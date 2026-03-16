import React, { useEffect, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    CheckCircle as ProfitableIcon,
    HelpOutline as AverageIcon,
    ErrorOutline as ProblemIcon,
    TrendingUp as TrendIcon,
    Print as PrintIcon
} from '@mui/icons-material';
import { Button } from '@mui/material';
import { analyticsAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';

interface ArticleItem {
    article: string;
    designation: string;
    ca_total: number;
    marge_pct: number;
}

interface ClassificationData {
    rentables: ArticleItem[];
    moyens: ArticleItem[];
    problemes: ArticleItem[];
    stats: {
        nb_rentables: number;
        nb_moyens: number;
        nb_problemes: number;
    };
}

const ArticleClassification: React.FC = () => {
    const lastParams = useAppSelector((state) => state.analytics.lastParams);
    const [data, setData] = useState<ClassificationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const tableRef = React.useRef<HTMLTableElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const filters = {
                    date_debut: lastParams?.date_debut,
                    date_fin: lastParams?.date_fin,
                };
                const res = await analyticsAPI.getArticleClassification(filters);
                setData(res);
            } catch (err) {
                console.error('Error fetching classification:', err);
                setError('Erreur lors du chargement de la classification.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [lastParams?.date_debut, lastParams?.date_fin]);

    const handlePrintClassification = () => {
        if (!tableRef.current) return;

        const categoryNames = ['Rentables', 'Moyens', 'Problématiques'];
        const currentCategory = categoryNames[tabValue];

        const printWindow = window.open('', '', 'height=600,width=800');
        if (!printWindow) return;

        const htmlContent = `
            <html>
                <head>
                    <title>Classification - ${currentCategory}</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f8fafc; font-weight: bold; }
                        .mga-text { color: #64748b; font-size: 0.9em; }
                    </style>
                </head>
                <body>
                    <h2>Classification des Articles : ${currentCategory}</h2>
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

    const handleChangeTab = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!data) return null;

    const renderTable = (articles: ArticleItem[], type: 'rentable' | 'moyen' | 'probleme') => {
        const color = type === 'rentable' ? '#10b981' : (type === 'moyen' ? '#f59e0b' : '#ef4444');

        return (
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#64748b' }}>
                        Liste des articles - {type === 'rentable' ? 'Rentables' : (type === 'moyen' ? 'Moyens' : 'Problématiques')}
                    </Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<PrintIcon />}
                        onClick={handlePrintClassification}
                        sx={{
                            color: color,
                            borderColor: `${color}40`,
                            '&:hover': { borderColor: color, bgcolor: `${color}05` },
                            fontWeight: 600,
                            textTransform: 'none'
                        }}
                    >
                        Imprimer cette liste
                    </Button>
                </Box>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f1f5f9', maxHeight: 800 }}>
                    <Table stickyHeader size="small" ref={tableRef}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 700 }}>Article</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Désignation</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>CA Total</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Marge %</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {articles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                        Aucun article dans cette catégorie.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                articles.map((item, idx) => (
                                    <TableRow key={idx} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>{item.article}</TableCell>
                                        <TableCell>{item.designation}</TableCell>
                                        <TableCell align="right">
                                            {new Intl.NumberFormat('fr-FR').format(Math.round(item.ca_total))} MGA
                                        </TableCell>
                                        <TableCell align="right">
                                            <Chip 
                                                label={`${item.marge_pct}%`} 
                                                size="small"
                                                sx={{ 
                                                    bgcolor: `${color}15`, 
                                                    color: color, 
                                                    fontWeight: 700,
                                                    border: `1px solid ${color}30`
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        );
    };

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                📊 Classification & Santé des Articles
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: '#ecfdf5', border: '1px solid #10b98130' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <ProfitableIcon sx={{ color: '#10b981', fontSize: 32, mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 900, color: '#064e3b' }}>{data.rentables.length} / {data.stats.nb_rentables}</Typography>
                            <Typography variant="body2" sx={{ color: '#059669', fontWeight: 700 }}>RENTABLES (&gt;20%)</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: '#fffbeb', border: '1px solid #f59e0b30' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <AverageIcon sx={{ color: '#f59e0b', fontSize: 32, mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 900, color: '#78350f' }}>{data.moyens.length} / {data.stats.nb_moyens}</Typography>
                            <Typography variant="body2" sx={{ color: '#d97706', fontWeight: 700 }}>MOYENS (5-20%)</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: '#fef2f2', border: '1px solid #ef444430' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <ProblemIcon sx={{ color: '#ef4444', fontSize: 32, mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 900, color: '#7f1d1d' }}>{data.problemes.length} / {data.stats.nb_problemes}</Typography>
                            <Typography variant="body2" sx={{ color: '#dc2626', fontWeight: 700 }}>PROBLÉMATIQUES (&lt;5%)</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Card>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleChangeTab} aria-label="tabs classification">
                        <Tab label={`Rentables (${data.rentables.length})`} sx={{ fontWeight: 700 }} />
                        <Tab label={`Moyens (${data.moyens.length})`} sx={{ fontWeight: 700 }} />
                        <Tab label={`Problèmes (${data.problemes.length})`} sx={{ fontWeight: 700 }} />
                    </Tabs>
                </Box>
                <CardContent>
                    <Box key={tabValue}>
                        {tabValue === 0 && renderTable(data.rentables, 'rentable')}
                        {tabValue === 1 && renderTable(data.moyens, 'moyen')}
                        {tabValue === 2 && renderTable(data.problemes, 'probleme')}
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ArticleClassification;
