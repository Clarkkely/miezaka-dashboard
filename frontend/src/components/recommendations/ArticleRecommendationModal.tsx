import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material';
import { Article, api } from '../../services/api';
import { updateArticle } from '../../store/redux_slices/rapportSlice';
import { useAppDispatch } from '../../store/hooks';

interface SimulationState {
  pu_achat: number;
  pu_vente: number;
  marge_pct: number;
  isApplied: boolean;
}

interface RecommendationModalProps {
  open: boolean;
  article: Article | null;
  onClose: () => void;
}

interface Recommendation {
  type: string;
  titre: string;
  description: string;
  solutions: string[];
  impact: string;
}

interface AnalysisResponse {
  article: {
    reference: string;
    designation: string;
    famille: string;
    fournisseur: string;
  };
  metriques_actuelles: {
    pu_achat: number;
    pct_vente: number;
    marge_pct: number;
    vente_qte: number;
    stock_qte: number;
    achat_qte: number;
    production_qte: number;
  };
  sante_article: number;
  recommendations: Recommendation[];
  resume_action: string;
}



const ArticleRecommendationModal: React.FC<RecommendationModalProps> = ({
  open,
  article,
  onClose,
}) => {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [originalMetrics, setOriginalMetrics] = useState<Partial<Article> | null>(null);

  const dispatch = useAppDispatch();

  // Rounding logic
  const roundToMultiple = (value: number, multiple: number) => {
    return Math.round(value / multiple) * multiple;
  };

  const getRoundedPurchase = (val: number) => {
    // Si c'est en Ariary (> 100), arrondir au multiple de 5
    if (val > 100) return roundToMultiple(val, 5);
    // Si c'est en devise (< 100), arrondir à 2 décimales pour ne pas tomber à 0
    return Math.round(val * 100) / 100;
  };

  const getRoundedSale = (val: number, famille: string) => {
    const isKG = famille.toUpperCase() !== 'BALLE';
    return isKG ? roundToMultiple(val, 500) : roundToMultiple(val, 10000);
  };

  const calculateMarge = (achat: number, vente: number) => {
    if (vente === 0) return 0;
    return ((vente - achat) / vente) * 100;
  };

  React.useEffect(() => {
    if (open && article) {
      // Stocker les valeurs originales à l'ouverture pour permettre l'annulation
      setOriginalMetrics({
        pu_achat: article.pu_achat,
        pu_gros: article.pu_gros,
        marge_pct: article.marge_pct
      });
      fetchAnalysis();
    } else if (!open) {
      setSimulation(null);
    }
  }, [open, article]);

  const fetchAnalysis = async () => {
    if (!article) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.post(
        '/recommendations/detailed-analysis',
        {
          reference: article.reference,
          designation: article.designation,
          famille: article.famille,
          fournisseur: article.fournisseur,
          pu_achat: article.pu_achat,
          pct_vente: article.pct_vente,
          marge_pct: article.marge_pct,
          vente_qte: article.vente_qte,
          stock_qte: article.stock_qte,
          achat_qte: article.achat_qte,
          production_qte: article.production_qte,
        }
      );
      setAnalysis(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'analyse');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRec = (rec: Recommendation) => {
    if (!article || !analysis) return;

    let newAchat = article.pu_achat;
    let newVente = article.pu_gros; 
    let newRevient = article.pu_revient;

    // Logic based on recommendation content
    if (rec.type === 'EQUILIBRE' || rec.type === 'RENTABILITE' || rec.type === 'NEGOCIATION') {
      if (rec.description.toLowerCase().includes('marge') || rec.type === 'RENTABILITE') {
        newVente = article.pu_gros * 1.08; // Simulate 8% increase
      }
      if (rec.type === 'NEGOCIATION') {
        newAchat = article.pu_achat * 0.95; // Simulate 5% reduction in Devise
        newRevient = article.pu_revient * 0.95; // Also reduces Revient by 5%
      }
    } else if (rec.type === 'EXPANSION' || rec.type === 'STOCK') {
      newVente = article.pu_gros * 0.90; // Simulate 10% reduction
    }

    // Apply strict rounding rules
    newAchat = getRoundedPurchase(newAchat);
    newVente = getRoundedSale(newVente, article.famille);
    newRevient = getRoundedPurchase(newRevient); // Round Revient similarly if needed

    // Logic métier: Triage costing 0
    const costForMarge = article.famille.toUpperCase().includes('TRIAGE') ? 0 : newRevient;

    setSimulation({
      pu_achat: newAchat,
      pu_vente: newVente,
      marge_pct: calculateMarge(costForMarge, newVente),
      isApplied: false
    });
  };

  const confirmSimulation = () => {
    if (!article || !simulation) return;

    // We need to estimate the new pu_revient based on simulation logic if we apply it.
    // For simplicity, if pu_achat was modified, we keep the ratio.
    const purchaseRatio = simulation.pu_achat / article.pu_achat;
    const newRevient = article.pu_revient * purchaseRatio;

    dispatch(updateArticle({
      reference: article.reference,
      updates: {
        pu_achat: simulation.pu_achat,
        pu_gros: simulation.pu_vente,
        pu_revient: newRevient,
        marge_pct: simulation.marge_pct
      }
    }));

    setSimulation({ ...simulation, isApplied: true });
  };

  const handleReset = () => {
    if (!article || !originalMetrics) return;

    dispatch(updateArticle({
      reference: article.reference,
      updates: originalMetrics
    }));

    setSimulation(null);
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#4caf50'; // Vert
    if (score >= 60) return '#8bc34a'; // Vert clair
    if (score >= 40) return '#ff9800'; // Orange
    return '#f44336'; // Rouge
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      EQUILIBRE: '#ff9800',
      EXPANSION: '#4caf50',
      STOCK: '#ff9800',
      APPROVISIONNEMENT: '#ff9800',
      RENTABILITE: '#f44336',
      NEGOCIATION: '#2196f3',
    };
    return colors[type] || '#757575';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>
        Analyse détaillée - {article?.reference} {article?.designation}
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {loading && (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <LinearProgress />
            <Typography sx={{ mt: 2 }}>Analyse en cours...</Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ p: 2, bgcolor: '#ffebee', borderRadius: 1, color: '#c62828' }}>
            {error}
          </Box>
        )}

        {analysis && !loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Santé Article */}
            <Card sx={{ bgcolor: '#fafafa' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Santé de l'article
                  </Typography>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: getHealthColor(analysis.sante_article) }}>
                      {analysis.sante_article}/100
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(analysis.sante_article, 100)}
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getHealthColor(analysis.sante_article),
                    },
                  }}
                />
                <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
                  {analysis.resume_action}
                </Typography>
              </CardContent>
            </Card>

            {/* Métriques actuelles */}
            <Card sx={{ bgcolor: '#f5f5f5' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Métriques actuelles
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>PU Achat</TableCell>
                      <TableCell>{analysis.metriques_actuelles.pu_achat.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Marge %</TableCell>
                      <TableCell sx={{ color: analysis.metriques_actuelles.marge_pct > 10 ? '#4caf50' : '#f44336' }}>
                        {analysis.metriques_actuelles.marge_pct.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>% Vente</TableCell>
                      <TableCell>{analysis.metriques_actuelles.pct_vente.toFixed(0)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Qté Vendue</TableCell>
                      <TableCell>{analysis.metriques_actuelles.vente_qte.toFixed(0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Stock</TableCell>
                      <TableCell>{analysis.metriques_actuelles.stock_qte.toFixed(0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Achat</TableCell>
                      <TableCell>{analysis.metriques_actuelles.achat_qte.toFixed(0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Production</TableCell>
                      <TableCell>{(analysis.metriques_actuelles.production_qte || 0).toFixed(0)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Recommandations */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Recommandations ({analysis.recommendations.length})
              </Typography>
              {analysis.recommendations.map((rec, idx) => (
                <Card key={idx} sx={{ mb: 2, borderLeft: `4px solid ${getTypeColor(rec.type)}` }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Chip
                          label={rec.type}
                          size="small"
                          sx={{
                            bgcolor: getTypeColor(rec.type),
                            color: 'white',
                            fontWeight: 'bold',
                            mb: 1,
                          }}
                        />
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                          {rec.titre}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="body2" sx={{ mb: 1.5, color: '#666' }}>
                      {rec.description}
                    </Typography>

                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      Solutions proposées:
                    </Typography>
                    <List dense sx={{ bgcolor: '#fafafa', borderRadius: 1, p: 1, mb: 1.5 }}>
                      {rec.solutions.map((solution, i) => (
                        <ListItem key={i} sx={{ py: 0.5, px: 1 }}>
                          <ListItemText
                            primary={solution}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>

                    <Box sx={{ bgcolor: '#e3f2fd', p: 1, borderRadius: 1, borderLeft: '3px solid #2196f3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        💡 Impact: {rec.impact}
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => handleApplyRec(rec)}
                        sx={{ ml: 2, textTransform: 'none', fontWeight: 'bold', borderRadius: 2 }}
                      >
                        Appliquer
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {/* Simulation Impact Panel */}
            {simulation && (
              <Card sx={{ mt: 1, border: '2px solid #2196f3', bgcolor: '#f0f7ff' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                    📈 Impact de la recommandation {simulation.isApplied ? '(Appliqué)' : '(Simulation)'}
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 2 }}>
                    <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
                      <Typography variant="caption" color="textSecondary">PU Achat</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        {article?.pu_achat !== simulation.pu_achat ? (
                          <>
                            <Typography variant="body2" sx={{ textDecoration: 'line-through', color: '#9e9e9e' }}>
                              {article?.pu_achat.toLocaleString()}
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#2e7d32', textDecoration: simulation?.isApplied ? 'none' : 'underline' }}>
                              {simulation.pu_achat.toLocaleString()}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333' }}>
                            {simulation.pu_achat.toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
                      <Typography variant="caption" color="textSecondary">PU Gros</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        {article?.pu_gros !== simulation.pu_vente ? (
                          <>
                            <Typography variant="body2" sx={{ textDecoration: 'line-through', color: '#9e9e9e' }}>
                              {article?.pu_gros.toLocaleString()}
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#2e7d32', textDecoration: simulation?.isApplied ? 'none' : 'underline' }}>
                              {simulation.pu_vente.toLocaleString()}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333' }}>
                            {simulation.pu_vente.toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
                      <Typography variant="caption" color="textSecondary">Marge</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        {Math.abs((article?.marge_pct || 0) - simulation.marge_pct) > 0.01 ? (
                          <>
                            <Typography variant="body2" sx={{ textDecoration: 'line-through', color: '#9e9e9e' }}>
                              {article?.marge_pct.toFixed(1)}%
                            </Typography>
                            <Typography variant="body1" sx={{ 
                              fontWeight: 'bold', 
                              color: simulation.marge_pct > (article?.marge_pct || 0) ? '#2e7d32' : '#f44336',
                              textDecoration: simulation?.isApplied ? 'none' : 'underline'
                            }}>
                              {simulation.marge_pct.toFixed(1)}%
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333' }}>
                            {simulation.marge_pct.toFixed(1)}%
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  {!simulation.isApplied ? (
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      onClick={confirmSimulation}
                      sx={{ fontWeight: 'bold' }}
                    >
                      Valider et mettre à jour le tableau
                    </Button>
                  ) : (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 'bold', mb: 1 }}>
                        ✓ Changements appliqués au tableau local
                      </Typography>
                      <Button
                        size="small"
                        color="inherit"
                        onClick={handleReset}
                        sx={{ textTransform: 'none', textDecoration: 'underline' }}
                      >
                        Annuler et rétablir les valeurs originales
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}

            {analysis.recommendations.length === 0 && (
              <Card sx={{ bgcolor: '#e8f5e9' }}>
                <CardContent>
                  <Typography sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                    ✓ Article stable - pas d'action urgente requise
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ArticleRecommendationModal;
