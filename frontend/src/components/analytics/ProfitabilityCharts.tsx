import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, CircularProgress, Tabs, Tab } from '@mui/material';
import {
    BarChart,
    Bar,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { api } from '../../services/api';
import { useAppSelector } from '../../store/hooks';

interface ProfitabilityData {
    marge_par_article: Array<{
        article: string;
        designation: string;
        marge_pct: number;
        marge_absolue: number;
    }>;
    marge_par_fournisseur: Array<{
        fournisseur: string;
        marge_pct: number;
        marge_absolue: number;
    }>;
    scatter_data: Array<{
        article: string;
        famille: string;
        qte_vendue: number;
        marge: number;
    }>;
}

const COLORS = ['#2563eb', '#0891b2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const FAMILLE_COLORS: { [key: string]: string } = {
    'BALLE': '#2563eb',
    'FRIPPE': '#10b981',
    'TRIAGE': '#f59e0b',
    'IMMO': '#8b5cf6',
};

const ProfitabilityCharts: React.FC = () => {
    const lastParams = useAppSelector((state) => state.analytics.lastParams);
    const [data, setData] = useState<ProfitabilityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/analytics/profitability', {
                    params: {
                        date_debut: lastParams?.date_debut,
                        date_fin: lastParams?.date_fin,
                    },
                });
                setData(response.data);
            } catch (error) {
                console.error('Error fetching profitability data:', error);
                setError('Erreur lors du chargement de l\'analyse de rentabilité. Vérifiez que le serveur backend est démarré.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [lastParams?.date_debut, lastParams?.date_fin]);

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
                    Aucune donnée d'analyse de rentabilité disponible.
                </Typography>
            </Box>
        );
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('fr-FR', {
            maximumFractionDigits: 0,
        }).format(value) + ' MGA';
    };

    const formatCompactCurrency = (value: number) => {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M MGA';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(0) + 'k MGA';
        }
        return value.toString() + ' MGA';
    };

    return (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                📈 Analyse de Rentabilité
            </Typography>

            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
                <Tab label="Par Article" />
                <Tab label="Par Fournisseur" />
                <Tab label="Vue d'ensemble" />
            </Tabs>

            {tabValue === 0 && (
                <Card>
                    <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                            Top 20 Articles par Marge
                        </Typography>
                        <ResponsiveContainer width="100%" height={450}>
                            <BarChart data={data.marge_par_article} margin={{ top: 20, right: 30, left: 40, bottom: 80 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="article" angle={-45} textAnchor="end" height={100} interval={0} tick={{ fontSize: 11 }} />
                                <YAxis tickFormatter={formatCompactCurrency} width={80} tick={{ fontSize: 11 }} />
                                <Tooltip
                                    formatter={(value: any, name: any) => {
                                        if (name === 'Marge (MGA)' || name === 'marge_absolue') return [formatCurrency(value), 'Marge'];
                                        if (name === 'marge_pct') return [`${value.toFixed(1)}%`, 'Taux de Marge'];
                                        return [value, name];
                                    }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="marge_absolue" fill="#10b981" name="Marge (MGA)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {tabValue === 1 && (
                <Card>
                    <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                            Marge par Fournisseur
                        </Typography>
                        <ResponsiveContainer width="100%" height={450}>
                            <BarChart data={data.marge_par_fournisseur} margin={{ top: 20, right: 30, left: 40, bottom: 80 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="fournisseur" angle={-45} textAnchor="end" height={100} interval={0} tick={{ fontSize: 11 }} />
                                <YAxis tickFormatter={formatCompactCurrency} width={80} tick={{ fontSize: 11 }} />
                                <Tooltip
                                    formatter={(value: any, name: any) => {
                                        if (name === 'Marge (MGA)' || name === 'marge_absolue') return [formatCurrency(value), 'Marge'];
                                        if (name === 'marge_pct') return [`${value.toFixed(1)}%`, 'Taux de Marge'];
                                        return [value, name];
                                    }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="marge_absolue" fill="#3b82f6" name="Marge (MGA)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {tabValue === 2 && (
                <Card>
                    <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                            Quantité Vendue vs Marge (par Famille)
                        </Typography>
                        <ResponsiveContainer width="100%" height={450}>
                            <ScatterChart margin={{ top: 20, right: 30, left: 40, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="qte_vendue" name="Quantité Vendue" tick={{ fontSize: 11 }} />
                                <YAxis type="number" dataKey="marge" name="Marge" tickFormatter={formatCompactCurrency} width={80} tick={{ fontSize: 11 }} />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    formatter={(value: any, name: any) => {
                                        if (name === 'Marge') return [formatCurrency(value), name];
                                        return [value, name]; // Quantité sans unité
                                    }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                {Object.keys(FAMILLE_COLORS).map((famille) => (
                                    <Scatter
                                        key={famille}
                                        name={famille}
                                        data={data.scatter_data.filter((d) => d.famille === famille)}
                                        fill={FAMILLE_COLORS[famille]}
                                    />
                                ))}
                            </ScatterChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default ProfitabilityCharts;
