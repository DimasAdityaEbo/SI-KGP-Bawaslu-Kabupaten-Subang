import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportPdfOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
  scale?: number;
}

/**
 * Robustly exports any HTML element to a downloadable PDF file using html2canvas & jsPDF.
 * Optimized for official government documents (KGB, Disposisi, Tanda Terima, Laporan).
 */
export async function exportElementToPdf(
  element: HTMLElement,
  options: ExportPdfOptions = {}
): Promise<void> {
  const {
    filename = 'Dokumen_Bawaslu.pdf',
    orientation = 'portrait',
    format = 'a4',
    scale = 2,
  } = options;

  // Temporarily ensure element styles are optimal for rendering
  const prevOverflow = element.style.overflow;
  element.style.overflow = 'visible';

  try {
    const canvas = await html2canvas(element, {
      scale: scale, // Higher scale for ultra-crisp vector-like text & seal/stamp quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        // Remove any element with class 'no-print' in the cloned canvas
        const noPrintElements = clonedDoc.querySelectorAll('.no-print');
        noPrintElements.forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });
      },
    });

    // A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: format,
      compress: true,
    });

    const pageWidth = orientation === 'portrait' ? 210 : 297;
    const pageHeight = orientation === 'portrait' ? 297 : 210;

    // Calculate dimensions maintaining aspect ratio
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    if (imgHeight <= pageHeight) {
      // Single page document
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
    } else {
      // Multi-page document handling
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }
    }

    const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(safeFilename);
  } catch (error) {
    console.error('Gagal menghasilkan PDF via jsPDF:', error);
    // Fallback: trigger print dialog if canvas generation fails
    window.print();
    throw error;
  } finally {
    element.style.overflow = prevOverflow;
  }
}

/**
 * Prints only the specified element cleanly without showing modal dialog overlays,
 * sidebar, or window chrome.
 */
export function printElementIsolated(element: HTMLElement, title: string = 'Dokumen Bawaslu'): void {
  try {
    // Create an invisible iframe for isolated printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    // Collect all stylesheets from host document
    let styleSheetsHtml = '';
    const styleTags = document.querySelectorAll('style, link[rel="stylesheet"]');
    styleTags.forEach((tag) => {
      styleSheetsHtml += tag.outerHTML;
    });

    // Write isolated printable document
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          ${styleSheetsHtml}
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 10mm 12mm;
            }
            body {
              background: #ffffff !important;
              color: #000000 !important;
              font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .no-print {
              display: none !important;
            }
            .print-break-inside-avoid {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            table {
              border-collapse: collapse !important;
            }
          </style>
        </head>
        <body class="bg-white text-slate-900 p-4">
          <div style="max-width: 210mm; margin: 0 auto;">
            ${element.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Give iframe a moment to render all resources/images
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.warn('Iframe print failed, falling back to window.print()', e);
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      }
    }, 400);
  } catch (err) {
    console.warn('Isolated print error:', err);
    window.print();
  }
}
