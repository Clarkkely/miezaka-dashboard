@echo off
REM Script de démarrage du backend FastAPI

echo.
echo ========================================
echo   MIEZAKA Dashboard - Backend Server
echo ========================================
echo.

REM Vérifier Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python n'est pas installé ou n'est pas dans le PATH
    pause
    exit /b 1
)

REM Naviguer au répertoire backend
cd /d "%~dp0"

REM Afficher le répertoire courant
echo 📁 Répertoire courant: %CD%
echo.

REM Vérifier si les dépendances sont installées
python -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo ⚙️  Installation des dépendances...
    pip install -r requirements.txt
)

REM Démarrer le serveur
echo.
echo 🚀 Démarrage du serveur FastAPI...
echo.
python -m uvicorn app.main:app --reload --port 8000

pause
