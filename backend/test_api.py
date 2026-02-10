#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.data_service import generate_rapport
from app.models import RapportRequest

# Créer une requête de test
request = RapportRequest(
    date_debut="2025-01-01",
    date_fin="2025-12-31", 
    date_stock="2025-12-31",
    familles=["BALLE", "FRIPPE"],
    min_stock=0,
    fournisseurs=[],
    debug_mode=False,
    periode_analyse="mensuel"
)

print("Test de génération de rapport...")
print(f"Requête: {request}")

try:
    df = generate_rapport(request)
    print(f" Succès! DataFrame généré avec {len(df)} lignes")
    print(f"Colonnes: {list(df.columns)}")
    if len(df) > 0:
        print(f"Première ligne:\n{df.iloc[0]}")
except Exception as e:
    print(f" Erreur: {str(e)}")
    import traceback
    traceback.print_exc()
