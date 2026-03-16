import pandas as pd
from app.database import db

def check_global_marge_with_pru():
    with db.get_connection() as conn:
        query = """
        SELECT
            SUM(COALESCE(VL.CATTCNET, 0)) AS ca_total,
            SUM(COALESCE(VL.CATTCNET, 0) - (VL.QTEVENDUES * COALESCE(VL.PRXREVIENTU, 0))) AS marge_totale_pru,
            SUM(COALESCE(VL.MARGE, 0)) AS marge_totale_sage_field
        FROM dbo.DP_VENTES V
        JOIN dbo.DP_VENTES_LIGNES VL ON V.V_DOCTYPE = VL.VL_DOCTYPE AND V.V_DOCNUMBIN = VL.VL_DOCNUMBIN
        JOIN dbo.DP_ARTICLES A ON VL.VL_ART_UK = A.ART_UK
        JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
        WHERE F.FA_Type = 0
          AND F.FA_CodeFamille IN ('BALLE','FRIPPE','TRIAGE')
          AND A.ART_SOMMEIL = 'Actif'
          AND V.V_TYPE IN ('Facture caisse décentralisée comptabilisée', 'Facture comptabilisée', 'Facture', 'Facture caisse décentralisée', 'Facture de retour comptabilisée', 'Facture de retour')
          AND V.V_DOCDATE >= '2024-01-01'
        """
        df = pd.read_sql(query, conn)
        print("\n=== VERIFICATION FINALE (PRU) ===")
        print(f"CA Total: {df['ca_total'].iloc[0]:,.0f} MGA")
        print(f"Marge PRU (Nouvelle Logique): {df['marge_totale_pru'].iloc[0]:,.0f} MGA")
        print(f"Marge Sage (Champ Interne): {df['marge_totale_sage_field'].iloc[0]:,.0f} MGA")
        
if __name__ == "__main__":
    check_global_marge_with_pru()
