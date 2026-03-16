from fastapi import APIRouter, HTTPException, Query
from app.database import db
import pandas as pd
from typing import Dict, Any, List, Optional
from datetime import datetime

router = APIRouter()


def _parse_date(date_str: Optional[str]) -> Optional[datetime]:
    if not date_str:
        return None
    return datetime.strptime(date_str, "%Y-%m-%d")

@router.get("/analytics/kpis")
def get_global_kpis(
    date_debut: Optional[str] = Query(default=None),
    date_fin: Optional[str] = Query(default=None),
    date_stock: Optional[str] = Query(default=None),
):
    """
    KPIs alignés sur la logique métier du rapport :
    - CA = SUM(CATTCNet) sur la période (mêmes types de vente que le rapport)
    - Marge = CA - coût (volume_poids * AR_PrixAchNouv si ART_POIDSNET!=1, sinon vente_qte * AR_PrixAchNouv)
    - Valeur Stock = stock_qte * AR_PrixAchNouv à la date stock demandée
    - Articles Rentables = % d'articles vendus avec marge > 0
    """
    try:
        d_start = _parse_date(date_debut)
        d_end   = _parse_date(date_fin)
        d_stock = _parse_date(date_stock) if date_stock else d_end

        with db.get_connection() as conn:
            query = """
            WITH vente_summary AS (
                SELECT
                    SUM(COALESCE(VL.CATTCNet, 0)) AS ca_total,
                    SUM(COALESCE(VL.CATTCNet, 0) - 
                        CASE 
                            WHEN F.FA_CodeFamille = 'TRIAGE' THEN 0 
                            -- Si POIDSNET > 1, la QteVendues est en KG, donc on divise par le poids nominal pour avoir le nombre de balles
                            ELSE (VL.QteVendues / NULLIF(CASE WHEN A.ART_POIDSNET > 1 THEN A.ART_POIDSNET ELSE 1 END, 0)) * COALESCE(FA.AR_PrixAchNouv, 0)
                        END
                    ) AS marge_totale,
                    COUNT(DISTINCT CASE 
                        WHEN (COALESCE(VL.CATTCNet, 0) - (CASE WHEN F.FA_CodeFamille = 'TRIAGE' THEN 0 ELSE (VL.QteVendues / NULLIF(CASE WHEN A.ART_POIDSNET > 1 THEN A.ART_POIDSNET ELSE 1 END, 0)) * COALESCE(FA.AR_PrixAchNouv, 0) END)) > 0 
                        AND VL.QteVendues > 0 THEN A.ART_NUM END) AS articles_rentables,
                    COUNT(DISTINCT CASE WHEN VL.QteVendues > 0 THEN A.ART_NUM END) AS articles_avec_ventes
                FROM dbo.DP_VENTES V
                JOIN dbo.DP_VENTES_LIGNES VL ON V.V_DOCTYPE = VL.VL_DOCTYPE AND V.V_DOCNUMBIN = VL.VL_DOCNUMBIN
                JOIN dbo.DP_ARTICLES A ON VL.VL_ART_UK = A.ART_UK
                JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
                LEFT JOIN dbo.F_ARTICLE FA ON FA.cbMarq = A.ART_PK
                WHERE F.FA_Type = 0
                  AND F.FA_CodeFamille IN ('BALLE','FRIPPE','TRIAGE')
                  AND A.ART_SOMMEIL = 'Actif'
                  AND V.V_TYPE IN ('Facture caisse décentralisée comptabilisée', 'Facture comptabilisée', 'Facture', 'Facture caisse décentralisée', 'Facture de retour comptabilisée', 'Facture de retour')
                  AND V.V_DOCDATE BETWEEN ? AND ?
                  AND A.ART_NUM NOT IN ('REPORT_FACT_ADD','REPORT_FACT_FRIP','REPORT_FACT_HYG','REPORT_FACT_LUM','REPORT_FACT_PET','REPORT_FACT_PNEU','REPORT_FACT_PPN','REPORT_FACT_QUIN','REPORT_FACTURE')
            ),
            -- 2. Calcul de la Valeur Stock (Indépendant des ventes)
            stock_summary AS (
                SELECT
                    SUM(STD.STD_QTE * COALESCE(FA.AR_PrixAchNouv, 0)) AS valeur_stock_total
                FROM dbo.DP_ARTICLES A
                JOIN dbo.DP_STOCK_A_DATE STD ON STD.STD_ART_UK = A.ART_UK
                JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
                LEFT JOIN dbo.F_ARTICLE FA ON FA.cbMarq = A.ART_PK
                WHERE F.FA_Type = 0
                  AND F.FA_CodeFamille IN ('BALLE','FRIPPE','TRIAGE')
                  AND A.ART_SOMMEIL = 'Actif'
                  AND STD.STD_DLDATEBL <= ?
                  AND STD.STD_DEINTITULE NOT IN ('Z DEPOT HUGUES','Z DEPOT RIZOU','Z INV 2024','Z INVENTAIRE','Z KARENJY','Z MIEZAKA','Z RETOUR PALETTE','Z TAVE PAUL (HUGUES)')
            )
            SELECT 
                vs.*, 
                ss.valeur_stock_total
            FROM vente_summary vs, stock_summary ss
            """
            params = [d_start, d_end, d_stock]
            df = pd.read_sql(query, conn, params=params)

            if df.empty:
                return {
                    "ca_total": 0, "marge_totale": 0, "taux_marge_moyen": 0,
                    "valeur_stock_total": 0, "pct_articles_rentables": 0
                }

            row = df.iloc[0]
            ca = float(row['ca_total']) if pd.notna(row['ca_total']) else 0
            marge = float(row['marge_totale']) if pd.notna(row['marge_totale']) else 0
            nb_ventes = float(row['articles_avec_ventes']) if pd.notna(row['articles_avec_ventes']) else 0
            nb_rentables = float(row['articles_rentables']) if pd.notna(row['articles_rentables']) else 0
            val_stock = float(row['valeur_stock_total']) if pd.notna(row['valeur_stock_total']) else 0

            return {
                "ca_total": ca,
                "marge_totale": marge,
                "taux_marge_moyen": (marge / ca * 100) if ca > 0 else 0,
                "valeur_stock_total": val_stock,
                "pct_articles_rentables": (nb_rentables / nb_ventes * 100) if nb_ventes > 0 else 0,
            }

    except Exception as e:
        print(f"Error in get_global_kpis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/analytics/profitability")
def get_profitability_analysis(
    date_debut: str | None = Query(default=None),
    date_fin: str | None = Query(default=None),
):
    """
    Analyse de rentabilité : marge par article, par fournisseur, et scatter plot
    """
    try:
        d_start = _parse_date(date_debut)
        d_end = _parse_date(date_fin)
        with db.get_connection() as conn:
            # Marge par article (top 20 avec ventes) - Filtre: familles BALLE, FRIPPE, TRIAGE
            query_articles = """
            SELECT TOP 20
                A.ART_NUM as article,
                A.ART_LIB as designation,
                SUM(COALESCE(VL.CATTCNet, 0)) as vente_montant,
                SUM(VL.QTEVENDUES) as vente_qte,
                CASE 
                    WHEN SUM(COALESCE(VL.CATTCNet, 0)) > 0 
                    THEN SUM(COALESCE(VL.CATTCNet, 0) - CASE WHEN F.FA_CodeFamille = 'TRIAGE' THEN 0 ELSE (VL.QTEVENDUES / NULLIF(CASE WHEN A.ART_POIDSNET > 1 THEN A.ART_POIDSNET ELSE 1 END, 0)) * COALESCE(FA.AR_PrixAchNouv, 0) END) / SUM(COALESCE(VL.CATTCNet, 0)) * 100
                    ELSE 0
                END as marge_pct,
                SUM(COALESCE(VL.CATTCNet, 0) - CASE WHEN F.FA_CodeFamille = 'TRIAGE' THEN 0 ELSE (VL.QTEVENDUES / NULLIF(CASE WHEN A.ART_POIDSNET > 1 THEN A.ART_POIDSNET ELSE 1 END, 0)) * COALESCE(FA.AR_PrixAchNouv, 0) END) as marge_absolue
            FROM dbo.DP_ARTICLES A WITH (NOLOCK)
            LEFT JOIN dbo.F_ARTICLE FA WITH (NOLOCK) ON FA.cbMarq = A.ART_PK
            LEFT JOIN dbo.DP_VENTES_LIGNES VL WITH (NOLOCK) ON VL.VL_ART_UK = A.ART_UK
            JOIN dbo.DP_VENTES V WITH (NOLOCK) ON V.V_DOCNUMBIN = VL.VL_DOCNUMBIN AND V.V_DOCTYPE = VL.VL_DOCTYPE
            LEFT JOIN dbo.F_FAMILLE F WITH (NOLOCK) ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
            WHERE A.ART_SOMMEIL = 'Actif'
                AND F.FA_CodeFamille IN ('BALLE', 'FRIPPE', 'TRIAGE')
                AND (? IS NULL OR V.V_DOCDATE >= ?)
                AND (? IS NULL OR V.V_DOCDATE <= ?)
                AND V.V_TYPE IN ('Facture caisse décentralisée comptabilisée', 'Facture comptabilisée', 'Facture', 'Facture caisse décentralisée', 'Facture de retour comptabilisée', 'Facture de retour')
                AND A.ART_NUM NOT IN ('REPORT_FACT_ADD','REPORT_FACT_FRIP','REPORT_FACT_HYG','REPORT_FACT_LUM','REPORT_FACT_PET','REPORT_FACT_PNEU','REPORT_FACT_PPN','REPORT_FACT_QUIN','REPORT_FACTURE')
            GROUP BY A.ART_NUM, A.ART_LIB
            HAVING SUM(VL.QTEVENDUES) > 0
            ORDER BY marge_absolue DESC
            """
            df_articles = pd.read_sql(query_articles, conn, params=[d_start, d_start, d_end, d_end])
            
            # Marge par fournisseur - Filtre: familles BALLE, FRIPPE, TRIAGE
            query_fournisseurs = """
            SELECT 
                fournisseur,
                SUM(vente_montant) as vente_montant,
                SUM(vente_qte) as vente_qte,
                CASE 
                    WHEN SUM(vente_montant) > 0 
                    THEN (SUM(vente_montant) - SUM(cout_revient_val)) / SUM(vente_montant) * 100
                    ELSE 0
                END as marge_pct,
                SUM(vente_montant) - SUM(cout_revient_val) as marge_absolue
            FROM (
                SELECT 
                    COALESCE(RTRIM(C.CT_Intitule), A.ART_FOURPRINC) as fournisseur,
                    COALESCE(VL.CATTCNet, 0) as vente_montant,
                    VL.QTEVENDUES as vente_qte,
                    CASE WHEN F.FA_CodeFamille = 'TRIAGE' THEN 0 ELSE (VL.QTEVENDUES / NULLIF(CASE WHEN A.ART_POIDSNET > 1 THEN A.ART_POIDSNET ELSE 1 END, 0)) * COALESCE(FA.AR_PrixAchNouv, 0) END as cout_revient_val
                FROM dbo.DP_ARTICLES A WITH (NOLOCK)
                LEFT JOIN dbo.F_ARTICLE FA WITH (NOLOCK) ON FA.cbMarq = A.ART_PK
                LEFT JOIN dbo.DP_VENTES_LIGNES VL WITH (NOLOCK) ON VL.VL_ART_UK = A.ART_UK
                JOIN dbo.DP_VENTES V WITH (NOLOCK) ON V.V_DOCNUMBIN = VL.VL_DOCNUMBIN AND V.V_DOCTYPE = VL.VL_DOCTYPE
                LEFT JOIN dbo.F_COMPTET C WITH (NOLOCK) ON C.CT_Num = A.ART_FOURPRINC
                LEFT JOIN dbo.F_FAMILLE F WITH (NOLOCK) ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
                WHERE A.ART_SOMMEIL = 'Actif'
                    AND F.FA_CodeFamille IN ('BALLE', 'FRIPPE', 'TRIAGE')
                    AND (? IS NULL OR V.V_DOCDATE >= ?)
                    AND (? IS NULL OR V.V_DOCDATE <= ?)
                    AND V.V_TYPE IN ('Facture caisse décentralisée comptabilisée', 'Facture comptabilisée', 'Facture', 'Facture caisse décentralisée', 'Facture de retour comptabilisée', 'Facture de retour')
                    AND A.ART_NUM NOT IN ('REPORT_FACT_ADD','REPORT_FACT_FRIP','REPORT_FACT_HYG','REPORT_FACT_LUM','REPORT_FACT_PET','REPORT_FACT_PNEU','REPORT_FACT_PPN','REPORT_FACT_QUIN','REPORT_FACTURE')
                    AND (C.CT_Intitule IS NULL OR C.CT_Intitule NOT LIKE '%TIERS A CREER%')
                    AND VL.QTEVENDUES > 0
            ) sub
            GROUP BY fournisseur
            HAVING SUM(vente_montant) > 0
            ORDER BY marge_absolue DESC
            """
            df_fournisseurs = pd.read_sql(query_fournisseurs, conn, params=[d_start, d_start, d_end, d_end])
            
            # Scatter plot data (qte, marge, famille) - Filtre: familles BALLE, FRIPPE, TRIAGE
            query_scatter = """
            SELECT 
                A.ART_NUM as article,
                F.FA_CodeFamille as famille,
                COALESCE(SUM(VL.QTEVENDUES), 0) as qte_vendue,
                SUM(COALESCE(VL.CATTCNet, 0) - CASE WHEN F.FA_CodeFamille = 'TRIAGE' THEN 0 ELSE (VL.QTEVENDUES / NULLIF(CASE WHEN A.ART_POIDSNET > 1 THEN A.ART_POIDSNET ELSE 1 END, 0)) * COALESCE(FA.AR_PrixAchNouv, 0) END) as marge
            FROM dbo.DP_ARTICLES A WITH (NOLOCK)
            LEFT JOIN dbo.F_ARTICLE FA WITH (NOLOCK) ON FA.cbMarq = A.ART_PK
            LEFT JOIN dbo.DP_VENTES_LIGNES VL WITH (NOLOCK) ON VL.VL_ART_UK = A.ART_UK
            JOIN dbo.DP_VENTES V WITH (NOLOCK) ON V.V_DOCNUMBIN = VL.VL_DOCNUMBIN AND V.V_DOCTYPE = VL.VL_DOCTYPE
            LEFT JOIN dbo.F_FAMILLE F WITH (NOLOCK) ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
            WHERE A.ART_SOMMEIL = 'Actif'
                AND F.FA_CodeFamille IN ('BALLE', 'FRIPPE', 'TRIAGE')
                AND (? IS NULL OR V.V_DOCDATE >= ?)
                AND (? IS NULL OR V.V_DOCDATE <= ?)
                AND V.V_TYPE IN ('Facture caisse décentralisée comptabilisée', 'Facture comptabilisée', 'Facture', 'Facture caisse décentralisée', 'Facture de retour comptabilisée', 'Facture de retour')
                AND A.ART_NUM NOT IN ('REPORT_FACT_ADD','REPORT_FACT_FRIP','REPORT_FACT_HYG','REPORT_FACT_LUM','REPORT_FACT_PET','REPORT_FACT_PNEU','REPORT_FACT_PPN','REPORT_FACT_QUIN','REPORT_FACTURE')
            GROUP BY A.ART_NUM, F.FA_CodeFamille
            HAVING SUM(VL.QTEVENDUES) > 0
            """
            df_scatter = pd.read_sql(query_scatter, conn, params=[d_start, d_start, d_end, d_end])
            
            return {
                "marge_par_article": df_articles.to_dict('records'),
                "marge_par_fournisseur": df_fournisseurs.to_dict('records'),
                "scatter_data": df_scatter.to_dict('records')
            }
            
    except Exception as e:
        print(f"Error in get_profitability_analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/sales-analysis")
def get_sales_analysis(
    date_debut: str | None = Query(default=None),
    date_fin: str | None = Query(default=None),
):
    """
    Analyse des ventes : évolution mensuelle, top 10, articles à 0 vente
    """
    try:
        d_start = _parse_date(date_debut)
        d_end = _parse_date(date_fin)
        with db.get_connection() as conn:
            # Évolution mensuelle des ventes (6 derniers mois) - Filtre: familles BALLE, FRIPPE, TRIAGE
            query_evolution = """
            SELECT 
                FORMAT(V.V_DOCDATE, 'yyyy-MM') as mois,
                COUNT(DISTINCT VL.VL_ART_UK) as nb_articles,
                SUM(CASE WHEN F.FA_CodeFamille = 'TRIAGE' THEN VL.QTEVENDUES ELSE (VL.QTEVENDUES / NULLIF(CASE WHEN A.ART_POIDSNET > 1 THEN A.ART_POIDSNET ELSE 1 END, 0)) END) as qte_totale,
                SUM(COALESCE(VL.CATTCNet, 0)) as ca_total
            FROM dbo.DP_VENTES V WITH (NOLOCK)
            JOIN dbo.DP_VENTES_LIGNES VL WITH (NOLOCK) ON V.V_DOCNUMBIN = VL.VL_DOCNUMBIN AND V.V_DOCTYPE = VL.VL_DOCTYPE
            JOIN dbo.DP_ARTICLES A WITH (NOLOCK) ON A.ART_UK = VL.VL_ART_UK
            LEFT JOIN dbo.F_ARTICLE FA WITH (NOLOCK) ON FA.cbMarq = A.ART_PK
            JOIN dbo.F_FAMILLE F WITH (NOLOCK) ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
            WHERE (? IS NULL OR V.V_DOCDATE >= ?)
              AND (? IS NULL OR V.V_DOCDATE <= ?)
              AND F.FA_CodeFamille IN ('BALLE', 'FRIPPE', 'TRIAGE')
              AND V.V_TYPE IN ('Facture caisse décentralisée comptabilisée', 'Facture comptabilisée', 'Facture', 'Facture caisse décentralisée', 'Facture de retour comptabilisée', 'Facture de retour')
              AND A.ART_NUM NOT IN ('REPORT_FACT_ADD','REPORT_FACT_FRIP','REPORT_FACT_HYG','REPORT_FACT_LUM','REPORT_FACT_PET','REPORT_FACT_PNEU','REPORT_FACT_PPN','REPORT_FACT_QUIN','REPORT_FACTURE')
            GROUP BY FORMAT(V.V_DOCDATE, 'yyyy-MM')
            ORDER BY mois
            """
            df_evolution = pd.read_sql(query_evolution, conn, params=[d_start, d_start, d_end, d_end])
            
            # Top 10 articles vendus - Filtre: familles BALLE, FRIPPE, TRIAGE
            query_top10 = """
            SELECT TOP 10
                A.ART_NUM as article,
                A.ART_LIB as designation,
                SUM(CASE WHEN F.FA_CodeFamille = 'TRIAGE' THEN VL.QTEVENDUES ELSE (VL.QTEVENDUES / NULLIF(CASE WHEN A.ART_POIDSNET > 1 THEN A.ART_POIDSNET ELSE 1 END, 0)) END) as qte_vendue,
                SUM(COALESCE(VL.CATTCNet, 0)) as ca_total
            FROM dbo.DP_ARTICLES A WITH (NOLOCK)
            JOIN dbo.DP_VENTES_LIGNES VL WITH (NOLOCK) ON VL.VL_ART_UK = A.ART_UK
            JOIN dbo.DP_VENTES V WITH (NOLOCK) ON V.V_DOCNUMBIN = VL.VL_DOCNUMBIN AND V.V_DOCTYPE = VL.VL_DOCTYPE
            LEFT JOIN dbo.F_ARTICLE FA WITH (NOLOCK) ON FA.cbMarq = A.ART_PK
            LEFT JOIN dbo.F_FAMILLE F WITH (NOLOCK) ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
            WHERE A.ART_SOMMEIL = 'Actif'
                AND F.FA_CodeFamille IN ('BALLE', 'FRIPPE', 'TRIAGE')
                AND (? IS NULL OR V.V_DOCDATE >= ?)
                AND (? IS NULL OR V.V_DOCDATE <= ?)
                AND V.V_TYPE IN ('Facture caisse décentralisée comptabilisée', 'Facture comptabilisée', 'Facture', 'Facture caisse décentralisée', 'Facture de retour comptabilisée', 'Facture de retour')
                AND A.ART_NUM NOT IN ('REPORT_FACT_ADD','REPORT_FACT_FRIP','REPORT_FACT_HYG','REPORT_FACT_LUM','REPORT_FACT_PET','REPORT_FACT_PNEU','REPORT_FACT_PPN','REPORT_FACT_QUIN','REPORT_FACTURE')
            GROUP BY A.ART_NUM, A.ART_LIB
            ORDER BY qte_vendue DESC
            """
            df_top10 = pd.read_sql(query_top10, conn, params=[d_start, d_start, d_end, d_end])
            
            # Articles à 0 vente (avec stock > 0) - Filtre: familles BALLE, FRIPPE, TRIAGE
            query_zero_sales = """
            WITH latest_stock AS (
                SELECT
                    STD_ART_UK,
                    MAX(STD_DLDATEBL) AS max_date
                FROM dbo.DP_STOCK_A_DATE
                WHERE STD_DLDATEBL >= DATEADD(day, -7, GETDATE())
                GROUP BY STD_ART_UK
            ),
            ventes_valides AS (
                SELECT DISTINCT VL.VL_ART_UK
                FROM dbo.DP_VENTES_LIGNES VL
                JOIN dbo.DP_VENTES V ON V.V_DOCNUMBIN = VL.VL_DOCNUMBIN AND V.V_DOCTYPE = VL.VL_DOCTYPE
                WHERE V.V_TYPE IN ('Facture caisse décentralisée comptabilisée', 'Facture comptabilisée', 'Facture', 'Facture caisse décentralisée', 'Facture de retour comptabilisée', 'Facture de retour')
                  AND (? IS NULL OR V.V_DOCDATE >= ?)
                  AND (? IS NULL OR V.V_DOCDATE <= ?)
            )
            SELECT 
                A.ART_NUM as article,
                A.ART_LIB as designation,
                COALESCE(STD.STD_QTE, 0) as stock_qte,
                COALESCE(FA.AR_PrixAchNouv, 0) as prix_achat
            FROM dbo.DP_ARTICLES A
            LEFT JOIN dbo.F_ARTICLE FA ON FA.cbMarq = A.ART_PK
            LEFT JOIN ventes_valides VV ON VV.VL_ART_UK = A.ART_UK
            LEFT JOIN latest_stock LS ON LS.STD_ART_UK = A.ART_UK
            LEFT JOIN dbo.DP_STOCK_A_DATE STD 
                ON STD.STD_ART_UK = LS.STD_ART_UK 
                AND STD.STD_DLDATEBL = LS.max_date
            LEFT JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
            WHERE A.ART_SOMMEIL = 'Actif'
                AND VV.VL_ART_UK IS NULL
                AND COALESCE(STD.STD_QTE, 0) > 0
                AND F.FA_CodeFamille IN ('BALLE', 'FRIPPE', 'TRIAGE')
                AND A.ART_NUM NOT IN ('REPORT_FACT_ADD','REPORT_FACT_FRIP','REPORT_FACT_HYG','REPORT_FACT_LUM','REPORT_FACT_PET','REPORT_FACT_PNEU','REPORT_FACT_PPN','REPORT_FACT_QUIN','REPORT_FACTURE')
            """
            df_zero_sales = pd.read_sql(query_zero_sales, conn, params=[d_start, d_start, d_end, d_end])
            
            return {
                "evolution_mensuelle": df_evolution.to_dict('records'),
                "top_10_articles": df_top10.to_dict('records'),
                "articles_zero_vente": df_zero_sales.to_dict('records')
            }
            
    except Exception as e:
        print(f"Error in get_sales_analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
