import QRCode from "qrcode";
import aiWingsLogo from "@/assets/aiwings-logo.png";
import ggctLogo from "@/assets/ggct-logo.png";

export interface CertificateData {
  certificate_id: string;
  full_name: string;
  event_title: string;
  achievement_type: string;
  issued_on: string;
  issued_by: string;
}

const W = 1600;
const H = 1131; // A4 landscape ratio

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export const verifyUrl = (id: string) => `${window.location.origin}/verify/${encodeURIComponent(id)}`;

/** Draws a modern AI/tech themed certificate and returns a PNG data URL. */
export async function renderCertificate(data: CertificateData): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#050914");
  bg.addColorStop(0.5, "#0a1226");
  bg.addColorStop(1, "#050914");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Neural network watermark
  const nodes = Array.from({ length: 46 }, (_, i) => ({
    x: ((i * 397) % (W - 160)) + 80,
    y: ((i * 733) % (H - 160)) + 80,
  }));
  ctx.strokeStyle = "rgba(56, 189, 248, 0.10)";
  ctx.lineWidth = 1;
  nodes.forEach((a, i) =>
    nodes.slice(i + 1).forEach((b) => {
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 260) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    })
  );
  ctx.fillStyle = "rgba(56, 189, 248, 0.22)";
  nodes.forEach((n) => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Glow corners
  const glow = (x: number, y: number, r: number, color: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  glow(120, 100, 420, "rgba(34,211,238,0.16)");
  glow(W - 120, H - 80, 480, "rgba(99,102,241,0.16)");

  // Neon borders
  ctx.strokeStyle = "rgba(34, 211, 238, 0.85)";
  ctx.lineWidth = 4;
  ctx.strokeRect(38, 38, W - 76, H - 76);
  ctx.strokeStyle = "rgba(129, 140, 248, 0.45)";
  ctx.lineWidth = 2;
  ctx.strokeRect(58, 58, W - 116, H - 116);

  // Corner accents
  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 6;
  const c = 70;
  [
    [38, 38, 1, 1],
    [W - 38, 38, -1, 1],
    [38, H - 38, 1, -1],
    [W - 38, H - 38, -1, -1],
  ].forEach(([x, y, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(x + dx * c, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * c);
    ctx.stroke();
  });

  // Logos
  try {
    const [ai, gg] = await Promise.all([loadImage(aiWingsLogo), loadImage(ggctLogo)]);
    ctx.drawImage(gg, 110, 96, 150, 150);
    ctx.drawImage(ai, W - 260, 96, 150, 150);
  } catch { /* logos optional */ }

  const center = (text: string, y: number, font: string, color: string, spacing = 0) => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    if (spacing) {
      const chars = [...text];
      const total = chars.reduce((s, ch) => s + ctx.measureText(ch).width + spacing, 0) - spacing;
      let x = W / 2 - total / 2;
      ctx.textAlign = "left";
      chars.forEach((ch) => {
        ctx.fillText(ch, x, y);
        x += ctx.measureText(ch).width + spacing;
      });
      ctx.textAlign = "center";
    } else {
      ctx.fillText(text, W / 2, y);
    }
  };

  center("GYAN GANGA COLLEGE OF TECHNOLOGY", 150, "600 30px Georgia, serif", "#e2e8f0", 3);
  center("THE AI WINGS · OFFICIAL AI CLUB", 196, "500 22px monospace", "#22d3ee", 5);

  center("CERTIFICATE", 330, "bold 84px Georgia, serif", "#ffffff", 8);
  center("OF " + data.achievement_type.toUpperCase(), 388, "600 32px monospace", "#818cf8", 8);

  center("This is proudly presented to", 480, "italic 28px Georgia, serif", "#94a3b8");

  // Name
  ctx.shadowColor = "rgba(34,211,238,0.55)";
  ctx.shadowBlur = 26;
  center(data.full_name, 580, "bold 68px Georgia, serif", "#ffffff");
  ctx.shadowBlur = 0;

  // Underline
  const ug = ctx.createLinearGradient(W / 2 - 320, 0, W / 2 + 320, 0);
  ug.addColorStop(0, "rgba(34,211,238,0)");
  ug.addColorStop(0.5, "#22d3ee");
  ug.addColorStop(1, "rgba(34,211,238,0)");
  ctx.fillStyle = ug;
  ctx.fillRect(W / 2 - 320, 606, 640, 3);

  center("for outstanding participation in", 668, "26px Georgia, serif", "#94a3b8");

  // Event title (wrap)
  ctx.font = "bold 42px Georgia, serif";
  const words = data.event_title.split(" ");
  const lines: string[] = [];
  let line = "";
  words.forEach((w) => {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > 1000 && line) {
      lines.push(line);
      line = w;
    } else line = t;
  });
  if (line) lines.push(line);
  lines.slice(0, 2).forEach((l, i) => center(l, 730 + i * 52, "bold 42px Georgia, serif", "#22d3ee"));

  const dateStr = new Date(data.issued_on).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  center(`Issued on ${dateStr}`, 730 + Math.min(lines.length, 2) * 52 + 30, "24px Georgia, serif", "#94a3b8");

  // QR code
  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl(data.certificate_id), {
      margin: 1,
      width: 320,
      color: { dark: "#0b1120", light: "#ffffff" },
    });
    const qr = await loadImage(qrDataUrl);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(W - 268, H - 300, 168, 168);
    ctx.drawImage(qr, W - 260, H - 292, 152, 152);
    ctx.font = "16px monospace";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.fillText("Scan to verify", W - 184, H - 110);
  } catch { /* qr optional */ }

  // Signature block
  ctx.textAlign = "left";
  ctx.strokeStyle = "rgba(226,232,240,0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, H - 190);
  ctx.lineTo(430, H - 190);
  ctx.stroke();
  ctx.font = "22px Georgia, serif";
  ctx.fillStyle = "#e2e8f0";
  ctx.fillText(data.issued_by, 120, H - 155);
  ctx.font = "16px monospace";
  ctx.fillStyle = "#64748b";
  ctx.fillText("Issuing Authority", 120, H - 126);

  // Certificate ID
  ctx.font = "20px monospace";
  ctx.fillStyle = "#22d3ee";
  ctx.fillText(`CERTIFICATE ID: ${data.certificate_id}`, 120, H - 82);
  ctx.font = "14px monospace";
  ctx.fillStyle = "#64748b";
  ctx.fillText(`Verify at ${window.location.host}/verify`, 120, H - 58);

  return canvas.toDataURL("image/png");
}

export async function downloadCertificate(data: CertificateData) {
  const url = await renderCertificate(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.certificate_id}-${data.full_name.replace(/\s+/g, "_")}.png`;
  a.click();
}

export function makeCertificateId() {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `AIW-${year}-${rand}`;
}
