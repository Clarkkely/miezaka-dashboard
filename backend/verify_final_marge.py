import pandas as pd
from app.database import db
import numpy as np

def test_final_logic():
    with db.get_connection() as conn:
        query = """
        SELECT
            F.FA_CodeFamille,
            SUM(VL.CATTCNet) as total_ca,
            SUM((VL.QteVendues / NULLIF(CASE WHEN A.ART_POIDSNET > 1 THEN A.ART_POIDSNET ELSE 1 END, 0)) * 
                CASE WHEN F.FA_CodeFamille = 'TRIAGE' THEN 0 ELSE COALESCE(FA.AR_PrixAchNouv, 0) END) as total_cost
        FROM dbo.DP_VENTES V
        JOIN dbo.DP_VENTES_LIGNES VL ON V.V_DOCTYPE = VL.VL_DOCTYPE AND V.V_DOCNUMBIN = VL.VL_DOCNUMBIN
        JOIN dbo.DP_ARTICLES A ON VL.VL_ART_UK = A.ART_UK
        JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
        LEFT JOIN dbo.F_ARTICLE FA ON FA.cbMarq = A.ART_PK
        WHERE F.FA_Type = 0
          AND F.FA_CodeFamille IN ('BALLE','FRIPPE','TRIAGE')
          AND A.ART_SOMMEIL = 'Actif'
          AND V.V_TYPE IN ('Facture caisse décentralisée comptabilisée', 'Facture comptabilisée', 'Facture', 'Facture caisse décentralisée', 'Facture de retour comptabilisée', 'Facture de retour')
        GROUP BY F.FA_CodeFamille
        """
        df = pd.read_sql(query, conn)
        print("\n=== VERIFICATION DES MARGES (LOGIQUE FINALE) ===")
        df['marge'] = df['total_ca'] - df['total_cost']
        df['pct'] = (df['marge'] / df['total_ca'] * 100)
        
        # Format metrics
        pd.options.display.float_format = '{:,.0f}'.format
        print(df)
        
        ca_global = df['total_ca'].sum()
        marge_globale = df['marge'].sum()
        print(f"\nTOTAL GLOBAL:")
        print(f"CA: {ca_global:,.0f} MGA")
        print(f"MARGE: {marge_globale:,.0f} MGA")
        print(f"TAUX: {(marge_globale/ca_global*100):.2f}%")

if __name__ == "__main__":
    test_final_logic()
