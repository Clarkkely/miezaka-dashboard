from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from enum import Enum

class FamilleEnum(str, Enum):
    BALLE = "BALLE"
    FRIPPE = "FRIPPE"

class RapportRequest(BaseModel):
    date_debut: str
    date_fin: str
    date_stock: str
    familles: List[str] = ["BALLE", "FRIPPE"]
    min_stock: int = 0
    fournisseurs: List[str] = []
    debug_mode: bool = False
    periode_analyse: str = "mensuel"

class Article(BaseModel):
    reference: str
    designation: str
    famille: str
    fournisseur: Optional[str]
    infotlib6: Optional[str] = None  # For Ciblage.pdf 2nd sub-column
    poids_uv: float
    pu_achat: float
    pu_revient: float
    pu_gros: float
    report_qte: float
    report_poids: float
    achat_qte: float
    achat_poids: float
    production_qte: float
    production_poids: float
    vente_qte: float
    vente_poids: float
    stock_qte: float
    stock_poids: float
    montant_disponible: float
    pct_vente: float
    marge_pct: float

class RapportResponse(BaseModel):
    articles: List[Article]
    total_general: dict
    periodes: dict
    metrics: dict
    generated_at: str
    message: str = "Rapport généré avec succès"

class Insight(BaseModel):
    type: str  # "critical", "warning", "opportunity", "info"
    title: str
    message: str
    metric_value: str
    action_label: str
    severity: str # "high", "medium", "low"
    details: List[dict] = []

class PredictionResponse(BaseModel):
    insights: List[Insight]
    summary_text: str
    generated_at: str