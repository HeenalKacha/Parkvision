import { DetectionResult, ParkingSpace } from '../types/parking';
import { getStatusConfig } from './colors';

export function exportToJson(data: DetectionResult, filename = 'parking-occupancy-report.json') {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(data, null, 2)
  )}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportToCsv(data: DetectionResult, filename = 'parking-occupancy.csv') {
  const headers = [
    'Slot Identifier',
    'Status',
    'Confidence (%)',
    'Vehicle Info',
    'Box Ymin',
    'Box Xmin',
    'Box Ymax',
    'Box Xmax',
    'Notes',
  ];

  const rows = data.spaces.map((s) => [
    `"${s.slotNumber}"`,
    `"${s.status}"`,
    `${Math.round(s.confidence * 100)}`,
    `"${s.vehicleInfo || 'None'}"`,
    `${s.box2d[0]}`,
    `${s.box2d[1]}`,
    `${s.box2d[2]}`,
    `${s.box2d[3]}`,
    `"${s.notes || ''}"`,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', encodedUri);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export async function exportAnnotatedImage(
  imageSrc: string,
  spaces: ParkingSpace[],
  filename = 'parking-detection-annotated.png'
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context not supported'));
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw bounding boxes and labels
      spaces.forEach((s) => {
        const [ymin, xmin, ymax, xmax] = s.box2d;
        const x = (xmin / 1000) * canvas.width;
        const y = (ymin / 1000) * canvas.height;
        const w = ((xmax - xmin) / 1000) * canvas.width;
        const h = ((ymax - ymin) / 1000) * canvas.height;

        const config = getStatusConfig(s.status);

        // Fill semi-transparent box
        ctx.fillStyle = config.fill;
        ctx.fillRect(x, y, w, h);

        // Stroke border
        ctx.lineWidth = Math.max(2, Math.round(canvas.width / 400));
        ctx.strokeStyle = config.stroke;
        ctx.strokeRect(x, y, w, h);

        // Draw corner badges / text
        const fontSize = Math.max(12, Math.round(canvas.width / 75));
        ctx.font = `600 ${fontSize}px sans-serif`;
        const labelText = `${s.slotNumber} • ${config.shortLabel}`;
        const textMetrics = ctx.measureText(labelText);
        const padding = 6;
        const badgeWidth = textMetrics.width + padding * 2;
        const badgeHeight = fontSize + padding * 2;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.fillRect(x, Math.max(0, y - badgeHeight), badgeWidth, badgeHeight);

        ctx.fillStyle = config.stroke;
        ctx.fillText(labelText, x + padding, Math.max(0, y - badgeHeight) + fontSize + 2);
      });

      // Trigger download
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to generate image blob'));
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        resolve();
      }, 'image/png');
    };
    img.onerror = (e) => reject(e);
    img.src = imageSrc;
  });
}
