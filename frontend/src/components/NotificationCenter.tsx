import React, { useState } from 'react';
import {
    Box, Badge, IconButton, Popover, Typography, List, ListItem,
    ListItemText, Divider, Button, Chip, Stack, Tooltip
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    NotificationsNone as NotificationsNoneIcon,
    CheckCircle as SuccessIcon,
    Info as InfoIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    DeleteOutline as ClearIcon,
    ArrowForward as ArrowIcon
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { markAsRead, markAllAsRead, clearNotifications } from '../store/redux_slices/notificationSlice';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const NotificationCenter: React.FC = () => {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const { notifications } = useAppSelector((state) => state.notifications);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = (id: string, path?: string) => {
        dispatch(markAsRead(id));
        if (path) {
            navigate(path);
            handleClose();
        }
    };

    const open = Boolean(anchorEl);
    const id = open ? 'notification-popover' : undefined;

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <SuccessIcon sx={{ color: '#10b981', fontSize: 18 }} />;
            case 'warning': return <WarningIcon sx={{ color: '#f59e0b', fontSize: 18 }} />;
            case 'error': return <ErrorIcon sx={{ color: '#ef4444', fontSize: 18 }} />;
            default: return <InfoIcon sx={{ color: '#3b82f6', fontSize: 18 }} />;
        }
    };

    return (
        <Box sx={{ position: 'fixed', top: 20, right: 20, zIndex: 2000 }}>
            <Tooltip title="Notifications">
                <IconButton
                    onClick={handleClick}
                    sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        '&:hover': { bgcolor: '#fff', transform: 'scale(1.05)' },
                        transition: 'all 0.2s'
                    }}
                >
                    <Badge badgeContent={unreadCount} color="error" overlap="circular">
                        {unreadCount > 0 ? <NotificationsIcon sx={{ color: '#1e293b' }} /> : <NotificationsNoneIcon sx={{ color: '#64748b' }} />}
                    </Badge>
                </IconButton>
            </Tooltip>

            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                    sx: {
                        width: 380,
                        maxHeight: 500,
                        borderRadius: 3,
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                        overflow: 'hidden',
                        mt: 1.5
                    }
                }}
            >
                <Box sx={{ p: 2, bgcolor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>Notifications</Typography>
                        {unreadCount > 0 && <Chip label={`${unreadCount} nouvelles`} size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />}
                    </Stack>
                    <Stack direction="row" spacing={1}>
                        <Tooltip title="Tout marquer comme lu">
                            <IconButton size="small" onClick={() => dispatch(markAllAsRead())} disabled={unreadCount === 0}>
                                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                                <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Tout lire</Typography>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Effacer tout">
                            <IconButton size="small" onClick={() => dispatch(clearNotifications())} disabled={notifications.length === 0}>
                                <ClearIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Box>
                <Divider />

                <List sx={{ p: 0, maxHeight: 400, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <NotificationsNoneIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>Aucune notification pour le moment</Typography>
                        </Box>
                    ) : (
                        notifications.map((notif, index) => (
                            <React.Fragment key={notif.id}>
                                <ListItem
                                    button
                                    onClick={() => handleNotificationClick(notif.id, notif.path)}
                                    sx={{
                                        bgcolor: notif.read ? 'transparent' : 'rgba(37, 99, 235, 0.04)',
                                        '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                                        py: 1.5
                                    }}
                                >
                                    <Box sx={{ mr: 2, mt: 0.5 }}>{getIcon(notif.type)}</Box>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body2" sx={{ fontWeight: notif.read ? 500 : 700, color: '#1e293b', lineHeight: 1.4 }}>
                                                {notif.message}
                                            </Typography>
                                        }
                                        secondary={
                                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
                                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                                    {format(notif.timestamp, 'HH:mm', { locale: fr })}
                                                </Typography>
                                                {notif.path && <ArrowIcon sx={{ fontSize: 14, color: '#3b82f6' }} />}
                                            </Stack>
                                        }
                                    />
                                </ListItem>
                                {index < notifications.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))
                    )}
                </List>
            </Popover>
        </Box>
    );
};

export default NotificationCenter;
