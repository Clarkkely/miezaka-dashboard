from app.database import db
import pandas as pd

def check_stock_data():
    try:
        with db.get_connection() as conn:
            # Check if there's any stock at all for active articles
            query = """
            SELECT TOP 10 
                A.ART_UK, 
                A.ART_FACODEFAMILLE, 
                STD.STD_QTE, 
                STD.STD_DLDATEBL, 
                STD.STD_DEINTITULE
            FROM dbo.DP_ARTICLES A
            JOIN dbo.DP_STOCK_A_DATE STD ON STD.STD_ART_UK = A.ART_UK
            WHERE A.ART_SOMMEIL = 'Actif'
            ORDER BY STD.STD_DLDATEBL DESC
            """
            df = pd.read_sql(query, conn)
            print("--- RECENT STOCK RECORDS FOR ACTIVE ARTICLES ---")
            print(df.to_string())
            
            # Check family distribution for active articles with stock
            query_fam = """
            SELECT 
                F.FA_CodeFamille, 
                COUNT(*) as record_count,
                SUM(STD.STD_QTE) as total_qte
            FROM dbo.DP_ARTICLES A
            JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = A.ART_FACODEFAMILLE
            JOIN dbo.DP_STOCK_A_DATE STD ON STD.STD_ART_UK = A.ART_UK
            WHERE A.ART_SOMMEIL = 'Actif'
            GROUP BY F.FA_CodeFamille
            """
            df_fam = pd.read_sql(query_fam, conn)
            print("\n--- STOCK BY FAMILY (GLOBAL) ---")
            print(df_fam.to_string())

    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == '__main__':
    check_stock_data()
