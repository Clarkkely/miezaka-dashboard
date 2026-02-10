from app.database import db
import pandas as pd

def quick_check():
    try:
        with db.get_connection() as conn:
            print("--- TABLE COUNTS ---")
            tabs = ['dbo.DP_ARTICLES', 'dbo.F_FAMILLE', 'dbo.DP_STOCK_A_DATE']
            for t in tabs:
                count = pd.read_sql(f"SELECT COUNT(*) as cnt FROM {t}", conn)
                print(f"{t}: {count['cnt'][0]}")
            
            print("\n--- SAMPLE DP_STOCK_A_DATE (Warehouses) ---")
            query_w = "SELECT DISTINCT TOP 20 STD_DEINTITULE FROM dbo.DP_STOCK_A_DATE"
            df_w = pd.read_sql(query_w, conn)
            print(df_w.to_string())
            
            print("\n--- SAMPLE DP_STOCK_A_DATE (Dates) ---")
            query_d = "SELECT DISTINCT TOP 5 STD_DLDATEBL FROM dbo.DP_STOCK_A_DATE ORDER BY STD_DLDATEBL DESC"
            df_d = pd.read_sql(query_d, conn)
            print(df_d.to_string())

            print("\n--- TEST CORE JOIN ---")
            # See if the JOIN between articles and families is working
            query_join = """
            SELECT TOP 5 A.ART_UK, A.ART_FACODEFAMILLE, F.FA_Intitule
            FROM dbo.DP_ARTICLES A
            JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
            WHERE A.ART_SOMMEIL = 'Actif'
            """
            df_join = pd.read_sql(query_join, conn)
            print(df_join.to_string())

    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == '__main__':
    quick_check()
