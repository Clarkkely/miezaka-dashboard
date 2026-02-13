from fastapi import APIRouter, HTTPException
from app.database import db
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/predictions/sales-forecast")
async def get_sales_forecast():
    """
    Prévision des ventes avec moyenne mobile (3 mois)
    """
    try:
        with db.get_connection() as conn:
            # Historique ventes mensuelles (12 derniers mois)
            query = """
            SELECT 
                FORMAT(V.V_DOCDATE, 'yyyy-MM') as mois,
                SUM(VL.QTEVENDUES) as qte_totale,
                SUM(VL.CATTCNet) as ca_total
            FROM dbo.DP_VENTES V
            JOIN dbo.DP_ARTICLES A ON A.ART_UK = VL.VL_ART_UK
            JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
            WHERE V.V_DOCDATE >= DATEADD(MONTH, -12, GETDATE())
                AND F.FA_CodeFamille IN ('BALLE', 'FRIPPE', 'TRIAGE')
            GROUP BY FORMAT(V.V_DOCDATE, 'yyyy-MM')
            ORDER BY mois
            """
            df = pd.read_sql(query, conn)
            
            if len(df) < 3:
                return {"historique": [], "previsions": [], "message": "Pas assez de données"}
            
            # Moyenne mobile sur 3 mois
            df['qte_ma3'] = df['qte_totale'].rolling(window=3).mean()
            df['ca_ma3'] = df['ca_total'].rolling(window=3).mean()
            
            # Prévisions pour les 3 prochains mois
            last_qte_ma = df['qte_ma3'].iloc[-1]
            last_ca_ma = df['ca_ma3'].iloc[-1]
            
            previsions = []
            current_date = datetime.now()
            
            for i in range(1, 4):
                next_month = current_date + timedelta(days=30*i)
                previsions.append({
                    "mois": next_month.strftime('%Y-%m'),
                    "qte_prevue": float(last_qte_ma) if pd.notna(last_qte_ma) else 0,
                    "ca_prevu": float(last_ca_ma) if pd.notna(last_ca_ma) else 0,
                    "confiance": "moyenne"
                })
            
            return {
                "historique": df[['mois', 'qte_totale', 'ca_total']].to_dict('records'),
                "previsions": previsions
            }
            
    except Exception as e:
        print(f"Error in get_sales_forecast: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predictions/stock-forecast")
async def get_stock_forecast():
    """
    Prévision de rupture de stock
    """
    try:
        with db.get_connection() as conn:
            query = """
            WITH latest_stock AS (
                SELECT
                    STD_ART_UK,
                    MAX(STD_DLDATEBL) AS max_date
                FROM dbo.DP_STOCK_A_DATE
                GROUP BY STD_ART_UK
            ),
            ventes_mensuelles AS (
                SELECT 
                    VL_ART_UK,
                    AVG(vente_mensuelle) as vente_moy_mensuelle
                FROM (
                    SELECT 
                        VL.VL_ART_UK,
                        FORMAT(V.V_DOCDATE, 'yyyy-MM') as mois,
                        SUM(VL.QTEVENDUES) as vente_mensuelle
                    FROM dbo.DP_VENTES V
                    JOIN dbo.DP_VENTES_LIGNES VL ON V.V_DOCNUMBIN = VL.VL_DOCNUMBIN
                    WHERE V.V_DOCDATE >= DATEADD(MONTH, -6, GETDATE())
                    GROUP BY VL.VL_ART_UK, FORMAT(V.V_DOCDATE, 'yyyy-MM')
                ) sub
                GROUP BY VL_ART_UK
            )
            SELECT TOP 20
                A.ART_NUM as article,
                A.ART_LIB as designation,
                COALESCE(STD.STD_QTE, 0) as stock_actuel,
                COALESCE(VM.vente_moy_mensuelle, 0) as vente_mensuelle,
                CASE 
                    WHEN VM.vente_moy_mensuelle > 0 
                    THEN COALESCE(STD.STD_QTE, 0) / VM.vente_moy_mensuelle
                    ELSE 999
                END as mois_restants
            FROM dbo.DP_ARTICLES A
            LEFT JOIN latest_stock LS ON LS.STD_ART_UK = A.ART_UK
            LEFT JOIN dbo.DP_STOCK_A_DATE STD 
                ON STD.STD_ART_UK = LS.STD_ART_UK 
                AND STD.STD_DLDATEBL = LS.max_date
            LEFT JOIN ventes_mensuelles VM ON VM.VL_ART_UK = A.ART_UK
            LEFT JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
            WHERE A.ART_SOMMEIL = 'Actif'
                AND VM.vente_moy_mensuelle > 0
                AND COALESCE(STD.STD_QTE, 0) > 0
                AND F.FA_CodeFamille IN ('BALLE', 'FRIPPE', 'TRIAGE')
            ORDER BY mois_restants ASC
            """
            df = pd.read_sql(query, conn)
            
            # Calculer date rupture et quantité recommandée
            results = []
            for _, row in df.iterrows():
                mois_restants = float(row['mois_restants'])
                date_rupture = datetime.now() + timedelta(days=int(mois_restants * 30))
                qte_recommandee = float(row['vente_mensuelle']) * 3  # 3 mois de stock
                
                priorite = "haute" if mois_restants < 1 else ("moyenne" if mois_restants < 2 else "basse")
                
                results.append({
                    "article": row['article'],
                    "designation": row['designation'],
                    "stock_actuel": float(row['stock_actuel']),
                    "vente_mensuelle": float(row['vente_mensuelle']),
                    "mois_restants": round(mois_restants, 1),
                    "date_rupture_estimee": date_rupture.strftime('%Y-%m-%d'),
                    "qte_recommandee": round(qte_recommandee, 0),
                    "priorite": priorite
                })
            
            return {"articles_critiques": results}
            
    except Exception as e:
        print(f"Error in get_stock_forecast: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predictions/classification")
async def get_article_classification():
    """
    Classification des articles (rentable, moyen, problème)
    """
    try:
        with db.get_connection() as conn:
            query = """
            SELECT 
                A.ART_NUM as article,
                A.ART_LIB as designation,
                COALESCE(SUM(VL.CATTCNet), 0) as ca_total,
                CASE 
                    WHEN SUM(VL.CATTCNet) > 0 
                    THEN ((SUM(VL.CATTCNet) - (SUM(VL.QTEVENDUES) * A.ART_PRIXACH)) / SUM(VL.CATTCNet)) * 100
                    ELSE 0
                END as marge_pct
            FROM dbo.DP_ARTICLES A
            LEFT JOIN dbo.DP_VENTES_LIGNES VL ON VL.VL_ART_UK = A.ART_UK
            LEFT JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
            WHERE A.ART_SOMMEIL = 'Actif'
                AND F.FA_CodeFamille IN ('BALLE', 'FRIPPE', 'TRIAGE')
            GROUP BY A.ART_NUM, A.ART_LIB, A.ART_PRIXACH
            HAVING SUM(VL.CATTCNet) > 0
            """
            df = pd.read_sql(query, conn)
            
            # Classification par seuils
            rentables = []
            moyens = []
            problemes = []
            
            for _, row in df.iterrows():
                marge = float(row['marge_pct'])
                article_data = {
                    "article": row['article'],
                    "designation": row['designation'],
                    "ca_total": float(row['ca_total']),
                    "marge_pct": round(marge, 1)
                }
                
                if marge > 20:
                    rentables.append(article_data)
                elif marge > 5:
                    moyens.append(article_data)
                else:
                    problemes.append(article_data)
            
            return {
                "rentables": rentables[:50],  # Top 50
                "moyens": moyens[:50],
                "problemes": problemes[:50],
                "stats": {
                    "nb_rentables": len(rentables),
                    "nb_moyens": len(moyens),
                    "nb_problemes": len(problemes)
                }
            }
            
    except Exception as e:
        print(f"Error in get_article_classification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
