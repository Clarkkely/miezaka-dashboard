import React, { useEffect, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    CircularProgress,
    Chip,
    List,
    ListItem,
    ListItemText,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
} from '@mui/material';
import {
    ShoppingCart as ReapproIcon,
    Visibility as SurveillerIcon,
    Stop as ArreterIcon,
    TrendingUp as PrixIcon,
    LocalOffer as PromoIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface Recommendation {
    article: string;
    designation: string;
    raison: string;
    action: string;
    stock?: number;
    vente_mensuelle?: number;
    marge_pct?: number;
}

interface RecommendationsData {
    reapprovisionner: Recommendation[];
    surveiller: Recommendation[];
    arreter: Recommendation[];
    augmenter_prix: Recommendation[];
    promotion: Recommendation[];
    stats: {
        total_recommandations: number;
    };
}

const RecommendationsPanel: React.FC = () => {
    const [data, setData] = useState<RecommendationsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRec, setSelectedRec] = useState<Recommendation & { categorie: string } | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/recommendations');
                setData(response.data);
            } catch (error) {
                console.error('Error fetching recommendations:', error);
                setError('Erreur lors du chargement des recommandations. Vérifiez que le serveur backend est démarré.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleOpenModal = (item: Recommendation, categorie: string) => {
        setSelectedRec({ ...item, categorie });
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedRec(null);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="error">
                    {error}
                </Typography>
            </Box>
        );
    }

    if (!data) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                    Aucune recommandation disponible.
                </Typography>
            </Box>
        );
    }

    const categories = [
        {
            title: 'Réapprovisionner',
            data: data.reapprovisionner,
            icon: <ReapproIcon />,
            color: '#10b981',
            bgColor: '#d1fae5',
        },
        {
            title: 'Surveiller',
            data: data.surveiller,
            icon: <SurveillerIcon />,
            color: '#f59e0b',
            bgColor: '#fef3c7',
        },
        {
            title: 'Arrêter/Liquider',
            data: data.arreter,
            icon: <ArreterIcon />,
            color: '#ef4444',
            bgColor: '#fee2e2',
        },
        {
            title: 'Augmenter Prix',
            data: data.augmenter_prix,
            icon: <PrixIcon />,
            color: '#3b82f6',
            bgColor: '#dbeafe',
        },
        {
            title: 'Promotion',
            data: data.promotion,
            icon: <PromoIcon />,
            color: '#8b5cf6',
            bgColor: '#ede9fe',
        },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    🧠 Recommandations Automatiques
                </Typography>
                <Chip
                    label={`${data.stats.total_recommandations} recommandations`}
                    color="primary"
                    sx={{ fontWeight: 600 }}
                />
            </Box>

            <Grid container spacing={3}>
                {categories.map((category, index) => (
                    <Grid item xs={12} md={6} lg={4} key={index}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <Box
                                        sx={{
                                            bgcolor: category.bgColor,
                                            color: category.color,
                                            borderRadius: 2,
                                            p: 1,
                                            display: 'flex',
                                        }}
                                    >
                                        {category.icon}
                                    </Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                        {category.title}
                                    </Typography>
                                    <Chip
                                        label={category.data.length}
                                        size="small"
                                        sx={{ bgcolor: category.bgColor, color: category.color, fontWeight: 600 }}
                                    />
                                </Box>

                                {category.data.length === 0 ? (
                                    <Alert severity="success" sx={{ fontSize: '0.75rem' }}>
                                        Aucune action requise
                                    </Alert>
                                ) : (
                                    <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                                        {category.data.slice(0, 5).map((item, idx) => (
                                            <ListItem
                                                key={idx}
                                                onClick={() => handleOpenModal(item, category.title)}
                                                sx={{
                                                    bgcolor: '#f8fafc',
                                                    mb: 1,
                                                    borderRadius: 1,
                                                    cursor: 'pointer',
                                                    '&:hover': { 
                                                        bgcolor: category.bgColor,
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                    },
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {item.article}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <>
                                                            <Typography variant="caption" display="block" color="text.secondary">
                                                                {item.raison}
                                                            </Typography>
                                                            <Typography
                                                                variant="caption"
                                                                display="block"
                                                                sx={{ color: category.color, fontWeight: 600 }}
                                                            >
                                                                ➜ {item.action}
                                                            </Typography>
                                                        </>
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Modal des détails de recommandation */}
            <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Détail de la Recommandation
                    <IconButton onClick={handleCloseModal} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                {selectedRec && (
                    <DialogContent dividers>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Catégorie */}
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                    CATÉGORIE
                                </Typography>
                                <Chip
                                    label={selectedRec.categorie}
                                    size="small"
                                    sx={{ mt: 0.5, fontWeight: 600 }}
                                />
                            </Box>

                            {/* Article */}
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                    ARTICLE
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    {selectedRec.article}
                                </Typography>
                            </Box>

                            {/* Désignation */}
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                    DÉSIGNATION
                                </Typography>
                                <Typography variant="body2">
                                    {selectedRec.designation}
                                </Typography>
                            </Box>

                            {/* Raison */}
                            <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                    RAISON
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    {selectedRec.raison}
                                </Typography>
                            </Box>

                            {/* Action recommandée */}
                            <Box sx={{ bgcolor: '#ede9fe', p: 1.5, borderRadius: 1, borderLeft: '4px solid #8b5cf6' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                    ACTION RECOMMANDÉE
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600, color: '#8b5cf6' }}>
                                    {selectedRec.action}
                                </Typography>
                            </Box>

                            {/* Détails supplémentaires */}
                            {(selectedRec.stock !== undefined || 
                              selectedRec.vente_mensuelle !== undefined || 
                              selectedRec.marge_pct !== undefined) && (
                                <Box sx={{ bgcolor: '#f0fdf4', p: 1.5, borderRadius: 1 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        MÉTRIQUES
                                    </Typography>
                                    <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                        {selectedRec.stock !== undefined && (
                                            <Grid item xs={6}>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Stock
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {selectedRec.stock} unités
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        )}
                                        {selectedRec.vente_mensuelle !== undefined && (
                                            <Grid item xs={6}>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Vente Mensuelle
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {selectedRec.vente_mensuelle} unités
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        )}
                                        {selectedRec.marge_pct !== undefined && (
                                            <Grid item xs={12}>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Marge
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {selectedRec.marge_pct.toFixed(1)}%
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        )}
                                    </Grid>
                                </Box>
                            )}
                        </Box>
                    </DialogContent>
                )}
                <DialogActions>
                    <Button onClick={handleCloseModal} variant="outlined">
                        Fermer
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RecommendationsPanel;
