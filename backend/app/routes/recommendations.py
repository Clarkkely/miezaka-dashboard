from fastapi import APIRouter, HTTPException
from app.database import db
import pandas as pd
from typing import Dict, Any, List
from pydantic import BaseModel

router = APIRouter()

class ArticleAnalysisRequest(BaseModel):
    """Données d'un article pour analyse détaillée"""
    reference: str
    designation: str
    famille: str
    fournisseur: str
    pu_achat: float
    pct_vente: float
    marge_pct: float
    vente_qte: float
    stock_qte: float
    achat_qte: float

@router.post("/recommendations/detailed-analysis")
async def get_detailed_analysis(article: ArticleAnalysisRequest):
    """
    Analyse détaillée d'un article avec recommandations personnalisées
    Basé sur: marge, % vente, prix d'achat, quantités
    """
    try:
        recommendations = []
        score_sante = 0  # 0-100
        
        # Analyse 1: Marge vs % Vente (équilibre rentabilité-volume)
        if article.pct_vente > 0 and article.marge_pct > 0:
            if article.pct_vente > 75 and article.marge_pct < 10:
                # Fort volume mais faible marge
                recommendations.append({
                    "type": "EQUILIBRE",
                    "titre": "Équilibrer volume et rentabilité",
                    "description": f"Article avec {article.pct_vente:.0f}% du volume mais marge de {article.marge_pct:.1f}%",
                    "solutions": [
                        f"1. Augmenter le PU Achat (réduire coût): Passer de {article.pu_achat:.2f} à {article.pu_achat * 0.95:.2f}",
                        f"2. Augmenter le prix de vente de 5-8% pour améliorer la marge de {article.marge_pct:.1f}% à ~{article.marge_pct + 6:.1f}%",
                        "3. Négocier avec le fournisseur pour obtenir une réduction volume",
                        f"4. Conserver le volume élevé ({article.pct_vente:.0f}%) qui génère du CA"
                    ],
                    "impact": "Augmentation de marge de 6-8% tout en conservant le volume"
                })
                score_sante += 60
            elif article.pct_vente < 15 and article.marge_pct > 20:
                # Faible volume mais bonne marge
                recommendations.append({
                    "type": "EXPANSION",
                    "titre": "Développer les ventes pour article rentable",
                    "description": f"Article avec faible volume ({article.pct_vente:.0f}%) mais marge excellente ({article.marge_pct:.1f}%)",
                    "solutions": [
                        f"1. Réduire le prix de vente de 10-15% (marge reste intéressante)",
                        f"2. Renforcer le stock ({article.stock_qte} unités actuellement)",
                        "3. Faire une promotion ciblée",
                        f"4. PU Achat optimal: {article.pu_achat:.2f} (possible réduction de 5%)"
                    ],
                    "impact": "Augmentation du volume de 30-50% avec marge acceptable"
                })
                score_sante += 75
            else:
                score_sante += 70
        
        # Analyse 2: Rupture d'équilibre - Trop de stock ou trop peu
        if article.vente_qte > 0:
            ratio_stock = article.stock_qte / article.vente_qte if article.vente_qte > 0 else 0
            if ratio_stock > 3:
                recommendations.append({
                    "type": "STOCK",
                    "titre": "Réduire le sur-stockage",
                    "description": f"Stock élevé ({article.stock_qte} unités) par rapport aux ventes ({article.vente_qte})",
                    "solutions": [
                        f"1. Promotion: réduire prix de 10-15% pour écouler stock",
                        f"2. Augmenter effort commercial - ciblage clients",
                        f"3. Vérifier la date de péremption/obsolescence",
                        "4. Réduire les commandes futures de 30-40%"
                    ],
                    "impact": "Libération de trésorerie, réduction risque de dépréciation"
                })
                score_sante -= 15
            elif ratio_stock < 0.5:
                recommendations.append({
                    "type": "APPROVISIONNEMENT",
                    "titre": "Augmenter la fréquence de réapprovisionnement",
                    "description": f"Risque de rupture: stock faible ({article.stock_qte}) vs demande ({article.vente_qte})",
                    "solutions": [
                        f"1. Commander immédiatement {int(article.vente_qte * 1.5)} unités",
                        f"2. Mettre en place réapprovisionnement auto (seuil: {int(article.vente_qte * 0.8)})",
                        f"3. Vérifier délai d'approvisionnement avec fournisseur",
                        "4. Envisager plusieurs fournisseurs"
                    ],
                    "impact": "Prévention des ruptures de stock, amélioration satisfaction clients"
                })
                score_sante -= 20
        
        # Analyse 3: Rentabilité - Marge vs Coût
        if article.marge_pct < 5:
            recommendations.append({
                "type": "RENTABILITE",
                "titre": "Améliorer la rentabilité critique",
                "description": f"Marge trop faible ({article.marge_pct:.1f}%) - risque financier",
                "solutions": [
                    f"1. Réduire coût d'achat: chercher alternative fournisseur",
                    f"2. PU Achat actuel {article.pu_achat:.2f} - cible {article.pu_achat * 0.90:.2f}",
                    "3. Augmenter prix de vente minimum 8-10%",
                    "4. Envisager retrait si marge < 2% et volume faible"
                ],
                "impact": "Retour à seuil minimum de rentabilité (>5%)"
            })
            score_sante -= 30
        elif article.marge_pct > 25:
            score_sante += 25
        
        # Analyse 4: Prix d'achat - Négociation possible
        if article.vente_qte > 100:  # Bon volume
            reduction_possible = article.pu_achat * 0.05  # 5% réduction possible
            recommendations.append({
                "type": "NEGOCIATION",
                "titre": "Opportunité de négociation fournisseur",
                "description": f"Volume élevé ({article.achat_qte} unités achetées) = levier de négociation",
                "solutions": [
                    f"1. PU Achat actuel: {article.pu_achat:.2f}",
                    f"2. Réduction possible 5%: {article.pu_achat - reduction_possible:.2f}",
                    f"3. Impact: {reduction_possible:.2f} de gain par unité × {article.achat_qte} = {reduction_possible * article.achat_qte:.2f} économies",
                    f"4. Marge passerait de {article.marge_pct:.1f}% à ~{article.marge_pct + 4:.1f}%"
                ],
                "impact": f"Économies potentielles: {reduction_possible * article.achat_qte:.2f}"
            })
            score_sante += 15
        
        return {
            "article": {
                "reference": article.reference,
                "designation": article.designation,
                "famille": article.famille,
                "fournisseur": article.fournisseur
            },
            "metriques_actuelles": {
                "pu_achat": article.pu_achat,
                "pct_vente": article.pct_vente,
                "marge_pct": article.marge_pct,
                "vente_qte": article.vente_qte,
                "stock_qte": article.stock_qte,
                "achat_qte": article.achat_qte
            },
            "sante_article": score_sante,
            "recommendations": recommendations,
            "resume_action": get_action_summary(recommendations, article)
        }
    except Exception as e:
        print(f"Error in detailed analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def get_action_summary(recommendations: List[Dict], article: ArticleAnalysisRequest) -> str:
    """Résumé des actions prioritaires"""
    if not recommendations:
        return "Article stable - pas d'action urgente"
    
    types = [r["type"] for r in recommendations]
    
    if "RENTABILITE" in types:
        return "🔴 URGENT: Améliorer rentabilité - risque financier"
    elif "RUPTURE" in types:
        return "🟠 IMPORTANT: Réapprovisionner - risque rupture"
    elif "EQUILIBRE" in types:
        return "🟡 À FAIRE: Rééquilibrer prix/marge pour meilleure rentabilité"
    elif "STOCK" in types:
        return "🟡 À FAIRE: Réduire sur-stockage et libérer trésorerie"
    elif "EXPANSION" in types:
        return "🟢 BON: Développer ventes de ce produit rentable"
    else:
        return "🟢 SUIVI: Article performant - suivi régulier"

@router.get("/recommendations")
async def get_recommendations():
    """
    Moteur de recommandations automatiques basé sur règles métier
    """
    try:
        with db.get_connection() as conn:
            # Données pour analyse
            query = """
            WITH latest_stock AS (
                SELECT
                    STD_ART_UK,
                    MAX(STD_DLDATEBL) AS max_date
                FROM dbo.DP_STOCK_A_DATE
                GROUP BY STD_ART_UK
            ),
            ventes_mensuelles AS (
                SELECT 
                    VL_ART_UK,
                    AVG(vente_mensuelle) as vente_moy_mensuelle
                FROM (
                    SELECT 
                        VL.VL_ART_UK,
                        FORMAT(V.V_DOCDATE, 'yyyy-MM') as mois,
                        SUM(VL.QTEVENDUES) as vente_mensuelle
                    FROM dbo.DP_VENTES V
                    JOIN dbo.DP_VENTES_LIGNES VL ON V.V_DOCNUMBIN = VL.VL_DOCNUMBIN
                    WHERE V.V_DOCDATE >= DATEADD(MONTH, -3, GETDATE())
                    GROUP BY VL.VL_ART_UK, FORMAT(V.V_DOCDATE, 'yyyy-MM')
                ) sub
                GROUP BY VL_ART_UK
            )
            SELECT 
                A.ART_NUM as article,
                A.ART_LIB as designation,
                COALESCE(STD.STD_QTE, 0) as stock_qte,
                COALESCE(VM.vente_moy_mensuelle, 0) as vente_mensuelle,
                COALESCE(VL_TOTAL.ca_total, 0) as ca_total,
                CASE 
                    WHEN VL_TOTAL.ca_total > 0 
                    THEN ((VL_TOTAL.ca_total - (VL_TOTAL.qte_total * A.ART_PRIXACH)) / VL_TOTAL.ca_total) * 100
                    ELSE 0
                END as marge_pct
            FROM dbo.DP_ARTICLES A
            LEFT JOIN latest_stock LS ON LS.STD_ART_UK = A.ART_UK
            LEFT JOIN dbo.DP_STOCK_A_DATE STD 
                ON STD.STD_ART_UK = LS.STD_ART_UK 
                AND STD.STD_DLDATEBL = LS.max_date
            LEFT JOIN ventes_mensuelles VM ON VM.VL_ART_UK = A.ART_UK
            LEFT JOIN (
                SELECT 
                    VL_ART_UK,
                    SUM(CATTCNet) as ca_total,
                    SUM(QTEVENDUES) as qte_total
                FROM dbo.DP_VENTES_LIGNES
                GROUP BY VL_ART_UK
            ) VL_TOTAL ON VL_TOTAL.VL_ART_UK = A.ART_UK
            WHERE A.ART_SOMMEIL = 'Actif'
            """
            df = pd.read_sql(query, conn)
            
            # Règles de recommandation
            reapprovisionner = []
            surveiller = []
            arreter = []
            augmenter_prix = []
            promotion = []
            
            for _, row in df.iterrows():
                stock = float(row['stock_qte'])
                vente_moy = float(row['vente_mensuelle'])
                marge = float(row['marge_pct'])
                ca = float(row['ca_total'])
                
                article_info = {
                    "article": row['article'],
                    "designation": row['designation'],
                    "stock": stock,
                    "vente_mensuelle": vente_moy,
                    "marge_pct": round(marge, 1)
                }
                
                # Règle 1: Réapprovisionner
                if stock > 0 and vente_moy > 0:
                    mois_stock = stock / vente_moy if vente_moy > 0 else 999
                    if mois_stock < 2 and marge > 0:
                        reapprovisionner.append({
                            **article_info,
                            "raison": f"Stock pour {mois_stock:.1f} mois seulement",
                            "action": f"Commander {int(vente_moy * 3)} unités"
                        })
                
                # Règle 2: Surveiller
                if 5 < marge < 15 and ca > 0:
                    surveiller.append({
                        **article_info,
                        "raison": "Marge faible mais ventes présentes",
                        "action": "Analyser coûts et prix"
                    })
                
                # Règle 3: Arrêter/Liquider
                if vente_moy == 0 and stock > 0 and marge < 0:
                    arreter.append({
                        **article_info,
                        "raison": "Aucune vente et marge négative",
                        "action": "Liquider le stock"
                    })
                
                # Règle 4: Augmenter prix
                if vente_moy > 10 and marge < 10 and stock < vente_moy:
                    augmenter_prix.append({
                        **article_info,
                        "raison": "Forte demande, marge faible",
                        "action": "Augmenter prix de 5-10%"
                    })
                
                # Règle 5: Promotion
                if stock > vente_moy * 3 and vente_moy > 0 and marge > 15:
                    promotion.append({
                        **article_info,
                        "raison": "Stock élevé, marge acceptable",
                        "action": "Faire promotion pour écouler"
                    })
            
            return {
                "reapprovisionner": reapprovisionner[:20],
                "surveiller": surveiller[:20],
                "arreter": arreter[:20],
                "augmenter_prix": augmenter_prix[:20],
                "promotion": promotion[:20],
                "stats": {
                    "total_recommandations": (
                        len(reapprovisionner) + len(surveiller) + 
                        len(arreter) + len(augmenter_prix) + len(promotion)
                    )
                }
            }
            
    except Exception as e:
        print(f"Error in get_recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
