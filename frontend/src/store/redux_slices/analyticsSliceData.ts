import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsAPI, Insight, Article, RapportRequest } from '../../services/api';

interface AnalyticsState {
    insights: Insight[];
    salesTrend: any[];
    stockByFamily: any[];
    topSuppliers: any[];
    profitMargin: any[];
    lastParams: RapportRequest | null;
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
    cacheValidity: number; // en millisecondes (défaut 5 min)
    hasData: boolean; // Flag pour savoir si des données ont été chargées une fois
}

const initialState: AnalyticsState = {
    insights: [],
    salesTrend: [],
    stockByFamily: [],
    topSuppliers: [],
    profitMargin: [],
    lastParams: null,
    loading: false,
    error: null,
    lastFetched: null,
    cacheValidity: 5 * 60 * 1000, // 5 minutes par défaut
    hasData: false,
};

/**
 * Vérifie si les paramètres sont identiques
 */
const areParamsEqual = (params1: RapportRequest | null, params2: RapportRequest | null): boolean => {
    if (!params1 || !params2) return false;
    return JSON.stringify(params1) === JSON.stringify(params2);
};

/**
 * Vérifie si le cache est encore valide
 */
const isCacheValid = (lastFetched: number | null, cacheValidity: number): boolean => {
    if (!lastFetched) return false;
    return Date.now() - lastFetched < cacheValidity;
};

export const fetchAnalyticsData = createAsyncThunk(
    'analytics/fetchAll',
    async (filters: RapportRequest, { rejectWithValue, getState }) => {
        try {
            const state = getState() as any;
            const analytics = state.analytics;

            // Vérifier si les données sont en cache et valides
            if (
                analytics.hasData &&
                areParamsEqual(analytics.lastParams, filters) &&
                isCacheValid(analytics.lastFetched, analytics.cacheValidity)
            ) {
                return {
                    salesTrend: analytics.salesTrend,
                    stockByFamily: analytics.stockByFamily,
                    topSuppliers: analytics.topSuppliers,
                    profitMargin: analytics.profitMargin,
                    insights: analytics.insights,
                    params: filters,
                    fromCache: true
                };
            }

            const [salesRes, stockRes, suppliersRes, profitRes, predRes] = await Promise.all([
                analyticsAPI.getSalesTrend(filters),
                analyticsAPI.getStockByFamily(filters),
                analyticsAPI.getTopSuppliers(filters),
                analyticsAPI.getProfitMargin(filters),
                analyticsAPI.getPredictions(filters)
            ]);

            return {
                salesTrend: salesRes?.data || salesRes || [],
                stockByFamily: stockRes?.data || stockRes || [],
                topSuppliers: suppliersRes?.data || suppliersRes || [],
                profitMargin: profitRes?.data || profitRes || [],
                insights: predRes?.insights || [],
                params: filters,
                fromCache: false
            };
        } catch (err: any) {
            return rejectWithValue(err.message || 'Erreur lors du chargement des analytics');
        }
    }
);

const analyticsSlice = createSlice({
    name: 'analytics',
    initialState,
    reducers: {
        clearAnalytics: (state) => {
            state.insights = [];
            state.salesTrend = [];
            state.stockByFamily = [];
            state.topSuppliers = [];
            state.profitMargin = [];
            state.lastParams = null;
            state.loading = false;
            state.error = null;
            state.lastFetched = null;
            state.hasData = false;
        },
        setCacheValidity: (state, action) => {
            state.cacheValidity = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAnalyticsData.pending, (state) => {
                // Ne mettre loading à true que si on ne vient pas du cache
                if (!state.hasData) {
                    state.loading = true;
                }
                state.error = null;
            })
            .addCase(fetchAnalyticsData.fulfilled, (state, action) => {
                const fromCache = (action.payload as any).fromCache;
                
                state.loading = false;
                state.insights = action.payload.insights;
                state.salesTrend = action.payload.salesTrend;
                state.stockByFamily = action.payload.stockByFamily;
                state.topSuppliers = action.payload.topSuppliers;
                state.profitMargin = action.payload.profitMargin;
                state.lastParams = action.payload.params;
                
                // Ne mettre à jour lastFetched que si ce n'est pas du cache
                if (!fromCache) {
                    state.lastFetched = Date.now();
                }
                
                state.hasData = true;
            })
            .addCase(fetchAnalyticsData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                // Garder les données en cache même en cas d'erreur
            });
    },
});

export const { clearAnalytics, setCacheValidity } = analyticsSlice.actions;
export default analyticsSlice.reducer;
