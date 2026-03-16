from fastapi import APIRouter, HTTPException, Query
from app.database import db
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

# Utility to parse dates from string
def parse_date_util(date_str: Optional[str]) -> Optional[datetime]:
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except Exception:
        return None

router = APIRouter()

@router.get("/predictions/sales-forecast")
def get_sales_forecast(
    date_debut: Optional[str] = Query(default=None),
    date_fin: Optional[str] = Query(default=None)
):
    """
    Prévision des ventes avec moyenne mobile (3 mois)
    """
    try:
        d_start = parse_date_util(date_debut)
        d_end = parse_date_util(date_fin)
        
        # Par défaut, si pas de dates, on prend les 12 derniers mois
        if not d_start:
            d_start = datetime.now() - timedelta(days=365)
            
        with db.get_connection() as conn:
            query = """
            SELECT 
                FORMAT(V.V_DOCDATE, 'yyyy-MM') as mois,
                SUM(CASE WHEN F.FA_CodeFamille = 'TRIAGE' THEN VL.QTEVENDUES ELSE (VL.QTEVENDUES / NULLIF(CASE WHEN A.ART_POIDSNET > 1 THEN A.ART_POIDSNET ELSE 1 END, 0)) END) as qte_totale,
                SUM(CASE WHEN F.FA_CodeFamille = 'TRIAGE' THEN VL.QTEVENDUES ELSE (VL.QTEVENDUES / NULLIF(CASE WHEN A.ART_POIDSNET > 1 THEN A.ART_POIDSNET ELSE 1 END, 0)) END * COALESCE(FA.AR_PrixVenNouv, 0)) as ca_total
            FROM dbo.DP_VENTES V
            JOIN dbo.DP_VENTES_LIGNES VL ON V.V_DOCTYPE = VL.VL_DOCTYPE AND V.V_DOCNUMBIN = VL.VL_DOCNUMBIN
            JOIN dbo.DP_ARTICLES A ON A.ART_UK = VL.VL_ART_UK
            LEFT JOIN dbo.F_ARTICLE FA ON FA.cbMarq = A.ART_PK
            JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
            WHERE V.V_DOCDATE >= ?
                AND (? IS NULL OR V.V_DOCDATE <= ?)
                AND F.FA_CodeFamille IN ('BALLE', 'FRIPPE', 'TRIAGE')
                AND V.V_TYPE IN ('Facture caisse décentralisée comptabilisée', 'Facture comptabilisée', 'Facture', 'Facture caisse décentralisée', 'Facture de retour comptabilisée', 'Facture de retour')
                AND A.ART_NUM NOT IN ('REPORT_FACT_ADD','REPORT_FACT_FRIP','REPORT_FACT_HYG','REPORT_FACT_LUM','REPORT_FACT_PET','REPORT_FACT_PNEU','REPORT_FACT_PPN','REPORT_FACT_QUIN','REPORT_FACTURE')
            GROUP BY FORMAT(V.V_DOCDATE, 'yyyy-MM')
            ORDER BY mois
            """
            df = pd.read_sql(query, conn, params=[d_start, d_end, d_end])
            
            if len(df) < 1:
                return {"historique": [], "previsions": []}
            
            df['qte_ma3'] = df['qte_totale'].rolling(window=3, min_periods=1).mean()
            df['ca_ma3'] = df['ca_total'].rolling(window=3, min_periods=1).mean()
            
            last_qte_ma = df['qte_ma3'].iloc[-1]
            last_ca_ma = df['ca_ma3'].iloc[-1]
            
            previsions = []
            if not df.empty:
                last_month_str = df['mois'].iloc[-1]
                last_date = datetime.strptime(last_month_str, '%Y-%m')
            else:
                last_date = datetime.now()

            for i in range(1, 4):
                next_month = last_date + timedelta(days=31*i)
                previsions.append({
                    "mois": next_month.strftime('%Y-%m'),
                    "qte_prevue": float(last_qte_ma) if pd.notna(last_qte_ma) else 0,
                    "ca_prevu": float(last_ca_ma) if pd.notna(last_ca_ma) else 0,
                    "confiance": "estimée"
                })
            
            return {
                "historique": df[['mois', 'qte_totale', 'ca_total']].to_dict('records'),
                "previsions": previsions
            }
    except Exception as e:
        print(f"DEBUG: Error in get_sales_forecast: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/predictions/stock-forecast")
def get_stock_forecast(
    date_debut: Optional[str] = Query(default=None),
    date_fin: Optional[str] = Query(default=None)
):
    """
    Prévision de rupture de stock basée sur la période sélectionnée
    """
    try:
        d_start = parse_date_util(date_debut)
        d_end = parse_date_util(date_fin)

        with db.get_connection() as conn:
            query = """
            WITH latest_stock AS (
                SELECT
                    STD_ART_UK,
                    MAX(STD_DLDATEBL) AS max_date
                FROM dbo.DP_STOCK_A_DATE
                WHERE STD_DLDATEBL >= DATEADD(day, -10, GETDATE())
                GROUP BY STD_ART_UK
            ),
            ventes_periode AS (
                SELECT 
                    VL.VL_ART_UK,
                    SUM(CASE WHEN F2.FA_CodeFamille = 'TRIAGE' THEN VL.QTEVENDUES ELSE (VL.QTEVENDUES / NULLIF(CASE WHEN A2.ART_POIDSNET > 1 THEN A2.ART_POIDSNET ELSE 1 END, 0)) END) as vente_totale,
                    COUNT(DISTINCT FORMAT(V.V_DOCDATE, 'yyyy-MM')) as nb_mois
                FROM dbo.DP_VENTES V
                JOIN dbo.DP_VENTES_LIGNES VL ON V.V_DOCNUMBIN = VL.VL_DOCNUMBIN AND V.V_DOCTYPE = VL.VL_DOCTYPE
                JOIN dbo.DP_ARTICLES A2 ON A2.ART_UK = VL.VL_ART_UK
                LEFT JOIN dbo.F_FAMILLE F2 ON F2.FA_CODEFAMILLE = A2.ART_FACODEFAMILLE
                WHERE V.V_TYPE IN ('Facture caisse décentralisée comptabilisée', 'Facture comptabilisée', 'Facture', 'Facture caisse décentralisée', 'Facture de retour comptabilisée', 'Facture de retour')
                  AND (? IS NULL OR V.V_DOCDATE >= ?)
                  AND (? IS NULL OR V.V_DOCDATE <= ?)
                GROUP BY VL.VL_ART_UK
            )
            SELECT
                A.ART_NUM as article,
                A.ART_LIB as designation,
                COALESCE(STD.STD_QTE, 0) as stock_actuel,
                CASE 
                    WHEN COALESCE(VP.nb_mois, 0) > 0 THEN VP.vente_totale / VP.nb_mois 
                    ELSE VP.vente_totale 
                END as vente_moy_mensuelle,
                CASE 
                    WHEN VP.vente_totale > 0 AND COALESCE(VP.nb_mois, 0) > 0
                    THEN COALESCE(STD.STD_QTE, 0) / (VP.vente_totale / VP.nb_mois)
                    WHEN VP.vente_totale > 0 
                    THEN COALESCE(STD.STD_QTE, 0) / VP.vente_totale
                    ELSE 999
                END as mois_restants
            FROM dbo.DP_ARTICLES A
            LEFT JOIN latest_stock LS ON LS.STD_ART_UK = A.ART_UK
            LEFT JOIN dbo.DP_STOCK_A_DATE STD 
                ON STD.STD_ART_UK = LS.STD_ART_UK 
                AND STD.STD_DLDATEBL = LS.max_date
            LEFT JOIN ventes_periode VP ON VP.VL_ART_UK = A.ART_UK
            LEFT JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
            WHERE A.ART_SOMMEIL = 'Actif'
                AND COALESCE(VP.vente_totale, 0) > 0
                AND COALESCE(STD.STD_QTE, 0) > 0
                AND F.FA_CodeFamille IN ('BALLE', 'FRIPPE', 'TRIAGE')
                AND A.ART_NUM NOT IN ('REPORT_FACT_ADD','REPORT_FACT_FRIP','REPORT_FACT_HYG','REPORT_FACT_LUM','REPORT_FACT_PET','REPORT_FACT_PNEU','REPORT_FACT_PPN','REPORT_FACT_QUIN','REPORT_FACTURE')
            ORDER BY mois_restants ASC
            """
            df = pd.read_sql(query, conn, params=[d_start, d_start, d_end, d_end])
            
            results = []
            for _, row in df.iterrows():
                m_rest = float(row['mois_restants'])
                date_rupture = datetime.now() + timedelta(days=int(min(m_rest, 36) * 30))
                results.append({
                    "article": row['article'],
                    "designation": row['designation'],
                    "stock_actuel": float(row['stock_actuel']),
                    "vente_mensuelle": round(float(row['vente_moy_mensuelle']), 1),
                    "mois_restants": round(m_rest, 1),
                    "date_rupture_estimee": date_rupture.strftime('%Y-%m-%d'),
                    "qte_recommandee": round(float(row['vente_moy_mensuelle']) * 3, 0),
                    "priorite": "haute" if m_rest < 1 else ("moyenne" if m_rest < 2 else "basse")
                })
            
            return {"articles_critiques": results}
    except Exception as e:
        print(f"DEBUG: Error in get_stock_forecast: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/predictions/classification")
def get_article_classification(
    date_debut: Optional[str] = Query(default=None),
    date_fin: Optional[str] = Query(default=None)
):
    """
    Classification des articles basée sur la période sélectionnée
    """
    try:
        d_start = parse_date_util(date_debut)
        d_end = parse_date_util(date_fin)

        with db.get_connection() as conn:
            query = """
            WITH vente_stats AS (
                SELECT 
                    VL.VL_ART_UK,
                    SUM(COALESCE(VL.CATTCNet, 0)) as ca_ttc,
                    SUM(CASE WHEN F2.FA_CodeFamille = 'TRIAGE' THEN 0 ELSE (VL.QTEVENDUES / NULLIF(CASE WHEN A2.ART_POIDSNET > 1 THEN A2.ART_POIDSNET ELSE 1 END, 0)) * COALESCE(FA2.AR_PrixAchNouv, 0) END) as cout_revient,
                    SUM(CASE WHEN F2.FA_CodeFamille = 'TRIAGE' THEN VL.QTEVENDUES ELSE (VL.QTEVENDUES / NULLIF(CASE WHEN A2.ART_POIDSNET > 1 THEN A2.ART_POIDSNET ELSE 1 END, 0)) END) as qte_vendue
                FROM dbo.DP_VENTES_LIGNES VL
                JOIN dbo.DP_VENTES V ON V.V_DOCNUMBIN = VL.VL_DOCNUMBIN AND V.V_DOCTYPE = VL.VL_DOCTYPE
                JOIN dbo.DP_ARTICLES A2 ON A2.ART_UK = VL.VL_ART_UK
                LEFT JOIN dbo.F_ARTICLE FA2 ON FA2.cbMarq = A2.ART_PK
                LEFT JOIN dbo.F_FAMILLE F2 ON F2.FA_CODEFAMILLE = A2.ART_FACODEFAMILLE
                WHERE V.V_TYPE IN ('Facture caisse décentralisée comptabilisée', 'Facture comptabilisée', 'Facture', 'Facture caisse décentralisée', 'Facture de retour comptabilisée', 'Facture de retour')
                  AND (? IS NULL OR V.V_DOCDATE >= ?)
                  AND (? IS NULL OR V.V_DOCDATE <= ?)
                GROUP BY VL.VL_ART_UK
            )
            SELECT 
                A.ART_NUM as article,
                A.ART_LIB as designation,
                COALESCE(VS.ca_ttc, 0) as ca_total,
                CASE 
                    WHEN COALESCE(VS.ca_ttc, 0) > 0 
                    THEN ((COALESCE(VS.ca_ttc, 0) - COALESCE(VS.cout_revient, 0)) / COALESCE(VS.ca_ttc, 0)) * 100
                    ELSE 0
                END as marge_pct
            FROM dbo.DP_ARTICLES A
            JOIN vente_stats VS ON VS.VL_ART_UK = A.ART_UK
            LEFT JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
            WHERE A.ART_SOMMEIL = 'Actif'
                AND F.FA_CodeFamille IN ('BALLE', 'FRIPPE', 'TRIAGE')
                AND A.ART_NUM NOT IN ('REPORT_FACT_ADD','REPORT_FACT_FRIP','REPORT_FACT_HYG','REPORT_FACT_LUM','REPORT_FACT_PET','REPORT_FACT_PNEU','REPORT_FACT_PPN','REPORT_FACT_QUIN','REPORT_FACTURE')
                AND VS.qte_vendue > 0
            """
            df = pd.read_sql(query, conn, params=[d_start, d_start, d_end, d_end])
            
            rentables, moyens, problemes = [], [], []
            for _, row in df.iterrows():
                marge = float(row['marge_pct'])
                article_data = {
                    "article": row['article'],
                    "designation": row['designation'],
                    "ca_total": float(row['ca_total']),
                    "marge_pct": round(marge, 1)
                }
                if marge > 20: rentables.append(article_data)
                elif marge > 5: moyens.append(article_data)
                else: problemes.append(article_data)
            
            return {
                "rentables": rentables,
                "moyens": moyens,
                "problemes": problemes,
                "stats": {
                    "nb_rentables": len(rentables),
                    "nb_moyens": len(moyens),
                    "nb_problemes": len(problemes)
                }
            }
    except Exception as e:
        print(f"DEBUG: Error in get_article_classification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
