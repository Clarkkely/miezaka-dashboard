from app.database import db
import pandas as pd
import json
import os

def test_endpoints():
    try:
        with db.get_connection() as conn:
            # Test Familles
            query_fam = """
            SELECT DISTINCT 
                RTRIM(F.FA_CodeFamille) AS code,
                RTRIM(COALESCE(NULLIF(F.FA_Intitule, ''), F.FA_CodeFamille)) AS name
            FROM dbo.F_FAMILLE F
            WHERE F.FA_CodeFamille IS NOT NULL 
            AND F.FA_CodeFamille != ''
            ORDER BY name
            """
            df_fam = pd.read_sql(query_fam, conn)
            familles = df_fam.to_dict('records')
            with open('familles_test.json', 'w') as f:
                json.dump(familles, f, indent=2)
            print(f"Familles saved to familles_test.json (Total: {len(familles)})")

            # Test Fournisseurs
            query_four = """
            SELECT DISTINCT
                RTRIM(A.ART_FOURPRINC) AS code,
                RTRIM(COALESCE(C.CT_Intitule, A.ART_FOURPRINC)) AS name
            FROM dbo.DP_ARTICLES A
            LEFT JOIN dbo.F_COMPTET C ON C.CT_Num = A.ART_FOURPRINC
            WHERE A.ART_FOURPRINC IS NOT NULL 
              AND A.ART_FOURPRINC != ''
            ORDER BY name
            """
            df_four = pd.read_sql(query_four, conn)
            fournisseurs = df_four.to_dict('records')
            with open('fournisseurs_test.json', 'w') as f:
                json.dump(fournisseurs, f, indent=2)
            print(f"Fournisseurs saved to fournisseurs_test.json (Total: {len(fournisseurs)})")

    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == '__main__':
    test_endpoints()
