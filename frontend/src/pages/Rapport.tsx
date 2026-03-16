import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Chip,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  Print as PrintIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { RapportRequest } from '../services/api';
import DataTable from '../components/Table/DataTable';
import { PrintPreview } from '../components/Modal/PrintPreview';
import ReportFilterModal from '../components/Modal/ReportFilterModal';
import { showToast } from '../components/Toast/ModernToast';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchRapport } from '../store/redux_slices/rapportSlice';

const Rapport: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);


  const { data, periodes, loading, error, lastParams, hasData, lastFetched, cacheValidity } = useAppSelector((state) => state.rapport);



  // Récupérer les paramètres du rapport depuis le state de navigation ou Redux
  useEffect(() => {
    const params = (location.state as any)?.rapportParams;
    if (params) {
      // On dispatch toujours, le thunk s'occupe de la gestion du cache interne
      dispatch(fetchRapport(params)).then((result) => {
        if (fetchRapport.fulfilled.match(result) && !result.payload.fromCache) {
          showToast.success('📊 Rapport actualisé !');
        } else if (fetchRapport.rejected.match(result)) {
          showToast.error(result.payload as string || 'Erreur lors du chargement');
        }
      });
    }
  }, [location.state?.rapportParams, dispatch]);



  const handleDownloadExcel = () => {
    if (!data) return;

    // Helper functions
    const getPctCategory = (pct: number): string => {
      if (pct < -30) return '-50';
      if (pct < -15) return '-30';
      if (pct < 0) return '-15';
      if (pct < 50) return '+50';
      return '+75';
    };

    // Table headers for 22 columns
    const tableHeader = [[
      '%', 'Info', '*', 'Référence', 'Désignation', 'Pds U', 'PU Ach', 'PU Revient', 'PU Gros',
      'Report Qté', 'Report Poids', 'Achat Qté', 'Achat Poids',
      'Prod Qté', 'Prod Poids', 'Vente Qté', 'Vente Poids',
      'Stock Qté', 'Stock Poids', 'Montant', '% Vente', 'Marge %'
    ]];

    const exportData = data.map(article => [
      getPctCategory(article.pct_vente),
      article.infotlib6 || '',
      article.stock_poids >= 0 ? '*' : '', // Stock indicator
      article.reference,
      article.designation,
      article.poids_uv,
      article.pu_achat,
      article.pu_revient,
      article.pu_gros,
      article.report_qte,
      article.report_poids,
      article.achat_qte,
      article.achat_poids,
      article.production_qte,
      article.production_poids,
      article.vente_qte,
      article.vente_poids,
      article.stock_qte,
      article.stock_poids,
      article.montant_disponible,
      article.pct_vente,
      article.marge_pct
    ]);

    const finalData = [
      ...tableHeader,
      ...exportData
    ];

    import('xlsx').then((XLSX) => {
      const ws = XLSX.utils.aoa_to_sheet(finalData);
      const wb = XLSX.utils.book_new();

      // Style slightly (bold for headers) - optional but nice
      ws['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];

      XLSX.utils.book_append_sheet(wb, ws, 'Rapport');
      XLSX.writeFile(wb, `rapport_miezaka_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast.success('📥 Fichier Excel téléchargé!');
    });
  };

  const handleDownloadPDF = async () => {
    if (!data) return;
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Helper functions
    const getPctCategory = (pct: number): string => {
      if (pct < -30) return '-50';
      if (pct < -15) return '-30';
      if (pct < 0) return '-15';
      if (pct < 50) return '+50';
      return '+75';
    };

    const tableRows = data.map(item => [
      getPctCategory(item.pct_vente),
      item.infotlib6 || '',
      item.stock_poids >= 0 ? '*' : '',
      item.reference,
      item.designation,
      item.poids_uv,
      item.pu_achat,
      item.pu_revient,
      item.pu_gros,
      item.report_qte,
      item.report_poids,
      item.achat_qte,
      item.achat_poids,
      item.production_qte,
      item.production_poids,
      item.vente_qte,
      item.vente_poids,
      item.stock_qte,
      item.stock_poids,
      item.montant_disponible,
      item.pct_vente.toFixed(1),
      item.marge_pct.toFixed(1)
    ]);

    autoTable(doc, {
      startY: 10,
      head: [['%', 'Info', '*', 'Ref', 'Designation', 'PdsU', 'PUAch', 'PURev', 'PUGro', 'RepQ', 'RepP', 'AchQ', 'AchP', 'PrdQ', 'PrdP', 'VenQ', 'VenP', 'StkQ', 'StkP', 'Montant', '%Ven', 'Marg%']],
      body: tableRows,
      styles: { fontSize: 5, cellPadding: 0.8, lineWidth: 0.1, lineColor: [200, 200, 200] },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 10, left: 5, right: 5 },
    });

    doc.save(`rapport_miezaka_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast.success('📥 Fichier PDF téléchargé!');
  };


  return (
    <Box sx={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      bgcolor: '#f8fafc'
    }}>
      {/* Header Fixe */}
      <Paper elevation={1} sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: '#ffffff',
        zIndex: 10,
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{ fontWeight: 600, color: '#64748b' }}
          >
            Retour
          </Button>
          <Box
            component="img"
            src="/logoM.jpeg"
            alt="Miezaka Logo"
            sx={{
              width: 32,
              height: 32,
              objectFit: 'contain',
              borderRadius: '50%'
            }}
          />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
            Rapport de Mouvements
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Nouveau Bouton Filtres Modale */}
          <Button
            variant="outlined"
            onClick={() => setFiltersOpen(true)}
            startIcon={<FilterListIcon />}
            size="small"
            sx={{
              fontWeight: 700,
              color: '#1e293b',
              borderColor: '#e2e8f0',
              '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' }
            }}
          >
            Filtres
          </Button>



          {data && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                color="info"
                startIcon={<PrintIcon />}
                onClick={() => setPrintPreviewOpen(true)}
                size="small"
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Imprimer
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/analytics', { state: { rapportParams: lastParams } })}
                sx={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                  fontWeight: 700,
                  textTransform: 'none',
                  px: 3,
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                  }
                }}
              >
                Voir Analyse
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Modal de Filtres Global */}
      <ReportFilterModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        lastParams={lastParams}
      />

      {/* Print Preview Modal */}
      <PrintPreview
        open={printPreviewOpen}
        onClose={() => setPrintPreviewOpen(false)}
        data={data || []}
        periodes={periodes}
        minStock={lastParams?.min_stock}
      />

      {/* Contenu Principal - Scrollable en interne */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', p: 0, display: 'flex', flexDirection: 'column' }}>
        {loading && !data ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
            <CircularProgress size={60} thickness={4} />
            <Typography color="text.secondary">Chargement des données...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="error" variant="h6">{error}</Typography>
            <Button onClick={() => window.location.reload()} sx={{ mt: 2 }}>Réessayer</Button>
          </Box>
        ) : data ? (
          <Box sx={{ flexGrow: 1, overflow: 'hidden', height: '100%', position: 'relative' }}>
            {loading && (
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}>
                <LinearProgress />
              </Box>
            )}
            <DataTable data={data} periodes={periodes} />
          </Box>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center', mt: 10 }}>
            <Typography variant="h6" color="text.secondary">Aucune donnée à afficher</Typography>
            <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>Retour à l'accueil</Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Rapport;