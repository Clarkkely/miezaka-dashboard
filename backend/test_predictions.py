import sys
import os
from datetime import datetime, timedelta

# Add the project directory to sys.path
sys.path.append(os.getcwd())

from app.routes.predictions_v2 import get_sales_forecast, get_stock_forecast, get_article_classification

def test_predictions():
    print("Testing Predictions Routes (v2)...")
    
    # Simuler des dates
    d_deb = "2025-01-01"
    d_fin = "2025-12-31"

    try:
        print(f"\n1. Testing Sales Forecast ({d_deb} to {d_fin})...")
        res = get_sales_forecast(date_debut=d_deb, date_fin=d_fin)
        print(f"Success! Historique: {len(res.get('historique', []))} items")
    except Exception as e:
        print(f"FAILED Sales Forecast: {e}")

    try:
        print(f"\n2. Testing Stock Forecast ({d_deb} to {d_fin})...")
        res = get_stock_forecast(date_debut=d_deb, date_fin=d_fin)
        print(f"Success! Articles critiques: {len(res.get('articles_critiques', []))} items")
    except Exception as e:
        print(f"FAILED Stock Forecast: {e}")

    try:
        print(f"\n3. Testing Article Classification ({d_deb} to {d_fin})...")
        res = get_article_classification(date_debut=d_deb, date_fin=d_fin)
        print(f"Success! Stats: {res.get('stats')}")
    except Exception as e:
        print(f"FAILED Article Classification: {e}")

if __name__ == "__main__":
    test_predictions()
