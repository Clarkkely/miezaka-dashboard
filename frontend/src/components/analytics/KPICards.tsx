import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, CircularProgress } from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    AttachMoney as MoneyIcon,
    Inventory as InventoryIcon,
    CheckCircle as CheckCircleIcon,
    ShowChart as ShowChartIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface KPIData {
    ca_total: number;
    marge_totale: number;
    taux_marge_moyen: number;
    valeur_stock_total: number;
    pct_articles_rentables: number;
}

const KPICards: React.FC = () => {
    const [kpis, setKpis] = useState<KPIData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchKPIs = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/analytics/kpis');
                setKpis(response.data);
            } catch (error) {
                console.error('Error fetching KPIs:', error);
                setError('Erreur lors du chargement des KPIs. Vérifiez que le serveur backend est démarré.');
            } finally {
                setLoading(false);
            }
        };

        fetchKPIs();
    }, []);

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

    if (!kpis) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                    Aucune donnée KPI disponible.
                </Typography>
            </Box>
        );
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'MGA',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const kpiCards = [
        {
            title: 'CA Total',
            value: formatCurrency(kpis.ca_total),
            icon: <MoneyIcon sx={{ fontSize: 40 }} />,
            color: '#10b981',
            bgColor: '#d1fae5',
        },
        {
            title: 'Marge Totale',
            value: formatCurrency(kpis.marge_totale),
            icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
            color: '#3b82f6',
            bgColor: '#dbeafe',
        },
        {
            title: 'Taux Marge Moyen',
            value: `${kpis.taux_marge_moyen.toFixed(1)}%`,
            icon: <ShowChartIcon sx={{ fontSize: 40 }} />,
            color: '#8b5cf6',
            bgColor: '#ede9fe',
        },
        {
            title: 'Valeur Stock',
            value: formatCurrency(kpis.valeur_stock_total),
            icon: <InventoryIcon sx={{ fontSize: 40 }} />,
            color: '#f59e0b',
            bgColor: '#fef3c7',
        },
        {
            title: 'Articles Rentables',
            value: `${kpis.pct_articles_rentables.toFixed(1)}%`,
            icon: <CheckCircleIcon sx={{ fontSize: 40 }} />,
            color: '#06b6d4',
            bgColor: '#cffafe',
        },
    ];

    return (
        <Grid container spacing={3}>
            {kpiCards.map((kpi, index) => (
                <Grid item xs={12} sm={6} md={2.4} key={index}>
                    <Card
                        sx={{
                            height: '100%',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 4,
                            },
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Box
                                    sx={{
                                        bgcolor: kpi.bgColor,
                                        color: kpi.color,
                                        borderRadius: 2,
                                        p: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {kpi.icon}
                                </Box>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {kpi.title}
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: kpi.color }}>
                                {kpi.value}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

export default KPICards;
