import { Article } from '../services/api';

export interface RapportExportData {
  articles: Article[];
  periodes?: {
    debut: string;
    fin: string;
    stock_date: string;
  };
  companyInfo?: {
    name: string;
    address?: string;
    phone?: string;
  };
}

/**
 * Formater un nombre en devise
 */
export const formatCurrency = (value: number, decimals: number = 2): string => {
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Formater une date
 */
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Calculer les totaux du rapport
 */
export const calculateReportTotals = (articles: Article[]) => {
  return {
    totalValAch: articles.reduce((sum, item) => sum + (item.pu_achat * item.achat_qte), 0),
    totalValDedouane: articles.reduce((sum, item) => sum + (item.pu_revient * item.achat_qte), 0),
    totalQteAchat: articles.reduce((sum, item) => sum + item.achat_qte, 0),
    totalQteVente: articles.reduce((sum, item) => sum + item.vente_qte, 0),
    totalQteStock: articles.reduce((sum, item) => sum + item.stock_qte, 0),
    totalPoidsAchat: articles.reduce((sum, item) => sum + item.achat_poids, 0),
    totalPoidsVente: articles.reduce((sum, item) => sum + item.vente_poids, 0),
    totalPoidsStock: articles.reduce((sum, item) => sum + item.stock_poids, 0),
    totalMontantDisponible: articles.reduce((sum, item) => sum + item.montant_disponible, 0),
    totalReportQte: articles.reduce((sum, item) => sum + item.report_qte, 0),
    totalReportPoids: articles.reduce((sum, item) => sum + item.report_poids, 0),
    totalProductionQte: articles.reduce((sum, item) => sum + item.production_qte, 0),
    totalProductionPoids: articles.reduce((sum, item) => sum + item.production_poids, 0),
    totalPrixGros: articles.reduce((sum, item) => sum + (item.pu_gros * item.vente_qte), 0),
    avgMargePercent: articles.length > 0 
      ? articles.reduce((sum, item) => sum + item.marge_pct, 0) / articles.length 
      : 0,
  };
};

/**
 * Générer les données pour l'export Excel
 */
export const generateExcelData = (exportData: RapportExportData) => {
  const { articles, periodes, companyInfo } = exportData;
  const totals = calculateReportTotals(articles);

  // En-tête de la société
  const companyHeader = [
    [companyInfo?.name || 'MIEZAKA DASHBOARD'],
    ['Rapport de Mouvements Détaillé'],
    [''],
    ['Informations Période'],
    ['Début', periodes?.debut ? formatDate(periodes.debut) : ''],
    ['Fin', periodes?.fin ? formatDate(periodes.fin) : ''],
    ['Stock date', periodes?.stock_date ? formatDate(periodes.stock_date) : ''],
    ['Nombre articles', articles.length],
    [''],
  ];

  // En-têtes des colonnes
  const tableHeader = [[
    'Réf',
    'Désignation',
    'Famille',
    'Fournisseur',
    'Pds UV',
    'PU Ach',
    'Qte Ach',
    'Val Ach',
    'PU Revient',
    'Val Dedouane',
    'Qte Vente',
    'Qte Stock',
    'Montant Dispo',
    'Marge %',
  ]];

  // Données des articles
  const exportArticles = articles.map(article => [
    article.reference,
    article.designation,
    article.famille,
    article.fournisseur,
    article.poids_uv,
    article.pu_achat,
    article.achat_qte,
    article.pu_achat * article.achat_qte,
    article.pu_revient,
    article.pu_revient * article.achat_qte,
    article.vente_qte,
    article.stock_qte,
    article.montant_disponible,
    article.marge_pct,
  ]);

  // Ligne de totaux
  const totalsRow = [
    'TOTAL GÉNÉRAL',
    '',
    '',
    '',
    '',
    '',
    totals.totalQteAchat,
    totals.totalValAch,
    '',
    totals.totalValDedouane,
    totals.totalQteVente,
    totals.totalQteStock,
    totals.totalMontantDisponible,
    totals.avgMargePercent,
  ];

  return [...companyHeader, ...tableHeader, ...exportArticles, [''], totalsRow];
};

/**
 * Générer les styles pour le PDF
 */
export const getPDFStyles = () => {
  return {
    fontSize: 8,
    cellPadding: 2,
    lineWidth: 0.1,
    lineColor: [200, 200, 200],
  };
};

/**
 * Générer les styles d'en-tête pour le PDF
 */
export const getPDFHeadStyles = () => {
  return {
    fillColor: [30, 41, 59],
    textColor: [255, 255, 255],
    fontStyle: 'bold',
    fontSize: 9,
  };
};
