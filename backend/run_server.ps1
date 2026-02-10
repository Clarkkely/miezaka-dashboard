# Script PowerShell pour démarrer le backend
# Usage: .\run_server.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MIEZAKA Dashboard - Backend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python installé: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python n'est pas installé" -ForegroundColor Red
    exit 1
}

# Naviguer au répertoire backend
Push-Location $PSScriptRoot

# Vérifier les dépendances
Write-Host ""
Write-Host "📦 Vérification des dépendances..." -ForegroundColor Yellow
try {
    python -c "import fastapi, uvicorn, pyodbc, pandas" 2>&1 | Out-Null
    Write-Host "✅ Toutes les dépendances sont installées" -ForegroundColor Green
} catch {
    Write-Host "⚙️  Installation des dépendances..." -ForegroundColor Yellow
    pip install -r requirements.txt
}

# Vérifier la base de données
Write-Host ""
Write-Host "🔍 Test de connexion à la base de données..." -ForegroundColor Yellow
python -c @"
import os
import sys
from app.database import db

try:
    with db.get_connection() as conn:
        print('✅ Connexion à la base de données réussie!')
except Exception as e:
    print(f'⚠️  Erreur de connexion: {str(e)[:80]}')
    print('   Le backend démarrera quand même. Vérifiez la configuration.')
"@ 2>&1

# Démarrer le serveur
Write-Host ""
Write-Host "🚀 Démarrage du serveur FastAPI..." -ForegroundColor Cyan
Write-Host "📡 API disponible à: http://localhost:8000" -ForegroundColor Green
Write-Host "📚 Documentation à: http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""

python -m uvicorn app.main:app --reload --port 8000

Pop-Location
