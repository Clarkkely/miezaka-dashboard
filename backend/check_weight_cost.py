import pandas as pd
from app.database import db

def check_weight_vs_cost():
    with db.get_connection() as conn:
        query = """
        SELECT TOP 10
            VL.VL_ART_NUM,
            VL.QteVendues,
            VL.CATTCNet,
            VL.PRXREVIENTU,
            A.ART_POIDSNET,
            FA.AR_UniteVen
        FROM dbo.DP_VENTES_LIGNES VL
        JOIN dbo.DP_ARTICLES A ON A.ART_UK = VL.VL_ART_UK
        LEFT JOIN dbo.F_ARTICLE FA ON FA.cbMarq = A.ART_PK
        WHERE A.ART_NUM = 'T_MO_PRO45K'
          AND VL.QteVendues >= 1
        ORDER BY VL.QteVendues DESC
        """
        df = pd.read_sql(query, conn)
        print("\n=== WEIGHT VS COST ANALYSIS (T_MO_PRO45K) ===")
        for i, row in df.iterrows():
            print(f"Qte Vendue: {row['QteVendues']}")
            print(f"  CA TTC: {row['CATTCNet']:,.0f}")
            print(f"  PRU (Sage): {row['PRXREVIENTU']:,.0f}")
            print(f"  Total Cost (Qte * PRU): {row['QteVendues'] * row['PRXREVIENTU']:,.0f}")
            print(f"  Nominal Weight: {row['ART_POIDSNET']}")
            print("-" * 30)

if __name__ == "__main__":
    check_weight_vs_cost()
