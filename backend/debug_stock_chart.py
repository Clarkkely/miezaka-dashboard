from app.database import db
import pandas as pd
import json

def debug_stock_by_family():
    try:
        with db.get_connection() as conn:
            query = """
            WITH latest_stock AS (
                SELECT
                    STD_ART_UK,
                    MAX(STD_DLDATEBL) AS max_date
                FROM dbo.DP_STOCK_A_DATE
                GROUP BY STD_ART_UK
            )
            SELECT 
                F.FA_CodeFamille AS famille,
                F.FA_Intitule AS intitule,
                COUNT(DISTINCT A.ART_UK) AS nombre_articles,
                COALESCE(SUM(STD.STD_QTE), 0) AS stock_total
            FROM dbo.DP_ARTICLES A
            JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
            JOIN latest_stock LS ON LS.STD_ART_UK = A.ART_UK
            JOIN dbo.DP_STOCK_A_DATE STD 
                ON STD.STD_ART_UK = LS.STD_ART_UK AND STD.STD_DLDATEBL = LS.max_date
            WHERE A.ART_SOMMEIL = 'Actif'
              AND STD.STD_DEINTITULE NOT IN (
                  'Z DEPOT HUGUES','Z DEPOT RIZOU','Z INV 2024','Z INVENTAIRE',
                  'Z KARENJY','Z MIEZAKA','Z RETOUR PALETTE','Z TAVE PAUL (HUGUES)'
              )
            GROUP BY F.FA_CodeFamille, F.FA_Intitule
            """
            df = pd.read_sql(query, conn)
            print("--- STOCK BY FAMILY DATA ---")
            print(df.to_string())
            
            # Check for articles without family mapping or families with zero stock
            query_check = "SELECT TOP 10 ART_UK, ART_FACODEFAMILLE FROM dbo.DP_ARTICLES WHERE ART_SOMMEIL = 'Actif'"
            df_check = pd.read_sql(query_check, conn)
            print("\n--- SAMPLE ARTICLES ---")
            print(df_check.to_string())

    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == '__main__':
    debug_stock_by_family()
