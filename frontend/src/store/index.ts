import { configureStore } from '@reduxjs/toolkit';
import rapportReducer from './redux_slices/rapportSlice';
import analyticsReducer from './redux_slices/analyticsSliceData';
import notificationReducer from './redux_slices/notificationSlice';

export const store = configureStore({
    reducer: {
        rapport: rapportReducer,
        analytics: analyticsReducer,
        notifications: notificationReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
