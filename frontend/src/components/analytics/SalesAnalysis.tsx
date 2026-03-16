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
    Alert,
    Button,
} from '@mui/material';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { Warning as WarningIcon, Print as PrintIcon } from '@mui/icons-material';
import { api } from '../../services/api';
import { useAppSelector } from '../../store/hooks';

interface SalesData {
    evolution_mensuelle: Array<{
        mois: string;
        nb_articles: number;
        qte_totale: number;
        ca_total: number;
    }>;
    top_10_articles: Array<{
        article: string;
        designation: string;
        qte_vendue: number;
        ca_total: number;
    }>;
    articles_zero_vente: Array<{
        article: string;
        designation: string;
        stock_qte: number;
        prix_achat: number;
    }>;
}

const SalesAnalysis: React.FC = () => {
    const lastParams = useAppSelector((state) => state.analytics.lastParams);
    const [data, setData] = useState<SalesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const tableRef = useRef<HTMLDivElement>(null);
    const tableOnlyRef = useRef<HTMLTableElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/analytics/sales-analysis', {
                    params: {
                        date_debut: lastParams?.date_debut,
                        date_fin: lastParams?.date_fin,
                    },
                });
                setData(response.data);
            } catch (error) {
                console.error('Error fetching sales analysis:', error);
                setError('Erreur lors du chargement de l\'analyse des ventes. Vérifiez que le serveur backend est démarré.');
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
                    Aucune donnée d'analyse des ventes disponible.
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

    const handlePrintArticlesZeroVente = () => {
        if (!tableOnlyRef.current) return;

        const printWindow = window.open('', '', 'height=600,width=800');
        if (!printWindow) {
            alert('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez les paramètres de votre navigateur.');
            return;
        }

        const htmlContent = `
            <html>
                <head>
                    <title>Articles à 0 Vente (avec stock)</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            padding: 10px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            background-color: white;
                        }
                        thead {
                            background-color: #fee2e2;
                        }
                        th {
                            padding: 12px;
                            text-align: left;
                            font-weight: 700;
                            color: #7f1d1d;
                            border-bottom: 2px solid #fca5a5;
                        }
                        td {
                            padding: 10px 12px;
                            border-bottom: 1px solid #e2e8f0;
                        }
                        .number {
                            text-align: right;
                        }
                        @media print {
                            body { padding: 0; }
                        }
                    </style>
                </head>
                <body>
                    ${tableOnlyRef.current.outerHTML}
                </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    return (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                📉 Analyse des Ventes
            </Typography>

            <Grid container spacing={3}>
                {/* Évolution mensuelle */}
                <Grid item xs={12} lg={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Évolution des Ventes (6 derniers mois)
                            </Typography>
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={data.evolution_mensuelle} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                                    <YAxis yAxisId="right" orientation="right" tickFormatter={formatCompactCurrency} width={80} tick={{ fontSize: 11 }} />
                                    <Tooltip 
                                        formatter={(value: any, name: any) => {
                                            if (name === 'CA (MGA)' || name === 'ca_total') return [formatCurrency(value), 'CA'];
                                            if (name === 'Quantité' || name === 'qte_totale') return [value, 'Quantité'];
                                            return [value, name];
                                        }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="qte_totale"
                                        stroke="#2563eb"
                                        strokeWidth={2}
                                        name="Quantité"
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="ca_total"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        name="CA (MGA)"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Top 10 */}
                <Grid item xs={12} lg={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Top 10 Articles Vendus
                            </Typography>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={data.top_10_articles} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" tick={{ fontSize: 11 }} />
                                    <YAxis dataKey="article" type="category" width={100} tick={{ fontSize: 10 }} />
                                    <Tooltip 
                                        formatter={(value: any, name: any) => {
                                            if (name === 'Quantité' || name === 'qte_vendue') return [value, 'Quantité'];
                                            return [value, name];
                                        }}
                                    />
                                    <Bar dataKey="qte_vendue" fill="#10b981" name="Quantité" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Articles à 0 vente */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent ref={tableRef}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <WarningIcon sx={{ color: '#ef4444' }} />
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#ef4444' }}>
                                        Articles à 0 Vente (avec stock)
                                    </Typography>
                                </Box>
                                {data.articles_zero_vente.length > 0 && (
                                    <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<PrintIcon />}
                                        onClick={handlePrintArticlesZeroVente}
                                        sx={{
                                            bgcolor: '#ef4444',
                                            '&:hover': { bgcolor: '#dc2626' },
                                            fontWeight: 600
                                        }}
                                    >
                                        Imprimer
                                    </Button>
                                )}
                            </Box>
                            {data.articles_zero_vente.length === 0 ? (
                                <Alert severity="success">Aucun article en stock sans vente !</Alert>
                            ) : (
                                <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                                    <Table stickyHeader size="small" ref={tableOnlyRef}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ bgcolor: '#fee2e2', fontWeight: 700 }}>Article</TableCell>
                                                <TableCell sx={{ bgcolor: '#fee2e2', fontWeight: 700 }}>Désignation</TableCell>
                                                <TableCell align="right" sx={{ bgcolor: '#fee2e2', fontWeight: 700 }}>
                                                    Stock
                                                </TableCell>
                                                <TableCell align="right" sx={{ bgcolor: '#fee2e2', fontWeight: 700 }}>
                                                    Prix Achat
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {data.articles_zero_vente.map((article, index) => (
                                                <TableRow key={index} sx={{ '&:hover': { bgcolor: '#fef2f2' } }}>
                                                    <TableCell>{article.article}</TableCell>
                                                    <TableCell>{article.designation}</TableCell>
                                                    <TableCell align="right">{article.stock_qte}</TableCell>
                                                    <TableCell align="right">{formatCurrency(article.prix_achat)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default SalesAnalysis;
