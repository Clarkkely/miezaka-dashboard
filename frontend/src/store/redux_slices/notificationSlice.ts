import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AppNotification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp: number;
    path?: string;
    read: boolean;
}

interface NotificationState {
    notifications: AppNotification[];
}

const initialState: NotificationState = {
    notifications: [],
};

const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addNotification: (state, action: PayloadAction<Omit<AppNotification, 'id' | 'timestamp' | 'read'>>) => {
            // Prevent duplicate notifications within 2 seconds
            if (state.notifications.length > 0) {
                const last = state.notifications[0];
                const isDuplicate = last.message === action.payload.message &&
                    last.type === action.payload.type &&
                    (Date.now() - last.timestamp < 5000);
                if (isDuplicate) return;
            }

            const newNotification: AppNotification = {
                ...action.payload,
                id: Date.now().toString(),
                timestamp: Date.now(),
                read: false,
            };
            state.notifications.unshift(newNotification);
            // Keep only last 50 notifications
            if (state.notifications.length > 50) {
                state.notifications.pop();
            }
        },
        markAsRead: (state, action: PayloadAction<string>) => {
            const notification = state.notifications.find(n => n.id === action.payload);
            if (notification) {
                notification.read = true;
            }
        },
        markAllAsRead: (state) => {
            state.notifications.forEach(n => { n.read = true; });
        },
        clearNotifications: (state) => {
            state.notifications = [];
        }
    },
    extraReducers: (builder) => {
        // Listen for Rapport success
        builder.addCase('rapport/fetchRapport/fulfilled', (state) => {
            // Dedupe check
            if (state.notifications.length > 0) {
                const last = state.notifications[0];
                if (last.message === 'Rapport de mouvements généré avec succès.' && (Date.now() - last.timestamp < 5000)) return;
            }
            const newNotification: AppNotification = {
                id: Date.now().toString() + '-rap',
                type: 'success',
                message: 'Rapport de mouvements généré avec succès.',
                timestamp: Date.now(),
                path: '/rapport',
                read: false,
            };
            state.notifications.unshift(newNotification);
        });

        // Listen for Analytics success
        builder.addCase('analytics/fetchAll/fulfilled', (state) => {
            // Dedupe check
            if (state.notifications.length > 0) {
                const last = state.notifications[0];
                if (last.message === 'Analyses et prédictions prêtes à être consultées.' && (Date.now() - last.timestamp < 5000)) return;
            }
            const newNotification: AppNotification = {
                id: Date.now().toString() + '-ana',
                type: 'success',
                message: 'Analyses et prédictions prêtes à être consultées.',
                timestamp: Date.now(),
                path: '/analytics',
                read: false,
            };
            state.notifications.unshift(newNotification);
        });
    }
});

export const { addNotification, markAsRead, markAllAsRead, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
