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
    setTimeout(() => {
      if (tableOnlyRef.current) {
        const printWindow = window.open('', '', 'height=800,width=1400');
        if (printWindow) {
          const stockWeight = calculateStockWeightMetric();

          const dateOptions: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          };
          const printDate = new Date().toLocaleDateString('fr-FR', dateOptions);
          const printDateFormatted = printDate.charAt(0).toUpperCase() + printDate.slice(1);

          const companyName = "SOCIETE MIEZAKA";
          const companyAddress = "LOT 111 MA/3608 SAHALAVA FIANARANTSOA 301";
          const contactInfo = "email: sciege@miezaka.com / Tél : 034 07 255 07 - 034 07 252 55";

          const dateDebut = periodes?.debut ? new Date(periodes.debut).toLocaleDateString('fr-FR') : '-';
          const dateFin = periodes?.fin ? new Date(periodes.fin).toLocaleDateString('fr-FR') : '-';
          const dateStock = periodes?.stock_date ? new Date(periodes.stock_date).toLocaleDateString('fr-FR') : '-';

          const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
          styles.forEach(node => {
            printWindow.document.head.appendChild(node.cloneNode(true));
          });

          printWindow.document.write('<html><head><title>MOUVEMENT ARTICLE</title>');
          printWindow.document.write('<style>');
          printWindow.document.write(`
            @page {
              size: landscape;
              margin: 6mm 6mm 12mm 6mm;
              /* Native @page margin boxes – supported in Chrome/Edge */
              @bottom-left {
                content: "Poids seuil stock > ${minStock} Kg";
                font-size: 9px;
                font-weight: bold;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                border-top: 1.5px solid #1e293b;
                padding-top: 2px;
              }
              @bottom-right {
                content: "Page " counter(page) " sur " counter(pages);
                font-size: 9px;
                font-weight: bold;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                border-top: 1.5px solid #1e293b;
                padding-top: 2px;
              }
            }

            body {
              margin: 0;
              padding: 0;
            }

            .page-break {
              page-break-after: always;
              break-after: page;
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
              /* Repeat header on every page */
              thead {
                display: table-header-group;
              }
              /* Avoid breaking rows internally */
              tbody tr {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              table {
                page-break-inside: auto;
                break-inside: auto;
              }
              /* Per-page header – shown once in body flow */
              .print-page-header {
                display: block;
              }
            }

            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 9px;
              margin: 0;
              padding: 0;
            }

            /* ===== PAGE HEADER ===== */
            .print-page-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #1e293b;
              padding-bottom: 3px;
              margin-bottom: 4px;
              width: 100%;
            }
            .header-left {
              width: 28%;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .header-logo {
              width: 46px;
              height: 46px;
              border-radius: 50%;
              object-fit: contain;
              flex-shrink: 0;
            }
            .header-company-info {
              display: flex;
              flex-direction: column;
            }
            .company-name {
              font-size: 12px;
              font-weight: 900;
              color: #1e293b;
            }
            .company-address {
              font-size: 8px;
              color: #475569;
              margin-top: 2px;
            }
            .header-center {
              text-align: center;
              flex-grow: 1;
            }
            .title-main {
              font-size: 15px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #1e293b;
            }
            .dates-info {
              font-size: 9px;
              color: #475569;
              margin-top: 3px;
            }
            .header-right {
              width: 28%;
              text-align: right;
              font-size: 9px;
              color: #475569;
            }
            .header-right .contact {
              font-size: 8px;
              font-style: italic;
              margin-top: 2px;
            }

            /* ===== TABLE ===== */
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 7.5px;
              table-layout: auto;
            }

            th {
              border: 1px solid #cbd5e1;
              padding: 3px 2px;
              text-align: center;
              font-weight: 900;
              font-size: 7.5px;
              line-height: 1.2;
              white-space: nowrap;
            }

            /* Header color groups */
            .header-reference  { background-color: #dbeafe !important; color: #1e293b !important; }
            .header-designation{ background-color: #f8fafc !important; color: #1e293b !important; }
            .header-default    { background-color: #f8fafc !important; color: #1e293b !important; }
            .header-report     { background-color: #e9d5ff !important; color: #1e293b !important; }
            .header-achat      { background-color: #d1fae5 !important; color: #1e293b !important; }
            .header-production { background-color: #fed7aa !important; color: #1e293b !important; }
            .header-vente      { background-color: #dbeafe !important; color: #1e293b !important; }
            .header-stock      { background-color: #f1f5f9 !important; color: #1e293b !important; }
            .header-pctven     { background-color: #fef3c7 !important; color: #1e293b !important; }
            .header-marge      { background-color: #fee2e2 !important; color: #1e293b !important; }

            td {
              border: 1px solid #e2e8f0;
              padding: 2px 2px;
              text-align: center;
              font-size: 7.5px;
              font-weight: 500;
              line-height: 1.2;
              white-space: nowrap;
              height: 18px;
            }

            .align-left  { text-align: left !important; padding-left: 4px !important; }
            .align-right { text-align: right !important; padding-right: 4px !important; }

            tbody tr:nth-child(odd)  { background-color: #ffffff !important; }
            tbody tr:nth-child(even) { background-color: #f8fafc !important; }

            /* Subtotal rows */
            .total-famille   { background-color: #e2e8f0 !important; font-weight: 900 !important; height: 20px !important; }
            .total-fournisseur{ background-color: #cbd5e1 !important; font-weight: 900 !important; height: 20px !important; }
            .total-general   { background-color: #1e293b !important; color: white !important; font-weight: 900 !important; height: 22px !important; }
            .total-valeur    { background-color: #fef3c7 !important; font-weight: 900 !important; height: 20px !important; }

            /* Data cell colours */
            .col-pct   { color: #7c3aed !important; font-weight: 700; }
            .col-info  { color: #475569 !important; }
            .col-star  { color: #dc2626 !important; font-weight: 900; }
            .col-ref   { color: #1e293b !important; font-weight: 800; }
            .col-design{ color: #334155 !important; font-weight: 800; }
            .col-poids { color: #64748b !important; }
            .col-prix  { color: #64748b !important; }
            .col-report{ color: #3b82f6 !important; }
            .col-achat { color: #16a34a !important; }
            .col-prod  { color: #d97706 !important; }
            .col-vente { color: #dc2626 !important; }
            .col-stock { color: #64748b !important; font-weight: 700; }
            .col-montant{ color: #0f172a !important; font-weight: 800; }
            .col-pctven { color: #2563eb !important; font-weight: 600; }
            .col-marge  { color: #dc2626 !important; font-weight: 800; }

            /* Footer is handled by @page margin boxes — no HTML footer needed */


          `);
          printWindow.document.write('</style>');

          // JavaScript to apply classes and inject per-page numbering
          printWindow.document.write(`
            <script>
              window.onload = function() {
                var table = document.querySelector('table');
                if (!table) return;

                /* --- Apply header colours --- */
                var headers = table.querySelectorAll('thead th');
                headers.forEach(function(th) {
                  var text = th.textContent.trim();
                  if (text.includes('Référence') || text === '%' || text === 'Info' || text === '*' || text === 'Réf') {
                    th.classList.add('header-reference');
                  } else if (text === 'Désignation') {
                    th.classList.add('header-designation');
                  } else if (text.includes('Report')) {
                    th.classList.add('header-report');
                  } else if (text.includes('Achat')) {
                    th.classList.add('header-achat');
                  } else if (text.includes('Production')) {
                    th.classList.add('header-production');
                  } else if (text.includes('Vente')) {
                    th.classList.add('header-vente');
                  } else if (text.includes('Stock')) {
                    th.classList.add('header-stock');
                  } else if (text === '% Ven' || text.includes('Ven')) {
                    th.classList.add('header-pctven');
                  } else if (text === 'Marg%' || text.includes('Marg')) {
                    th.classList.add('header-marge');
                  } else {
                    th.classList.add('header-default');
                  }
                });

                /* --- Apply row colours --- */
                var rows = table.querySelectorAll('tbody tr');

                rows.forEach(function(tr) {
                  var cells = tr.querySelectorAll('td');
                  var firstCell = cells[0];
                  var cellText = firstCell ? firstCell.textContent.trim() : '';

                  if (cellText.includes('TOT FOURN')) {
                    tr.classList.add('total-fournisseur');
                  } else if (cellText.includes('TOT') && !cellText.includes('TOTAL') && !cellText.includes('FOURN')) {
                    tr.classList.add('total-famille');
                  } else if (cellText.includes('TOTAL GENERAL')) {
                    tr.classList.add('total-general');
                  } else if (cellText.includes('VAL') || cellText.includes('VALEUR')) {
                    tr.classList.add('total-valeur');
                  } else {
                    /* Normal data row — apply column colours */
                    cells.forEach(function(cell, idx) {
                      if (idx === 0) cell.classList.add('col-pct');
                      else if (idx === 1) cell.classList.add('col-info');
                      else if (idx === 2) cell.classList.add('col-star');
                      else if (idx === 3) { cell.classList.add('col-ref'); cell.classList.add('align-left'); }
                      else if (idx === 4) { cell.classList.add('col-design'); cell.classList.add('align-left'); }
                      else if (idx === 5) cell.classList.add('col-poids');
                      else if (idx >= 6 && idx <= 8) cell.classList.add('col-prix');
                      else if (idx >= 9 && idx <= 10) cell.classList.add('col-report');
                      else if (idx >= 11 && idx <= 12) cell.classList.add('col-achat');
                      else if (idx >= 13 && idx <= 14) cell.classList.add('col-prod');
                      else if (idx >= 15 && idx <= 16) cell.classList.add('col-vente');
                      else if (idx >= 17 && idx <= 18) cell.classList.add('col-stock');
                      else if (idx === 19) { cell.classList.add('col-montant'); cell.classList.add('align-right'); }
                      else if (idx === 20) cell.classList.add('col-pctven');
                      else if (idx === 21) cell.classList.add('col-marge');
                    });
                  }
                });

                /* Page breaks and page numbers are fully handled by CSS @page margin boxes — no JS needed */

              };

              window.onafterprint = function() {
                window.close();
              };
            <\/script>
          `);

          printWindow.document.write('</head><body>');

          // Print header
          printWindow.document.write(`
            <div class="print-page-header">
              <div class="header-left">
                <img class="header-logo" src="/logoM.jpeg" alt="Logo Miezaka" />
                <div class="header-company-info">
                  <div class="company-name">${companyName}</div>
                  <div class="company-address">${companyAddress}</div>
                </div>
              </div>
              <div class="header-center">
                <div class="title-main">MOUVEMENT ARTICLE</div>
                <div class="dates-info">
                  Période du : <b>${dateDebut}</b> au <b>${dateFin}</b> &nbsp;|&nbsp; État stock au : <b>${dateStock}</b>
                </div>
              </div>
              <div class="header-right">
                <div>${printDateFormatted}</div>
                <div class="contact">${contactInfo}</div>
              </div>
            </div>
          `);

          // Table content
          printWindow.document.write(tableOnlyRef.current.innerHTML);

          /* Footer is rendered by @page margin boxes — no HTML div needed */

          printWindow.document.write('</body></html>');
          printWindow.document.close();

          setTimeout(() => {
            printWindow.print();
          }, 600);

          // Close the modal immediately
          onClose();
        }
      }
    }, 100);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{ opacity: 0, pointerEvents: 'none' }}
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