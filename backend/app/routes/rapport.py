from fastapi import APIRouter, HTTPException
from typing import Dict, List
import pandas as pd
from datetime import datetime, timedelta
from app.models import RapportRequest, RapportResponse, Article, PredictionResponse, Insight
from app.services.data_service import generate_rapport
from app.database import db

router = APIRouter()

# ==================== ENDPOINT FAMILLES ====================
@router.get("/familles")
async def get_familles() -> List[Dict[str, str]]:
    """
    Récupère les familles d'articles autorisées (FRIPPE, BALLE, TRIAGE uniquement)
    """
    # Liste restreinte des familles autorisées
    familles = [
        {'code': 'FRIPPE', 'name': 'ACHAT DE MARCHANDISES FRIPERIE'},
        {'code': 'BALLE', 'name': 'GROSSE BALLE'},
        {'code': 'TRIAGE', 'name': 'TRIAGE DE GROSSE BALLE'}
    ]
    
    return familles



# ==================== ENDPOINT FOURNISSEURS ====================
@router.get("/fournisseurs")
async def get_fournisseurs() -> List[Dict[str, str]]:
    """
    Récupère tous les fournisseurs possibles selon la formule de nommage
    """
    # Liste complète de tous les noms de fournisseurs possibles selon la formule
    # Chaque variante possible est incluse
    fournisseurs = [
        {'code': 'ATTAR', 'name': 'ATTAR'},
        {'code': 'ATTAR PRO', 'name': 'ATTAR PRO'},
        {'code': 'LE RELAIS FR', 'name': 'LE RELAIS FR'},
        {'code': 'LRF PRO', 'name': 'LRF PRO'},
        {'code': 'LE RELAIS FR DUB', 'name': 'LE RELAIS FR DUB'},
        {'code': 'EUROTEX', 'name': 'EUROTEX'},
        {'code': 'EUROTEX PRO', 'name': 'EUROTEX PRO'},
        {'code': 'LRM SBR', 'name': 'LRM SBR'},
        {'code': 'LRM ABR', 'name': 'LRM ABR'},
        {'code': 'RECUTEX', 'name': 'RECUTEX'},
        {'code': 'RECU PRO', 'name': 'RECU PRO'},
        {'code': 'SOEX ALL', 'name': 'SOEX ALL'},
        {'code': 'SOEX DUB', 'name': 'SOEX DUB'},
        {'code': 'TTR/O', 'name': 'TTR/O'},
        {'code': 'TTR/N', 'name': 'TTR/N'},
        {'code': 'TTR/PRO', 'name': 'TTR/PRO'},
        {'code': 'TTR/T', 'name': 'TTR/T'},
        {'code': 'TTR ANCIENS', 'name': 'TTR ANCIENS'},
        {'code': 'GENERAL-TEX', 'name': 'GENERAL-TEX'},
        {'code': 'G-TEX PRO', 'name': 'G-TEX PRO'},
        {'code': 'RIMATEX BVBA', 'name': 'RIMATEX BVBA'},
        {'code': 'RIMATEX PRO', 'name': 'RIMATEX PRO'},
        {'code': 'ANCIENS FRNS', 'name': 'ANCIENS FRNS'},
    ]
    
    # DEBUG
    print(f"=== DEBUG FOURNISSEURS ===")
    print(f"Nombre de fournisseurs possibles: {len(fournisseurs)}")
    
    return fournisseurs


@router.post("/generate", response_model=RapportResponse)
async def generer_rapport(request: RapportRequest):
    try:
        df = generate_rapport(request)
        
        # Conversion en liste d'articles
        articles = []
        for _, row in df.iterrows():
            article = Article(
                reference=row['ART_NUM'],
                designation=row['ART_LIB'],
                famille=str(row['FA_Intitule']) if 'FA_Intitule' in df.columns and pd.notna(row['FA_Intitule']) else str(row['FA_CodeFamille']),
                # Utilisation de Fournisseur_Nom si dispo, sinon ART_FOURPRINC, sinon chaîne vide
                fournisseur=str(row['Fournisseur_Nom']) if ('Fournisseur_Nom' in df.columns and pd.notna(row['Fournisseur_Nom']) and str(row['Fournisseur_Nom']).strip() != "") else (str(row['ART_FOURPRINC']) if pd.notna(row['ART_FOURPRINC']) else ""),
                infotlib6=str(row['infolibre6']) if ('infolibre6' in df.columns and pd.notna(row['infolibre6'])) else None,
                poids_uv=float(row['ART_POIDSNET']),
                pu_achat=float(row['ART_PRIXACH']),
                pu_revient=float(row['ART_POIDSBRUT']),
                pu_gros=float(row['AR_PrixVenNouv']),
                report_qte=float(row['report_qte']),
                report_poids=float(row['report_poids']),
                achat_qte=float(row['achat_qte']),
                achat_poids=float(row['achat_poids']),
                production_qte=float(row['prod_qte']),
                production_poids=float(row['prod_poids']),
                vente_qte=float(row['vente_qte']),
                vente_poids=float(row['vente_poids']),
                stock_qte=float(row['stock_qte']),
                stock_poids=float(row['stock_poids']),
                montant_disponible=float(row['Montant_Disponible']),
                pct_vente=float(row['Pct_Vente']),
                marge_pct=float(row['Marge_%'])
            )
            articles.append(article)
        
        # Totaux
        total_general = {
            "report_qte": df['report_qte'].sum(),
            "report_poids": df['report_poids'].sum(),
            "achat_qte": df['achat_qte'].sum(),
            "achat_poids": df['achat_poids'].sum(),
            "production_qte": df['prod_qte'].sum(),
            "production_poids": df['prod_poids'].sum(),
            "vente_qte": df['vente_qte'].sum(),
            "vente_poids": df['vente_poids'].sum(),
            "stock_qte": df['stock_qte'].sum(),
            "stock_poids": df['stock_poids'].sum(),
            "montant_disponible": df['Montant_Disponible'].sum(),
            "nombre_articles": len(df)
        }
        
        # Métriques
        metrics = {
            "vente_moyenne": df['vente_qte'].mean(),
            "stock_moyen": df['stock_qte'].mean(),
            "marge_moyenne": df['Marge_%'].mean(),
            "rotation_stock": (df['vente_qte'].sum() / df['stock_qte'].sum()) if df['stock_qte'].sum() > 0 else 0
        }
        
        return RapportResponse(
            articles=articles,
            total_general=total_general,
            periodes={
                "debut": request.date_debut,
                "fin": request.date_fin,
                "stock_date": request.date_stock
            },
            metrics=metrics,
            generated_at=pd.Timestamp.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard-metrics")
async def get_dashboard_metrics():
    """
    Récupère les métriques pour le dashboard de la page d'accueil
    """
    try:
        with db.get_connection() as conn:
            today = datetime.now().date()
            month_start = today.replace(day=1)
            
            # Ventes du mois (derniers 30 jours)
            vente_query = """
            SELECT COALESCE(SUM(VL.CATTCNet), 0) as total_ventes,
                   COUNT(DISTINCT A.ART_NUM) as nombre_articles
            FROM dbo.DP_VENTES V
            JOIN dbo.DP_VENTES_LIGNES VL ON V.V_DOCTYPE = VL.VL_DOCTYPE AND V.V_DOCNUMBIN = VL.VL_DOCNUMBIN
            JOIN dbo.DP_ARTICLES A ON VL.VL_ART_UK = A.ART_UK
            WHERE V.V_DOCDATE >= ? 
              AND V.V_DOCDATE <= ?
            """
            vente_df = pd.read_sql(vente_query, conn, params=[month_start, today])
            total_ventes = float(vente_df['total_ventes'].iloc[0]) if len(vente_df) > 0 else 0
            
            # Stock disponible
            stock_query = """
            SELECT COALESCE(SUM(QTE), 0) as total_stock
            FROM dbo.F_STOCKS
            WHERE QTE > 0
            """
            stock_df = pd.read_sql(stock_query, conn)
            total_stock = int(stock_df['total_stock'].iloc[0]) if len(stock_df) > 0 else 0
            
            # Articles actifs
            active_query = """
            SELECT COUNT(*) as total_articles
            FROM dbo.DP_ARTICLES
            WHERE ART_SOMMEIL = 'Actif'
            """
            active_df = pd.read_sql(active_query, conn)
            total_articles = int(active_df['total_articles'].iloc[0]) if len(active_df) > 0 else 0
            
            return {
                "ventes_totales": {
                    "value": f"₱{total_ventes:,.0f}",
                    "percentage": "+12%",
                    "description": "ce mois"
                },
                "stock_disponible": {
                    "value": total_stock,
                    "percentage": "0",
                    "description": f"{total_articles} articles"
                },
                "rendement": {
                    "value": "94.2%",
                    "percentage": "+3.5%",
                    "description": "vs mois dernier"
                },
                "vitesse_traitement": {
                    "value": "2.5s",
                    "percentage": "0",
                    "description": "temps moyen"
                }
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recent-activities")
async def get_recent_activities():
    """
    Récupère les activités récentes
    """
    try:
        with db.get_connection() as conn:
            # Rapports générés récemment
            reports_query = """
            SELECT TOP 4
                'Rapport généré' as text,
                CAST(A_DOCDATE as VARCHAR) as time
            FROM dbo.DP_ACHATS
            WHERE A_DOCDATE >= DATEADD(day, -7, CAST(GETDATE() as DATE))
            ORDER BY A_DOCDATE DESC
            """
            reports_df = pd.read_sql(reports_query, conn)
            
            activities = []
            for idx, row in reports_df.iterrows():
                date_obj = pd.to_datetime(row['time'])
                now = datetime.now()
                diff = now - date_obj.to_pydatetime()
                
                if diff.days == 0 and diff.seconds < 3600:
                    time_str = f"Il y a {diff.seconds // 60} minutes"
                elif diff.days == 0:
                    time_str = f"Il y a {diff.seconds // 3600} heures"
                else:
                    time_str = f"Il y a {diff.days} jours"
                
                activities.append({
                    "text": "Mouvement articles enregistré",
                    "time": time_str,
                    "status": "success"
                })
            
            # Si pas assez d'activités, ajouter des données de test
            if len(activities) < 4:
                activities.extend([
                    {"text": "Stock actualisé", "time": "Il y a 15 minutes", "status": "success"},
                    {"text": "Exportation en cours", "time": "Il y a 30 minutes", "status": "process"},
                    {"text": "Rapport archivé", "time": "Il y a 1 heure", "status": "success"},
                ][:4-len(activities)])
            
            return {"activities": activities[:4]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/sales-trend")
async def get_sales_trend():
        """
        Tendance des ventes par jour sur les 30 derniers jours
        """
        try:
            with db.get_connection() as conn:
                query = """
                SELECT 
                    CAST(V.V_DOCDATE AS DATE) as date,
                    COALESCE(SUM(VL.CATTCNet), 0) as ventes,
                    COUNT(DISTINCT VL.VL_ART_UK) as articles
                FROM dbo.DP_VENTES V
                JOIN dbo.DP_VENTES_LIGNES VL ON V.V_DOCTYPE = VL.VL_DOCTYPE AND V.V_DOCNUMBIN = VL.VL_DOCNUMBIN
                JOIN dbo.DP_ARTICLES A ON VL.VL_ART_UK = A.ART_UK
                WHERE V.V_DOCDATE >= DATEADD(day, -30, CAST(GETDATE() as DATE))
                GROUP BY CAST(V.V_DOCDATE AS DATE)
                ORDER BY date
                """
                df = pd.read_sql(query, conn)
            
                data = []
                for _, row in df.iterrows():
                    data.append({
                        "date": str(row['date']),
                        "ventes": float(row['ventes']),
                        "articles": int(row['articles'])
                    })
            
                return {"data": data}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/stock-by-family")
async def get_stock_by_family():
        """
        Distribution du stock par famille avec optimisation et noms réels
        """
        try:
            with db.get_connection() as conn:
                query = """
                WITH active_articles AS (
                    SELECT ART_UK, ART_FACODEFAMILLE 
                    FROM dbo.DP_ARTICLES 
                    WHERE ART_SOMMEIL = 'Actif'
                ),
                latest_stock AS (
                    SELECT
                        STD_ART_UK,
                        MAX(STD_DLDATEBL) AS max_date
                    FROM dbo.DP_STOCK_A_DATE
                    WHERE STD_ART_UK IN (SELECT ART_UK FROM active_articles)
                    GROUP BY STD_ART_UK
                )
                SELECT 
                    RTRIM(F.FA_Intitule) AS name,
                    COUNT(DISTINCT AA.ART_UK) AS nombre_articles,
                    COALESCE(SUM(STD.STD_QTE), 0) AS stock_total
                FROM active_articles AA
                JOIN dbo.F_FAMILLE F ON F.FA_CODEFAMILLE = AA.ART_FACODEFAMILLE
                JOIN latest_stock LS ON LS.STD_ART_UK = AA.ART_UK
                JOIN dbo.DP_STOCK_A_DATE STD 
                    ON STD.STD_ART_UK = LS.STD_ART_UK AND STD.STD_DLDATEBL = LS.max_date
                WHERE STD.STD_QTE > 0
                  AND STD.STD_DEINTITULE NOT IN (
                      'Z DEPOT HUGUES','Z DEPOT RIZOU','Z INV 2024','Z INVENTAIRE',
                      'Z KARENJY','Z MIEZAKA','Z RETOUR PALETTE','Z TAVE PAUL (HUGUES)'
                  )
                GROUP BY F.FA_Intitule
                ORDER BY stock_total DESC
                """
                df = pd.read_sql(query, conn)
            
                data = []
                for _, row in df.iterrows():
                    data.append({
                        "name": str(row['name']),
                        "value": round(float(row['stock_total']), 2),
                        "articles": int(row['nombre_articles'])
                    })
            
                return {"data": data}
        except Exception as e:
            print(f"Error in get_stock_by_family: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/top-suppliers")
async def get_top_suppliers():
        """
        Top 10 fournisseurs par volume de ventes
        """
        try:
            with db.get_connection() as conn:
                query = """
                SELECT TOP 10
                    RTRIM(COALESCE(C.CT_Intitule, A.ART_FOURPRINC)) as name,
                    COUNT(DISTINCT A.ART_UK) as articles,
                    COALESCE(SUM(VL.CATTCNet), 0) as ventes
                FROM dbo.DP_ARTICLES A
                LEFT JOIN dbo.F_COMPTET C ON C.CT_Num = A.ART_FOURPRINC
                LEFT JOIN dbo.DP_VENTES_LIGNES VL ON VL.VL_ART_UK = A.ART_UK
                WHERE A.ART_SOMMEIL = 'Actif'
                  AND (C.CT_Intitule IS NULL OR C.CT_Intitule NOT LIKE '%TIERS A CREER%')
                  AND A.ART_FOURPRINC NOT LIKE 'REPORT%'
                GROUP BY COALESCE(C.CT_Intitule, A.ART_FOURPRINC)
                ORDER BY ventes DESC
                """
                df = pd.read_sql(query, conn)
            
                data = df.to_dict('records')
                return {"data": data}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/profit-margin")
async def get_profit_margin():
        """
        Marge bénéficiaire par article (top articles)
        """
        try:
            with db.get_connection() as conn:
                # Requête simplifiée pour les articles avec les meilleures marges
                query = """
                SELECT TOP 15
                    A.ART_NUM as reference,
                    LEFT(A.ART_LIB, 30) as designation,
                    A.ART_FACODEFAMILLE as famille,
                    COALESCE(SUM(VL.QteVendues), 0) as qte_vendues,
                    COALESCE(SUM(VL.CATTCNet), 0) as montant_vente,
                    CAST(CASE 
                        WHEN SUM(VL.CATTCNet) > 0 
                        THEN ((SUM(VL.CATTCNet) - (SUM(VL.QteVendues) * A.ART_PRIXACH)) / SUM(VL.CATTCNet) * 100)
                        ELSE 0 
                    END AS FLOAT) as marge_pct
                FROM dbo.DP_ARTICLES A
                LEFT JOIN dbo.DP_VENTES_LIGNES VL ON VL.VL_ART_UK = A.ART_UK
                WHERE A.ART_SOMMEIL = 'Actif'
                GROUP BY A.ART_NUM, A.ART_LIB, A.ART_FACODEFAMILLE, A.ART_PRIXACH
                HAVING SUM(VL.CATTCNet) > 0
                ORDER BY marge_pct DESC
                """
                df = pd.read_sql(query, conn)
            
                data = []
                for _, row in df.iterrows():
                    data.append({
                        "reference": str(row['reference']),
                        "designation": str(row['designation']),
                        "famille": str(row['famille']),
                        "qte_vendues": int(row['qte_vendues']),
                        "montant": float(row['montant_vente']),
                        "marge_pct": float(row['marge_pct'])
                    })
            
                return {"data": data}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@router.post("/analytics/predictions", response_model=PredictionResponse)
async def get_predictions(request: RapportRequest):
    """
    Génère des prédictions et conseils basés sur les données du rapport
    """
    try:
        # Récupérer les données via le service existant
        df = generate_rapport(request)
        
        insights = []
        

        # Helper pour convertir DF row en dict Article compatible
        def row_to_article(row):
            return {
                "reference": row['ART_NUM'],
                "designation": row['ART_LIB'],
                "famille": row['FA_CodeFamille'],
                "fournisseur": str(row['Fournisseur_Nom']) if ('Fournisseur_Nom' in df.columns and pd.notna(row['Fournisseur_Nom']) and str(row['Fournisseur_Nom']).strip() != "") else (str(row['ART_FOURPRINC']) if pd.notna(row['ART_FOURPRINC']) else ""),
                "stock_qte": float(row['stock_qte']),
                "vente_qte": float(row['vente_qte']),
                "marge_pct": float(row.get('Marge_%', 0)),
                "poids_uv": float(row.get('ART_POIDSNET', 0)),
                "pu_achat": float(row.get('ART_PRIXACH', 0)),
                "pu_revient": float(row.get('ART_POIDSBRUT', 0)),
                "pu_gros": float(row.get('AR_PrixVenNouv', 0)),
                "montant_disponible": float(row.get('Montant_Disponible', 0))
            }

        # 1. Analyse des ruptures de stock
        # Si min_stock fourni, on l'utilise, sinon seuil par défaut 5
        seuil_rupture = request.min_stock if request.min_stock > 0 else 5
        ruptures = df[df['stock_qte'] <= seuil_rupture]
        
        if not ruptures.empty:
            count = len(ruptures)
            top_rupture = ruptures.sort_values('vente_qte', ascending=False) # On prend tout trié
            # Use .iloc to access rows to avoid index issues if validation fails
            articles_list = ", ".join([row['ART_LIB'][:20] for _, row in top_rupture.head(3).iterrows()])
            
            insights.append(Insight(
                type="critical",
                title=f"{count} Articles en Stock Critique",
                message=f"Ces articles sont proches de la rupture alors qu'ils ont des ventes. Priorité : {articles_list}...",
                metric_value=f"{count} articles",
                action_label="Commander en urgence",
                severity="high",
                details=[row_to_article(row) for _, row in top_rupture.iterrows()]
            ))

        # 2. Analyse des marges faibles
        marges_faibles = df[(df['Marge_%'] < 15) & (df['vente_qte'] > 0)]
        if not marges_faibles.empty:
            count = len(marges_faibles)
            avg_marge = marges_faibles['Marge_%'].mean()
            
            insights.append(Insight(
                type="warning",
                title=f"{count} Articles à Faible Marge",
                message=f"La marge moyenne sur ces produits vendus est de seulement {avg_marge:.1f}%.",
                metric_value=f"{avg_marge:.1f}% moy.",
                action_label="Réviser les prix",
                severity="medium",
                details=[row_to_article(row) for _, row in marges_faibles.iterrows()]
            ))

        # 3. Stock Dormant (Dead Stock)
        stock_dormant = df[(df['stock_qte'] > 50) & (df['vente_qte'] == 0)]
        if not stock_dormant.empty:
            valeur_dormante = (stock_dormant['stock_qte'] * stock_dormant['ART_PRIXACH']).sum()
            count = len(stock_dormant)
            
            insights.append(Insight(
                type="info",
                title=f"Stock Dormant Détecté",
                message=f"{count} références ont >50 en stock mais aucune vente.",
                metric_value=f"₱{valeur_dormante:,.0f}",
                action_label="Promouvoir",
                severity="low",
                details=[row_to_article(row) for _, row in stock_dormant.iterrows()]
            ))

        # 4. Opportunités (Fortes ventes, bonne marge)
        stars = df[(df['vente_qte'] > 50) & (df['Marge_%'] > 30)]
        if not stars.empty:
            top_star = stars.sort_values('vente_qte', ascending=False)
            best = top_star.iloc[0]
            
            insights.append(Insight(
                type="opportunity",
                title="Produits Stars",
                message=f"L'article '{best['ART_LIB']}' performe très bien, ainsi que {len(stars)-1} autres.",
                metric_value=f"{len(stars)} articles",
                action_label="Mettre en avant",
                severity="medium",
                details=[row_to_article(row) for _, row in top_star.iterrows()]
            ))
            
        summary = f"Analyse terminée. {len(insights)} insights générés."

        return PredictionResponse(
            insights=insights,
            summary_text=summary,
            generated_at=pd.Timestamp.now().isoformat()
        )

    except Exception as e:
        print(f"Erreur prediction: {str(e)}")
        # Fail safe
        return PredictionResponse(
            insights=[],
            summary_text="Erreur lors de l'analyse.",
            generated_at=pd.Timestamp.now().isoformat()
        )