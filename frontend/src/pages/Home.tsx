import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Grid, Typography, Box, Button, Stack,
  Drawer, IconButton, TextField, MenuItem, FormControl, InputLabel,
  Select, OutlinedInput, Chip, Checkbox, ListItemText, Paper,
  Fade, CircularProgress, Link as MuiLink,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import fr from 'date-fns/locale/fr';
import {
  Close as CloseIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { rapportAPI } from '../services/api';
import WaveShape from '../components/WaveShape';
import * as animations from '../styles/animations';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const [selectedFamilles, setSelectedFamilles] = useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [familles, setFamilles] = useState<{ code: string; name: string }[]>([]);
  const [fournisseurs, setFournisseurs] = useState<{ code: string; name: string }[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [dateDebut, setDateDebut] = useState<Date | null>(new Date());
  const [dateFin, setDateFin] = useState<Date | null>(new Date());
  const [dateStock, setDateStock] = useState<Date | null>(new Date());
  const [minStock, setMinStock] = useState<number>(0);

  useEffect(() => {
    const loadFiltersData = async () => {
      setLoadingFilters(true);
      try {
        const [famillesData, fournisseursData] = await Promise.all([
          rapportAPI.getFamilles(),
          rapportAPI.getFournisseurs()
        ]);
        console.log('Familles loaded:', famillesData);
        console.log('Fournisseurs loaded:', fournisseursData);
        setFamilles(famillesData || []);
        setFournisseurs(fournisseursData || []);
      } catch (error) {
        console.error('Erreur lors du chargement des filtres:', error);
        setFamilles([{ code: 'BALLE', name: 'BALLE (DB Error)' }, { code: 'FRIPPE', name: 'FRIPPE (DB Error)' }]);
        setFournisseurs([{ code: 'USA Import', name: 'USA Import (DB Error)' }]);
      } finally {
        setLoadingFilters(false);
      }
    };
    loadFiltersData();
  }, []);

  const handleGenerateReport = () => {
    const params = {
      date_debut: dateDebut?.toISOString().split('T')[0] || '',
      date_fin: dateFin?.toISOString().split('T')[0] || '',
      date_stock: dateStock?.toISOString().split('T')[0] || '',
      familles: selectedFamilles,
      fournisseurs: selectedVendors,
      min_stock: minStock,
      debug_mode: false,
    };
    setFiltersOpen(false);
    navigate('/rapport', { state: { rapportParams: params } });
  };

  return (
    <React.Fragment>
      <style>{`
        html, body {
          overflow: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        #root {
          overflow: hidden !important;
          width: 100vw !important;
          height: 100vh !important;
        }
      `}</style>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
        <Box sx={{
          width: '100vw',
          height: '100vh',
          bgcolor: '#f5f5f7',
          position: 'fixed',
          top: 0,
          left: 0,
          overflow: 'hidden',
          m: 0,
          p: 0
        }}>

          {/* Blue Wave Background */}
          <WaveShape />

          {/* Logo Miezaka */}
          <Box
            component="img"
            src="/logoM.jpeg"
            alt="Miezaka Logo"
            sx={{
              position: 'absolute',
              top: 30,
              left: 50,
              zIndex: 10,
              width: '80px',
              height: '80px',
              objectFit: 'contain',
              borderRadius: '50%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
          />

          <Container
            maxWidth="lg"
            disableGutters
            sx={{
              position: 'relative',
              zIndex: 2,
              height: '100vh',
              display: 'flex',
              flexDirection: 'column',
              px: { xs: 3, sm: 4, md: 5 }
            }}
          >

            {/* Navigation Links */}
            <Stack
              direction="row"
              justifyContent="flex-end"
              spacing={3.5}
              sx={{ pt: 4.5, mb: 6 }}
            >
              {[
                { label: 'RAPPORT DE MOUVEMENTS', path: '/rapport' },
                { label: 'ANALYTICS & PRÉDICTIONS', path: '/analytics' },
                { label: 'À PROPOS', path: 'about' }
              ].map((item) => (
                <MuiLink
                  key={item.label}
                  component="button"
                  underline="none"
                  onClick={() => {
                    if (item.path === 'about') setAboutOpen(true);
                    else if (item.path !== '#') navigate(item.path);
                  }}
                  sx={{
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.6px',
                    textTransform: 'uppercase',
                    transition: 'opacity 0.2s',
                    '&:hover': { opacity: 0.8 },
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    p: 0
                  }}
                >
                  {item.label}
                </MuiLink>
              ))}
            </Stack>

            {/* Main Content */}
            <Grid container spacing={6} alignItems="center" sx={{ flexGrow: 1, pb: 4 }}>

              {/* Left: Hero Text */}
              <Grid item xs={12} md={5}>
                <Fade in timeout={500}>
                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 900,
                        color: '#1a365d',
                        fontSize: { xs: '2.5rem', md: '3.2rem' },
                        lineHeight: 1.12,
                        mb: 1.2,
                        letterSpacing: '-0.03em'
                      }}
                    >
                      SOCIETE MIEZAKA<br />ANALYSE
                    </Typography>
                    <Typography
                      sx={{
                        color: '#a0aec0',
                        fontWeight: 600,
                        mb: 2.8,
                        letterSpacing: '0.8px',
                        fontSize: '1rem'
                      }}
                    >
                      Inventaires & Analyses des Mouvements Articles
                    </Typography>
                    <Typography
                      sx={{
                        color: '#718096',
                        mb: 4.5,
                        maxWidth: '410px',
                        lineHeight: 1.7,
                        fontSize: '0.82rem'
                      }}
                    >
                      Bienvenue sur le portail d'analyse MIEZAKA. Optimisez votre gestion de stock avec nos outils d'inventaire précis, suivez vos mouvements d'articles en temps réel et profitez de prédictions intelligentes pour anticiper vos besoins futurs.
                    </Typography>

                    <Button
                      variant="contained"
                      onClick={() => setFiltersOpen(true)}
                      sx={{
                        bgcolor: '#00c4cc',
                        color: '#fff',
                        borderRadius: '22px',
                        px: 4.2,
                        py: 1.2,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        boxShadow: '0 6px 18px rgba(0, 196, 204, 0.32)',
                        '&:hover': {
                          bgcolor: '#00b0b8',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 8px 22px rgba(0, 196, 204, 0.38)'
                        },
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                        transition: 'all 0.25s ease'
                      }}
                    >
                      DÉMARRER L'ANALYSE
                    </Button>
                  </Box>
                </Fade>
              </Grid>

              {/* Right: Illustration Area */}
              <Grid item xs={12} md={7}>
                <Fade in timeout={800}>
                  <Box sx={{
                    position: 'relative',
                    height: '400px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mt: { md: 4, xs: 2 }, // Reduced margin, text will stay at original position
                    zIndex: 1
                  }}>
                    <Box
                      component="img"
                      src="/data1.avif"
                      alt="Data Analysis Illustration"
                      sx={{
                        width: '100%',
                        maxWidth: '550px',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 10px 40px rgba(0,0,0,0.12))',
                        animation: `${animations.floaty} 6s ease-in-out infinite`
                      }}
                    />
                  </Box>
                </Fade>
              </Grid>
            </Grid>
          </Container>

          {/* About Dialog */}
          <Dialog
            open={aboutOpen}
            onClose={() => setAboutOpen(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: { borderRadius: 3, p: 1 }
            }}
          >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#1a365d' }}>À PROPOS DE L'APPLICATION</Typography>
              <IconButton onClick={() => setAboutOpen(false)} size="small" sx={{ color: '#ef4444' }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ py: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#2d3748' }}>
                  Solution de Gestion et d'Analyse MIEZAKA
                </Typography>
                <Typography variant="body1" paragraph sx={{ color: '#4a5568' }}>
                  Cette application a été conçue spécifiquement pour la société MIEZAKA afin de moderniser le suivi des inventaires et l'analyse des flux de marchandises (ventes, achats, production, rapports).
                </Typography>

                <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 3, mb: 1, color: '#1a365d' }}>
                  🚀 FONCTIONNALITÉS CLÉS
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { t: 'Tableau de Bord en Temps Réel', d: 'Visualisez instantanément l\'état de votre stock et vos performances.' },
                    { t: 'Rapports de Mouvements Dépendants', d: 'Générez des rapports détaillés incluant les poids, quantités et marges.' },
                    { t: 'Analyses Prédictives', d: 'Grâce à l\'IA, anticipez les ruptures de stock et identifiez les produits les plus rentables.' },
                    { t: 'Exportation Facile', d: 'Téléchargez vos données au format Excel pour une utilisation externe.' }
                  ].map((f, i) => (
                    <Grid item xs={12} sm={6} key={i}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: '#f7fafc', borderRadius: 2, border: '1px solid #e2e8f0', height: '100%' }}>
                        <Typography sx={{ fontWeight: 700, color: '#2b6cb0', mb: 0.5 }}>{f.t}</Typography>
                        <Typography variant="body2" sx={{ color: '#718096' }}>{f.d}</Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 4, mb: 1, color: '#1a365d' }}>
                  📖 GUIDE D'UTILISATION
                </Typography>
                <Typography component="div" variant="body2" sx={{ color: '#4a5568', pl: 2 }}>
                  <ol>
                    <li><strong>Configuration :</strong> Sur la page d'accueil, cliquez sur "DÉMARRER L'ANALYSE" pour ouvrir le panneau de configuration.</li>
                    <li><strong>Filtres :</strong> Sélectionnez vos dates (début, fin, état stock), les familles et les fournisseurs, puis spécifiez un seuil de stock.</li>
                    <li><strong>Exploration :</strong> Consultez le rapport complet avec les calculs de poids unitaires et les sous-totaux par fournisseur.</li>
                    <li><strong>Prédictions :</strong> Rendez-vous dans la section Analytics pour voir les graphiques de tendance et les recommandations intelligentes.</li>
                  </ol>
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setAboutOpen(false)} variant="contained" sx={{ bgcolor: '#1a365d', fontWeight: 700, px: 4 }}>
                Compris
              </Button>
            </DialogActions>
          </Dialog>

          {/* Configuration Drawer */}
          <Drawer
            anchor="right"
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            PaperProps={{
              sx: {
                width: { xs: '100%', sm: 420 },
                border: 'none',
                background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                boxShadow: '-10px 0 50px rgba(0,0,0,0.15)'
              }
            }}
          >
            <Box sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Configuration
                </Typography>
                <IconButton onClick={() => setFiltersOpen(false)} size="small" sx={{ color: '#ef4444' }}>
                  <CloseIcon />
                </IconButton>
              </Box>

              <Stack spacing={2} sx={{ flexGrow: 1 }}>
                {/* Périodes Compactes */}
                <Paper elevation={0} sx={{ p: 1.5, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <CalendarIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight="bold">Périodes</Typography>
                  </Stack>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      <DatePicker
                        label="Du"
                        value={dateDebut}
                        onChange={(n) => setDateDebut(n)}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <DatePicker
                        label="Au"
                        value={dateFin}
                        onChange={(n) => setDateFin(n)}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <DatePicker
                        label="État stock au"
                        value={dateStock}
                        onChange={(n) => setDateStock(n)}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Filtres Compacts */}
                <Paper elevation={0} sx={{ p: 1.5, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>Filtres</Typography>
                  <Stack spacing={1.5}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Familles</InputLabel>
                      <Select
                        multiple
                        value={selectedFamilles}
                        onChange={(e) => setSelectedFamilles(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                        input={<OutlinedInput label="Familles" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={familles.find(f => f.code === value)?.name || value} size="small" sx={{ height: 24 }} />
                            ))}
                          </Box>
                        )}
                        MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                      >
                        {familles && familles.length > 0 ? familles.map((f) => (
                          <MenuItem key={f.code} value={f.code} dense>
                            {f.name}
                          </MenuItem>
                        )) : <MenuItem disabled>Aucun résultat</MenuItem>}
                      </Select>
                    </FormControl>

                    <FormControl size="small" fullWidth>
                      <InputLabel>Fournisseurs</InputLabel>
                      <Select
                        multiple
                        value={selectedVendors}
                        onChange={(e) => setSelectedVendors(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                        input={<OutlinedInput label="Fournisseurs" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={fournisseurs.find(f => f.code === value)?.name || value} size="small" sx={{ height: 24 }} />
                            ))}
                          </Box>
                        )}
                        MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                      >
                        {fournisseurs && fournisseurs.length > 0 ? fournisseurs.map((f) => (
                          <MenuItem key={f.code} value={f.code} dense>
                            {f.name}
                          </MenuItem>
                        )) : <MenuItem disabled>Aucun résultat</MenuItem>}
                      </Select>
                    </FormControl>
                  </Stack>
                </Paper>

                <TextField
                  label="Seuil Stock"
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(Number(e.target.value))}
                  size="small"
                  fullWidth
                />
              </Stack>

              <Button
                variant="contained"
                onClick={handleGenerateReport}
                sx={{
                  mt: 'auto',
                  borderRadius: 2,
                  py: 1.2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontWeight: 700
                }}
              >
                Générer le Rapport
              </Button>
            </Box>
          </Drawer>

        </Box>
      </LocalizationProvider>
    </React.Fragment>
  );
};

export default Home;
