import axios from 'axios';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:8000/api' : '/api');

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour le logging des erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.group('❌ API Error Detail');
    console.error('Message:', error.message);
    console.error('URL:', error.config?.url);
    if (error.response) {
      console.error('Data:', error.response.data);
      console.error('Status:', error.response.status);
    } else if (error.request) {
      console.error('Request was made but no response received');
      console.error('Request Detail:', error.request);
    }
    console.groupEnd();
    return Promise.reject(error);
  }
);

export interface RapportRequest {
  date_debut: string;
  date_fin: string;
  date_stock: string;
  familles: string[];
  min_stock: number;
  fournisseurs: string[];
  debug_mode: boolean;
}

export interface Article {
  reference: string;
  designation: string;
  famille: string;
  fournisseur: string;
  infotlib6?: string;
  poids_uv: number;
  pu_achat: number;
  pu_revient: number;
  pu_gros: number;
  report_qte: number;
  report_poids: number;
  achat_qte: number;
  achat_poids: number;
  production_qte: number;
  production_poids: number;
  vente_qte: number;
  vente_poids: number;
  stock_qte: number;
  stock_poids: number;
  montant_disponible: number;
  pct_vente: number;
  marge_pct: number;
}

export interface RapportResponse {
  articles: Article[];
  total_general: any;
  periodes: any;
  metrics: any;
  generated_at: string;
  message: string;
}

export interface FournisseurOption {
  code: string;
  name: string;
}

// Interface pour les familles
export interface FamilleOption {
  code: string;
  name: string;
}

export const rapportAPI = {
  async generate(params: RapportRequest): Promise<RapportResponse> {
    const response = await api.post('/rapport/generate', params);
    return response.data;
  },

  // ✅ Récupérer les familles
  async getFamilles(): Promise<FamilleOption[]> {
    try {
      const response = await api.get('/rapport/familles');
      // Backend returns list directly
      return Array.isArray(response.data) ? response.data : (response.data.familles || []);
    } catch (error) {
      console.error('Erreur lors du chargement des familles:', error);
      return [
        { code: 'BALLE', name: 'BALLE' },
        { code: 'FRIPPE', name: 'FRIPPE' }
      ];
    }
  },

  // ✅ Récupérer les fournisseurs
  async getFournisseurs(): Promise<FournisseurOption[]> {
    try {
      const response = await api.get('/rapport/fournisseurs');
      return Array.isArray(response.data) ? response.data : (response.data.fournisseurs || []);
    } catch (error) {
      console.error('Erreur lors du chargement des fournisseurs:', error);
      return [{ code: 'USA Import', name: 'USA Import' }];
    }
  },

  async getDashboardMetrics(): Promise<any> {
    const response = await api.get('/rapport/dashboard-metrics');
    return response.data;
  },

  async getRecentActivities(): Promise<any> {
    const response = await api.get('/rapport/recent-activities');
    return response.data;
  }
};

export const analyticsAPI = {
  async getSalesTrend(filters?: Record<string, any>): Promise<any> {
    const response = await api.get('/rapport/analytics/sales-trend', { params: filters });
    return response.data;
  },

  async getStockByFamily(filters?: Record<string, any>): Promise<any> {
    const response = await api.get('/rapport/analytics/stock-by-family', { params: filters });
    return response.data;
  },

  async getTopSuppliers(filters?: Record<string, any>): Promise<any> {
    const response = await api.get('/rapport/analytics/top-suppliers', { params: filters });
    return response.data;
  },

  async getProfitMargin(filters?: Record<string, any>): Promise<any> {
    const response = await api.get('/rapport/analytics/profit-margin', { params: filters });
    return response.data;
  },

  async getPredictions(params: RapportRequest): Promise<PredictionResponse> {
    const response = await api.post('/rapport/analytics/predictions', params);
    return response.data;
  },

  async getSalesForecast(filters?: Record<string, any>): Promise<any> {
    const response = await api.get('/predictions/sales-forecast', { params: filters });
    return response.data;
  },

  async getStockForecast(filters?: Record<string, any>): Promise<any> {
    const response = await api.get('/predictions/stock-forecast', { params: filters });
    return response.data;
  },

  async getArticleClassification(filters?: Record<string, any>): Promise<any> {
    const response = await api.get('/predictions/classification', { params: filters });
    return response.data;
  }
};

export interface Insight {
  type: 'critical' | 'warning' | 'opportunity' | 'info';
  title: string;
  message: string;
  metric_value: string;
  action_label: string;
  severity: 'high' | 'medium' | 'low';
  details?: Article[];
}

export interface PredictionResponse {
  insights: Insight[];
  summary_text: string;
  generated_at: string;
}