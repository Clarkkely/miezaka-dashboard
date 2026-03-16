import sys
import os

# Add the project directory to sys.path
sys.path.append(os.getcwd())

from app.routes.analytics_advanced import get_profitability_analysis

def test_profit():
    print("Testing Profitability Analysis...")
    try:
        res = get_profitability_analysis()
        print(f"Top Articles: {len(res['marge_par_article'])}")
        print(f"Top 1st Article Marge Absolue: {res['marge_par_article'][0]['marge_absolue']}")
        print(f"Top Fournisseurs: {len(res['marge_par_fournisseur'])}")
        print(f"Top 1st Fournisseur Marge Absolue: {res['marge_par_fournisseur'][0]['marge_absolue']}")
        print(f"Scatter Points: {len(res['scatter_data'])}")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_profit()
