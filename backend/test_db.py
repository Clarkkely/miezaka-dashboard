# test_db.py
import pandas as pd
from app.database import db

def test_familles():
    """Teste la requête des familles"""
    try:
        query = """
        SELECT DISTINCT 
            F.FA_CodeFamille AS code,
            F.FA_CodeFamille AS name
        FROM dbo.F_FAMILLE F
        WHERE F.FA_Type = 0
        AND F.FA_CodeFamille IS NOT NULL 
        AND F.FA_CodeFamille != ''
        ORDER BY F.FA_CodeFamille
        """
        
        with db.get_connection() as conn:
            df = pd.read_sql(query, conn)
            print("=== TEST FAMILLES ===")
            print(f"Nombre de résultats: {len(df)}")
            print(f"Colonnes: {df.columns.tolist()}")
            if len(df) > 0:
                print("Premières 10 lignes:")
                print(df.head(10))
            else:
                print("Aucune donnée trouvée!")
                
    except Exception as e:
        print(f"Erreur: {str(e)}")

def test_fournisseurs():
    """Teste la requête des fournisseurs"""
    try:
        query = """
        SELECT DISTINCT
            CT_Num AS code,
            CT_Intitule AS name
        FROM dbo.F_COMPTET
        WHERE CT_Type = 3
        AND CT_Num IS NOT NULL
        AND CT_Num != ''
        ORDER BY CT_Intitule
        """
        
        with db.get_connection() as conn:
            df = pd.read_sql(query, conn)
            print("\n=== TEST FOURNISSEURS ===")
            print(f"Nombre de résultats: {len(df)}")
            print(f"Colonnes: {df.columns.tolist()}")
            if len(df) > 0:
                print("Premières 10 lignes:")
                print(df.head(10))
            else:
                print("Aucune donnée trouvée!")
                
    except Exception as e:
        print(f"Erreur: {str(e)}")

def test_structure():
    """Teste la structure des tables"""
    try:
        with db.get_connection() as conn:
            # Teste la table F_FAMILLE
            query_fam = "SELECT TOP 5 * FROM dbo.F_FAMILLE"
            df_fam = pd.read_sql(query_fam, conn)
            print("\n=== STRUCTURE F_FAMILLE ===")
            print(f"Colonnes: {df_fam.columns.tolist()}")
            print(df_fam.head())
            
            # Teste la table F_COMPTET
            query_comp = "SELECT TOP 5 * FROM dbo.F_COMPTET WHERE CT_Type = 3"
            df_comp = pd.read_sql(query_comp, conn)
            print("\n=== STRUCTURE F_COMPTET (Fournisseurs) ===")
            print(f"Colonnes: {df_comp.columns.tolist()}")
            print(df_comp.head())
            
            # Teste la table DP_VENTES_LIGNES
            query_ventes = "SELECT TOP 5 * FROM dbo.DP_VENTES_LIGNES"
            df_ventes = pd.read_sql(query_ventes, conn)
            print("\n=== STRUCTURE DP_VENTES_LIGNES ===")
            print(f"Colonnes: {df_ventes.columns.tolist()}")
            print(df_ventes.head())
            
    except Exception as e:
        print(f"Erreur: {str(e)}")

if __name__ == "__main__":
    test_structure()
    test_familles()
    test_fournisseurs()