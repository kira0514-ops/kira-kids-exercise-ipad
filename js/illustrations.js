// Port of kids_exercise_app.py's _draw_* illustration methods (math/logic side only for
// now -- the 18 _toon_* cartoon-word templates are a separate follow-up, tracked as phase 4).
// Each function creates and returns a properly-sized <canvas> element, mirroring how the
// Python methods each build and return a tk.Canvas widget.

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  const dpr = window.devicePixelRatio || 1;
  c.width = w * dpr;
  c.height = h * dpr;
  c.style.width = w + "px";
  c.style.height = h + "px";
  const ctx = c.getContext("2d");
  ctx.scale(dpr, dpr);
  return c;
}

function dotCluster(ctx, xStart, yStart, count, color, textColor, perRow = 10, r = 8, gap = 22) {
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / perRow), col = i % perRow;
    const cx = xStart + col * gap, cy = yStart + row * gap;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    ctx.strokeStyle = textColor; ctx.stroke();
  }
}

function drawDotsAdd(illus, theme) {
  const { a, b } = illus;
  const perRow = 10, gap = 22;
  const rowsA = Math.max(1, Math.ceil(a / perRow));
  const rowsB = Math.max(1, Math.ceil(b / perRow));
  const widthA = Math.min(a, perRow) * gap;
  const widthB = Math.min(b, perRow) * gap;
  const height = Math.max(rowsA, rowsB) * gap + 20;
  const width = widthA + widthB + 70;
  const c = makeCanvas(width, height);
  const ctx = c.getContext("2d");
  dotCluster(ctx, 20, 20, a, theme.choice_palette[0], theme.text, perRow, 8, gap);
  ctx.fillStyle = theme.text; ctx.font = "bold 20px 'Segoe UI'"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("+", widthA + 40, height / 2);
  dotCluster(ctx, widthA + 60, 20, b, theme.choice_palette[1], theme.text, perRow, 8, gap);
  return c;
}

function drawMakeTen(illus, theme) {
  // Ten-frame showing "bigger" filled in, then (once revealed) the piece borrowed from
  // "smaller" that completes the ten (dashed border) and the leftover piece shown
  // separately -- the visual version of the decompose-to-make-ten worksheet method.
  // `stage` supports progressive reveal for the interactive Make 10 game:
  //   0 = only "bigger" filled; 1 = frame completed to ten; 2 (default) = ten + leftover.
  const { bigger, smaller = 0 } = illus;
  const stage = illus.stage != null ? illus.stage : 2;
  const needed = 10 - bigger;
  const leftover = stage >= 2 ? Math.max(0, smaller - needed) : 0;
  const r = 14, gap = 34, cols = 5;
  const frameW = cols * gap + 10, frameH = 2 * gap + 10;
  const leftoverW = Math.max(1, leftover) * gap + 20;
  const showLeftoverSlot = stage >= 1;
  const width = frameW + (showLeftoverSlot ? 50 + leftoverW : 0);
  const height = frameH + 50;
  const c = makeCanvas(width, height);
  const ctx = c.getContext("2d");

  ctx.strokeStyle = theme.text; ctx.lineWidth = 2;
  ctx.strokeRect(5, 5, frameW, frameH);
  for (let i = 1; i < cols; i++) {
    ctx.beginPath(); ctx.moveTo(5 + i * gap, 5); ctx.lineTo(5 + i * gap, 5 + frameH); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(5, 5 + gap); ctx.lineTo(5 + frameW, 5 + gap); ctx.stroke();

  const filledToTen = stage >= 1; // whether the borrowed cells (bigger..9) should render yet
  for (let i = 0; i < 10; i++) {
    const row = Math.floor(i / cols), col = i % cols;
    const cx = 5 + col * gap + gap / 2, cy = 5 + row * gap + gap / 2;
    const isBorrowed = i >= bigger;
    if (i < bigger || (isBorrowed && filledToTen)) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = theme.choice_palette[0]; ctx.fill();
      ctx.setLineDash(isBorrowed ? [4, 3] : []);
      ctx.strokeStyle = isBorrowed ? theme.choice_palette[1] : theme.text;
      ctx.lineWidth = isBorrowed ? 2.5 : 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  ctx.fillStyle = theme.text; ctx.font = "bold 16px 'Segoe UI'"; ctx.textAlign = "center";
  ctx.fillText(filledToTen ? "10" : String(bigger), 5 + frameW / 2, frameH + 26);

  if (!showLeftoverSlot) return c;

  ctx.font = "bold 22px 'Segoe UI'"; ctx.textBaseline = "middle";
  ctx.fillText("+", frameW + 25, frameH / 2 + 5);

  const leftoverX = frameW + 50;
  for (let i = 0; i < leftover; i++) {
    const col = i % cols;
    const cx = leftoverX + col * gap + gap / 2, cy = 5 + gap / 2;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = theme.choice_palette[1]; ctx.fill();
    ctx.strokeStyle = theme.text; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.fillStyle = theme.text; ctx.font = "bold 16px 'Segoe UI'"; ctx.textAlign = "center";
  ctx.fillText(String(leftover), leftoverX + (Math.max(1, leftover) * gap) / 2, frameH + 26);
  return c;
}

function drawDotsSub(illus, theme) {
  const { a, b } = illus;
  const perRow = 10, gap = 22;
  const rows = Math.max(1, Math.ceil(a / perRow));
  const width = Math.min(a, perRow) * gap + 40;
  const height = rows * gap + 20;
  const c = makeCanvas(width, height);
  const ctx = c.getContext("2d");
  for (let i = 0; i < a; i++) {
    const row = Math.floor(i / perRow), col = i % perRow;
    const cx = 20 + col * gap, cy = 20 + row * gap;
    const removed = i >= a - b;
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = removed ? "#EF9A9A" : theme.choice_palette[0]; ctx.fill();
    ctx.strokeStyle = theme.text; ctx.stroke();
    if (removed) {
      ctx.strokeStyle = "#B71C1C"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - 8, cy - 8); ctx.lineTo(cx + 8, cy + 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 8, cy + 8); ctx.lineTo(cx + 8, cy - 8); ctx.stroke();
      ctx.lineWidth = 1;
    }
  }
  return c;
}

function drawArray(illus, theme) {
  const { a, b } = illus;
  const gap = 24;
  const width = b * gap + 40, height = a * gap + 40;
  const c = makeCanvas(width, height);
  const ctx = c.getContext("2d");
  const palette = theme.choice_palette;
  for (let r = 0; r < a; r++) {
    for (let col = 0; col < b; col++) {
      const cx = 25 + col * gap, cy = 25 + r * gap;
      ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = palette[(r + col) % palette.length]; ctx.fill();
      ctx.strokeStyle = theme.text; ctx.stroke();
    }
  }
  return c;
}

function drawGrouping(illus, theme) {
  const { total, groups } = illus;
  const perGroup = Math.floor(total / groups);
  const dotPerRow = 5;
  const boxW = Math.max(60, Math.min(perGroup, dotPerRow) * 18 + 30);
  const boxH = Math.max(50, Math.ceil(perGroup / dotPerRow) * 18 + 30);
  const gap = 14;
  const cols = Math.min(groups, 4);
  const rows = Math.ceil(groups / cols);
  const width = cols * (boxW + gap) + gap;
  const height = rows * (boxH + gap) + gap;
  const c = makeCanvas(width, height);
  const ctx = c.getContext("2d");
  const palette = theme.choice_palette;
  for (let g = 0; g < groups; g++) {
    const col = g % cols, row = Math.floor(g / cols);
    const x0 = gap + col * (boxW + gap), y0 = gap + row * (boxH + gap);
    ctx.strokeStyle = theme.text; ctx.lineWidth = 2;
    ctx.strokeRect(x0, y0, boxW, boxH);
    for (let i = 0; i < perGroup; i++) {
      const dr = Math.floor(i / dotPerRow), dc = i % dotPerRow;
      const cx = x0 + 18 + dc * 18, cy = y0 + 18 + dr * 18;
      ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = palette[g % palette.length]; ctx.fill();
    }
  }
  ctx.lineWidth = 1;
  return c;
}

function drawPie(ctx, cx, cy, r, num, denom, color, textColor) {
  const anglePer = (2 * Math.PI) / denom;
  for (let i = 0; i < denom; i++) {
    const start = -Math.PI / 2 + i * anglePer;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + anglePer);
    ctx.closePath();
    ctx.fillStyle = i < num ? color : "white";
    ctx.fill();
    ctx.strokeStyle = textColor;
    ctx.stroke();
  }
}

function drawFractionPies(illus, theme) {
  const fractions = illus.fractions;
  const r = 45, gap = 40;
  const n = fractions.length;
  const width = n * (2 * r) + (n + 1) * gap;
  const height = 2 * r + 45;
  const c = makeCanvas(width, height);
  const ctx = c.getContext("2d");
  const palette = theme.choice_palette;
  fractions.forEach(([num, denom], idx) => {
    const cx = gap + r + idx * (2 * r + gap);
    const cy = r + 15;
    drawPie(ctx, cx, cy, r, num, denom, palette[idx % palette.length], theme.text);
    ctx.fillStyle = theme.text; ctx.font = "bold 11px 'Segoe UI'"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillText(`${num}/${denom}`, cx, cy + r + 18);
  });
  return c;
}

function drawPercentGrid(illus, theme) {
  const cell = 16, size = cell * 10;
  const c = makeCanvas(size + 20, size + 20);
  const ctx = c.getContext("2d");
  const shaded = Math.round(illus.pct);
  const color = theme.choice_palette[0];
  for (let i = 0; i < 100; i++) {
    const r = Math.floor(i / 10), col = i % 10;
    const x0 = 10 + col * cell, y0 = 10 + r * cell;
    ctx.fillStyle = i < shaded ? color : "white";
    ctx.fillRect(x0, y0, cell, cell);
    ctx.strokeStyle = "#999"; ctx.strokeRect(x0, y0, cell, cell);
  }
  return c;
}

function drawPercentBar(illus, theme) {
  const width = 300, height = 44;
  const c = makeCanvas(width, height);
  const ctx = c.getContext("2d");
  ctx.strokeStyle = theme.text; ctx.lineWidth = 2;
  ctx.strokeRect(10, 12, width - 20, height - 24);
  const fillW = illus.whole ? (illus.part / illus.whole) * (width - 20) : 0;
  ctx.fillStyle = theme.choice_palette[0];
  ctx.fillRect(10, 12, fillW, height - 24);
  ctx.lineWidth = 1;
  return c;
}

function drawRectangleShape(illus, theme) {
  const { length, width: w } = illus;
  const maxDim = 180;
  const scale = maxDim / Math.max(length, w);
  const wPx = length * scale, hPx = w * scale;
  const pad = 40;
  const c = makeCanvas(wPx + pad * 2, hPx + pad * 2);
  const ctx = c.getContext("2d");
  const x0 = pad, y0 = pad, x1 = pad + wPx, y1 = pad + hPx;
  ctx.fillStyle = theme.choice_palette[2]; ctx.fillRect(x0, y0, wPx, hPx);
  ctx.strokeStyle = theme.text; ctx.lineWidth = 2; ctx.strokeRect(x0, y0, wPx, hPx);
  ctx.fillStyle = theme.text; ctx.font = "bold 11px 'Segoe UI'"; ctx.textAlign = "center";
  ctx.fillText(`${length} in`, (x0 + x1) / 2, y1 + 22);
  ctx.save();
  ctx.translate(x0 - 25, (y0 + y1) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`${w} in`, 0, 0);
  ctx.restore();
  return c;
}

function drawTriangleShape(illus, theme) {
  const { base, height } = illus;
  const maxDim = 150;
  const scale = maxDim / Math.max(base, height);
  const bPx = base * scale, hPx = height * scale;
  const pad = 45;
  const c = makeCanvas(bPx + pad * 2, hPx + pad * 1.5);
  const ctx = c.getContext("2d");
  const x0 = pad, y0 = pad + hPx, x1 = x0 + bPx;
  const apexX = x0 + bPx / 2, apexY = pad;
  ctx.beginPath();
  ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(apexX, apexY); ctx.closePath();
  ctx.fillStyle = theme.choice_palette[3]; ctx.fill();
  ctx.strokeStyle = theme.text; ctx.lineWidth = 2; ctx.stroke();
  ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(apexX, apexY); ctx.lineTo(apexX, y0); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = theme.text; ctx.font = "bold 10px 'Segoe UI'"; ctx.textAlign = "center";
  ctx.fillText(`base = ${base} in`, (x0 + x1) / 2, y0 + 20);
  ctx.textAlign = "left";
  ctx.fillText(`height = ${height} in`, apexX + 20, (apexY + y0) / 2);
  return c;
}

function drawCircleMeasure(illus, theme) {
  const rPx = 90, pad = 30;
  const size = rPx * 2 + pad * 2;
  const c = makeCanvas(size, size);
  const ctx = c.getContext("2d");
  const cx = size / 2, cy = size / 2;
  ctx.beginPath(); ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
  ctx.fillStyle = theme.choice_palette[1]; ctx.fill();
  ctx.strokeStyle = theme.text; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + rPx, cy); ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = theme.text; ctx.font = "bold 11px 'Segoe UI'"; ctx.textAlign = "center";
  ctx.fillText(`r = ${illus.radius} in`, cx + rPx / 2, cy - 14);
  ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fillStyle = theme.text; ctx.fill();
  return c;
}

function drawRightTriangleLabeled(illus, theme) {
  const w = 150, h = 130, pad = 30;
  const c = makeCanvas(w + pad * 2, h + pad * 1.4);
  const ctx = c.getContext("2d");
  const x0 = pad, y0 = pad + h, x1 = x0 + w, y1 = y0, x2 = x0, y2 = pad;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.closePath();
  ctx.fillStyle = theme.choice_palette[3]; ctx.fill();
  ctx.strokeStyle = theme.text; ctx.lineWidth = 2; ctx.stroke();
  const mark = 14;
  ctx.strokeRect(x0, y0 - mark, mark, mark);
  ctx.fillStyle = theme.text; ctx.font = "bold 14px 'Segoe UI'"; ctx.textAlign = "center";
  ctx.fillText(illus.right, x0 - 14, y0 + 16);
  ctx.fillText(illus.b, x1 + 14, y1 + 16);
  ctx.fillText(illus.c, x2 - 14, y2 - 4);
  return c;
}

function drawRightTriangleTrig(illus, theme) {
  const { adjacent, opposite, hypotenuse } = illus;
  const maxDim = 130;
  const scale = maxDim / Math.max(adjacent, opposite);
  const wPx = adjacent * scale, hPx = opposite * scale, pad = 50;
  const c = makeCanvas(wPx + pad * 2, hPx + pad * 1.6);
  const ctx = c.getContext("2d");
  const x0 = pad, y0 = pad + hPx, x1 = x0 + wPx, y1 = y0, x2 = x0, y2 = pad;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.closePath();
  ctx.fillStyle = theme.choice_palette[2]; ctx.fill();
  ctx.strokeStyle = theme.text; ctx.lineWidth = 2; ctx.stroke();
  const mark = 14;
  ctx.strokeRect(x0, y0 - mark, mark, mark);
  ctx.beginPath(); ctx.arc(x1, y1, 22, Math.PI * 0.75, Math.PI * 0.75 + Math.PI * 25 / 180);
  ctx.strokeStyle = theme.choice_palette[0]; ctx.stroke();
  ctx.fillStyle = theme.choice_palette[0]; ctx.font = "bold 14px 'Segoe UI'"; ctx.textAlign = "center";
  ctx.fillText("θ", x1 - 32, y1 - 12);
  ctx.fillStyle = theme.text; ctx.font = "bold 10px 'Segoe UI'";
  ctx.fillText(`adjacent = ${adjacent}`, (x0 + x1) / 2, y0 + 18);
  ctx.save(); ctx.translate(x0 - 22, (y0 + y2) / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText(`opposite = ${opposite}`, 0, 0); ctx.restore();
  ctx.fillText(`hyp = ${hypotenuse}`, (x1 + x2) / 2 + 28, (y1 + y2) / 2 - 8);
  return c;
}

function drawEquationBalance(illus, theme) {
  const width = 320, height = 160;
  const c = makeCanvas(width, height);
  const ctx = c.getContext("2d");
  const cx = width / 2, beamY = 35;
  ctx.beginPath();
  ctx.moveTo(cx - 16, beamY + 40); ctx.lineTo(cx + 16, beamY + 40); ctx.lineTo(cx, beamY + 5); ctx.closePath();
  ctx.fillStyle = theme.choice_palette[0]; ctx.fill();
  ctx.strokeStyle = theme.text; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(50, beamY); ctx.lineTo(width - 50, beamY); ctx.lineWidth = 4; ctx.stroke();
  for (const px of [50, width - 50]) {
    ctx.beginPath(); ctx.moveTo(px, beamY); ctx.lineTo(px, beamY + 35); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = theme.choice_palette[2]; ctx.fillRect(px - 42, beamY + 35, 84, 20);
    ctx.strokeStyle = theme.text; ctx.lineWidth = 2; ctx.strokeRect(px - 42, beamY + 35, 84, 20);
  }
  ctx.fillStyle = theme.text; ctx.font = "bold 12px 'Segoe UI'"; ctx.textAlign = "center";
  ctx.fillText(illus.left, 50, beamY + 49);
  ctx.fillText(illus.right, width - 50, beamY + 49);
  ctx.beginPath(); ctx.moveTo(cx, beamY + 40); ctx.lineTo(cx, height - 25); ctx.lineWidth = 4; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 30, height - 25); ctx.lineTo(cx + 30, height - 25); ctx.stroke();
  return c;
}

function drawPolygonShape(illus, theme) {
  const size = 130;
  const c = makeCanvas(size, size);
  const ctx = c.getContext("2d");
  const cx = size / 2, cy = size / 2, r = size / 2 - 15;
  const sides = illus.sides;
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI / 180) * (90 + i * (360 / sides));
    const x = cx + r * Math.cos(angle), y = cy - r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = theme.choice_palette[1]; ctx.fill();
  ctx.strokeStyle = theme.text; ctx.lineWidth = 2; ctx.stroke();
  return c;
}

function drawAngleShape(illus, theme) {
  const size = 150;
  const c = makeCanvas(size, size);
  const ctx = c.getContext("2d");
  const vx = 20, vy = size - 20, length = 105;
  ctx.strokeStyle = theme.text; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + length, vy); ctx.stroke();
  const angleRad = (Math.PI / 180) * illus.degrees;
  const x2 = vx + length * Math.cos(angleRad), y2 = vy - length * Math.sin(angleRad);
  ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.strokeStyle = theme.choice_palette[0]; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(vx, vy, 30, -angleRad, 0); ctx.stroke();
  return c;
}

const COIN_COLORS = { penny: "#B87333", nickel: "#C0C0C0", dime: "#E0E0E0", quarter: "#BDBDBD" };
const COIN_SIZES = { penny: 26, nickel: 30, dime: 22, quarter: 32 };
const COIN_VALUES = { penny: 1, nickel: 5, dime: 10, quarter: 25 };

function drawCoins(illus, theme) {
  const counts = illus.counts;
  const rowH = 40;
  const keys = Object.keys(counts);
  const c = makeCanvas(270, rowH * keys.length + 15);
  const ctx = c.getContext("2d");
  let y = 25;
  for (const coin of keys) {
    const n = counts[coin];
    const d = COIN_SIZES[coin], r = d / 2;
    const shown = Math.min(n, 6);
    for (let i = 0; i < shown; i++) {
      const cx = 25 + r + i * (d + 4);
      ctx.beginPath(); ctx.arc(cx, y, r, 0, Math.PI * 2);
      ctx.fillStyle = COIN_COLORS[coin]; ctx.fill();
      ctx.strokeStyle = theme.text; ctx.stroke();
      ctx.fillStyle = "#333"; ctx.font = "bold 7px 'Segoe UI'"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(COIN_VALUES[coin]), cx, y);
    }
    const labelX = 25 + shown * (d + 4) + 10;
    ctx.fillStyle = theme.text; ctx.font = "bold 10px 'Segoe UI'"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(`× ${n} ${coin}${n > 1 ? "s" : ""}`, labelX, y);
    y += rowH;
  }
  return c;
}

function drawClock(illus, theme) {
  const size = 130;
  const c = makeCanvas(size, size);
  const ctx = c.getContext("2d");
  const cx = size / 2, cy = size / 2, r = size / 2 - 10;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = theme.text; ctx.lineWidth = 3; ctx.stroke();
  for (let h = 0; h < 12; h++) {
    const angle = (Math.PI / 180) * (90 - h * 30);
    const x1 = cx + (r - 10) * Math.cos(angle), y1 = cy - (r - 10) * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle), y2 = cy - r * Math.sin(angle);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  const h12 = illus.hour % 12;
  const hourAngle = (Math.PI / 180) * (90 - (h12 + illus.minute / 60) * 30);
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(cx, cy);
  ctx.lineTo(cx + r * 0.5 * Math.cos(hourAngle), cy - r * 0.5 * Math.sin(hourAngle)); ctx.stroke();
  const minAngle = (Math.PI / 180) * (90 - illus.minute * 6);
  ctx.strokeStyle = theme.choice_palette[0]; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx, cy);
  ctx.lineTo(cx + r * 0.75 * Math.cos(minAngle), cy - r * 0.75 * Math.sin(minAngle)); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fillStyle = theme.text; ctx.fill();
  return c;
}

function drawPlaceValueDigits(illus, theme) {
  const digits = String(illus.num);
  const ndigits = digits.length;
  const placeLabels = ["ones", "tens", "hun.", "thou.", "10-th.", "100-th.", "mil.", "10-mil.", "100-mil."];
  const box = 40, gap = 6;
  const width = ndigits * (box + gap);
  const height = 90;
  const c = makeCanvas(width, height);
  const ctx = c.getContext("2d");
  for (let i = 0; i < ndigits; i++) {
    const posFromRight = ndigits - 1 - i;
    const x0 = i * (box + gap), y0 = 10;
    const isHl = posFromRight === illus.highlight_pos;
    ctx.fillStyle = isHl ? theme.choice_palette[0] : "white";
    ctx.fillRect(x0, y0, box, box);
    ctx.strokeStyle = theme.text; ctx.lineWidth = 2; ctx.strokeRect(x0, y0, box, box);
    ctx.fillStyle = theme.text; ctx.font = "bold 18px 'Segoe UI'"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(digits[i], x0 + box / 2, y0 + box / 2 + 1);
    const label = posFromRight < placeLabels.length ? placeLabels[posFromRight] : "";
    ctx.font = "8px 'Segoe UI'"; ctx.textBaseline = "alphabetic";
    ctx.fillText(label, x0 + box / 2, y0 + box + 20);
  }
  return c;
}

function drawDecimalBars(illus, theme) {
  const values = illus.values;
  const maxRef = Math.max(...values, 1) * 1.15;
  const barWMax = 220, rowH = 34;
  const c = makeCanvas(barWMax + 90, rowH * values.length + 10);
  const ctx = c.getContext("2d");
  const palette = theme.choice_palette;
  let y = 17;
  values.forEach((v, i) => {
    const w = (v / maxRef) * barWMax;
    ctx.fillStyle = palette[i % palette.length]; ctx.fillRect(70, y - 10, w, 20);
    ctx.strokeStyle = theme.text; ctx.strokeRect(70, y - 10, w, 20);
    ctx.fillStyle = theme.text; ctx.font = "bold 10px 'Segoe UI'"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(String(v), 35, y);
    y += rowH;
  });
  return c;
}

function drawWordCards(illus, theme) {
  const words = illus.words;
  const cardW = 100, cardH = 110, gap = 14;
  const n = words.length;
  const c = makeCanvas(n * cardW + (n + 1) * gap, cardH + 20);
  const ctx = c.getContext("2d");
  words.forEach(([word, emoji], i) => {
    const x0 = gap + i * (cardW + gap), y0 = 10;
    ctx.fillStyle = "#FAFAFA"; ctx.fillRect(x0, y0, cardW, cardH);
    ctx.strokeStyle = theme.grad2; ctx.lineWidth = 2; ctx.strokeRect(x0, y0, cardW, cardH);
    if (!drawWordCartoon(ctx, x0 + cardW / 2, y0 + 42, 74, word)) {
      ctx.font = "30px 'Segoe UI Emoji', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(emoji, x0 + cardW / 2, y0 + 42);
    }
    ctx.fillStyle = theme.text; ctx.font = "bold 13px 'Segoe UI'"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillText(word, x0 + cardW / 2, y0 + 88);
  });
  return c;
}

function drawScene(illus, theme) {
  const words = illus.words;
  const n = Math.max(1, words.length);
  const width = 130 * n + 30, height = 175;
  const groundY = height * 0.62;
  const c = makeCanvas(width, height);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#BBDEFB"; ctx.fillRect(0, 0, width, groundY);
  ctx.beginPath(); ctx.ellipse((width - 55 + width - 18) / 2, (12 + 49) / 2, (width - 18 - (width - 55)) / 2, (49 - 12) / 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#FFCA28"; ctx.fill();
  ctx.fillStyle = "#AED581"; ctx.fillRect(0, groundY, width, height - groundY);
  const spacing = width / (n + 1);
  words.forEach(([word, emoji], i) => {
    const cx = spacing * (i + 1), cy = groundY - 42;
    if (!drawWordCartoon(ctx, cx, cy, 100, word)) {
      ctx.font = "48px 'Segoe UI Emoji', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(emoji, cx, cy);
    }
    ctx.fillStyle = "#333"; ctx.font = "bold 10px 'Segoe UI'"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillText(word, cx, height - 14);
  });
  return c;
}

function drawBarChart(chart, theme, width = 520, height = 220) {
  const { categories, values } = chart;
  const c = makeCanvas(width, height);
  const ctx = c.getContext("2d");
  const maxVal = Math.max(...values, 1);
  const n = categories.length;
  const baseY = height - 45, topY = 20, usableH = baseY - topY, margin = 20;
  const slotW = (width - 2 * margin) / n, barW = slotW * 0.55;
  const palette = theme.choice_palette;
  categories.forEach((cat, i) => {
    const val = values[i];
    const barH = (val / maxVal) * usableH;
    const x0 = margin + i * slotW + (slotW - barW) / 2, x1 = x0 + barW;
    const y1 = baseY, y0 = baseY - barH;
    ctx.fillStyle = palette[i % palette.length]; ctx.fillRect(x0, y0, barW, y1 - y0);
    ctx.strokeStyle = theme.text; ctx.strokeRect(x0, y0, barW, y1 - y0);
    ctx.font = "bold 10px 'Segoe UI'"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillText(String(val), (x0 + x1) / 2, y0 - 10);
    ctx.font = "9px 'Segoe UI'";
    ctx.fillText(String(cat), (x0 + x1) / 2, baseY + 20);
  });
  ctx.strokeStyle = theme.text;
  ctx.beginPath(); ctx.moveTo(margin - 5, baseY); ctx.lineTo(width - margin + 5, baseY); ctx.stroke();
  return c;
}

function drawPictograph(chart, theme) {
  const { categories, values, unit } = chart;
  const icon = "⭐";
  const rowH = 36;
  const maxIcons = Math.max(...values.map((v) => Math.floor(v / unit)), 1);
  const width = 150 + maxIcons * 28, height = rowH * categories.length + 40;
  const c = makeCanvas(width, height);
  const ctx = c.getContext("2d");
  let y = 22;
  categories.forEach((cat, i) => {
    ctx.fillStyle = theme.text; ctx.font = "bold 10px 'Segoe UI'"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(String(cat), 8, y);
    const nIcons = Math.floor(values[i] / unit);
    ctx.font = "16px 'Segoe UI Emoji', sans-serif"; ctx.textAlign = "center";
    for (let k = 0; k < nIcons; k++) ctx.fillText(icon, 150 + k * 28, y);
    y += rowH;
  });
  ctx.fillStyle = "#777"; ctx.font = "italic 9px 'Segoe UI'"; ctx.textAlign = "center";
  ctx.fillText(`Each ${icon} = ${unit}`, width / 2, height - 14);
  return c;
}

function drawDataPie(chart, theme) {
  const { categories, values } = chart;
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const r = 70;
  const size = 2 * r + 24;
  const c = makeCanvas(size + 150, size);
  const ctx = c.getContext("2d");
  const cx = size / 2, cy = size / 2;
  const palette = theme.choice_palette.concat(["#B39DDB", "#80CBC4", "#FFAB91"]);
  let start = -Math.PI / 2;
  values.forEach((val, i) => {
    const extent = (val / total) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + extent);
    ctx.closePath();
    ctx.fillStyle = palette[i % palette.length]; ctx.fill();
    ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.stroke();
    start += extent;
  });
  let ly = 20;
  categories.forEach((cat, i) => {
    ctx.fillStyle = palette[i % palette.length]; ctx.fillRect(size + 10, ly, 14, 14);
    ctx.fillStyle = theme.text; ctx.font = "9px 'Segoe UI'"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(String(cat), size + 30, ly + 7);
    ly += 22;
  });
  return c;
}

function drawLineGraph(chart, theme) {
  const { categories, values } = chart;
  const width = 400, height = 210, margin = 32;
  const c = makeCanvas(width, height);
  const ctx = c.getContext("2d");
  const maxVal = Math.max(...values, 1);
  const n = categories.length;
  const stepX = (width - 2 * margin) / Math.max(1, n - 1);
  const pt = (i) => [margin + i * stepX, height - margin - (values[i] / maxVal) * (height - 2 * margin)];
  ctx.strokeStyle = theme.grad1; ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const [x, y] = pt(i);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  for (let i = 0; i < n; i++) {
    const [x, y] = pt(i);
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = theme.choice_palette[0]; ctx.fill();
    ctx.strokeStyle = theme.text; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = theme.text; ctx.font = "8px 'Segoe UI'"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillText(String(categories[i]).slice(0, 9), x, height - margin + 15);
    ctx.font = "bold 9px 'Segoe UI'";
    ctx.fillText(String(values[i]), x, y - 14);
  }
  ctx.strokeStyle = theme.text; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(margin, height - margin); ctx.lineTo(width - margin + 10, height - margin); ctx.stroke();
  return c;
}

function drawLinePlot(chart, theme) {
  const { points, max_range: maxRange } = chart;
  const counts = {};
  for (let v = 0; v <= maxRange; v++) counts[v] = points.filter((p) => p === v).length;
  const maxFreq = Math.max(...Object.values(counts), 1);
  const nVals = maxRange + 1;
  const slotW = 42;
  const width = slotW * nVals + 20, height = 28 * maxFreq + 55;
  const c = makeCanvas(width, height);
  const ctx = c.getContext("2d");
  const baseY = height - 30;
  for (let v = 0; v < nVals; v++) {
    const x = 20 + v * slotW + slotW / 2;
    ctx.fillStyle = theme.text; ctx.font = "bold 10px 'Segoe UI'"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillText(String(v), x, baseY + 16);
    for (let i = 0; i < (counts[v] || 0); i++) {
      const y = baseY - i * 26 - 10;
      ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = theme.choice_palette[0]; ctx.fill();
      ctx.strokeStyle = theme.text; ctx.stroke();
    }
  }
  ctx.strokeStyle = theme.text;
  ctx.beginPath(); ctx.moveTo(20, baseY); ctx.lineTo(width - 10, baseY); ctx.stroke();
  return c;
}

function drawTallyChart(chart, theme) {
  const { categories, values } = chart;
  const rowH = 40;
  const maxVal = Math.max(...values, 1);
  const nGroups = Math.ceil(maxVal / 5);
  const groupW = 32;
  const width = 150 + nGroups * groupW + 20, height = rowH * categories.length + 20;
  const c = makeCanvas(width, height);
  const ctx = c.getContext("2d");
  let y = 24;
  categories.forEach((cat, ci) => {
    const val = values[ci];
    ctx.fillStyle = theme.text; ctx.font = "bold 10px 'Segoe UI'"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(String(cat), 8, y);
    let x = 150, remaining = val;
    ctx.strokeStyle = theme.text; ctx.lineWidth = 2;
    while (remaining > 0) {
      const n = Math.min(5, remaining);
      for (let i = 0; i < Math.min(n, 4); i++) {
        const lx = x + i * 6;
        ctx.beginPath(); ctx.moveTo(lx, y - 10); ctx.lineTo(lx, y + 10); ctx.stroke();
      }
      if (n === 5) {
        ctx.beginPath(); ctx.moveTo(x - 3, y + 10); ctx.lineTo(x + 21, y - 10); ctx.stroke();
      }
      x += groupW;
      remaining -= n;
    }
    y += rowH;
  });
  ctx.lineWidth = 1;
  return c;
}

function drawVennDiagram(chart, theme) {
  const { label_a: labelA, label_b: labelB, only_a: onlyA, only_b: onlyB, both } = chart;
  const width = 340, height = 220;
  const c = makeCanvas(width, height);
  const ctx = c.getContext("2d");
  const r = 75, cy = height / 2 + 15;
  const cxA = width / 2 - 45, cxB = width / 2 + 45;
  ctx.strokeStyle = theme.choice_palette[0]; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cxA, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = theme.choice_palette[1];
  ctx.beginPath(); ctx.arc(cxB, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = theme.text; ctx.font = "bold 10px 'Segoe UI'"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(labelA, cxA - 45, cy - r - 16);
  ctx.fillText(labelB, cxB + 45, cy - r - 16);
  ctx.font = "bold 20px 'Segoe UI'";
  ctx.fillText(String(onlyA), cxA - 35, cy);
  ctx.fillText(String(both), (cxA + cxB) / 2, cy);
  ctx.fillText(String(onlyB), cxB + 35, cy);
  return c;
}

function drawFlowchart(chart, theme) {
  const steps = chart.steps;
  const boxW = 140, boxH = 40, gap = 26;
  const n = steps.length;
  const width = boxW + 40, height = n * boxH + (n - 1) * gap + 20;
  const c = makeCanvas(width, height);
  const ctx = c.getContext("2d");
  const x0 = 20;
  let y = 10;
  const palette = theme.choice_palette;
  steps.forEach((step, i) => {
    ctx.fillStyle = palette[i % palette.length]; ctx.fillRect(x0, y, boxW, boxH);
    ctx.strokeStyle = theme.text; ctx.lineWidth = 2; ctx.strokeRect(x0, y, boxW, boxH);
    ctx.fillStyle = theme.text; ctx.font = "bold 9px 'Segoe UI'"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    wrapText(ctx, step, x0 + boxW / 2, y + boxH / 2, boxW - 10, 11);
    if (i < n - 1) {
      const ax = x0 + boxW / 2, ay0 = y + boxH, ay1 = y + boxH + gap;
      ctx.beginPath(); ctx.moveTo(ax, ay0); ctx.lineTo(ax, ay1); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ax, ay1); ctx.lineTo(ax - 5, ay1 - 8); ctx.lineTo(ax + 5, ay1 - 8); ctx.closePath();
      ctx.fillStyle = theme.text; ctx.fill();
    }
    y += boxH + gap;
  });
  return c;
}

function wrapText(ctx, text, cx, cy, maxWidth, lineHeight) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const startY = cy - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, cx, startY + i * lineHeight));
}

const CHART_DRAWERS = {
  line_plot: drawLinePlot,
  venn: drawVennDiagram,
  flowchart: drawFlowchart,
  pictograph: drawPictograph,
  pie: drawDataPie,
  line_graph: drawLineGraph,
  tally: drawTallyChart,
};

function drawChart(chart, theme) {
  const fn = CHART_DRAWERS[chart.kind];
  if (fn) return fn(chart, theme);
  return drawBarChart(chart, theme);
}

const ILLUSTRATION_DRAWERS = {
  dots_add: drawDotsAdd,
  make_ten: drawMakeTen,
  dots_sub: drawDotsSub,
  array: drawArray,
  grouping: drawGrouping,
  fraction_pies: drawFractionPies,
  percent_grid: drawPercentGrid,
  percent_bar: drawPercentBar,
  rectangle: drawRectangleShape,
  triangle: drawTriangleShape,
  circle_measure: drawCircleMeasure,
  right_triangle_labeled: drawRightTriangleLabeled,
  right_triangle_trig: drawRightTriangleTrig,
  equation_balance: drawEquationBalance,
  polygon_shape: drawPolygonShape,
  angle: drawAngleShape,
  coins: drawCoins,
  clock: drawClock,
  place_value_digits: drawPlaceValueDigits,
  decimal_bars: drawDecimalBars,
  word_cards: drawWordCards,
  scene: drawScene,
};

function drawIllustration(illus, theme) {
  const fn = ILLUSTRATION_DRAWERS[illus.type];
  return fn ? fn(illus, theme) : null;
}

function drawQVisual(q, theme) {
  // Mirrors _draw_q_visual: chart takes priority over illustration, matching the
  // Python dispatcher's precedence.
  if (q.chart) return drawChart(q.chart, theme);
  if (q.illustration) return drawIllustration(q.illustration, theme);
  return null;
}
