# 🎯 MIEZAKA Dashboard - Plateforme Analytique Intelligente

Une plateforme complète de gestion des stocks et d'analyse des ventes pour MIEZAKA.

## 📋 Prérequis

- **Python 3.8+** - Pour le backend FastAPI
- **Node.js 14+** - Pour le frontend React  
- **SQL Server** - Base de données (SRVRDS22)
- **ODBC Driver 17 for SQL Server** - Driver de connexion

## ✨ Fonctionnalités Principales

### 📊 Rapports & Données
- ✅ Génération de rapports dynamiques avec DataTable interactive
- ✅ Filtrage par famille (BALLE, FRIPPE, TRIAGE)
- ✅ Affichage des noms de fournisseurs (depuis F_COMPTET)
- ✅ Regroupement par fournisseur et famille
- ✅ Calculs automatiques des totaux

### 🖨️ Impression & Export
- ✅ Aperçu d'impression exact
- ✅ Export Excel formaté
- ✅ Export PDF professionnel
- ✅ Impression tableau uniquement

### 📈 Analytics
- ✅ Dashboard KPI (CA, marge, stock, rentabilité)
- ✅ Top 10 Articles Vendus
- ✅ Top 20 Articles par Marge
- ✅ Marge par Fournisseur
- ✅ Scatter Plot (Quantité vs Marge)
- ✅ Évolution mensuelle (6 derniers mois)
- ✅ Articles à 0 Vente
- ✅ Boutons d'impression intégrés

### 🧠 Recommandations Automatiques
- ✅ Réapprovisionner - Stock faible
- ✅ Surveiller - Tendances
- ✅ Arrêter/Liquider - Non rentables
- ✅ Augmenter Prix - Marge potentielle
- ✅ Promotion - Dynamiser
- ✅ Modal détaillée au clic
- ✅ Raison d'action expliquée

### ⚡ Performance & UX
- ✅ Redux avec cache 5 minutes
- ✅ Navigation fluide sans rechargement
- ✅ Notifications Toast
- ✅ Interface Material-UI moderne
- ✅ Responsive design

## 🚀 Démarrage Rapide

### Option 1 : Scripts PowerShell (Recommandé sous Windows)

#### Backend
```powershell
cd backend
.\run_server.ps1
```

L'API sera disponible à `http://localhost:8000`

#### Frontend (dans une nouvelle console)
```powershell
cd frontend
.\run_dev.ps1
```

L'application sera disponible à `http://localhost:3000`

### Option 2 : Commandes Manuelles

#### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

## 🔧 Configuration

### Backend (.env)
```
DB_SERVER=SRVRDS22
DB_DATABASE=MIEZAKA_TEST
DB_USERNAME=StageInfo
DB_PASSWORD=StageInfo
```

### Frontend (api.ts)
```typescript
const API_BASE_URL = 'http://localhost:8000/api';
```

## 📚 API Endpoints

### Rapports
- `POST /api/rapport/generate` - Générer rapport avec filtres
- `GET /api/rapport/fournisseurs` - Liste fournisseurs avec noms

### Analytics
- `GET /api/analytics/kpis` - KPIs globaux
- `GET /api/analytics/profitability` - Rentabilité (top 20, marge/fournisseur)
- `GET /api/analytics/sales-analysis` - Ventes (top 10, évolution, 0 vente)

### Recommandations
- `GET /api/recommendations` - Toutes les recommandations
- `POST /api/recommendations/detailed-analysis` - Analyse article

## 🧪 Tests

### Connexion Base de Données
```bash
cd backend
python test_db.py
```

### API Endpoints
```bash
# SWagger UI
http://localhost:8000/docs

# ReDoc
http://localhost:8000/redoc
```

### Tester Exports
- Import/Export Excel: `/rapport` → Boutons de téléchargement
- PDF: `/rapport` → "Télécharger PDF"
- Print: `/rapport` → "Aperçu" → Button "Imprimer"

## 🐛 Troubleshooting

### ODBC Driver 17 manquant
```powershell
# Installer depuis Microsoft
https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server

# Ou via Chocolatey (Windows)
choco install odbc-driver-17-for-sql-server
```

### Erreur: "Cannot connect to database"
- ✅ Vérifier que SRVRDS22 est accessible en réseau
- ✅ Vérifier les identifiants dans `.env`
- ✅ Vérifier firewall/VPN ne bloque pas
- ✅ Test: `cd backend && python test_db.py`

### Frontend ne se connecte pas au backend
- ✅ Vérifier: http://localhost:8000/docs accessible ✓
- ✅ Vérifier URL API dans `src/services/api.ts`
- ✅ Vérifier CORS dans `backend/app/main.py`

### Port déjà utilisé
```bash
# Nettoyer les processus (Windows)
taskkill /F /IM python.exe
taskkill /F /IM node.exe

# macOS/Linux
kill -9 $(lsof -t -i:8000)
kill -9 $(lsof -t -i:3000)

# Utiliser autre port
uvicorn app.main:app --port 8001
npm start -- --port 3001
```

### Erreur de permissions
- Vérifier que le dossier projet n'est pas protégé
- Lancer terminal/PowerShell en Admin si nécessaire
- Vérifier permissions fichiers .env

## 📦 Structure du Projet

```
MIEZAKA_DASHBOARD/
├── backend/
│   ├── app/
│   │   ├── main.py                      # FastAPI + CORS
│   │   ├── database.py                  # SQL Server
│   │   ├── models.py                    # Pydantic
│   │   ├── routes/
│   │   │   ├── rapport.py               # Rapports & fournisseurs
│   │   │   ├── analytics_advanced.py    # Analytics
│   │   │   └── recommendations.py       # Recommandations
│   │   └── services/
│   │       ├── data_service.py          # Logique métier
│   │       └── excel_service.py         # Export
│   ├── requirements.txt
│   ├── .env
│   └── run_server.ps1
│
├── frontend/
│   ├── src/
│   │   ├── pages/                       # Home, Rapport, Analytics
│   │   ├── components/
│   │   │   ├── Table/DataTable.tsx      # Table principale
│   │   │   ├── Modal/PrintPreview.tsx   # Aperçu impression
│   │   │   ├── analytics/               # KPI, Profitability, Sales
│   │   │   └── recommendations/         # Panel & Modal
│   │   ├── store/                       # Redux avec cache
│   │   ├── services/api.ts              # Client HTTP
│   │   └── styles/                      # CSS & animations
│   ├── package.json
│   └── run_dev.ps1
│
└── README.md
```

## 🎨 Stack Technologique

### Backend
- **FastAPI** - Framework web moderne async
- **Pydantic** - Validation données
- **Pandas** - Traitement DataFrames
- **PyODBC** - SQL Server
- **Python-dotenv** - Env vars

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Typage statique
- **Redux Toolkit** - State management + cache
- **Material-UI** - Composants UI
- **Recharts** - Graphiques interactifs
- **Axios** - Client HTTP
- **React Router** - Navigation
- **XLSX** - Export Excel
- **jsPDF** - Export PDF

## � Redux Caching Architecture

Le projet optimise les performances avec un système de cache intelligent:

- **lastFetched**: Timestamp du dernier chargement
- **cacheValidity**: Durée de cache (5 min par défaut)
- **hasData**: Flag indiquant si données en mémoire
- **Logique**: N'appeler API que si cache expiré ET paramètres changés

Avantages:
- ✅ Navigation fluide sans rechargement
- ✅ Données conservées 5 minutes
- ✅ UX rapide et réactive

## 📝 Notes

- Le backend utilise le **hot reload** en mode développement
- Le frontend utilise le **live reload** avec npm start  
- Les fichiers `.env` contiennent les credentials (ne pas committer)
- Redux cache réduit les appels API inutiles
- Tous les graphiques et listes filtrent par famille (BALLE, FRIPPE, TRIAGE)

## 🤝 Support & Contribution

### Contributing
```bash
git checkout -b feature/description
git commit -m "Description"
git push origin feature/description
# Crear Pull Request
```

### Documentation
- FastAPI: https://fastapi.tiangolo.com
- React: https://react.dev
- Material-UI: https://mui.com
- Redux: https://redux.js.org

## 📄 Licence

Projet interne MIEZAKA - Tous droits réservés
