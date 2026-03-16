import React, { useEffect, useState, useRef } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Alert,
    Button
} from '@mui/material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { Warning as WarningIcon, Print as PrintIcon } from '@mui/icons-material';
import { analyticsAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';

interface SalesForecast {
    historique: Array<{ mois: string; ca_total: number }>;
    previsions: Array<{ mois: string; ca_prevu: number; confiance: string }>;
}

interface StockForecastItem {
    article: string;
    designation: string;
    stock_actuel: number;
    vente_mensuelle: number;
    mois_restants: number;
    date_rupture_estimee: string;
    qte_recommandee: number;
    priorite: 'haute' | 'moyenne' | 'basse';
}

const PredictionsCharts: React.FC = () => {
    const lastParams = useAppSelector((state) => state.analytics.lastParams);
    const [salesData, setSalesData] = useState<SalesForecast | null>(null);
    const [stockData, setStockData] = useState<StockForecastItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const tableRef = React.useRef<HTMLTableElement>(null);

    useEffect(() => {
        const fetchPredictions = async () => {
            try {
                const filters = {
                    date_debut: lastParams?.date_debut,
                    date_fin: lastParams?.date_fin,
                };
                const [salesRes, stockRes] = await Promise.all([
                    analyticsAPI.getSalesForecast(filters),
                    analyticsAPI.getStockForecast(filters)
                ]);
                setSalesData(salesRes);
                setStockData(stockRes.articles_critiques || []);
            } catch (err) {
                console.error('Error fetching predictions:', err);
                setError('Erreur lors du chargement des prévisions.');
            } finally {
                setLoading(false);
            }
        };

        fetchPredictions();
    }, [lastParams?.date_debut, lastParams?.date_fin]);

    const handlePrintStock = () => {
        if (!tableRef.current) return;

        const printWindow = window.open('', '', 'height=600,width=800');
        if (!printWindow) return;

        const htmlContent = `
            <html>
                <head>
                    <title>Alertes Ruptures de Stock Prévisibles</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f8fafc; font-weight: bold; }
                        .priorite-haute { color: #ef4444; font-weight: bold; }
                        .priorite-moyenne { color: #f59e0b; font-weight: bold; }
                        .priorite-basse { color: #10b981; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h2>Alertes Ruptures de Stock Prévisibles</h2>
                    ${tableRef.current.outerHTML}
                </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    // Fusionner historique et prévisions pour le graphique
    const chartData = [
        ...(salesData?.historique.map(h => ({ mois: h.mois, Valeur: h.ca_total, type: 'Historique' })) || []),
        ...(salesData?.previsions.map(p => ({ mois: p.mois, Valeur: p.ca_prevu, type: 'Prévision' })) || [])
    ];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'MGA',
            minimumFractionDigits: 0,
        }).format(value);
    };

    return (
        <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    🔮 Prévisions Intelligentes
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* 1. Prévision des Ventes */}
                <Grid item xs={12} lg={7}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Prévision du Chiffre d'Affaires
                            </Typography>
                            <Box sx={{ height: 350 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="mois"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 12 }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 12 }}
                                            tickFormatter={(val) => (val / 1000000).toFixed(0) + 'M'}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            formatter={(value: any) => [formatCurrency(Number(value) || 0), 'CA Prévu']}
                                        />
                                        <Legend />
                                        <Area
                                            type="monotone"
                                            dataKey="Valeur"
                                            stroke="#8b5cf6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorVal)"
                                            name="CA (Historique + Prévision)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', fontStyle: 'italic' }}>
                                * Les 3 derniers points représentent les prévisions basées sur les tendances actuelles.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 2. Alertes de Rupture */}
                <Grid item xs={12} lg={5}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    🚨 Alertes Ruptures de Stock Prévisibles
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<PrintIcon />}
                                    onClick={handlePrintStock}
                                    sx={{
                                        bgcolor: '#3b82f6',
                                        '&:hover': { bgcolor: '#2563eb' },
                                        fontWeight: 600,
                                        height: 32,
                                        fontSize: '0.75rem',
                                        textTransform: 'none',
                                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                                    }}
                                >
                                    Imprimer la liste
                                </Button>
                            </Box>
                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f1f5f9' }}>
                                <Table size="small" ref={tableRef}>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                            <TableCell sx={{ fontWeight: 700 }}>Article</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 700 }}>Mois restants</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>Priorité</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {stockData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                                                    Aucun risque de rupture détecté.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            stockData.map((item, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={600}>{item.article}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{item.designation}</Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Box sx={{
                                                            display: 'inline-block',
                                                            bgcolor: item.mois_restants < 1 ? '#fee2e2' : '#fef3c7',
                                                            px: 1, borderRadius: 1, fontWeight: 700, color: item.mois_restants < 1 ? '#ef4444' : '#f59e0b'
                                                        }}>
                                                            {item.mois_restants}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Chip
                                                            label={item.priorite.toUpperCase()}
                                                            size="small"
                                                            color={item.priorite === 'haute' ? 'error' : (item.priorite === 'moyenne' ? 'warning' : 'success')}
                                                            sx={{ fontWeight: 800, fontSize: '0.6rem' }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                                Basé sur le rythme de vente des 6 derniers mois.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PredictionsCharts;
