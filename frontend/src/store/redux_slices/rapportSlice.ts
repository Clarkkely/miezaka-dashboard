import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { rapportAPI, Article, RapportRequest } from '../../services/api';

interface RapportState {
    data: Article[] | null;
    periodes: any | null;
    lastParams: RapportRequest | null;
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
    cacheValidity: number; // en millisecondes (défaut 5 min)
    hasData: boolean; // Flag pour savoir si des données ont été chargées une fois
    originalDataMap: Record<string, { pu_achat: number; pu_gros: number; marge_pct: number }>;
}

const initialState: RapportState = {
    data: null,
    periodes: null,
    lastParams: null,
    loading: false,
    error: null,
    lastFetched: null,
    cacheValidity: 5 * 60 * 1000, // 5 minutes par défaut
    hasData: false,
    originalDataMap: {},
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

export const fetchRapport = createAsyncThunk(
    'rapport/fetchRapport',
    async (params: RapportRequest, { rejectWithValue, getState }) => {
        try {
            const state = getState() as any;
            const rapport = state.rapport;

            // Vérifier si les données sont en cache et valides
            if (
                rapport.hasData &&
                areParamsEqual(rapport.lastParams, params) &&
                isCacheValid(rapport.lastFetched, rapport.cacheValidity)
            ) {
                return {
                    response: {
                        articles: rapport.data,
                        periodes: rapport.periodes
                    },
                    params,
                    fromCache: true
                };
            }

            const response = await rapportAPI.generate(params);
            return { response, params, fromCache: false };
        } catch (err: any) {
            return rejectWithValue(err.message || 'Erreur lors du chargement du rapport');
        }
    }
);

const rapportSlice = createSlice({
    name: 'rapport',
    initialState,
    reducers: {
        resetRapport: (state) => {
            state.data = null;
            state.periodes = null;
            state.lastParams = null;
            state.error = null;
            state.lastFetched = null;
            state.hasData = false;
            state.originalDataMap = {};
        },
        revertArticle: (state, action: { payload: string }) => {
            const reference = action.payload;
            if (!state.originalDataMap) return;
            const original = state.originalDataMap[reference];
            if (state.data && original) {
                const index = state.data.findIndex(art => art.reference === reference);
                if (index !== -1) {
                    state.data[index] = { ...state.data[index], ...original };
                }
            }
        },
        setCacheValidity: (state, action) => {
            state.cacheValidity = action.payload;
        },
        updateArticle: (state, action: { payload: { reference: string; updates: Partial<Article> } }) => {
            if (state.data) {
                const index = state.data.findIndex(art => art.reference === action.payload.reference);
                if (index !== -1) {
                    state.data[index] = { ...state.data[index], ...action.payload.updates };
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRapport.pending, (state) => {
                // Ne mettre loading à true que si on ne vient pas du cache
                if (!state.hasData) {
                    state.loading = true;
                }
                state.error = null;
            })
            .addCase(fetchRapport.fulfilled, (state, action) => {
                const fromCache = (action.payload as any).fromCache;

                state.loading = false;
                state.data = action.payload.response.articles;
                state.periodes = action.payload.response.periodes;
                state.lastParams = action.payload.params;

                // Sync originalDataMap: Always refresh if fresh data or if currently empty
                if (!fromCache || Object.keys(state.originalDataMap || {}).length === 0) {
                    state.originalDataMap = {};
                    action.payload.response.articles.forEach((art: Article) => {
                        state.originalDataMap[art.reference] = {
                            pu_achat: art.pu_achat,
                            pu_gros: art.pu_gros,
                            marge_pct: art.marge_pct
                        };
                    });
                }

                // Ne mettre à jour lastFetched que si ce n'est pas du cache
                if (!fromCache) {
                    state.lastFetched = Date.now();
                }

                state.hasData = true;
            })
            .addCase(fetchRapport.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                // Garder les données en cache même en cas d'erreur
            })
            // Reset loading state on re-hydration to prevent stuck spinner if persisted while loading
            .addCase('persist/REHYDRATE', (state) => {
                state.loading = false;
                state.error = null;
            });
    },
});

export const { resetRapport, setCacheValidity, updateArticle, revertArticle } = rapportSlice.actions;
export default rapportSlice.reducer;
