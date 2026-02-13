import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
    persistStore,
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web

import rapportReducer from './redux_slices/rapportSlice';
import analyticsReducer from './redux_slices/analyticsSliceData';
import notificationReducer from './redux_slices/notificationSlice';

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['rapport', 'analytics'], // only persist these slices
};

const rootReducer = combineReducers({
    rapport: rapportReducer,
    analytics: analyticsReducer,
    notifications: notificationReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
