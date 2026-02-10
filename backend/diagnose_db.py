from app.database import db
import pandas as pd

def diagnose():
    try:
        with db.get_connection() as conn:
            print("--- FAMILLES (ALL) ---")
            df_fam = pd.read_sql("SELECT TOP 20 FA_CodeFamille, FA_Intitule, FA_Type FROM dbo.F_FAMILLE", conn)
            print(df_fam)
            
            print("\n--- FOURNISSEURS (ALL) ---")
            df_four = pd.read_sql("SELECT TOP 20 CT_Num, CT_Intitule, CT_Type FROM dbo.F_COMPTET", conn)
            print(df_four)
            
            print("\n--- ARTICLES (SAMPLE) ---")
            df_art = pd.read_sql("SELECT TOP 10 ART_NUM, ART_LIB, ART_FOURPRINC, ART_FACODEFAMILLE FROM dbo.DP_ARTICLES", conn)
            print(df_art)
            
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == '__main__':
    diagnose()
