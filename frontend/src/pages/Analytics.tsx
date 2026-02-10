import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Close as CloseIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Insight, Article } from '../services/api';
import { useLocation, useNavigate } from 'react-router-dom';
import * as animations from '../styles/animations';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchAnalyticsData } from '../store/redux_slices/analyticsSliceData';
import KPICards from '../components/analytics/KPICards';
import ProfitabilityCharts from '../components/analytics/ProfitabilityCharts';
import SalesAnalysis from '../components/analytics/SalesAnalysis';
import RecommendationsPanel from '../components/recommendations/RecommendationsPanel';

const COLORS = ['#2563eb', '#0891b2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const {
    insights,
    salesTrend,
    stockByFamily,
    topSuppliers,
    profitMargin,
    loading,
    error,
    lastParams,
    hasData,
    lastFetched,
    cacheValidity
  } = useAppSelector((state) => state.analytics);

  // Modal state
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // Prefer params passed from Rapport page, then last fetched params, otherwise fall back to sensible defaults
    const paramsFromLocation = (location.state as any)?.rapportParams;
    const defaultDates = (() => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      const toIso = (d: Date) => d.toISOString().split('T')[0];
      return { date_debut: toIso(start), date_fin: toIso(end), date_stock: toIso(end) };
    })();

    const filters = paramsFromLocation || lastParams || ({
      ...defaultDates,
      familles: ['BALLE', 'FRIPPE'],
      min_stock: 0,
      fournisseurs: [],
      debug_mode: false,
    } as any);

    // Vérifier si on doit recharger les données
    const areParamsEqual = lastParams && JSON.stringify(lastParams) === JSON.stringify(filters);
    const isCacheValid = lastFetched && (Date.now() - lastFetched < cacheValidity);
    
    // Charger les données SI:
    // 1. Aucune donnée n'a jamais été chargée (hasData === false)
    // 2. OU les paramètres ont changé (areParamsEqual === false)
    // 3. ET le cache n'est pas valide
    if (!hasData || (!areParamsEqual && !isCacheValid)) {
      dispatch(fetchAnalyticsData(filters));
    }
  }, [location.state?.rapportParams, lastParams, dispatch, hasData, lastFetched, cacheValidity]);

  const handleCardClick = (insight: Insight) => {
    if (insight.details && insight.details.length > 0) {
      setSelectedInsight(insight);
      setModalOpen(true);
    }
  };

  if (loading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (insights.length === 0 && !loading) {
    return (
      <Box sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f8fafc',
        p: 3
      }}>
        <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
          Aucun données d'analytics disponibles
        </Typography>
        <Typography variant="body1" sx={{ textAlign: 'center', color: 'text.secondary' }}>
          Veuillez d'abord générer un rapport dans la page Rapport pour voir les analyses et prédictions.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/rapport')}
          sx={{ mt: 3 }}
        >
          Aller à la page Rapport
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#f8fafc',
      overflow: 'hidden'
    }}>
      {/* Top Header */}
      <Paper elevation={1} sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #e2e8f0',
        zIndex: 10
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ color: '#64748b', fontWeight: 600 }}
          >
            Retour
          </Button>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
            ANALYTICS & PRÉDICTIONS
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          Basé sur votre dernier rapport de mouvements
        </Typography>
      </Paper>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* 1. Interactive Predictions Section */}
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          🧠 ASSISTANT INTELLIGENT (Cliquer pour les détails)
        </Typography>
        <Grid container spacing={3}>
          {/* 1. KPIs Globaux */}
          <Grid item xs={12}>
            <KPICards />
          </Grid>

          {/* 2. Recommandations Automatiques */}
          <Grid item xs={12}>
            <RecommendationsPanel />
          </Grid>

          {/* 3. Analyse des Ventes */}
          <Grid item xs={12}>
            <SalesAnalysis />
          </Grid>

          {/* 4. Rentabilité */}
          <Grid item xs={12}>
            <ProfitabilityCharts />
          </Grid>
        </Grid>
      </Box>

      {/* Drill-down Modal (Keep existing logic if needed, but components handle their own interactions) */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>{selectedInsight?.title}</Typography>
          <IconButton onClick={() => setModalOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                  <TableCell sx={{ fontWeight: 700, width: '15%' }}>Référence</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: '40%' }}>Désignation</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, width: '15%' }}>Stock Qte</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, width: '15%' }}>Vente Qte</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, width: '15%' }}>Marge %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedInsight?.details?.map((art: Article) => (
                  <TableRow key={art.reference}>
                    <TableCell sx={{ fontWeight: 600, width: '15%' }}>{art.reference}</TableCell>
                    <TableCell sx={{ width: '40%', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{art.designation}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: art.stock_qte < 5 ? '#ef4444' : 'inherit', width: '15%' }}>
                      {art.stock_qte.toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ width: '15%' }}>{art.vente_qte.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: art.marge_pct > 30 ? '#10b981' : (art.marge_pct < 15 ? '#ef4444' : 'inherit'), width: '15%' }}>
                      {art.marge_pct.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
          <Button onClick={() => setModalOpen(false)} variant="contained" sx={{ fontWeight: 700 }}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Analytics;