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
import { Article } from '../../services/api';
import axios from 'axios';

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
  };
  sante_article: number;
  recommendations: Recommendation[];
  resume_action: string;
}

const API_BASE_URL = 'http://localhost:8000/api';

const ArticleRecommendationModal: React.FC<RecommendationModalProps> = ({
  open,
  article,
  onClose,
}) => {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (open && article) {
      fetchAnalysis();
    }
  }, [open, article]);

  const fetchAnalysis = async () => {
    if (!article) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/recommendations/detailed-analysis`,
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
        }
      );
      setAnalysis(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'analyse');
    } finally {
      setLoading(false);
    }
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

                    <Box sx={{ bgcolor: '#e3f2fd', p: 1, borderRadius: 1, borderLeft: '3px solid #2196f3' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        💡 Impact: {rec.impact}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

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
