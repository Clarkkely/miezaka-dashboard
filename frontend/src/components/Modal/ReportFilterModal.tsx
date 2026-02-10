import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  TextField,
  Divider,
  Typography,
  CircularProgress,
  FormHelperText,
} from '@mui/material';
import animations from '../../styles/animations';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { rapportAPI, RapportRequest, FamilleOption, FournisseurOption } from '../../services/api';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useFormValidation } from '../../hooks/useFormValidation';
import { showToast } from '../Toast/ModernToast';

interface ReportFilterModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate?: (params: any) => void;
}

const ReportFilterModal: React.FC<ReportFilterModalProps> = ({ open, onClose, onGenerate }) => {
  const [dateDebut, setDateDebut] = useState<Date | null>(new Date());
  const [dateFin, setDateFin] = useState<Date | null>(new Date());
  const [dateStock, setDateStock] = useState<Date | null>(new Date());
  const [selectedFamilles, setSelectedFamilles] = useState<string[]>(['BALLE', 'FRIPPE']);
  const [selectedFournisseurs, setSelectedFournisseurs] = useState<string[]>([]);
  const [fournisseursList, setFournisseursList] = useState<FournisseurOption[]>([]);
  const [famillesList, setFamillesList] = useState<FamilleOption[]>([]);
  const [minStock, setMinStock] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Hook de validation du formulaire
  const {
    errors,
    touched,
    validateField,
    validateAll,
    setValue,
    isValid,
  } = useFormValidation({
    dateDebut: { value: new Date(), required: true, type: 'date' },
    dateFin: { value: new Date(), required: true, type: 'date' },
    dateStock: { value: new Date(), required: true, type: 'date' },
    familles: { value: ['BALLE', 'FRIPPE'], required: true, type: 'array', minLength: 1 },
    minStock: { value: 0, required: false, type: 'number', min: 0 },
  });

  // Gestionnaires avec validation
  const handleDateDebutChange = (newValue: Date | null) => {
    setDateDebut(newValue);
    setValue('dateDebut', newValue);
    validateField('dateDebut');
  };

  const handleDateFinChange = (newValue: Date | null) => {
    setDateFin(newValue);
    setValue('dateFin', newValue);
    validateField('dateFin');
  };

  const handleDateStockChange = (newValue: Date | null) => {
    setDateStock(newValue);
    setValue('dateStock', newValue);
    validateField('dateStock');
  };

  const handleFamillesChange = (newValue: string[]) => {
    setSelectedFamilles(newValue);
    setValue('familles', newValue);
    validateField('familles');
  };

  const handleMinStockChange = (newValue: number) => {
    setMinStock(newValue);
    setValue('minStock', newValue);
    validateField('minStock');
  };

  const loadFiltersData = async () => {
    setLoading(true);
    try {
      const [fournisseursData, famillesData] = await Promise.all([
        rapportAPI.getFournisseurs(),
        rapportAPI.getFamilles()
      ]);

      setFournisseursList(fournisseursData);
      setFamillesList(famillesData);

    } catch (error) {
      console.error('Erreur lors du chargement des filtres:', error);
      showToast.error('Impossible de charger les filtres. Utilisation des valeurs par défaut.');

      setFournisseursList([{ code: 'USA Import', name: 'USA Import' }]);
      setFamillesList([
        { code: 'BALLE', name: 'BALLE' },
        { code: 'FRIPPE', name: 'FRIPPE' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    // Validation complète du formulaire
    const isFormValid = validateAll();
    if (!isFormValid) {
      showToast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    // Validation supplémentaire des dates
    if (dateDebut && dateFin && dateDebut > dateFin) {
      showToast.error('La date de début ne peut pas être après la date de fin');
      return;
    }

    const params: RapportRequest = {
      date_debut: dateDebut!.toISOString().split('T')[0],
      date_fin: dateFin!.toISOString().split('T')[0],
      date_stock: dateStock!.toISOString().split('T')[0],
      familles: selectedFamilles,
      min_stock: minStock,
      fournisseurs: selectedFournisseurs,
      debug_mode: false,
    };

    setLoading(true);
    try {
      if (onGenerate) {
        onGenerate(params);
      }

      navigate('/rapport', { state: { rapportParams: params } });

      try {
        const qs = new URLSearchParams();
        qs.set('date_debut', params.date_debut);
        qs.set('date_fin', params.date_fin);
        qs.set('date_stock', params.date_stock);
        qs.set('min_stock', String(params.min_stock ?? 0));
        if (params.familles && params.familles.length) qs.set('familles', params.familles.join(','));
        if (params.fournisseurs && params.fournisseurs.length) qs.set('fournisseurs', params.fournisseurs.join(','));
        const analyticsUrl = `${window.location.origin}/analytics?${qs.toString()}`;
        window.open(analyticsUrl, '_blank');
      } catch (e) {
        console.warn('Impossible d ouvrir Analytics dans un nouvel onglet', e);
      }

      onClose();
      showToast.success('Rapport généré avec succès ! Analytics ouvert dans un nouvel onglet');
    } catch (error: any) {
      showToast.error(error.message || 'Erreur lors de la génération du rapport');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const defaultDate = new Date();
    setDateDebut(defaultDate);
    setDateFin(defaultDate);
    setDateStock(defaultDate);
    setSelectedFamilles(['BALLE', 'FRIPPE']);
    setSelectedFournisseurs([]);
    setMinStock(0);

    // Réinitialiser la validation
    setValue('dateDebut', defaultDate);
    setValue('dateFin', defaultDate);
    setValue('dateStock', defaultDate);
    setValue('familles', ['BALLE', 'FRIPPE']);
    setValue('minStock', 0);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          animation: `${animations.slideDown} 320ms ease both`,
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: '1.15rem',
          background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          animation: `${animations.fadeInUp} 360ms ease both`,
        }}
      >
        📊 Générer un Rapport
        <CloseIcon
          onClick={onClose}
          sx={{
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': { transform: 'rotate(90deg)' },
          }}
        />
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ animation: `${animations.fadeInUp} 420ms ease both` }}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            {/* Dates */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: '#2563eb',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontSize: '0.85rem',
                }}
              >
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }} />
                📅 Période
              </Typography>
              <DatePicker
                label="Date début"
                value={dateDebut}
                onChange={handleDateDebutChange}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    sx: { mb: 2 },
                    error: touched.dateDebut && !!errors.dateDebut,
                    helperText: touched.dateDebut && errors.dateDebut,
                  },
                }}
              />
              <DatePicker
                label="Date fin"
                value={dateFin}
                onChange={handleDateFinChange}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    sx: { mb: 2 },
                    error: touched.dateFin && !!errors.dateFin,
                    helperText: touched.dateFin && errors.dateFin,
                  },
                }}
              />
              <DatePicker
                label="Date stock"
                value={dateStock}
                onChange={handleDateStockChange}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    error: touched.dateStock && !!errors.dateStock,
                    helperText: touched.dateStock && errors.dateStock,
                  },
                }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Filtres de sélection */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: '#2563eb',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontSize: '0.85rem',
                }}
              >
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }} />
                🏭 Filtres
              </Typography>

              <FormControl
                fullWidth
                size="small"
                sx={{ mb: 2 }}
                error={touched.familles && !!errors.familles}
              >
                <InputLabel>Familles</InputLabel>
                <Select
                  multiple
                  value={selectedFamilles}
                  onChange={(e) => handleFamillesChange(e.target.value as string[])}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {/* MODIFIÉ ICI : utiliser famillesList au lieu des valeurs codées en dur */}
                  {famillesList.map((famille) => (
                    <MenuItem key={famille.code} value={famille.code}>
                      {famille.name}
                    </MenuItem>
                  ))}
                </Select>
                {touched.familles && errors.familles && (
                  <FormHelperText>{errors.familles}</FormHelperText>
                )}
              </FormControl>

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Fournisseurs (optionnel)</InputLabel>
                <Select
                  multiple
                  value={selectedFournisseurs}
                  onChange={(e) => setSelectedFournisseurs(e.target.value as string[])}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((code) => {
                        const f = fournisseursList.find((item) => item.code === code);
                        const label = (f?.name || code);
                        const shortLabel = label.length > 22 ? `${label.slice(0, 20)}…` : label;
                        return (
                          <Chip
                            key={code}
                            label={shortLabel}
                            size="small"
                            sx={{ maxWidth: 140 }}
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {fournisseursList.map((fournisseur) => {
                    const label = fournisseur.name || fournisseur.code;
                    const shortLabel = label.length > 40 ? `${label.slice(0, 38)}…` : label;
                    return (
                      <MenuItem key={fournisseur.code} value={fournisseur.code}>
                        <Box sx={{
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {shortLabel}
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              <TextField
                label="Stock minimum (optionnel)"
                type="number"
                value={minStock}
                onChange={(e) => handleMinStockChange(parseInt(e.target.value, 10) || 0)}
                size="small"
                fullWidth
                inputProps={{ min: 0 }}
                error={touched.minStock && !!errors.minStock}
                helperText={touched.minStock && errors.minStock}
              />
            </Box>
          </LocalizationProvider>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          gap: 1,
          background: '#f3f4f6',
          borderTop: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <Button
          onClick={handleReset}
          disabled={loading}
          sx={{
            color: '#999',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.05)',
            },
          }}
        >
          Réinitialiser
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            color: '#666',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.05)',
            },
          }}
        >
          Annuler
        </Button>
        <Button
          onClick={handleGenerate}
          variant="contained"
          disabled={loading || !isValid}
          sx={{
            background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
            color: 'white',
            fontWeight: 700,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)',
            },
            '&:disabled': {
              opacity: 0.7,
            },
          }}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
        >
          {loading ? 'Génération...' : 'Générer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportFilterModal;