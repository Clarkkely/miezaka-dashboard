import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from '@mui/material';
import {
  Close as CloseIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { Article } from '../../services/api';
import DataTable from '../Table/DataTable';

interface PrintPreviewProps {
  open: boolean;
  onClose: () => void;
  data: Article[];
  periodes?: {
    debut: string;
    fin: string;
    stock_date: string;
  };
  onExportExcel?: () => void;
  onExportPDF?: () => void;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({
  open,
  onClose,
  data,
  periodes,
}) => {
  const printRef = React.useRef<HTMLDivElement>(null);
  const tableOnlyRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (tableOnlyRef.current) {
      const printWindow = window.open('', '', 'height=1400,width=1600');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Aperçu Impression</title>');
        printWindow.document.write('<style>');
        printWindow.document.write('body { margin: 10px; font-family: Arial, sans-serif; }');
        printWindow.document.write('table { border-collapse: collapse; width: 100%; }');
        printWindow.document.write('th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }');
        printWindow.document.write('th { background-color: #f8fafc; font-weight: bold; }');
        printWindow.document.write('@media print { body { margin: 0; } }');
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(tableOnlyRef.current.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Aperçu Impression
        <Button onClick={onClose} size="small">
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2, maxHeight: '80vh', overflow: 'auto' }}>
        <Box ref={printRef}>
          <Box ref={tableOnlyRef}>
            <DataTable data={data} periodes={periodes} hideSearch={true} hideActions={true} />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Fermer
        </Button>
        <Button 
          onClick={handlePrint}
          variant="contained"
          startIcon={<PrintIcon />}
        >
          Imprimer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrintPreview;