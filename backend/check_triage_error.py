import pandas as pd
from app.database import db

def check_triage_cost_error():
    with db.get_connection() as conn:
        query = """
        SELECT TOP 10
            VL.VL_ART_NUM,
            A.ART_LIB,
            VL.QteVendues,
            VL.CATTCNet,
            VL.PRXREVIENTU,
            F.FA_CodeFamille
        FROM dbo.DP_VENTES_LIGNES VL
        JOIN dbo.DP_ARTICLES A ON A.ART_UK = VL.VL_ART_UK
        JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
        WHERE F.FA_CodeFamille = 'TRIAGE'
          AND VL.QteVendues > 0
          AND VL.PRXREVIENTU > 100000
        ORDER BY VL.VL_DOCDATE DESC
        """
        df = pd.read_sql(query, conn)
        print("\n=== TRIAGE COST ANALYSIS (ERROR CHECK) ===")
        for i, row in df.iterrows():
            print(f"Article: {row['VL_ART_NUM']}")
            print(f"  Designation: {row['ART_LIB']}")
            print(f"  Qte: {row['QteVendues']} | CA: {row['CATTCNet']:,.0f}")
            print(f"  PRU (Sage): {row['PRXREVIENTU']:,.0f}")
            print(f"  Margin if Cost=PRU: {row['CATTCNet'] - (row['QteVendues'] * row['PRXREVIENTU']):,.0f}")
            print("-" * 30)

if __name__ == "__main__":
    check_triage_cost_error()
