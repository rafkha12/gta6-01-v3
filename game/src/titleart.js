// Title poster: Mara Voss and Dario Cruz, drawn entirely in code on a 2D
// canvas — vector shapes and gradients, no image files. A purple-pink
// sunset over Bahía Sol, palm silhouettes, a neon sign, and the duo standing
// side by side with human proportions and real faces. This is the cover shot.
import { DUO } from './config.js';

function ellipse(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill();
}
// A tapered limb from (x1,y1) to (x2,y2), round-capped, with a soft shade.
function limb(ctx, x1, y1, x2, y2, w, color, shade) {
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  if (shade) {
    ctx.strokeStyle = shade; ctx.lineWidth = w * 0.45;
    ctx.beginPath(); ctx.moveTo(x1 + w * 0.22, y1); ctx.lineTo(x2 + w * 0.22, y2); ctx.stroke();
  }
}

function drawSky(ctx, w, h, u) {
  const g = ctx.createLinearGradient(0, 0, 0, h * 0.62);
  g.addColorStop(0, '#2a0e4a'); g.addColorStop(0.45, '#7a2a68');
  g.addColorStop(0.75, '#e85d3d'); g.addColorStop(1, '#ffc46b');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h * 0.62);
  // Sun with a warm halo, low over the skyline.
  const sx = w * 0.84, sy = h * 0.40, sr = 58 * u;
  const halo = ctx.createRadialGradient(sx, sy, sr * 0.2, sx, sy, sr * 3.2);
  halo.addColorStop(0, 'rgba(255,214,130,0.85)'); halo.addColorStop(0.35, 'rgba(255,150,80,0.35)');
  halo.addColorStop(1, 'rgba(255,150,80,0)');
  ctx.fillStyle = halo; ctx.fillRect(sx - sr * 3.2, sy - sr * 3.2, sr * 6.4, sr * 6.4);
  ctx.fillStyle = '#ffe9a8'; ellipse(ctx, sx, sy, sr, sr);
  ctx.fillStyle = 'rgba(255,120,60,0.35)'; ellipse(ctx, sx, sy + sr * 0.25, sr * 0.8, sr * 0.55);
  // Streak clouds, lit pink underneath — thin and wispy, not blobs.
  ctx.fillStyle = 'rgba(255,170,140,0.20)';
  for (const [cx, cy, cw, ch] of [[0.10, 0.13, 0.34, 0.008], [0.52, 0.09, 0.26, 0.006], [0.28, 0.22, 0.38, 0.009], [0.70, 0.26, 0.24, 0.007], [0.04, 0.31, 0.28, 0.008]]) {
    ellipse(ctx, w * cx, h * cy, w * cw * 0.5, h * ch * 2.2);
  }
}

function drawSkyline(ctx, w, h, u, seed) {
  // Back row, then a nearer row; lit windows are warm pinpricks.
  const layers = [
    { base: h * 0.60, color: '#33184f', heights: [90, 150, 120, 190, 110, 170, 100, 140, 180, 95, 130, 160] },
    { base: h * 0.66, color: '#1d0d33', heights: [70, 110, 85, 130, 95, 120, 80, 105, 125, 75, 100, 115] },
  ];
  for (const layer of layers) {
    ctx.fillStyle = layer.color;
    const n = layer.heights.length; const bw = w / n;
    for (let i = 0; i < n; i += 1) {
      const bh = layer.heights[i] * u;
      ctx.fillRect(i * bw, layer.base - bh, bw - 3 * u, bh + 2);
    }
    // Windows.
    for (let i = 0; i < n; i += 1) {
      const bh = layer.heights[i] * u; const bw2 = w / n;
      for (let wy = layer.base - bh + 12 * u; wy < layer.base - 14 * u; wy += 18 * u) {
        for (let wx = i * bw2 + 8 * u; wx < (i + 1) * bw2 - 10 * u; wx += 16 * u) {
          if (((i * 7 + Math.round(wy) * 3 + Math.round(wx)) % 5) < 2) {
            ctx.fillStyle = ((i + Math.round(wy)) % 3 === 0) ? 'rgba(120,220,255,0.75)' : 'rgba(255,205,120,0.85)';
            ctx.fillRect(wx, wy, 5 * u, 7 * u);
          }
        }
      }
    }
  }
}

function drawPalm(ctx, x, y, s, lean) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(lean);
  ctx.strokeStyle = '#180a2a'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(6, -60, -4, -118); ctx.stroke();
  ctx.lineWidth = 6;
  for (let i = 0; i < 7; i += 1) {
    const a = -Math.PI * (0.08 + i * 0.13);
    ctx.beginPath(); ctx.moveTo(-4, -118);
    ctx.quadraticCurveTo(-4 + Math.cos(a) * 42, -118 + Math.sin(a) * 26 - 14, -4 + Math.cos(a) * 72, -118 + Math.sin(a) * 52 + 26);
    ctx.stroke();
  }
  ctx.restore();
}

// A face at (x, y) — head centre — radius r. Stylised but human: eyes with
// irises, brows, nose, lips, jaw shading, warm rim light on the sun side.
function drawFace(ctx, x, y, r, spec, opts = {}) {
  const { skinCss, lipCss, eyeCss, hairCss } = spec;
  const rim = 'rgba(255,170,90,0.9)';
  // Neck + jaw.
  ctx.fillStyle = skinCss;
  ctx.fillRect(x - r * 0.28, y + r * 0.72, r * 0.56, r * 0.7);
  ellipse(ctx, x, y, r * 0.92, r * 1.05);
  // Jaw shading on the shadow side.
  ctx.fillStyle = 'rgba(120,50,40,0.18)';
  ellipse(ctx, x - r * 0.35, y + r * 0.35, r * 0.5, r * 0.62);
  // Rim light on the sun side.
  ctx.strokeStyle = rim; ctx.lineWidth = r * 0.09; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y, r * 0.95, -0.9, 0.9); ctx.stroke();
  // Eyes — big enough to read at poster size.
  for (const s of [-1, 1]) {
    const ex = x + s * r * 0.36, ey = y - r * 0.02;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(ex, ey, r * 0.24, r * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = eyeCss; ellipse(ctx, ex + s * r * 0.02, ey, r * 0.12, r * 0.12);
    ctx.fillStyle = '#000'; ellipse(ctx, ex + s * r * 0.02, ey, r * 0.06, r * 0.06);
    // Brow.
    ctx.strokeStyle = hairCss; ctx.lineWidth = r * 0.09; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ex - r * 0.24, ey - r * 0.28); ctx.quadraticCurveTo(ex, ey - r * 0.40, ex + r * 0.24, ey - r * 0.26); ctx.stroke();
    // Lash line.
    ctx.strokeStyle = 'rgba(20,10,8,0.7)'; ctx.lineWidth = r * 0.05;
    ctx.beginPath(); ctx.moveTo(ex - r * 0.24, ey - r * 0.12); ctx.quadraticCurveTo(ex, ey - r * 0.20, ex + r * 0.24, ey - r * 0.12); ctx.stroke();
  }
  // Nose.
  ctx.strokeStyle = 'rgba(120,60,40,0.55)'; ctx.lineWidth = r * 0.06; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x + r * 0.04, y + r * 0.05); ctx.quadraticCurveTo(x + r * 0.12, y + r * 0.38, x - r * 0.02, y + r * 0.44); ctx.stroke();
  // Lips.
  ctx.fillStyle = lipCss;
  ctx.beginPath(); ctx.moveTo(x - r * 0.2, y + r * 0.62);
  ctx.quadraticCurveTo(x, y + r * 0.5, x + r * 0.2, y + r * 0.62);
  ctx.quadraticCurveTo(x, y + r * 0.78, x - r * 0.2, y + r * 0.62); ctx.fill();
  if (opts.stubble) {
    ctx.fillStyle = 'rgba(30,18,12,0.28)';
    ctx.beginPath(); ctx.ellipse(x, y + r * 0.55, r * 0.62, r * 0.5, 0, 0.15 * Math.PI, 0.85 * Math.PI); ctx.fill();
  }
}

function drawMara(ctx, x, y, s) {
  // y = ground line under her boots. s = scale (figure ~ 400*s px tall).
  const u = s;
  ctx.save(); ctx.translate(x, y); ctx.scale(u, u);
  // Legs — jeans, one slightly forward.
  limb(ctx, -14, -190, -22, -96, 26, DUO.mara.pantsCss, 'rgba(0,0,0,0.25)');
  limb(ctx, 16, -190, 30, -96, 26, DUO.mara.pantsCss, 'rgba(0,0,0,0.25)');
  limb(ctx, -22, -96, -26, -8, 24, DUO.mara.pantsCss);
  limb(ctx, 30, -96, 38, -8, 24, DUO.mara.pantsCss);
  // Boots.
  ctx.fillStyle = DUO.mara.shoesCss;
  rr(ctx, -42, -14, 34, 14, 5); rr(ctx, 24, -14, 34, 14, 5);
  // Red jacket, open over a white tee — tapered at the waist.
  ctx.fillStyle = DUO.mara.jacketCss;
  ctx.beginPath();
  ctx.moveTo(-50, -330); ctx.quadraticCurveTo(-56, -240, -40, -196);
  ctx.lineTo(40, -196); ctx.quadraticCurveTo(56, -240, 50, -330);
  ctx.quadraticCurveTo(0, -348, -50, -330); ctx.closePath(); ctx.fill();
  // Jacket shading + folds.
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.moveTo(20, -340); ctx.quadraticCurveTo(34, -280, 26, -200); ctx.lineTo(12, -200); ctx.quadraticCurveTo(20, -280, 8, -340); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,120,100,0.5)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-30, -320); ctx.lineTo(-24, -220); ctx.moveTo(30, -320); ctx.lineTo(24, -220); ctx.stroke();
  // White tee + collar.
  ctx.fillStyle = DUO.mara.shirtCss;
  ctx.beginPath(); ctx.moveTo(-18, -336); ctx.lineTo(18, -336); ctx.lineTo(14, -200); ctx.lineTo(-14, -200); ctx.closePath(); ctx.fill();
  // Arms: left hand on her hip (elbow out, forearm in), right arm relaxed.
  limb(ctx, -50, -322, -76, -262, 22, DUO.mara.jacketCss);
  limb(ctx, -76, -262, -52, -214, 20, DUO.mara.jacketCss);
  ctx.fillStyle = DUO.mara.skinCss; ellipse(ctx, -50, -210, 10, 11);
  limb(ctx, 50, -322, 70, -256, 22, DUO.mara.jacketCss);
  limb(ctx, 70, -256, 66, -180, 20, DUO.mara.jacketCss);
  ctx.fillStyle = DUO.mara.skinCss; ellipse(ctx, 66, -172, 10, 11);
  // Neck + face.
  ctx.fillStyle = DUO.mara.skinCss; ctx.fillRect(-13, -368, 26, 34);
  drawFace(ctx, 0, -398, 40, DUO.mara);
  // Hair: a high crown cap that leaves the forehead and eyes visible,
  // side locks, and a ponytail down the back.
  ctx.fillStyle = DUO.mara.hairCss;
  ctx.beginPath(); ctx.arc(0, -404, 42, Math.PI * 1.08, Math.PI * 1.92); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-38, -392, 11, 30, 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(38, -392, 11, 30, -0.15, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-32, -432); ctx.quadraticCurveTo(-74, -384, -60, -300); ctx.quadraticCurveTo(-44, -330, -40, -384); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,170,90,0.55)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(0, -404, 42, -0.5, 0.7); ctx.stroke();
  ctx.restore();
}

function drawDario(ctx, x, y, s) {
  const u = s;
  ctx.save(); ctx.translate(x, y); ctx.scale(u, u);
  // Legs — dark pants, stance wide, arms crossed.
  limb(ctx, -16, -200, -26, -100, 28, DUO.dario.pantsCss, 'rgba(0,0,0,0.25)');
  limb(ctx, 18, -200, 32, -100, 28, DUO.dario.pantsCss, 'rgba(0,0,0,0.25)');
  limb(ctx, -26, -100, -30, -8, 26, DUO.dario.pantsCss);
  limb(ctx, 32, -100, 36, -8, 26, DUO.dario.pantsCss);
  ctx.fillStyle = DUO.dario.shoesCss;
  rr(ctx, -48, -14, 36, 14, 5); rr(ctx, 22, -14, 36, 14, 5);
  // Teal shirt, broad shoulders, tapered waist.
  ctx.fillStyle = DUO.dario.jacketCss;
  ctx.beginPath();
  ctx.moveTo(-56, -352); ctx.quadraticCurveTo(-62, -250, -46, -206);
  ctx.lineTo(46, -206); ctx.quadraticCurveTo(62, -250, 56, -352);
  ctx.quadraticCurveTo(0, -372, -56, -352); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.moveTo(24, -360); ctx.quadraticCurveTo(38, -290, 28, -210); ctx.lineTo(12, -210); ctx.quadraticCurveTo(22, -290, 10, -360); ctx.closePath(); ctx.fill();
  // Undershirt — just a small V at the collar.
  ctx.fillStyle = DUO.dario.shirtCss;
  ctx.beginPath(); ctx.moveTo(-14, -356); ctx.lineTo(14, -356); ctx.lineTo(0, -322); ctx.closePath(); ctx.fill();
  // Arms crossed: forearms lie flat across the chest as two bands, hands
  // tucked at the far elbows.
  limb(ctx, -56, -344, -34, -296, 24, DUO.dario.jacketCss);
  limb(ctx, -34, -296, 28, -300, 22, DUO.dario.jacketCss);
  limb(ctx, 56, -344, 34, -314, 24, DUO.dario.jacketCss);
  limb(ctx, 34, -314, -26, -320, 22, DUO.dario.jacketCss);
  ctx.fillStyle = DUO.dario.skinCss;
  ellipse(ctx, 32, -298, 8, 9); ellipse(ctx, -30, -318, 8, 9);
  // Neck + face with stubble.
  ctx.fillStyle = DUO.dario.skinCss; ctx.fillRect(-14, -392, 28, 36);
  drawFace(ctx, 0, -424, 42, DUO.dario, { stubble: true });
  // Hair at the sides, tucked under the cap.
  ctx.fillStyle = DUO.dario.hairCss;
  ctx.beginPath(); ctx.ellipse(-40, -424, 7, 16, 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(40, -424, 7, 16, -0.15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = DUO.dario.capCss;
  ctx.beginPath(); ctx.arc(0, -442, 44, Math.PI * 1.02, Math.PI * 1.98); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, -444, 46, 10, 0, Math.PI, 0); ctx.fill();
  ctx.fillRect(-46, -456, 92, 12);
  ctx.beginPath(); ctx.ellipse(22, -458, 32, 7, 0.06, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = 'rgba(255,170,90,0.6)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-46, -452); ctx.lineTo(46, -452); ctx.stroke();
  ctx.restore();
}

function drawNeon(ctx, w, h, u, t) {
  // A glowing NEON BAR sign on the front skyline, left side.
  const x = w * 0.055, y = h * 0.475, bw = 150 * u, bh = 34 * u;
  const flick = 0.85 + 0.15 * Math.sin(t * 3.1);
  ctx.save();
  ctx.shadowColor = '#ff2e88'; ctx.shadowBlur = 22 * u * flick;
  ctx.fillStyle = '#2a0a24'; rr(ctx, x, y, bw, bh, 6 * u);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ff7ad9'; ctx.font = `bold ${Math.round(20 * u)}px Arial, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ff2e88'; ctx.shadowBlur = 14 * u * flick;
  ctx.fillText('NEON BAR', x + bw / 2, y + bh / 2 + 1);
  ctx.restore();
}

// The whole poster. t is a time in seconds for the neon shimmer (pass 0 for
// a deterministic shot).
export function drawTitle(ctx, w, h, t = 0) {
  const u = w / 1280;
  drawSky(ctx, w, h, u);
  drawSkyline(ctx, w, h, u);
  // Street: warm asphalt with reflections.
  const street = ctx.createLinearGradient(0, h * 0.66, 0, h);
  street.addColorStop(0, '#3a1c3e'); street.addColorStop(1, '#170a24');
  ctx.fillStyle = street; ctx.fillRect(0, h * 0.66, w, h * 0.34);
  ctx.fillStyle = 'rgba(255,150,80,0.10)';
  for (let i = 0; i < 5; i += 1) ellipse(ctx, w * (0.14 + i * 0.18), h * 0.76, 46 * u, 3 * u);
  ctx.strokeStyle = 'rgba(255,210,140,0.5)'; ctx.lineWidth = 3 * u; ctx.setLineDash([26 * u, 22 * u]);
  ctx.beginPath(); ctx.moveTo(0, h * 0.86); ctx.lineTo(w, h * 0.86); ctx.stroke(); ctx.setLineDash([]);
  drawPalm(ctx, w * 0.045, h * 0.68, 1.15 * u, 0.10);
  drawPalm(ctx, w * 0.955, h * 0.70, 1.3 * u, -0.12);
  drawNeon(ctx, w, h, u, t);
  // The duo, centre stage, big.
  drawMara(ctx, w * 0.40, h * 0.965, 0.92 * u);
  drawDario(ctx, w * 0.60, h * 0.965, 0.98 * u);
  // Title.
  ctx.save();
  ctx.textAlign = 'center';
  ctx.shadowColor = '#ff5e3a'; ctx.shadowBlur = 26 * u;
  ctx.fillStyle = '#fff3d6';
  ctx.font = `900 ${Math.round(84 * u)}px Arial, sans-serif`;
  ctx.fillText('BAHÍA SOL', w / 2, h * 0.115);
  ctx.shadowBlur = 0; ctx.fillStyle = '#ffd27d';
  ctx.font = `600 ${Math.round(21 * u)}px Arial, sans-serif`;
  ctx.fillText('A  S U N S E T  C I T Y  S T O R Y', w / 2, h * 0.165);
  ctx.restore();
  // Names under each figure.
  ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,240,220,0.92)';
  ctx.font = `700 ${Math.round(17 * u)}px Arial, sans-serif`;
  ctx.fillText('MARA VOSS', w * 0.40, h * 0.995);
  ctx.fillText('DARIO CRUZ', w * 0.60, h * 0.995);
  ctx.restore();
}
