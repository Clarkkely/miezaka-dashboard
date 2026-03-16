import pandas as pd
from app.database import db

def debug_mismatch_v2():
    with db.get_connection() as conn:
        query = """
        SELECT TOP 20
            A.ART_NUM,
            A.ART_LIB,
            VL.QteVendues,
            VL.CATTCNet,
            VL.PRXREVIENTU,
            A.ART_POIDSNET,
            F.FA_CodeFamille,
            (VL.CATTCNet - (VL.QteVendues * VL.PRXREVIENTU)) as margin_at_risk
        FROM dbo.DP_VENTES_LIGNES VL
        JOIN dbo.DP_ARTICLES A ON A.ART_UK = VL.VL_ART_UK
        JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
        WHERE VL.QteVendues > 0
          AND A.ART_NUM NOT IN ('REPORT_FACT_ADD','REPORT_FACT_FRIP','REPORT_FACT_HYG','REPORT_FACT_LUM','REPORT_FACT_PET','REPORT_FACT_PNEU','REPORT_FACT_PPN','REPORT_FACT_QUIN','REPORT_FACTURE')
          AND F.FA_CodeFamille IN ('BALLE','FRIPPE','TRIAGE')
        ORDER BY (VL.CATTCNet - (VL.QteVendues * VL.PRXREVIENTU)) ASC
        """
        df = pd.read_sql(query, conn)
        print("\n=== TOP 20 SOURCE OF NEGATIVE MARGIN (FILTERED) ===")
        for i, row in df.iterrows():
            print(f"Art: {row['ART_NUM']} ({row['FA_CodeFamille']})")
            print(f"Designation: {row['ART_LIB']}")
            print(f"  Qte: {row['QteVendues']} | CA: {row['CATTCNet']:,.0f} | PRU: {row['PRXREVIENTU']:,.0f}")
            print(f"  Poids: {row['ART_POIDSNET']} | Ratio CA/Qte: {row['CATTCNet']/row['QteVendues'] if row['QteVendues'] != 0 else 0:,.0f}")
            print(f"  Calculated Margin: {row['margin_at_risk']:,.0f}")
            print("-" * 30)

if __name__ == "__main__":
    debug_mismatch_v2()
