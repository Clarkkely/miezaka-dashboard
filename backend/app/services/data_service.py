import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from app.database import db

# ==================== REQUÊTES SQL ====================
Q_ACHAT = """
SELECT
  A.ART_NUM,
  A.ART_LIB,
  A.ART_PRIXACH,
  A.ART_POIDSNET,
  A.ART_POIDSBRUT,
  A.ART_FOURPRINC,
  SUM(AL.QteVendues) AS achat_qte,
  SUM(AL.QteVendues)*A.ART_POIDSNET AS achat_poids,
  F.FA_CodeFamille,
  INF6.infolibre6,
  INF10.infolibre10,
  FA.AR_PrixVenNouv,
  FA.AR_PrixAchNouv
FROM dbo.DP_ARTICLES A
JOIN dbo.DP_ACHATS_LIGNES AL ON AL.AL_ART_UK = A.ART_UK
JOIN dbo.DP_ACHATS ACH ON ACH.A_DOCNUMBIN = AL.AL_DOCNUMBIN AND ACH.A_DOCTYPE = AL.AL_DOCTYPE
JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
LEFT JOIN dbo.DP_INFOLIBREART6 INF6 ON INF6.ART_UK = A.ART_UK
LEFT JOIN dbo.DP_INFOLIBREART10 INF10 ON INF10.ART_UK = A.ART_UK
LEFT JOIN dbo.F_ARTICLE FA ON FA.cbMarq = A.ART_PK
WHERE
  F.FA_Type = 0
  AND F.FA_CodeFamille IN ('BALLE','FRIPPE')
  AND A.ART_SOMMEIL IN ('Actif')
  AND ACH.A_DOCDATE BETWEEN ? AND ?
  AND ACH.A_TYPE IN ('Facture comptabilisée', 'Facture', 'Facture de retour comptabilisée', 'Facture de retour')
  AND A.ART_NUM != 'REPORT_FACTURE'
GROUP BY
  A.ART_NUM, A.ART_LIB, A.ART_PRIXACH, A.ART_POIDSNET, A.ART_POIDSBRUT, A.ART_FOURPRINC,
  F.FA_CodeFamille, INF6.infolibre6, INF10.infolibre10, FA.AR_PrixVenNouv, FA.AR_PrixAchNouv
"""

Q_PRODUCTION = """
SELECT
  A.ART_NUM,
  A.ART_LIB,
  A.ART_PRIXACH,
  A.ART_POIDSNET,
  A.ART_POIDSBRUT,
  A.ART_FOURPRINC,
  SUM(DFAL.DFAL_QTE) AS prod_qte,
  SUM(DFAL.DFAL_QTE)*A.ART_POIDSNET AS prod_poids,
  F.FA_CodeFamille,
  INF6.infolibre6,
  INF10.infolibre10,
  FA.AR_PrixVenNouv,
  FA.AR_PrixAchNouv
FROM dbo.DP_ARTICLES A
JOIN dbo.DP_DOC_FABRICATION_LIGNES DFAL ON DFAL.DFAL_ART_UK = A.ART_UK
JOIN dbo.DP_DOC_FABRICATION DF ON DF.DF_DOCNUMBIN = DFAL.DFAL_DOCNUMBIN AND DF.DF_DOCTYPE = DFAL.DFAL_DOTYPE
JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
LEFT JOIN dbo.DP_INFOLIBREART6 INF6 ON INF6.ART_UK = A.ART_UK
LEFT JOIN dbo.DP_INFOLIBREART10 INF10 ON INF10.ART_UK = A.ART_UK
LEFT JOIN dbo.F_ARTICLE FA ON FA.cbMarq = A.ART_PK
WHERE
  F.FA_Type = 0
  AND F.FA_CodeFamille IN ('BALLE','FRIPPE')
  AND A.ART_SOMMEIL IN ('Actif')
  AND DF.DF_DOCDATE BETWEEN ? AND ?
  AND INF6.infolibre6 NOT IN ('C')
GROUP BY
  A.ART_NUM, A.ART_LIB, A.ART_PRIXACH, A.ART_POIDSNET, A.ART_POIDSBRUT, A.ART_FOURPRINC,
  F.FA_CodeFamille, INF6.infolibre6, INF10.infolibre10, FA.AR_PrixVenNouv, FA.AR_PrixAchNouv
"""

Q_VENTE = """
SELECT
  A.ART_NUM,
  A.ART_LIB,
  A.ART_PRIXACH,
  A.ART_POIDSNET,
  A.ART_POIDSBRUT,
  A.ART_FOURPRINC,
  SUM(VL.QteVendues) AS vente_qte,
  SUM(VL.QteVendues)*A.ART_POIDSNET AS vente_poids,
  SUM(VL.CATTCNet) AS vente_montant,
  F.FA_CodeFamille,
  INF6.infolibre6,
  INF10.infolibre10,
  FA.AR_PrixVenNouv,
  FA.AR_PrixAchNouv
FROM dbo.DP_VENTES V
JOIN dbo.DP_VENTES_LIGNES VL ON V.V_DOCTYPE = VL.VL_DOCTYPE AND V.V_DOCNUMBIN = VL.VL_DOCNUMBIN
JOIN dbo.DP_ARTICLES A ON VL.VL_ART_UK = A.ART_UK
JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
LEFT JOIN dbo.DP_INFOLIBREART6 INF6 ON INF6.ART_UK = A.ART_UK
LEFT JOIN dbo.DP_INFOLIBREART10 INF10 ON INF10.ART_UK = A.ART_UK
LEFT JOIN dbo.F_ARTICLE FA ON FA.cbMarq = A.ART_PK
WHERE
  F.FA_Type = 0
  AND F.FA_CodeFamille IN ('BALLE','FRIPPE')
  AND A.ART_SOMMEIL IN ('Actif')
  AND V.V_TYPE IN ('Facture caisse décentralisée comptabilisée', 'Facture comptabilisée', 'Facture', 'Facture caisse décentralisée', 'Facture de retour comptabilisée', 'Facture de retour')
  AND V.V_DOCDATE BETWEEN ? AND ?
  AND A.ART_NUM NOT IN ('REPORT_FACT_ADD','REPORT_FACT_FRIP','REPORT_FACT_HYG','REPORT_FACT_LUM','REPORT_FACT_PET','REPORT_FACT_PNEU','REPORT_FACT_PPN','REPORT_FACT_QUIN','REPORT_FACTURE')
GROUP BY
  A.ART_NUM, A.ART_LIB, A.ART_PRIXACH, A.ART_POIDSNET, A.ART_POIDSBRUT, A.ART_FOURPRINC,
  F.FA_CodeFamille, INF6.infolibre6, INF10.infolibre10, FA.AR_PrixVenNouv, FA.AR_PrixAchNouv
"""

Q_STOCK = """
SELECT
  A.ART_NUM,
  A.ART_LIB,
  A.ART_PRIXACH,
  A.ART_POIDSNET,
  A.ART_POIDSBRUT,
  A.ART_FOURPRINC,
  F.FA_CodeFamille,
  SUM(STD.STD_QTE) AS stock_qte,
  SUM(STD.STD_QTE)*A.ART_POIDSNET AS stock_poids,
  INF6.infolibre6,
  INF10.infolibre10,
  FA.AR_PrixVenNouv,
  FA.AR_PrixAchNouv
FROM dbo.DP_ARTICLES A
JOIN dbo.DP_STOCK_A_DATE STD ON STD.STD_ART_UK = A.ART_UK
JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
LEFT JOIN dbo.DP_INFOLIBREART6 INF6 ON INF6.ART_UK = A.ART_UK
LEFT JOIN dbo.DP_INFOLIBREART10 INF10 ON INF10.ART_UK = A.ART_UK
LEFT JOIN dbo.F_ARTICLE FA ON FA.cbMarq = A.ART_PK
WHERE
  F.FA_Type = 0
  AND F.FA_CodeFamille IN ('BALLE','FRIPPE')
  AND A.ART_SOMMEIL IN ('Actif')
  AND STD.STD_DEINTITULE NOT IN ('Z DEPOT HUGUES','Z DEPOT RIZOU','Z INV 2024','Z INVENTAIRE','Z KARENJY','Z MIEZAKA','Z RETOUR PALETTE','Z TAVE PAUL (HUGUES)')
  AND STD.STD_DLDATEBL <= ?
  AND INF6.infolibre6 != 'C'
GROUP BY
  A.ART_NUM, A.ART_LIB, A.ART_PRIXACH, A.ART_POIDSNET, A.ART_POIDSBRUT, A.ART_FOURPRINC,
  F.FA_CodeFamille, INF6.infolibre6, INF10.infolibre10, FA.AR_PrixVenNouv, FA.AR_PrixAchNouv
HAVING SUM(STD.STD_QTE) >= 1
"""

Q_REPORT = """
SELECT
  A.ART_NUM,
  A.ART_LIB,
  A.ART_PRIXACH,
  A.ART_POIDSNET,
  A.ART_POIDSBRUT,
  A.ART_FOURPRINC,
  F.FA_CodeFamille,
  SUM(STD.STD_QTE) AS report_qte,
  SUM(STD.STD_QTE)*A.ART_POIDSNET AS report_poids,
  INF6.infolibre6,
  INF10.infolibre10,
  FA.AR_PrixVenNouv,
  FA.AR_PrixAchNouv
FROM dbo.DP_ARTICLES A
JOIN dbo.DP_STOCK_A_DATE STD ON STD.STD_ART_UK = A.ART_UK
JOIN dbo.F_FAMILLe F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
LEFT JOIN dbo.DP_INFOLIBREART6 INF6 ON INF6.ART_UK = A.ART_UK
LEFT JOIN dbo.DP_INFOLIBREART10 INF10 ON INF10.ART_UK = A.ART_UK
LEFT JOIN dbo.F_ARTICLE FA ON FA.cbMarq = A.ART_PK
WHERE
  F.FA_Type = 0
  AND F.FA_CodeFamille IN ('BALLE','FRIPPE')
  AND A.ART_SOMMEIL IN ('Actif')
  AND STD.STD_DEINTITULE NOT IN ('Z DEPOT HUGUES','Z DEPOT RIZOU','Z INV 2024','Z INVENTAIRE','Z KARENJY','Z MIEZAKA','Z RETOUR PALETTE','Z TAVE PAUL (HUGUES)')
  AND STD.STD_DLDATEBL <= ?
  AND INF6.infolibre6 != 'C'
GROUP BY
  A.ART_NUM, A.ART_LIB, A.ART_PRIXACH, A.ART_POIDSNET, A.ART_POIDSBRUT, A.ART_FOURPRINC,
  F.FA_CodeFamille, INF6.infolibre6, INF10.infolibre10, FA.AR_PrixVenNouv, FA.AR_PrixAchNouv
"""

def generate_rapport(params):
    """Génère le rapport complet"""
    with db.get_connection() as conn:
        # Conversion des chaînes de dates en objets date
        try:
            # Utilisation de Pandas pour le parsing robuste
            d_debut = pd.to_datetime(params.date_debut).date()
            d_fin = pd.to_datetime(params.date_fin).date()
            d_stock = pd.to_datetime(params.date_stock).date()
        except Exception as e:
            print(f"Date conversion error: {e}")
            d_debut = d_fin = d_stock = datetime.now().date()

        # Force verification type
        if isinstance(d_debut, str):
            print("CRITICAL: d_debut is still string!")
            d_debut = datetime.now().date()

        date_report = d_debut - timedelta(days=1)
        print(f"DEBUG DATES: debut={type(d_debut)} val={d_debut}, report={type(date_report)} val={date_report}")
        
        # Exécution des requêtes
        report = pd.read_sql(Q_REPORT, conn, params=(date_report,))
        achat = pd.read_sql(Q_ACHAT, conn, params=(d_debut, d_fin))
        production = pd.read_sql(Q_PRODUCTION, conn, params=(d_debut, d_fin))
        vente = pd.read_sql(Q_VENTE, conn, params=(d_debut, d_fin))
        stock = pd.read_sql(Q_STOCK, conn, params=(d_stock,))
        
        # Traitement identique à votre fonction rapport()
        all_articles = pd.concat([
            report[['ART_NUM', 'ART_LIB', 'ART_PRIXACH', 'ART_POIDSNET', 'ART_POIDSBRUT', 
                    'ART_FOURPRINC', 'FA_CodeFamille', 'AR_PrixVenNouv', 'AR_PrixAchNouv', 'infolibre6']],
            achat[['ART_NUM', 'ART_LIB', 'ART_PRIXACH', 'ART_POIDSNET', 'ART_POIDSBRUT',
                   'ART_FOURPRINC', 'FA_CodeFamille', 'AR_PrixVenNouv', 'AR_PrixAchNouv', 'infolibre6']],
            production[['ART_NUM', 'ART_LIB', 'ART_PRIXACH', 'ART_POIDSNET', 'ART_POIDSBRUT',
                       'ART_FOURPRINC', 'FA_CodeFamille', 'AR_PrixVenNouv', 'AR_PrixAchNouv', 'infolibre6']],
            vente[['ART_NUM', 'ART_LIB', 'ART_PRIXACH', 'ART_POIDSNET', 'ART_POIDSBRUT',
                   'ART_FOURPRINC', 'FA_CodeFamille', 'AR_PrixVenNouv', 'AR_PrixAchNouv', 'infolibre6']],
            stock[['ART_NUM', 'ART_LIB', 'ART_PRIXACH', 'ART_POIDSNET', 'ART_POIDSBRUT',
                   'ART_FOURPRINC', 'FA_CodeFamille', 'AR_PrixVenNouv', 'AR_PrixAchNouv', 'infolibre6']]
        ]).drop_duplicates(subset=['ART_NUM'])

        # Fusion des données de mouvements
        df = all_articles.merge(
            report[['ART_NUM', 'report_qte', 'report_poids']], on='ART_NUM', how='left'
        ).merge(
            achat[['ART_NUM', 'achat_qte', 'achat_poids']], on='ART_NUM', how='left'
        ).merge(
            production[['ART_NUM', 'prod_qte', 'prod_poids']], on='ART_NUM', how='left'
        ).merge(
            vente[['ART_NUM', 'vente_qte', 'vente_poids', 'vente_montant']], on='ART_NUM', how='left'
        ).merge(
            stock[['ART_NUM', 'stock_qte', 'stock_poids']], on='ART_NUM', how='left'
        ).fillna(0)

        # Récupération du nom du fournisseur principal (Sage 100 : table tiers F_COMPTET)
        try:
            # Nettoyage des clés de jointure pour éviter les erreurs liées aux espaces (CHAR vs VARCHAR)
            df["ART_FOURPRINC"] = df["ART_FOURPRINC"].astype(str).str.strip()
            
            # Récupérer TOUS les fournisseurs de la table F_COMPTET (pas juste ceux du WHERE IN)
            all_suppliers = pd.read_sql(
                """
                SELECT 
                    RTRIM(CT_Num) as CT_Num,
                    RTRIM(CT_Intitule) as CT_Intitule
                FROM dbo.F_COMPTET
                WHERE CT_Type = 3
                """,
                conn,
            )
            
            # Créer un dictionnaire pour le mapping code -> nom
            supplier_map = {}
            for _, row in all_suppliers.iterrows():
                code = str(row['CT_Num']).strip()
                name = str(row['CT_Intitule']).strip() if pd.notna(row['CT_Intitule']) else code
                supplier_map[code] = name
            
            print(f"\n=== Fournisseur Mapping ===")
            print(f"Total suppliers in F_COMPTET: {len(supplier_map)}")
            if len(supplier_map) > 0:
                print(f"Sample suppliers: {list(supplier_map.items())[:3]}")
            
            # Appliquer le mapping au dataframe
            df["Fournisseur_Nom"] = df['ART_FOURPRINC'].apply(
                lambda code: supplier_map.get(str(code).strip(), str(code).strip()) if pd.notna(code) else ''
            )
            
            print(f"Articles in report: {len(df)}")
            print(f"Fournisseur_Nom samples: {df['Fournisseur_Nom'].head(5).tolist()}")
            print(f"ART_FOURPRINC samples: {df['ART_FOURPRINC'].head(5).tolist()}")

        except Exception as e:
            # En cas de problème, utiliser simplement le code
            print(f"Error mapping fournisseur names: {e}")
            import traceback
            traceback.print_exc()
            df["Fournisseur_Nom"] = df["ART_FOURPRINC"].astype(str).str.strip()
        
        # Calculs
        df['Montant_Disponible'] = df['stock_qte'] * df['ART_POIDSBRUT']
        df['Pct_Vente'] = np.where(
            (df['report_qte'] + df['achat_qte'] + df['prod_qte']) > 0,
            (df['vente_qte'] / (df['report_qte'] + df['achat_qte'] + df['prod_qte'])) * 100,
            0
        )
        df['Marge_%'] = np.where(
            df['AR_PrixVenNouv'] > 0,
            ((df['AR_PrixVenNouv'] - df['ART_POIDSBRUT']) / df['AR_PrixVenNouv']) * 100,
            0
        )
        
        # Filtrage
        if params.familles:
            # params.familles est une List[str], donc on l'utilise directement
            df = df[df['FA_CodeFamille'].isin(params.familles)]
        if params.min_stock > 0:
            df = df[df['stock_qte'] >= params.min_stock]
        if params.fournisseurs:
            df = df[df['ART_FOURPRINC'].isin(params.fournisseurs)]
        
        return df
        
        return df