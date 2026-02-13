import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Typography,
  TextField,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Article } from '../../services/api';
import ArticleRecommendationModal from '../recommendations/ArticleRecommendationModal';
import { Lightbulb as LightbulbIcon } from '@mui/icons-material';

interface DataTableProps {
  data: Article[];
  periodes?: {
    debut: string;
    fin: string;
    stock_date: string;
  };
  hideSearch?: boolean;
  hideActions?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({ data, periodes, hideSearch, hideActions }) => {
  const [search, setSearch] = React.useState('');
  const [selectedArticle, setSelectedArticle] = React.useState<Article | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [fournisseurMap, setFournisseurMap] = React.useState<Record<string, string>>({});

  // Fetch fournisseur names from backend on mount
  React.useEffect(() => {
    const fetchFournisseurs = async () => {
      try {
        const response = await fetch('/api/rapport/fournisseurs');
        if (response.ok) {
          const fournisseurs = await response.json();
          const map: Record<string, string> = {};
          fournisseurs.forEach((f: any) => {
            map[f.code] = f.name;
          });
          setFournisseurMap(map);
        }
      } catch (error) {
        console.error('Error fetching fournisseurs:', error);
      }
    };
    fetchFournisseurs();
  }, []);

  // Helper function to get fournisseur display name
  const getFournisseurAffiche = (fournisseurValue: string): string => {
    // First check if it's a code that needs mapping
    if (fournisseurMap[fournisseurValue]) {
      return fournisseurMap[fournisseurValue];
    }
    // If not found in map, it might already be a name from backend
    return fournisseurValue;
  };

  const filteredData = data.filter(
    (item) =>
      item.reference.toLowerCase().includes(search.toLowerCase()) ||
      item.designation.toLowerCase().includes(search.toLowerCase()) ||
      item.fournisseur.toLowerCase().includes(search.toLowerCase()) ||
      item.famille.toLowerCase().includes(search.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (a.fournisseur !== b.fournisseur) return a.fournisseur.localeCompare(b.fournisseur);
    if (a.famille !== b.famille) return a.famille.localeCompare(b.famille);
    return a.reference.localeCompare(b.reference);
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR');
  };

  // Helper to get % category based on pct_vente
  // pct<15 → -15, 15<=pct<30 → -30, 30<=pct<50 → -50, 50<=pct<75 → +50, pct>=75 → +75
  const getPctCategory = (pct: number): string => {
    if (pct < 15) return '-15';
    if (pct < 30) return '-30';
    if (pct < 50) return '-50';
    if (pct < 75) return '+50';
    return '+75';
  };

  // Helper to get stock indicator (* if report_poids >= threshold of 100)
  const getStockIndicator = (reportPoids: number): string => {
    return reportPoids >= 100 ? '*' : '';
  };

  const getHeaderStyle = (color?: string) => ({
    bgcolor: color || '#f8fafc',
    color: 'black',
    fontWeight: 900,
    fontSize: '0.75rem', // Increased from 0.5rem
    py: 1, // Increased padding
    px: 1,
    border: '1px solid #cbd5e1',
    lineHeight: 1.2,
    whiteSpace: 'nowrap' as const,
    textAlign: 'center' as const,
    // overflow: 'hidden', // Removed to allow sticky headers to work better or content to be fully visible if needed, though usually header is fixed
  });

  const cellStyle = {
    fontSize: '0.75rem', // Increased from 0.5rem
    py: 0.8, // Increased padding
    px: 0.8,
    border: '1px solid #e2e8f0',
    fontWeight: 500,
    lineHeight: 1.2,
    whiteSpace: 'nowrap' as const,
    // overflow: 'hidden', // Removed to avoid clipping
  };

  // Sticky style for Designation column (Header and Body)
  const stickyDesignationStyle = {
    position: 'sticky' as const,
    left: 200, // Adjusted based on approximate width of preceding columns (Ref group)
    zIndex: 5,
    bgcolor: '#f8fafc',
    borderRight: '2px solid #e2e8f0',
    whiteSpace: 'normal' as const,
    lineHeight: 1.2,
    maxWidth: '200px',
    overflow: 'hidden',
  };



  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ... search ... */}

      {/* Table */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <TableContainer sx={{ maxHeight: '100%', width: '100%' }}>
          {/* Removed tableLayout: fixed to allow auto-sizing and scrolling */}
          <Table stickyHeader size="small" sx={{ width: 'max-content', minWidth: '100%' }}>
            {/* Removed colgroup to let columns auto-size based on content and min-widths */}
            <TableHead>
              {/* Main header row with column groups */}
              <TableRow>
                <TableCell colSpan={4} sx={{ ...getHeaderStyle('#dbeafe'), minWidth: 200 }}>Référence Article</TableCell>
                <TableCell rowSpan={2} sx={{ ...getHeaderStyle('#f8fafc'), minWidth: 200, ...stickyDesignationStyle, top: 0, zIndex: 6 }}>Désignation</TableCell>
                <TableCell rowSpan={2} sx={{ ...getHeaderStyle('#f8fafc'), minWidth: 60 }}>Pds U</TableCell>
                {/* ... other headers ... */}

                <TableCell rowSpan={2} sx={{ ...getHeaderStyle('#f8fafc'), minWidth: 80 }}>PU Ach</TableCell>
                <TableCell rowSpan={2} sx={{ ...getHeaderStyle('#f8fafc'), minWidth: 80 }}>PU Revient</TableCell>
                <TableCell rowSpan={2} sx={{ ...getHeaderStyle('#f8fafc'), minWidth: 80 }}>PU Gros</TableCell>
                <TableCell colSpan={2} sx={{ ...getHeaderStyle('#e9d5ff'), minWidth: 140 }}>Report</TableCell>
                <TableCell colSpan={2} sx={{ ...getHeaderStyle('#d1fae5'), minWidth: 140 }}>Achat</TableCell>
                <TableCell colSpan={2} sx={{ ...getHeaderStyle('#fed7aa'), minWidth: 140 }}>Production</TableCell>
                <TableCell colSpan={2} sx={{ ...getHeaderStyle('#dbeafe'), minWidth: 140 }}>Vente</TableCell>
                <TableCell colSpan={2} sx={{ ...getHeaderStyle('#f1f5f9'), minWidth: 140 }}>Stock</TableCell>
                <TableCell rowSpan={2} sx={{ ...getHeaderStyle('#f1f5f9'), minWidth: 100 }}>Montant</TableCell>
                <TableCell rowSpan={2} sx={{ ...getHeaderStyle('#fef3c7'), minWidth: 70 }}>% Ven</TableCell>
                <TableCell rowSpan={2} sx={{ ...getHeaderStyle('#fee2e2'), minWidth: 70 }}>Marg%</TableCell>
                {!hideActions && <TableCell rowSpan={2} sx={{ ...getHeaderStyle('#e0e7ff'), minWidth: 50 }}>Actions</TableCell>}
              </TableRow>
              {/* Sub-header row */}
              <TableRow>
                <TableCell sx={getHeaderStyle('#dbeafe')}>%</TableCell>
                <TableCell sx={getHeaderStyle('#dbeafe')}>Info</TableCell>
                <TableCell sx={getHeaderStyle('#dbeafe')}>*</TableCell>
                <TableCell sx={getHeaderStyle('#dbeafe')}>Réf</TableCell>
                <TableCell sx={getHeaderStyle('#e9d5ff')}>Qte</TableCell>
                <TableCell sx={getHeaderStyle('#e9d5ff')}>Poids</TableCell>
                <TableCell sx={getHeaderStyle('#d1fae5')}>Qte</TableCell>
                <TableCell sx={getHeaderStyle('#d1fae5')}>Poids</TableCell>
                <TableCell sx={getHeaderStyle('#fed7aa')}>Qte</TableCell>
                <TableCell sx={getHeaderStyle('#fed7aa')}>Poids</TableCell>
                <TableCell sx={getHeaderStyle('#dbeafe')}>Qte</TableCell>
                <TableCell sx={getHeaderStyle('#dbeafe')}>Poids</TableCell>
                <TableCell sx={getHeaderStyle('#f1f5f9')}>Qte</TableCell>
                <TableCell sx={getHeaderStyle('#f1f5f9')}>Poids</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                const rows: JSX.Element[] = [];
                let currentFournisseur = '';
                let currentFamille = '';

                // Enhanced totals with additional metrics for % Ven, Marg%, and avg PU Ach
                let totalFamille = { qrt: 0, prt: 0, qac: 0, pac: 0, qpr: 0, ppr: 0, qve: 0, pve: 0, qst: 0, pst: 0, mnt: 0, count: 0, sumPuAch: 0, sumVenteMontant: 0, sumCoutAchat: 0 };
                let totalFourn = { qrt: 0, prt: 0, qac: 0, pac: 0, qpr: 0, ppr: 0, qve: 0, pve: 0, qst: 0, pst: 0, mnt: 0, count: 0, sumPuAch: 0, sumVenteMontant: 0, sumCoutAchat: 0 };
                let totalGeneral = { qrt: 0, prt: 0, qac: 0, pac: 0, qpr: 0, ppr: 0, qve: 0, pve: 0, qst: 0, pst: 0, mnt: 0, count: 0, sumPuAch: 0, sumVenteMontant: 0, sumCoutAchat: 0 };

                // Format numbers: show "-" for 0 or negative values, 2 decimal places
                const formatNum = (val: number) => (val <= 0) ? '-' : val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

                const renderTotalRow = (label: string, data: any, level: 'famille' | 'fournisseur' | 'general', labelCol: number) => {
                  const bg = level === 'famille' ? '#f8fafc' : (level === 'fournisseur' ? '#f1f5f9' : '#1e293b');
                  const fg = level === 'general' ? 'white' : 'inherit';

                  // Calculate % Ven, Marg%, and avg PU Ach for subtotals
                  const totalDisponible = data.qrt + data.qac + data.qpr;
                  const pctVen = totalDisponible > 0 ? (data.qve / totalDisponible * 100) : 0;
                  const avgPuAch = data.count > 0 ? (data.sumPuAch / data.count) : 0;
                  const margePct = data.sumVenteMontant > 0 ? ((data.sumVenteMontant - data.sumCoutAchat) / data.sumVenteMontant * 100) : 0;

                  return (
                    <TableRow key={label + Math.random()} sx={{ bgcolor: bg }}>
                      {/* Empty cells before label */}
                      {Array.from({ length: labelCol }).map((_, i) => (
                        <TableCell key={i} sx={{ ...cellStyle, color: fg }} />
                      ))}
                      {/* Label cell */}
                      <TableCell sx={{ ...cellStyle, fontWeight: 900, color: fg, textAlign: 'center' }}>{label}</TableCell>
                      {/* Empty cells after label, but show avg PU Ach in PU Ach column */}
                      {Array.from({ length: 8 - labelCol }).map((_, i) => {
                        // Column 6 (PU Ach) is at index (6 - labelCol - 1) after the label
                        if (i === (6 - labelCol - 1)) {
                          return <TableCell key={i} align="right" sx={{ ...cellStyle, fontWeight: 700, color: fg }}>{formatNum(avgPuAch)}</TableCell>;
                        }
                        return <TableCell key={i} sx={{ ...cellStyle, color: fg }} />;
                      })}
                      {/* Data columns */}
                      <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: fg }}>{formatNum(data.qrt)}</TableCell>
                      <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: fg }}>{formatNum(data.prt)}</TableCell>
                      <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: fg }}>{formatNum(data.qac)}</TableCell>
                      <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: fg }}>{formatNum(data.pac)}</TableCell>
                      <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: fg }}>{formatNum(data.qpr)}</TableCell>
                      <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: fg }}>{formatNum(data.ppr)}</TableCell>
                      <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: fg }}>{formatNum(data.qve)}</TableCell>
                      <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: fg }}>{formatNum(data.pve)}</TableCell>
                      <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: fg }}>{formatNum(data.qst)}</TableCell>
                      <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: fg }}>{formatNum(data.pst)}</TableCell>
                      <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: level === 'general' ? '#fbbf24' : '#2563eb' }}>{formatNum(data.mnt)}</TableCell>
                      {/* % Ven and Marg% for all totals including TOTAL GENERAL */}
                      <TableCell align="right" sx={{ ...cellStyle, fontWeight: 700, color: level === 'general' ? 'white' : '#2563eb' }}>{pctVen.toFixed(2)}%</TableCell>
                      <TableCell align="right" sx={{ ...cellStyle, fontWeight: 700, color: level === 'general' ? 'white' : '#dc2626' }}>{margePct.toFixed(2)}%</TableCell>
                      {!hideActions && <TableCell sx={cellStyle} />}
                    </TableRow>
                  );
                };

                sortedData.forEach((row, index) => {
                  const isNewFournisseur = row.fournisseur !== currentFournisseur;
                  const isNewFamille = row.famille !== currentFamille || isNewFournisseur;

                  // Render subtotals when groups change
                  // Order: supplier subtotal first, then famille subtotal
                  // This makes TOT FOURN appear BEFORE (above) TOT FAMILLE in the table

                  if (isNewFournisseur && currentFournisseur !== '' && index > 0) {
                    const fournisseurAffiche = getFournisseurAffiche(currentFournisseur);
                    rows.push(renderTotalRow(`TOT FOURN ${fournisseurAffiche}`, totalFourn, 'fournisseur', 3)); // Label in col 4 (Réf)
                    totalFourn = { qrt: 0, prt: 0, qac: 0, pac: 0, qpr: 0, ppr: 0, qve: 0, pve: 0, qst: 0, pst: 0, mnt: 0, count: 0, sumPuAch: 0, sumVenteMontant: 0, sumCoutAchat: 0 };
                  }

                  if (isNewFamille && currentFamille !== '' && index > 0) {
                    rows.push(renderTotalRow(`TOT ${currentFamille}`, totalFamille, 'famille', 4));
                    totalFamille = { qrt: 0, prt: 0, qac: 0, pac: 0, qpr: 0, ppr: 0, qve: 0, pve: 0, qst: 0, pst: 0, mnt: 0, count: 0, sumPuAch: 0, sumVenteMontant: 0, sumCoutAchat: 0 };
                  }

                  if (isNewFournisseur) {
                    currentFournisseur = row.fournisseur;
                    // Fournisseur grouping row removed - no grey separator line
                  }

                  if (isNewFamille) {
                    currentFamille = row.famille;
                    // Famille grouping row removed per user request
                  }

                  // Update totals with additional metrics
                  [totalFamille, totalFourn, totalGeneral].forEach(t => {
                    t.qrt += row.report_qte; t.prt += row.report_poids;
                    t.qac += row.achat_qte; t.pac += row.achat_poids;
                    t.qpr += row.production_qte; t.ppr += row.production_poids;
                    t.qve += row.vente_qte; t.pve += row.vente_poids;
                    t.qst += row.stock_qte; t.pst += row.stock_poids;
                    t.mnt += row.montant_disponible;
                    t.count += 1;
                    t.sumPuAch += row.pu_achat;
                    // Estimate vente montant and cout achat for marge calculation
                    const venteMontant = row.vente_qte * row.pu_gros;
                    const coutAchat = row.vente_qte * row.pu_achat;
                    t.sumVenteMontant += venteMontant;
                    t.sumCoutAchat += coutAchat;
                  });

                  // Article data row with 23 columns (ajouté Actions)
                  // Si Pds U = 1, afficher "-" pour les Qte
                  const showQte = row.poids_uv !== 1;

                  rows.push(
                    <TableRow key={row.reference + index} hover sx={{ '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.05)' } }}>
                      {/* Référence Article - 4 sub-columns */}
                      <TableCell align="center" sx={{ ...cellStyle, color: '#7c3aed', fontWeight: 700 }}>{getPctCategory(row.pct_vente)}</TableCell>
                      <TableCell sx={{ ...cellStyle, color: '#475569' }}>{row.infotlib6 || ''}</TableCell>
                      <TableCell align="center" sx={{ ...cellStyle, color: '#dc2626', fontWeight: 900 }}>{getStockIndicator(row.report_poids)}</TableCell>
                      {/* Data row with bold Ref and Designation */}
                      <TableCell sx={{ ...cellStyle, color: '#1e293b', fontWeight: 800 }}>{row.reference}</TableCell> {/* Bold Ref */}
                      <TableCell sx={{ ...cellStyle, color: '#334155', fontWeight: 800, minWidth: 200, ...stickyDesignationStyle }}>{row.designation}</TableCell> {/* Bold Designation */}
                      <TableCell align="center" sx={{ ...cellStyle, color: '#64748b' }}>{formatNum(row.poids_uv)}</TableCell>
                      <TableCell align="center" sx={{ ...cellStyle, color: '#64748b' }}>{formatNum(row.pu_achat)}</TableCell>
                      <TableCell align="center" sx={{ ...cellStyle, color: '#64748b' }}>{formatNum(row.pu_revient)}</TableCell>
                      <TableCell align="center" sx={{ ...cellStyle, color: '#64748b' }}>{formatNum(row.pu_gros)}</TableCell>
                      {/* ... rest of columns ... */}
                      <TableCell align="center" sx={{ ...cellStyle, color: '#60a5fa' }}>{formatNum(row.report_qte)}</TableCell>
                      <TableCell align="center" sx={{ ...cellStyle, color: '#60a5fa' }}>{formatNum(row.report_poids)}</TableCell>
                      <TableCell align="center" sx={{ ...cellStyle, color: '#4ade80' }}>{formatNum(row.achat_qte)}</TableCell>
                      <TableCell align="center" sx={{ ...cellStyle, color: '#4ade80' }}>{formatNum(row.achat_poids)}</TableCell>
                      <TableCell align="center" sx={{ ...cellStyle, color: '#fbbf24' }}>{formatNum(row.production_qte)}</TableCell>
                      <TableCell align="center" sx={{ ...cellStyle, color: '#fbbf24' }}>{formatNum(row.production_poids)}</TableCell>
                      <TableCell align="center" sx={{ ...cellStyle, color: '#ef4444' }}>{formatNum(row.vente_qte)}</TableCell>
                      <TableCell align="center" sx={{ ...cellStyle, color: '#ef4444' }}>{formatNum(row.vente_poids)}</TableCell>
                      <TableCell align="center" sx={{ ...cellStyle, color: '#94a3b8', fontWeight: 700 }}>{formatNum(row.stock_qte)}</TableCell>
                      <TableCell align="center" sx={{ ...cellStyle, color: '#94a3b8', fontWeight: 700 }}>{formatNum(row.stock_poids)}</TableCell>
                      <TableCell align="right" sx={{ ...cellStyle, color: '#0f172a', fontWeight: 800 }}>{formatNum(row.montant_disponible)}</TableCell>
                      <TableCell align="right" sx={{ ...cellStyle, color: '#2563eb', fontWeight: 600 }}>{row.pct_vente.toFixed(1)}%</TableCell>
                      <TableCell align="right" sx={{ ...cellStyle, color: '#dc2626', fontWeight: 800 }}>{row.marge_pct.toFixed(1)}%</TableCell>
                      {/* Actions column */}
                      {!hideActions && (
                        <TableCell align="center" sx={cellStyle}>
                          <Tooltip title="Afficher analyse et recommandations">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedArticle(row);
                                setModalOpen(true);
                              }}
                              sx={{
                                color: '#4f46e5',
                                '&:hover': {
                                  bgcolor: 'rgba(79, 70, 229, 0.1)',
                                },
                              }}
                            >
                              <LightbulbIcon sx={{ fontSize: '1.2rem' }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  );

                  if (index === sortedData.length - 1) {
                    // Render final subtotals in order: supplier, famille, general
                    const fournisseurAffiche = getFournisseurAffiche(currentFournisseur);
                    rows.push(renderTotalRow(`TOT FOURN ${fournisseurAffiche}`, totalFourn, 'fournisseur', 3));
                    rows.push(renderTotalRow(`TOT ${currentFamille}`, totalFamille, 'famille', 4));
                    rows.push(renderTotalRow(`TOTAL GENERAL`, totalGeneral, 'general', 3));

                    // Additional total rows (placeholders for now - need actual data)
                    // Additional total rows with values per section
                    // VAL ACH DEVISE should be distributed across Report, Achat, Production, Vente, Stock based on quantities
                    const unitValAch = totalGeneral.qac > 0 ? totalGeneral.mnt / totalGeneral.qac : 0;
                    const totalValAchReport = unitValAch * totalGeneral.qrt;
                    const totalValAchAchat = unitValAch * totalGeneral.qac;
                    const totalValAchProd = unitValAch * totalGeneral.qpr;
                    const totalValAchVente = unitValAch * totalGeneral.qve;
                    const totalValAchStock = unitValAch * totalGeneral.qst;

                    rows.push(
                      <TableRow key="val-ach-devise" sx={{ bgcolor: '#fef3c7' }}>
                        {/* Merged empty cols + label */}
                        <TableCell colSpan={4} sx={{ ...cellStyle, fontWeight: 900, textAlign: 'center' }}>TOTAL VAL ACH DEVISE</TableCell>
                        <TableCell colSpan={5} sx={cellStyle} />
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#4ade80' }} colSpan={2}>{formatNum(totalValAchReport)}</TableCell>
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#4ade80' }} colSpan={2}>{formatNum(totalValAchAchat)}</TableCell>
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#fbbf24' }} colSpan={2}>{formatNum(totalValAchProd)}</TableCell>
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#60a5fa' }} colSpan={2}>{formatNum(totalValAchVente)}</TableCell>
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#94a3b8' }} colSpan={2}>{formatNum(totalValAchStock)}</TableCell>
                        <TableCell colSpan={2} sx={cellStyle} />
                        <TableCell colSpan={hideActions ? 1 : 2} sx={cellStyle} /> {/* Adjusted colSpan for last empty cells */}
                      </TableRow>
                    );


                    // Use TOTAL GENERAL average PU Ach for VALEUR DEDOUANEE AR as requested
                    // "le donnees c'est le donnees du PU Ach du TOTAL GENERAL"
                    const avgPuAchGeneral = totalGeneral.count > 0 ? (totalGeneral.sumPuAch / totalGeneral.count) : 0;
                    const unitValDedouane = avgPuAchGeneral;

                    const totalValDedouaneReport = unitValDedouane * totalGeneral.qrt;
                    const totalValDedouaneAchat = unitValDedouane * totalGeneral.qac;
                    const totalValDedouaneProd = unitValDedouane * totalGeneral.qpr;
                    const totalValDedouaneVente = unitValDedouane * totalGeneral.qve;
                    const totalValDedouaneStock = unitValDedouane * totalGeneral.qst;

                    // Calculate Marg% for VAL DEDOUANE DEV
                    // Cost = totalValDedouaneVente
                    // Sales = totalGeneral.sumVenteMontant 
                    const margePctDedouane = totalGeneral.sumVenteMontant > 0 ? ((totalGeneral.sumVenteMontant - totalValDedouaneVente) / totalGeneral.sumVenteMontant * 100) : 0;
                    const pctVenDedouane = totalGeneral.sumVenteMontant > 0 ? (totalGeneral.qve / (totalGeneral.qrt + totalGeneral.qac + totalGeneral.qpr) * 100) : 0; // Recalculate based on totalGeneral quantities

                    rows.push(
                      <TableRow key="val-dedouane-dev" sx={{ bgcolor: '#fef3c7' }}>
                        <TableCell colSpan={4} sx={{ ...cellStyle, fontWeight: 900, textAlign: 'center' }}>VAL DEDOUANE DEV</TableCell>
                        <TableCell colSpan={5} sx={cellStyle} />
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#60a5fa' }} colSpan={2}>{formatNum(totalValDedouaneReport)}</TableCell>
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#60a5fa' }} colSpan={2}>{formatNum(totalValDedouaneAchat)}</TableCell>
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#fbbf24' }} colSpan={2}>{formatNum(totalValDedouaneProd)}</TableCell>
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#60a5fa' }} colSpan={2}>{formatNum(totalValDedouaneVente)}</TableCell>
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#94a3b8' }} colSpan={2}>{formatNum(totalValDedouaneStock)}</TableCell>
                        <TableCell colSpan={2} sx={cellStyle} />
                        <TableCell colSpan={hideActions ? 1 : 2} sx={cellStyle} /> {/* Adjusted colSpan for last empty cells */}
                      </TableRow>
                    );

                    // =================================================================================================
                    // CALCUL VALEUR DEDOUANEE AR (with Exchange Rates)
                    // =================================================================================================

                    // 1. Calculate weighted exchange rate or separate sums based on Supplier
                    // Rate: USA = 4700 (USD), Else = 5200 (EUR)

                    let sumValArReport = 0;
                    let sumValArAchat = 0;
                    let sumValArProd = 0;
                    let sumValArVente = 0;
                    let sumValArStock = 0;

                    // Iterate to sum using specific rates per article
                    sortedData.forEach(item => {
                      const isUSA = item.fournisseur && item.fournisseur.toUpperCase().includes('USA');
                      const rate = isUSA ? 4700 : 5200;

                      const unitVal = item.pu_achat * rate; // Price in AR

                      sumValArReport += unitVal * item.report_qte;
                      sumValArAchat += unitVal * item.achat_qte;
                      sumValArProd += unitVal * item.production_qte;
                      sumValArVente += unitVal * item.vente_qte;
                      sumValArStock += unitVal * item.stock_qte;
                    });

                    // Calculate totals
                    // Average Unit Value AR = Total Value over Total Qty (just for display if needed, but not explicitly requested)
                    const totalQty = totalGeneral.qrt + totalGeneral.qac + totalGeneral.qpr;
                    const avgUnitValAr = totalQty > 0 ? (sumValArReport + sumValArAchat + sumValArProd) / totalQty : 0; // Approx weighted avg

                    // Calculate Marg% for VALEUR DEDOUANEE AR
                    // Cost AR = sumValArVente
                    // Sales AR (Montant Disp is presumably in AR?) -> Yes, usually Montant is sales revenue
                    // "montant_disponible" is usually value of STOCK? Or sales amount?
                    // In previous code: sumVenteMontant = vente_qte * pu_gros. Assuming pu_gros is local currency (AR).

                    const margePctAr = totalGeneral.sumVenteMontant > 0 ? ((totalGeneral.sumVenteMontant - sumValArVente) / totalGeneral.sumVenteMontant * 100) : 0;

                    rows.push(
                      <TableRow key="valeur-dedouanee-ar" sx={{ bgcolor: '#fef3c7' }}>
                        <TableCell colSpan={4} sx={{ ...cellStyle, fontWeight: 900, textAlign: 'center' }}>VALEUR DEDOUANEE AR</TableCell>
                        <TableCell colSpan={2} sx={cellStyle} /> {/* Desig, PdsU */}
                        <TableCell align="right" sx={{ ...cellStyle, fontWeight: 800, color: '#0f172a' }}>{formatNum(unitValDedouane)}</TableCell> {/* PU Ach filled - Keep in Devise as requested */}
                        <TableCell colSpan={2} sx={cellStyle} /> {/* PU Rev, PU Gros */}

                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#f97316' }} colSpan={2}>{formatNum(sumValArReport)}</TableCell>
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#f97316' }} colSpan={2}>{formatNum(sumValArAchat)}</TableCell>
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#fbbf24' }} colSpan={2}>{formatNum(sumValArProd)}</TableCell>
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#f97316' }} colSpan={2}>{formatNum(sumValArVente)}</TableCell>
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#94a3b8' }} colSpan={2}>{formatNum(sumValArStock)}</TableCell>
                        <TableCell sx={cellStyle} /> {/* Montant */}
                        <TableCell align="right" sx={{ ...cellStyle, fontWeight: 800, color: '#2563eb' }}>{pctVenDedouane.toFixed(2)}%</TableCell>
                        <TableCell align="right" sx={{ ...cellStyle, fontWeight: 800, color: '#dc2626' }}>{margePctAr.toFixed(2)}%</TableCell>
                        {!hideActions && <TableCell sx={cellStyle} />}
                      </TableRow>
                    );
                  }
                });

                if (sortedData.length === 0) {
                  rows.push(
                    <TableRow key="none">
                      <TableCell colSpan={23} align="center" sx={{ py: 3, fontSize: '0.8rem' }}>Aucun article trouvé.</TableCell>
                    </TableRow>
                  );
                }

                return rows;
              })()}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Modal de recommandations */}
      <ArticleRecommendationModal
        open={modalOpen}
        article={selectedArticle}
        onClose={() => {
          setModalOpen(false);
          setSelectedArticle(null);
        }}
      />
    </Box>
  );
};

export default DataTable;