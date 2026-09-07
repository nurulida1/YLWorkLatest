import QRCode from 'qrcode';
import { environment } from '../../../../environments/environment.development';

export function buildInventoryItemUrl(id: string): string {
  const base = (environment.RedirectUrl || window.location.origin).replace(
    /\/$/,
    '',
  );
  return `${base}/inventory/item/${id}`;
}

export async function generateInventoryQrDataUrl(
  id: string,
  size = 280,
): Promise<string> {
  return QRCode.toDataURL(buildInventoryItemUrl(id), {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'M',
  });
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export function printInventoryQrLabel(options: {
  qrDataUrl: string;
  itemName: string;
  itemCode?: string | null;
}): void {
  const code = options.itemCode?.trim() || '—';
  const name = options.itemName?.trim() || 'Inventory item';

  const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Inventory QR – ${escapeHtml(name)}</title>
    <style>
      html, body { margin: 0; padding: 0; }
      body {
        font-family: Arial, Helvetica, sans-serif;
        text-align: center;
        padding: 24px;
        color: #111;
      }
      img { width: 260px; height: 260px; display: block; margin: 0 auto; }
      .code { margin-top: 12px; font-size: 14px; color: #555; }
      .name { margin-top: 6px; font-size: 18px; font-weight: 700; }
      @media print {
        body { padding: 0; }
      }
    </style>
  </head>
  <body>
    <img id="qr" src="${options.qrDataUrl}" alt="Inventory QR code" />
    <div class="code">${escapeHtml(code)}</div>
    <div class="name">${escapeHtml(name)}</div>
  </body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'Print inventory QR');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDocument = iframe.contentDocument || frameWindow?.document;
  if (!frameWindow || !frameDocument) {
    document.body.removeChild(iframe);
    return;
  }

  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();

  const cleanup = () => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  };

  const triggerPrint = () => {
    try {
      frameWindow.focus();
      frameWindow.print();
    } finally {
      // Give the print dialog time to capture content before removing the iframe
      window.setTimeout(cleanup, 1000);
    }
  };

  const img = frameDocument.getElementById('qr') as HTMLImageElement | null;
  if (img && !img.complete) {
    img.onload = () => triggerPrint();
    img.onerror = () => triggerPrint();
  } else {
    // Data URLs are often already complete; still defer one tick for layout
    window.setTimeout(triggerPrint, 50);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
