import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
} from '@mui/material';
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
  minStock?: number;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({
  open,
  onClose,
  data,
  periodes,
  minStock = 0,
}) => {
  const tableOnlyRef = React.useRef<HTMLDivElement>(null);

  // Trigger print immediately when open becomes true
  useEffect(() => {
    if (open) {
      handlePrint();
    }
  }, [open]);

  // Calculate the specific stock weight metric
  // "Poids seuil stock > [saisie] Kg" only (no total)
  const calculateStockWeightMetric = () => {
    const limit = minStock || 0;
    const totalWeight = data.reduce((acc, article) => {
      if (article.stock_qte > limit) {
        return acc + article.stock_poids;
      }
      return acc;
    }, 0);
    return totalWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePrint = () => {
    // Small delay to ensure ref is mounted if valid
    setTimeout(() => {
      if (tableOnlyRef.current) {
        const printWindow = window.open('', '', 'height=800,width=1200');
        if (printWindow) {
          const stockWeight = calculateStockWeightMetric();

          // Date formatting: "Mercredi 12 février 2026"
          const dateOptions: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          };
          const printDate = new Date().toLocaleDateString('fr-FR', dateOptions);
          // Capitalize first letter of the day
          const printDateFormatted = printDate.charAt(0).toUpperCase() + printDate.slice(1);

          const companyName = "SOCIETE MIEZAKA";
          const companyAddress = "LOT 111 MA/3608 SAHALAVA FIANARANTSOA 301";
          const contactInfo = "email: sciege@miezaka.com /Tel : 034 07 255 07 - 034 07 252 55";

          // Periods formatting
          const dateDebut = periodes?.debut ? new Date(periodes.debut).toLocaleDateString('fr-FR') : '-';
          const dateFin = periodes?.fin ? new Date(periodes.fin).toLocaleDateString('fr-FR') : '-';
          const dateStock = periodes?.stock_date ? new Date(periodes.stock_date).toLocaleDateString('fr-FR') : '-';

          // Copy styles from parent window to ensure MUI colors and layout are preserved
          const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
          styles.forEach(node => {
            printWindow.document.head.appendChild(node.cloneNode(true));
          });

          printWindow.document.write('<html><head><title>MOUVEMENT ARTICLE</title>');
          printWindow.document.write('<style>');
          printWindow.document.write(`
            @page { 
              size: landscape; 
              margin: 10mm 10mm 25mm 10mm; /* Marges: haut, droite, bas (pour le footer), gauche */
            }
            @media print { 
              * {
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important; 
                color-adjust: exact !important;
              }
              body { 
                margin: 0; 
              }
              .no-print { display: none; }
              
              /* Force les couleurs du tableau à s'imprimer */
              table th {
                background-color: #1976d2 !important;
                color: white !important;
              }
              table tr:nth-child(even) {
                background-color: #f5f5f5 !important;
              }
              table tr:hover {
                background-color: #e3f2fd !important;
              }
            }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              font-size: 10px;
              margin: 10px;
            }
            
            /* Header Layout */
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 10px;
              border-bottom: 2px solid #333;
              padding-bottom: 5px;
              width: 100%;
            }
            .header-left { 
              width: 30%;
              font-size: 14px;
              font-weight: bold;
            }
            .header-left .address {
              font-size: 10px;
              font-weight: normal;
              margin-top: 2px;
            }
            .header-center { 
              text-align: center; 
              flex-grow: 1;
            }
            .header-right { 
              text-align: right; 
              font-size: 11px;
              width: 30%;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            .header-right .contact {
              font-size: 9px;
              margin-top: 2px;
              font-style: italic;
            }
            .title-main {
              font-size: 18px;
              font-weight: 900;
              margin-bottom: 2px;
              text-transform: uppercase;
            }
            .dates-info {
              font-size: 11px;
              color: #444;
            }

            /* Table Styling avec couleurs exactes de DataTable */
            table { 
              width: 100%; 
              border-collapse: collapse; 
              font-size: 11px; /* Augmenté de 9px à 11px */
              margin-bottom: 25mm; /* Espace pour le footer */
            }
            
            /* En-têtes avec couleurs spécifiques */
            th { 
              border: 1px solid #cbd5e1; 
              padding: 8px 5px; /* Augmenté de 4px à 8px */
              text-align: center;
              font-weight: 900;
              font-size: 11px; /* Augmenté de 9px à 11px */
              line-height: 1.4; /* Augmenté de 1.2 à 1.4 */
              white-space: nowrap;
            }
            
            /* Couleurs spécifiques des en-têtes de groupes */
            .header-reference { background-color: #dbeafe !important; color: black !important; }
            .header-designation { background-color: #f8fafc !important; color: black !important; }
            .header-default { background-color: #f8fafc !important; color: black !important; }
            .header-report { background-color: #e9d5ff !important; color: black !important; }
            .header-achat { background-color: #d1fae5 !important; color: black !important; }
            .header-production { background-color: #fed7aa !important; color: black !important; }
            .header-vente { background-color: #dbeafe !important; color: black !important; }
            .header-stock { background-color: #f1f5f9 !important; color: black !important; }
            .header-pctven { background-color: #fef3c7 !important; color: black !important; }
            .header-marge { background-color: #fee2e2 !important; color: black !important; }
            
            /* Cellules de données */
            td { 
              border: 1px solid #e2e8f0; 
              padding: 6px 4px; /* Augmenté de 3px à 6px */
              text-align: center;
              font-size: 11px; /* Augmenté de 9px à 11px */
              font-weight: 500;
              line-height: 1.5; /* Augmenté de 1.2 à 1.5 */
              white-space: nowrap;
              height: 30px; /* Hauteur fixe pour chaque ligne */
            }
            
            /* Lignes de données - alternance subtile */
            tbody tr:nth-child(odd) {
              background-color: white !important;
            }
            
            tbody tr:nth-child(even) {
              background-color: #fafafa !important;
            }
            
            /* Lignes de totaux */
            .total-famille {
              background-color: #f8fafc !important;
              font-weight: 900 !important;
              height: 35px !important; /* Hauteur augmentée pour les totaux */
            }
            
            .total-fournisseur {
              background-color: #f1f5f9 !important;
              font-weight: 900 !important;
              height: 35px !important;
            }
            
            .total-general {
              background-color: #1e293b !important;
              color: white !important;
              font-weight: 900 !important;
              height: 35px !important;
            }
            
            .total-valeur {
              background-color: #fef3c7 !important;
              font-weight: 900 !important;
              height: 35px !important;
            }
            
            /* Couleurs de texte dans les cellules */
            .col-pct { color: #7c3aed !important; font-weight: 700; }
            .col-info { color: #475569 !important; }
            .col-star { color: #dc2626 !important; font-weight: 900; }
            .col-ref { color: #1e293b !important; font-weight: 800; }
            .col-design { color: #334155 !important; font-weight: 800; }
            .col-poids { color: #64748b !important; }
            .col-prix { color: #64748b !important; }
            .col-report { color: #60a5fa !important; }
            .col-achat { color: #4ade80 !important; }
            .col-prod { color: #fbbf24 !important; }
            .col-vente { color: #ef4444 !important; }
            .col-stock { color: #94a3b8 !important; font-weight: 700; }
            .col-montant { color: #0f172a !important; font-weight: 800; }
            .col-pctven { color: #2563eb !important; font-weight: 600; }
            .col-marge { color: #dc2626 !important; font-weight: 800; }
            
            /* Footer Layout - Positionné en bas de chaque page */
            @page {
              margin-bottom: 25mm;
              @bottom-left {
                content: "Poids seuil stock > ${minStock} Kg : ${stockWeight} Kg";
              }
              @bottom-right {
                content: "Page " counter(page) " sur " counter(pages);
              }
            }
            
            .footer-container {
              position: fixed;
              bottom: 5mm;
              left: 10mm;
              right: 10mm;
              width: calc(100% - 20mm);
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 10px;
              background: white;
              border-top: 2px solid #333;
              font-size: 11px; /* Augmenté de 10px à 11px */
              font-weight: bold;
              z-index: 1000;
            }
            
            .footer-left {
              flex: 1;
              text-align: left;
            }
            
            .footer-right {
              flex: 1;
              text-align: right;
            }
            
            /* Compteur de pages */
            body {
              counter-reset: page;
            }
            
            .page-counter::before {
              content: "Page ";
            }
            
            .page-counter::after {
              content: counter(page);
            }
            
            /* Pagination : 25 lignes par page */
            @media print {
              /* Répéter l'en-tête sur chaque page */
              thead {
                display: table-header-group;
              }
              tfoot {
                display: table-footer-group;
              }
              
              /* Forcer un saut de page tous les 25 lignes */
              tbody tr:nth-child(25n) {
                page-break-after: always;
              }
              
              /* Ne pas couper une ligne en deux */
              tbody tr {
                page-break-inside: avoid;
              }
              
              /* Empêcher les sauts de page indésirables dans le tableau */
              table {
                page-break-inside: auto;
              }
            }
          `);
          printWindow.document.write('</style>');

          // Script pour appliquer les classes CSS aux cellules, gérer la pagination et compter les pages
          printWindow.document.write(`
            <script>
              window.onload = function() {
                const table = document.querySelector('table');
                if (!table) return;
                
                // Appliquer les classes aux en-têtes
                const headers = table.querySelectorAll('thead th');
                headers.forEach((th, index) => {
                  const colspan = th.getAttribute('colspan');
                  const rowspan = th.getAttribute('rowspan');
                  const text = th.textContent.trim();
                  
                  // Identifier le type d'en-tête basé sur le texte ou la position
                  if (text.includes('Référence') || text === '%' || text === 'Info' || text === '*' || text === 'Réf') {
                    th.classList.add('header-reference');
                  } else if (text === 'Désignation') {
                    th.classList.add('header-designation');
                  } else if (text.includes('Report') || (colspan === '2' && index >= 9 && index <= 10)) {
                    th.classList.add('header-report');
                  } else if (text.includes('Achat') || (colspan === '2' && index >= 11 && index <= 12)) {
                    th.classList.add('header-achat');
                  } else if (text.includes('Production') || (colspan === '2' && index >= 13 && index <= 14)) {
                    th.classList.add('header-production');
                  } else if (text.includes('Vente') || (colspan === '2' && index >= 15 && index <= 16)) {
                    th.classList.add('header-vente');
                  } else if (text.includes('Stock') || (colspan === '2' && index >= 17 && index <= 18)) {
                    th.classList.add('header-stock');
                  } else if (text === '% Ven' || text.includes('Ven')) {
                    th.classList.add('header-pctven');
                  } else if (text === 'Marg%' || text.includes('Marg')) {
                    th.classList.add('header-marge');
                  } else {
                    th.classList.add('header-default');
                  }
                });
                
                // Appliquer les classes aux cellules de données
                const rows = table.querySelectorAll('tbody tr');
                let dataRowCount = 0;
                
                rows.forEach((tr, rowIndex) => {
                  const cells = tr.querySelectorAll('td');
                  
                  // Vérifier si c'est une ligne de total
                  const firstCell = cells[0];
                  const cellText = firstCell ? firstCell.textContent.trim() : '';
                  
                  if (cellText.includes('TOT FAMILLE') || cellText.includes('TOT ')) {
                    tr.classList.add('total-famille');
                  } else if (cellText.includes('TOT FOURN')) {
                    tr.classList.add('total-fournisseur');
                  } else if (cellText.includes('TOTAL GENERAL')) {
                    tr.classList.add('total-general');
                  } else if (cellText.includes('VAL') || cellText.includes('VALEUR')) {
                    tr.classList.add('total-valeur');
                  } else {
                    // Ligne de données normale - appliquer les classes de couleur
                    dataRowCount++;
                    cells.forEach((cell, idx) => {
                      if (idx === 0) cell.classList.add('col-pct');
                      else if (idx === 1) cell.classList.add('col-info');
                      else if (idx === 2) cell.classList.add('col-star');
                      else if (idx === 3) cell.classList.add('col-ref');
                      else if (idx === 4) cell.classList.add('col-design');
                      else if (idx === 5) cell.classList.add('col-poids');
                      else if (idx >= 6 && idx <= 8) cell.classList.add('col-prix');
                      else if (idx >= 9 && idx <= 10) cell.classList.add('col-report');
                      else if (idx >= 11 && idx <= 12) cell.classList.add('col-achat');
                      else if (idx >= 13 && idx <= 14) cell.classList.add('col-prod');
                      else if (idx >= 15 && idx <= 16) cell.classList.add('col-vente');
                      else if (idx >= 17 && idx <= 18) cell.classList.add('col-stock');
                      else if (idx === 19) cell.classList.add('col-montant');
                      else if (idx === 20) cell.classList.add('col-pctven');
                      else if (idx === 21) cell.classList.add('col-marge');
                    });
                  }
                  
                  // Ajouter un saut de page tous les 25 lignes de données (sauf pour les totaux)
                  if (dataRowCount > 0 && dataRowCount % 25 === 0 && !cellText.includes('TOT') && !cellText.includes('TOTAL') && !cellText.includes('VAL')) {
                    tr.style.pageBreakAfter = 'always';
                  }
                });
                
                // Calculer le nombre total de pages (approximatif basé sur 25 lignes par page)
                const totalPages = Math.ceil(dataRowCount / 25);
                
                // Mettre à jour le compteur de pages dans le footer
                const pageCounter = document.querySelector('.page-counter');
                if (pageCounter && totalPages > 0) {
                  pageCounter.textContent = 'Page 1 sur ' + totalPages;
                }
              };
            </script>
          `);

          printWindow.document.write('</head><body>');

          printWindow.document.write(`
            <div class="header-container">
              <div class="header-left">
                ${companyName}
                <div class="address">${companyAddress}</div>
              </div>
              <div class="header-center">
                <div class="title-main">MOUVEMENT ARTICLE</div>
                <div class="dates-info">
                  Période du : <b>${dateDebut}</b> au <b>${dateFin}</b> | Stock : <b>${dateStock}</b>
                </div>
              </div>
              <div class="header-right">
                <div>${printDateFormatted}</div>
                <div class="contact">${contactInfo}</div>
              </div>
            </div>
          `);

          // Content
          printWindow.document.write(tableOnlyRef.current.innerHTML);

          printWindow.document.write('</body></html>');
          printWindow.document.close();

          // Trigger print and close preview logic
          setTimeout(() => {
            printWindow.print();
            onClose();
          }, 500);
        }
      }
    }, 100);
  };

  // Render hidden content for generating HTML
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{ opacity: 0, pointerEvents: 'none' }} // Hidden from view but mounted
    >
      <DialogContent>
        <Box>
          <Box ref={tableOnlyRef}>
            <DataTable
              data={data}
              periodes={periodes}
              hideSearch={true}
              hideActions={true}
            />
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export { PrintPreview };