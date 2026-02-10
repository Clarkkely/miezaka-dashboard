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
    fontSize: '0.5rem',
    py: 0.1,
    px: 0.1,
    border: '1px solid #cbd5e1',
    lineHeight: 1,
    whiteSpace: 'nowrap' as const,
    textAlign: 'center' as const,
    overflow: 'hidden',
  });

  const cellStyle = {
    fontSize: '0.5rem',
    py: 0.1,
    px: 0.1,
    border: '1px solid #e2e8f0',
    fontWeight: 500,
    lineHeight: 1,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search and Period Info */}
      {!hideSearch && (
        <Box sx={{ p: 2, bgcolor: 'white', borderBottom: '1px solid #e2e8f0' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                size="small"
                fullWidth
                placeholder="Rechercher (référence, désignation, fournisseur, famille)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ bgcolor: 'white' }}
              />
            </Grid>
            {periodes && (
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                  Période : {formatDate(periodes.debut)} - {formatDate(periodes.fin)} | Stock au : {formatDate(periodes.stock_date)}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Table */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <TableContainer sx={{ maxHeight: '100%', width: '100%' }}>
          <Table stickyHeader size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              <col style={{ width: '1%' }} /> {/* % */}
              <col style={{ width: '1%' }} /> {/* Info */}
              <col style={{ width: '1%' }} /> {/* * */}
              <col style={{ width: '5%' }} /> {/* Réf - Augmenté */}
              <col style={{ width: '6%' }} /> {/* Désignation - Réduit */}
              <col style={{ width: '1.5%' }} /> {/* Pds U */}
              <col style={{ width: '1.5%' }} /> {/* PU Ach */}
              <col style={{ width: '2.5%' }} /> {/* PU Revient */}
              <col style={{ width: '2.5%' }} /> {/* PU Gros */}
              <col style={{ width: '3%'}} /> {/* Report Qte */}
              <col style={{ width: '3%'}} /> {/* Report Poids */}
              <col style={{ width: '3%' }} /> {/* Achat Qte */}
              <col style={{ width: '3%' }} /> {/* Achat Poids */}
              <col style={{ width: '3%' }} /> {/* Prod Qte */}
              <col style={{ width: '3%' }} /> {/* Prod Poids */}
              <col style={{ width: '3%' }} /> {/* Vente Qte */}
              <col style={{ width: '3%' }} /> {/* Vente Poids */}
              <col style={{ width: '3%' }} /> {/* Stock Qte */}
              <col style={{ width: '3%' }} /> {/* Stock Poids */}
              <col style={{ width: '5%' }} /> {/* Montant */}
              <col style={{ width: '2%' }} /> {/* % Ven */}
              <col style={{ width: '2%' }} /> {/* Marg% */}
              {!hideActions && <col style={{ width: '2.5%' }} /> } {/* Actions */}
            </colgroup>
            <TableHead>
              {/* Main header row with column groups */}
              <TableRow>
                <TableCell colSpan={4} sx={getHeaderStyle('#dbeafe')}>Référence Article</TableCell>
                <TableCell rowSpan={2} sx={getHeaderStyle('#f8fafc')}>Désignation</TableCell>
                <TableCell rowSpan={2} sx={getHeaderStyle('#f8fafc')}>Pds U</TableCell>
                <TableCell rowSpan={2} sx={getHeaderStyle('#f8fafc')}>PU Ach</TableCell>
                <TableCell rowSpan={2} sx={getHeaderStyle('#f8fafc')}>PU Revient</TableCell>
                <TableCell rowSpan={2} sx={getHeaderStyle('#f8fafc')}>PU Gros</TableCell>
                <TableCell colSpan={2} sx={getHeaderStyle('#e9d5ff')}>Report</TableCell>
                <TableCell colSpan={2} sx={getHeaderStyle('#d1fae5')}>Achat</TableCell>
                <TableCell colSpan={2} sx={getHeaderStyle('#fed7aa')}>Production</TableCell>
                <TableCell colSpan={2} sx={getHeaderStyle('#dbeafe')}>Vente</TableCell>
                <TableCell colSpan={2} sx={getHeaderStyle('#f1f5f9')}>Stock</TableCell>
                <TableCell rowSpan={2} sx={getHeaderStyle('#f1f5f9')}>Montant</TableCell>
                <TableCell rowSpan={2} sx={getHeaderStyle('#fef3c7')}>% Ven</TableCell>
                <TableCell rowSpan={2} sx={getHeaderStyle('#fee2e2')}>Marg%</TableCell>
                {!hideActions && <TableCell rowSpan={2} sx={getHeaderStyle('#e0e7ff')}>Actions</TableCell>}
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

                let totalFamille = { qrt: 0, prt: 0, qac: 0, pac: 0, qpr: 0, ppr: 0, qve: 0, pve: 0, qst: 0, pst: 0, mnt: 0 };
                let totalFourn = { qrt: 0, prt: 0, qac: 0, pac: 0, qpr: 0, ppr: 0, qve: 0, pve: 0, qst: 0, pst: 0, mnt: 0 };
                let totalGeneral = { qrt: 0, prt: 0, qac: 0, pac: 0, qpr: 0, ppr: 0, qve: 0, pve: 0, qst: 0, pst: 0, mnt: 0 };

                const formatNum = (val: number) => val === 0 ? '-' : val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 });

                const renderTotalRow = (label: string, data: any, level: 'famille' | 'fournisseur' | 'general', labelCol: number) => {
                  const bg = level === 'famille' ? '#f8fafc' : (level === 'fournisseur' ? '#f1f5f9' : '#1e293b');
                  const fg = level === 'general' ? 'white' : 'inherit';
                  return (
                    <TableRow key={label + Math.random()} sx={{ bgcolor: bg }}>
                      {/* Empty cells before label */}
                      {Array.from({ length: labelCol }).map((_, i) => (
                        <TableCell key={i} sx={{ ...cellStyle, color: fg }} />
                      ))}
                      {/* Label cell */}
                      <TableCell sx={{ ...cellStyle, fontWeight: 900, color: fg, textAlign: 'center' }}>{label}</TableCell>
                      {/* Empty cells after label until data columns */}
                      {Array.from({ length: 8 - labelCol }).map((_, i) => (
                        <TableCell key={i} sx={{ ...cellStyle, color: fg }} />
                      ))}
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
                      {!hideActions ? <TableCell colSpan={3} sx={cellStyle} /> : <TableCell colSpan={2} sx={cellStyle} />}
                    </TableRow>
                  );
                };

                sortedData.forEach((row, index) => {
                  const isNewFournisseur = row.fournisseur !== currentFournisseur;
                  const isNewFamille = row.famille !== currentFamille || isNewFournisseur;

                  if (isNewFamille && currentFamille !== '' && index > 0) {
                    rows.push(renderTotalRow(`TOT ${currentFamille}`, totalFamille, 'famille', 4)); // Label in col 5 (Désignation)
                    totalFamille = { qrt: 0, prt: 0, qac: 0, pac: 0, qpr: 0, ppr: 0, qve: 0, pve: 0, qst: 0, pst: 0, mnt: 0 };
                  }

                  if (isNewFournisseur && currentFournisseur !== '' && index > 0) {
                    const fournisseurAffiche = getFournisseurAffiche(currentFournisseur);
                    rows.push(renderTotalRow(`TOT FOURN ${fournisseurAffiche}`, totalFourn, 'fournisseur', 3)); // Label in col 4 (Réf)
                    totalFourn = { qrt: 0, prt: 0, qac: 0, pac: 0, qpr: 0, ppr: 0, qve: 0, pve: 0, qst: 0, pst: 0, mnt: 0 };
                  }

                  if (isNewFournisseur) {
                    currentFournisseur = row.fournisseur;
                    // Fournisseur grouping row removed - no grey separator line
                  }

                  if (isNewFamille) {
                    currentFamille = row.famille;
                    // Famille grouping row - name in col 5 (Désignation)
                    rows.push(
                      <TableRow key={currentFournisseur + currentFamille} sx={{ bgcolor: '#e2e8f0' }}>
                        <TableCell colSpan={4} sx={cellStyle} />
                        <TableCell sx={{ ...cellStyle, fontWeight: 800, fontSize: '0.65rem' }}>
                          {currentFamille}
                        </TableCell>
                        <TableCell colSpan={17} sx={cellStyle} />
                      </TableRow>
                    );
                  }

                  [totalFamille, totalFourn, totalGeneral].forEach(t => {
                    t.qrt += row.report_qte; t.prt += row.report_poids;
                    t.qac += row.achat_qte; t.pac += row.achat_poids;
                    t.qpr += row.production_qte; t.ppr += row.production_poids;
                    t.qve += row.vente_qte; t.pve += row.vente_poids;
                    t.qst += row.stock_qte; t.pst += row.stock_poids;
                    t.mnt += row.montant_disponible;
                  });

                  // Article data row with 23 columns (ajouté Actions)
                  rows.push(
                    <TableRow key={row.reference + index} hover sx={{ '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.05)' } }}>
                      {/* Référence Article - 4 sub-columns */}
                      <TableCell align="center" sx={{ ...cellStyle, color: '#7c3aed', fontWeight: 700 }}>{getPctCategory(row.pct_vente)}</TableCell>
                      <TableCell sx={{ ...cellStyle, color: '#475569' }}>{row.infotlib6 || ''}</TableCell>
                      <TableCell align="center" sx={{ ...cellStyle, color: '#dc2626', fontWeight: 900 }}>{getStockIndicator(row.report_poids)}</TableCell>
                      <TableCell sx={{ ...cellStyle, color: '#1e293b', fontWeight: 700 }}>{row.reference}</TableCell>
                      {/* Other columns */}
                      <TableCell sx={{ ...cellStyle, color: '#475569' }}>{row.designation}</TableCell>
                      <TableCell align="right" sx={cellStyle}>{formatNum(row.poids_uv)}</TableCell>
                      <TableCell align="right" sx={cellStyle}>{formatNum(row.pu_achat)}</TableCell>
                      <TableCell align="right" sx={cellStyle}>{formatNum(row.pu_revient)}</TableCell>
                      <TableCell align="right" sx={cellStyle}>{formatNum(row.pu_gros)}</TableCell>
                      <TableCell align="right" sx={{ ...cellStyle, color: '#7c3aed' }}>{formatNum(row.report_qte)}</TableCell>
                      <TableCell align="right" sx={{ ...cellStyle, color: '#7c3aed', fontWeight: 700 }}>{formatNum(row.report_poids)}</TableCell>
                      <TableCell align="right" sx={{ ...cellStyle, color: '#059669' }}>{formatNum(row.achat_qte)}</TableCell>
                      <TableCell align="right" sx={{ ...cellStyle, color: '#059669', fontWeight: 700 }}>{formatNum(row.achat_poids)}</TableCell>
                      <TableCell align="right" sx={{ ...cellStyle, color: '#d97706' }}>{formatNum(row.production_qte)}</TableCell>
                      <TableCell align="right" sx={{ ...cellStyle, color: '#d97706', fontWeight: 700 }}>{formatNum(row.production_poids)}</TableCell>
                      <TableCell align="right" sx={{ ...cellStyle, color: '#2563eb' }}>{formatNum(row.vente_qte)}</TableCell>
                      <TableCell align="right" sx={{ ...cellStyle, color: '#2563eb', fontWeight: 700 }}>{formatNum(row.vente_poids)}</TableCell>
                      <TableCell align="right" sx={{ ...cellStyle, color: '#4b5563' }}>{formatNum(row.stock_qte)}</TableCell>
                      <TableCell align="right" sx={{ ...cellStyle, color: '#4b5563', fontWeight: 700 }}>{formatNum(row.stock_poids)}</TableCell>
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
                    rows.push(renderTotalRow(`TOT ${currentFamille}`, totalFamille, 'famille', 4));
                    const fournisseurAffiche = getFournisseurAffiche(currentFournisseur);
                    rows.push(renderTotalRow(`TOT FOURN ${fournisseurAffiche}`, totalFourn, 'fournisseur', 3));
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
                        <TableCell colSpan={3} sx={{ ...cellStyle, fontWeight: 900 }} />
                        <TableCell sx={{ ...cellStyle, fontWeight: 900, textAlign: 'center' }}>TOTAL VAL ACH DEVISE</TableCell>
                        <TableCell colSpan={5} sx={cellStyle} />
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#4ade80', colSpan: 2 }} colSpan={2}>{formatNum(totalValAchReport)}</TableCell>
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#4ade80', colSpan: 2 }} colSpan={2}>{formatNum(totalValAchAchat)}</TableCell>
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#fbbf24', colSpan: 2 }} colSpan={2}>{formatNum(totalValAchProd)}</TableCell>
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#60a5fa', colSpan: 2 }} colSpan={2}>{formatNum(totalValAchVente)}</TableCell>
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#94a3b8', colSpan: 2 }} colSpan={2}>{formatNum(totalValAchStock)}</TableCell>
                        <TableCell colSpan={2} sx={cellStyle} />
                      </TableRow>
                    );

                    const unitValDedouane = totalGeneral.qac > 0 ? totalGeneral.mnt / totalGeneral.qac : 0;
                    const totalValDedouaneReport = unitValDedouane * totalGeneral.qrt;
                    const totalValDedouaneAchat = unitValDedouane * totalGeneral.qac;
                    const totalValDedouaneProd = unitValDedouane * totalGeneral.qpr;
                    const totalValDedouaneVente = unitValDedouane * totalGeneral.qve;
                    const totalValDedouaneStock = unitValDedouane * totalGeneral.qst;

                    rows.push(
                      <TableRow key="val-dedouane-dev" sx={{ bgcolor: '#fef3c7' }}>
                        <TableCell colSpan={3} sx={{ ...cellStyle, fontWeight: 900 }} />
                        <TableCell sx={{ ...cellStyle, fontWeight: 900, textAlign: 'center' }}>VAL DEDOUANE DEV</TableCell>
                        <TableCell colSpan={5} sx={cellStyle} />
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#60a5fa', colSpan: 2 }} colSpan={2}>{formatNum(totalValDedouaneReport)}</TableCell>
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#60a5fa', colSpan: 2 }} colSpan={2}>{formatNum(totalValDedouaneAchat)}</TableCell>
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#fbbf24', colSpan: 2 }} colSpan={2}>{formatNum(totalValDedouaneProd)}</TableCell>
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#60a5fa', colSpan: 2 }} colSpan={2}>{formatNum(totalValDedouaneVente)}</TableCell>
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#94a3b8', colSpan: 2 }} colSpan={2}>{formatNum(totalValDedouaneStock)}</TableCell>
                        <TableCell colSpan={2} sx={cellStyle} />
                      </TableRow>
                    );

                    rows.push(
                      <TableRow key="valeur-dedouanee-ar" sx={{ bgcolor: '#fef3c7' }}>
                        <TableCell colSpan={3} sx={{ ...cellStyle, fontWeight: 900 }} />
                        <TableCell sx={{ ...cellStyle, fontWeight: 900, textAlign: 'center' }}>VALEUR DEDOUANEE AR</TableCell>
                        <TableCell colSpan={5} sx={cellStyle} />
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#f97316', colSpan: 2 }} colSpan={2}>{formatNum(totalValDedouaneReport)}</TableCell>
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#f97316', colSpan: 2 }} colSpan={2}>{formatNum(totalValDedouaneAchat)}</TableCell>
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#fbbf24', colSpan: 2 }} colSpan={2}>{formatNum(totalValDedouaneProd)}</TableCell>
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#f97316', colSpan: 2 }} colSpan={2}>{formatNum(totalValDedouaneVente)}</TableCell>
                        <TableCell align="center" sx={{ ...cellStyle, fontWeight: 900, color: '#94a3b8', colSpan: 2 }} colSpan={2}>{formatNum(totalValDedouaneStock)}</TableCell>
                        <TableCell colSpan={2} sx={cellStyle} />
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