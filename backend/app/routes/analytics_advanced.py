from fastapi import APIRouter, HTTPException
from app.database import db
import pandas as pd
from typing import Dict, Any, List

router = APIRouter()

@router.get("/analytics/kpis")
async def get_global_kpis():
    """
    Calcule les indicateurs clés de performance globaux
    """
    try:
        with db.get_connection() as conn:
            # Requête pour obtenir les KPIs
            query = """
            WITH latest_stock AS (
                SELECT
                    STD_ART_UK,
                    MAX(STD_DLDATEBL) AS max_date
                FROM dbo.DP_STOCK_A_DATE
                GROUP BY STD_ART_UK
            ),
            article_data AS (
                SELECT 
                    A.ART_UK,
                    A.ART_NUM,
                    A.ART_PRIXACH,
                    A.ART_POIDSNET,
                    COALESCE(VL.vente_montant, 0) AS vente_montant,
                    COALESCE(VL.vente_qte, 0) AS vente_qte,
                    COALESCE(STD.STD_QTE, 0) AS stock_qte,
                    COALESCE(STD.STD_QTE * A.ART_PRIXACH, 0) AS valeur_stock,
                    CASE 
                        WHEN VL.vente_montant > 0 
                        THEN ((VL.vente_montant - (VL.vente_qte * A.ART_PRIXACH)) / VL.vente_montant) * 100
                        ELSE 0
                    END AS marge_pct
                FROM dbo.DP_ARTICLES A
                LEFT JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
                LEFT JOIN (
                    SELECT 
                        VL_ART_UK,
                        SUM(CATTCNet) AS vente_montant,
                        SUM(QTEVENDUES) AS vente_qte
                    FROM dbo.DP_VENTES_LIGNES
                    GROUP BY VL_ART_UK
                ) VL ON VL.VL_ART_UK = A.ART_UK
                LEFT JOIN latest_stock LS ON LS.STD_ART_UK = A.ART_UK
                LEFT JOIN dbo.DP_STOCK_A_DATE STD 
                    ON STD.STD_ART_UK = LS.STD_ART_UK 
                    AND STD.STD_DLDATEBL = LS.max_date
                WHERE A.ART_SOMMEIL = 'Actif'
                    AND F.FA_CodeFamille IN ('BALLE', 'FRIPPE', 'TRIAGE')
            )
            SELECT 
                SUM(vente_montant) AS ca_total,
                SUM(vente_montant - (vente_qte * ART_PRIXACH)) AS marge_totale,
                AVG(CASE WHEN vente_montant > 0 THEN marge_pct ELSE NULL END) AS taux_marge_moyen,
                SUM(valeur_stock) AS valeur_stock_total,
                COUNT(CASE WHEN marge_pct > 0 AND vente_montant > 0 THEN 1 END) AS articles_rentables,
                COUNT(*) AS total_articles
            FROM article_data
            """
            
            df = pd.read_sql(query, conn)
            
            if df.empty:
                return {
                    "ca_total": 0,
                    "marge_totale": 0,
                    "taux_marge_moyen": 0,
                    "valeur_stock_total": 0,
                    "pct_articles_rentables": 0
                }
            
            row = df.iloc[0]
            
            return {
                "ca_total": float(row['ca_total']) if pd.notna(row['ca_total']) else 0,
                "marge_totale": float(row['marge_totale']) if pd.notna(row['marge_totale']) else 0,
                "taux_marge_moyen": float(row['taux_marge_moyen']) if pd.notna(row['taux_marge_moyen']) else 0,
                "valeur_stock_total": float(row['valeur_stock_total']) if pd.notna(row['valeur_stock_total']) else 0,
                "pct_articles_rentables": (float(row['articles_rentables']) / float(row['total_articles']) * 100) if row['total_articles'] > 0 else 0
            }
            
    except Exception as e:
        print(f"Error in get_global_kpis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/profitability")
async def get_profitability_analysis():
    """
    Analyse de rentabilité : marge par article, par fournisseur, et scatter plot
    """
    try:
        with db.get_connection() as conn:
            # Marge par article (top 20 avec ventes) - Filtre: familles BALLE, FRIPPE, TRIAGE
            query_articles = """
            SELECT TOP 20
                A.ART_NUM as article,
                A.ART_LIB as designation,
                SUM(VL.CATTCNet) as vente_montant,
                SUM(VL.QTEVENDUES) as vente_qte,
                CASE 
                    WHEN SUM(VL.CATTCNet) > 0 
                    THEN ((SUM(VL.CATTCNet) - (SUM(VL.QTEVENDUES) * A.ART_PRIXACH)) / SUM(VL.CATTCNet)) * 100
                    ELSE 0
                END as marge_pct,
                SUM(VL.CATTCNet) - (SUM(VL.QTEVENDUES) * A.ART_PRIXACH) as marge_absolue
            FROM dbo.DP_ARTICLES A
            LEFT JOIN dbo.DP_VENTES_LIGNES VL ON VL.VL_ART_UK = A.ART_UK
            LEFT JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
            WHERE A.ART_SOMMEIL = 'Actif'
                AND F.FA_CodeFamille IN ('BALLE', 'FRIPPE', 'TRIAGE')
            GROUP BY A.ART_NUM, A.ART_LIB, A.ART_PRIXACH
            HAVING SUM(VL.CATTCNet) > 0
            ORDER BY marge_absolue DESC
            """
            df_articles = pd.read_sql(query_articles, conn)
            
            # Marge par fournisseur - Filtre: familles BALLE, FRIPPE, TRIAGE
            query_fournisseurs = """
            SELECT 
                fournisseur,
                SUM(vente_montant) as vente_montant,
                SUM(vente_qte) as vente_qte,
                CASE 
                    WHEN SUM(vente_montant) > 0 
                    THEN (SUM(vente_montant) - SUM(marge_absolue)) / SUM(vente_montant) * 100
                    ELSE 0
                END as marge_pct,
                SUM(vente_montant) - SUM(marge_absolue) as marge_absolue
            FROM (
                SELECT 
                    COALESCE(RTRIM(C.CT_Intitule), A.ART_FOURPRINC) as fournisseur,
                    VL.CATTCNet as vente_montant,
                    VL.QTEVENDUES as vente_qte,
                    VL.QTEVENDUES * A.ART_PRIXACH as marge_absolue
                FROM dbo.DP_ARTICLES A
                LEFT JOIN dbo.DP_VENTES_LIGNES VL ON VL.VL_ART_UK = A.ART_UK
                LEFT JOIN dbo.F_COMPTET C ON C.CT_Num = A.ART_FOURPRINC
                LEFT JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
                WHERE A.ART_SOMMEIL = 'Actif'
                    AND F.FA_CodeFamille IN ('BALLE', 'FRIPPE', 'TRIAGE')
                    AND (C.CT_Intitule IS NULL OR C.CT_Intitule NOT LIKE '%TIERS A CREER%')
                    AND VL.CATTCNet > 0
            ) sub
            GROUP BY fournisseur
            HAVING SUM(vente_montant) > 0
            ORDER BY marge_absolue DESC
            """
            df_fournisseurs = pd.read_sql(query_fournisseurs, conn)
            
            # Scatter plot data (qte, marge, famille) - Filtre: familles BALLE, FRIPPE, TRIAGE
            query_scatter = """
            SELECT 
                A.ART_NUM as article,
                F.FA_CodeFamille as famille,
                COALESCE(SUM(VL.QTEVENDUES), 0) as qte_vendue,
                SUM(VL.CATTCNet) - SUM(VL.QTEVENDUES * A.ART_PRIXACH) as marge
            FROM dbo.DP_ARTICLES A
            LEFT JOIN dbo.DP_VENTES_LIGNES VL ON VL.VL_ART_UK = A.ART_UK
            LEFT JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
            WHERE A.ART_SOMMEIL = 'Actif'
                AND F.FA_CodeFamille IN ('BALLE', 'FRIPPE', 'TRIAGE')
            GROUP BY A.ART_NUM, F.FA_CodeFamille
            HAVING SUM(VL.QTEVENDUES) > 0
            """
            df_scatter = pd.read_sql(query_scatter, conn)
            
            return {
                "marge_par_article": df_articles.to_dict('records'),
                "marge_par_fournisseur": df_fournisseurs.to_dict('records'),
                "scatter_data": df_scatter.to_dict('records')
            }
            
    except Exception as e:
        print(f"Error in get_profitability_analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/sales-analysis")
async def get_sales_analysis():
    """
    Analyse des ventes : évolution mensuelle, top 10, articles à 0 vente
    """
    try:
        with db.get_connection() as conn:
            # Évolution mensuelle des ventes (6 derniers mois) - Filtre: familles BALLE, FRIPPE, TRIAGE
            query_evolution = """
            SELECT 
                FORMAT(V.V_DOCDATE, 'yyyy-MM') as mois,
                COUNT(DISTINCT VL.VL_ART_UK) as nb_articles,
                SUM(VL.QTEVENDUES) as qte_totale,
                SUM(VL.CATTCNet) as ca_total
            FROM dbo.DP_VENTES V
            JOIN dbo.DP_VENTES_LIGNES VL ON V.V_DOCNUMBIN = VL.VL_DOCNUMBIN AND V.V_DOCTYPE = VL.VL_DOCTYPE
            JOIN dbo.DP_ARTICLES A ON A.ART_UK = VL.VL_ART_UK
            JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
            WHERE V.V_DOCDATE >= DATEADD(MONTH, -6, GETDATE())
                AND F.FA_CodeFamille IN ('BALLE', 'FRIPPE', 'TRIAGE')
            GROUP BY FORMAT(V.V_DOCDATE, 'yyyy-MM')
            ORDER BY mois
            """
            df_evolution = pd.read_sql(query_evolution, conn)
            
            # Top 10 articles vendus - Filtre: familles BALLE, FRIPPE, TRIAGE
            query_top10 = """
            SELECT TOP 10
                A.ART_NUM as article,
                A.ART_LIB as designation,
                SUM(VL.QTEVENDUES) as qte_vendue,
                SUM(VL.CATTCNet) as ca_total
            FROM dbo.DP_ARTICLES A
            JOIN dbo.DP_VENTES_LIGNES VL ON VL.VL_ART_UK = A.ART_UK
            LEFT JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
            WHERE A.ART_SOMMEIL = 'Actif'
                AND F.FA_CodeFamille IN ('BALLE', 'FRIPPE', 'TRIAGE')
            GROUP BY A.ART_NUM, A.ART_LIB
            ORDER BY qte_vendue DESC
            """
            df_top10 = pd.read_sql(query_top10, conn)
            
            # Articles à 0 vente (avec stock > 0) - Filtre: familles BALLE, FRIPPE, TRIAGE
            query_zero_sales = """
            WITH latest_stock AS (
                SELECT
                    STD_ART_UK,
                    MAX(STD_DLDATEBL) AS max_date
                FROM dbo.DP_STOCK_A_DATE
                GROUP BY STD_ART_UK
            )
            SELECT 
                A.ART_NUM as article,
                A.ART_LIB as designation,
                COALESCE(STD.STD_QTE, 0) as stock_qte,
                A.ART_PRIXACH as prix_achat
            FROM dbo.DP_ARTICLES A
            LEFT JOIN dbo.DP_VENTES_LIGNES VL ON VL.VL_ART_UK = A.ART_UK
            LEFT JOIN latest_stock LS ON LS.STD_ART_UK = A.ART_UK
            LEFT JOIN dbo.DP_STOCK_A_DATE STD 
                ON STD.STD_ART_UK = LS.STD_ART_UK 
                AND STD.STD_DLDATEBL = LS.max_date
            LEFT JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
            WHERE A.ART_SOMMEIL = 'Actif'
                AND VL.VL_ART_UK IS NULL
                AND COALESCE(STD.STD_QTE, 0) > 0
                AND F.FA_CodeFamille IN ('BALLE', 'FRIPPE', 'TRIAGE')
            """
            df_zero_sales = pd.read_sql(query_zero_sales, conn)
            
            return {
                "evolution_mensuelle": df_evolution.to_dict('records'),
                "top_10_articles": df_top10.to_dict('records'),
                "articles_zero_vente": df_zero_sales.to_dict('records')
            }
            
    except Exception as e:
        print(f"Error in get_sales_analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
