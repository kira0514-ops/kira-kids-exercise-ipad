// Port of kids_exercise_app.py's _toon_* cartoon-word template engine (30 reusable
// parameterized drawing templates + the WORD_CARTOON dispatch table, already in data.js).
// Unlike illustrations.js's draw* functions (which each create their own canvas), these
// draw directly onto an existing ctx at a given (cx, cy) -- mirroring the Python methods,
// which draw onto an existing tk.Canvas -- so multiple words can share one canvas
// (flashcard badges, word_cards, scenes).

const TOON_OUTLINE = "#3a3a3a";

function toonEllipse(ctx, x1, y1, x2, y2, fill, outline, width) {
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
  const rx = Math.max(Math.abs(x2 - x1) / 2, 0.1), ry = Math.max(Math.abs(y2 - y1) / 2, 0.1);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (outline) { ctx.strokeStyle = outline; ctx.lineWidth = width || 1; ctx.stroke(); }
}

function toonPoly(ctx, pts, fill, outline, width, smooth) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  if (smooth) {
    for (let i = 0; i < pts.length; i++) {
      const p0 = pts[i], p1 = pts[(i + 1) % pts.length];
      ctx.quadraticCurveTo(p0[0], p0[1], (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2);
    }
  } else {
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (outline) { ctx.strokeStyle = outline; ctx.lineWidth = width || 1; ctx.stroke(); }
}

function toonLine(ctx, pts, fill, width, smooth, cap) {
  ctx.beginPath();
  ctx.lineCap = cap || "butt";
  ctx.moveTo(pts[0][0], pts[0][1]);
  if (smooth && pts.length > 2) {
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i], p1 = pts[i + 1];
      ctx.quadraticCurveTo(p0[0], p0[1], (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2);
    }
    ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  } else {
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  }
  ctx.strokeStyle = fill; ctx.lineWidth = width || 1; ctx.stroke();
  ctx.lineCap = "butt";
}

function toonRect(ctx, x1, y1, x2, y2, fill, outline, width) {
  const x = Math.min(x1, x2), y = Math.min(y1, y2), w = Math.abs(x2 - x1), h = Math.abs(y2 - y1);
  if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); }
  if (outline) { ctx.strokeStyle = outline; ctx.lineWidth = width || 1; ctx.strokeRect(x, y, w, h); }
}

function toonArcOutline(ctx, x1, y1, x2, y2, startDeg, extentDeg, outline, width) {
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
  const rx = Math.max(Math.abs(x2 - x1) / 2, 0.1), ry = Math.max(Math.abs(y2 - y1) / 2, 0.1);
  const startRad = (-startDeg * Math.PI) / 180;
  const endRad = (-(startDeg + extentDeg) * Math.PI) / 180;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, startRad, endRad, extentDeg > 0);
  ctx.strokeStyle = outline; ctx.lineWidth = width || 1; ctx.stroke();
}

function toonArcPie(ctx, x1, y1, x2, y2, startDeg, extentDeg, fill, outline, width) {
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
  const rx = Math.max(Math.abs(x2 - x1) / 2, 0.1), ry = Math.max(Math.abs(y2 - y1) / 2, 0.1);
  const startRad = (-startDeg * Math.PI) / 180;
  const endRad = (-(startDeg + extentDeg) * Math.PI) / 180;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.ellipse(cx, cy, rx, ry, 0, startRad, endRad, extentDeg > 0);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (outline) { ctx.strokeStyle = outline; ctx.lineWidth = width || 1; ctx.stroke(); }
}

// -- templates ---------------------------------------------------------------

function toonRoundAnimal(ctx, cx, cy, size, p) {
  const bodyColor = p.body_color, ear = p.ear || "round", snout = p.snout !== false,
    tail = p.tail || "short", pattern = p.pattern || null, eyeColor = p.eye_color || "#222",
    horn = !!p.horn, trunk = !!p.trunk, wings = !!p.wings, bulgeEyes = !!p.bulge_eyes, legs = !!p.legs;
  const r = size * 0.42, earR = r * 0.34;
  if (wings) {
    for (const sx of [-1, 1]) {
      const bx = cx + sx * r * 0.95;
      toonPoly(ctx, [[cx + sx * r * 0.55, cy - r * 0.1], [bx, cy - r * 0.6],
        [bx + sx * r * 0.1, cy + r * 0.1], [cx + sx * r * 0.6, cy + r * 0.4]], bodyColor, TOON_OUTLINE, 2, true);
    }
  }
  if (ear === "round") {
    for (const sx of [-1, 1]) {
      const ex = cx + sx * r * 0.62;
      toonEllipse(ctx, ex - earR, cy - r * 0.95 - earR, ex + earR, cy - r * 0.95 + earR * 0.6, bodyColor, TOON_OUTLINE, 2);
    }
  } else if (ear === "pointy") {
    for (const sx of [-1, 1]) {
      const bx = cx + sx * r * 0.55;
      toonPoly(ctx, [[bx - r * 0.28, cy - r * 0.55], [bx + sx * r * 0.05, cy - r * 1.55], [bx + r * 0.28, cy - r * 0.55]],
        bodyColor, TOON_OUTLINE, 2);
    }
  } else if (ear === "floppy") {
    for (const sx of [-1, 1]) {
      const ex = cx + sx * r * 0.85;
      toonEllipse(ctx, ex - r * 0.22, cy - r * 0.5, ex + r * 0.22, cy + r * 0.65, bodyColor, TOON_OUTLINE, 2);
    }
  }
  toonEllipse(ctx, cx - r, cy - r * 0.85, cx + r, cy + r * 1.05, bodyColor, TOON_OUTLINE, 2);
  if (horn) {
    toonPoly(ctx, [[cx - 6, cy - r * 0.95], [cx, cy - r * 1.6], [cx + 6, cy - r * 0.95]], "#FFECB3", TOON_OUTLINE, 2);
  }
  if (pattern === "spots") {
    for (const [dx, dy] of [[-0.4, -0.1], [0.3, 0.2], [-0.1, 0.5], [0.5, -0.3]]) {
      toonEllipse(ctx, cx + dx * r - 6, cy + dy * r - 6, cx + dx * r + 6, cy + dy * r + 6, "#5D4037", null);
    }
  } else if (pattern === "stripes") {
    for (const dy of [-0.4, -0.1, 0.2, 0.5]) {
      toonLine(ctx, [[cx - r * 0.8, cy + dy * r], [cx + r * 0.8, cy + dy * r - 6]], "#222", 4);
    }
  }
  if (bulgeEyes) {
    for (const sx of [-1, 1]) {
      const ex = cx + sx * r * 0.35;
      toonEllipse(ctx, ex - 13, cy - r * 0.85 - 13, ex + 13, cy - r * 0.85 + 13, bodyColor, TOON_OUTLINE, 2);
      toonEllipse(ctx, ex - 6, cy - r * 0.85 - 6, ex + 6, cy - r * 0.85 + 6, eyeColor);
      toonEllipse(ctx, ex - 2, cy - r * 0.85 - 4, ex + 2, cy - r * 0.85, "white");
    }
  } else {
    for (const sx of [-1, 1]) {
      const ex = cx + sx * r * 0.32;
      toonEllipse(ctx, ex - 6, cy - r * 0.22 - 6, ex + 6, cy - r * 0.22 + 6, eyeColor);
      toonEllipse(ctx, ex - 2, cy - r * 0.22 - 4, ex + 2, cy - r * 0.22, "white");
    }
  }
  if (trunk) {
    toonLine(ctx, [[cx, cy + r * 0.1], [cx + r * 0.05, cy + r * 0.55], [cx - r * 0.15, cy + r * 0.85]],
      bodyColor, Math.max(4, r * 0.22), true, "round");
    toonEllipse(ctx, cx - 5, cy + r * 0.05, cx + 5, cy + r * 0.17, TOON_OUTLINE);
  } else if (snout) {
    toonEllipse(ctx, cx - r * 0.22, cy + r * 0.05, cx + r * 0.22, cy + r * 0.38, "#FFF3E0", TOON_OUTLINE);
    toonEllipse(ctx, cx - 5, cy + r * 0.1, cx + 5, cy + r * 0.22, TOON_OUTLINE);
  } else {
    toonEllipse(ctx, cx - 5, cy + r * 0.05, cx + 5, cy + r * 0.17, TOON_OUTLINE);
  }
  if (legs) {
    for (const sx of [-1, 1]) {
      const lx = cx + sx * r * 0.5;
      toonLine(ctx, [[lx, cy + r * 0.9], [lx + sx * r * 0.35, cy + r * 1.3], [lx + sx * r * 0.15, cy + r * 1.45]],
        bodyColor, Math.max(4, r * 0.22), true, "round");
    }
  }
  if (tail !== "none") {
    const tx = cx + r * 0.95, ty = cy + r * 0.55;
    if (tail === "long") {
      toonLine(ctx, [[tx, ty], [tx + r * 0.7, ty - r * 0.5], [tx + r * 0.4, ty - r * 0.9]], bodyColor, 6, true, "round");
    } else if (tail === "fluffy") {
      toonEllipse(ctx, tx, ty - r * 0.25, tx + r * 0.5, ty + r * 0.25, bodyColor, TOON_OUTLINE, 2);
    } else {
      toonLine(ctx, [[tx, ty], [tx + r * 0.35, ty - r * 0.25]], bodyColor, 6, false, "round");
    }
  }
}

function toonBird(ctx, cx, cy, size, p) {
  const bodyColor = p.body_color, beakColor = p.beak_color || "#FFA726";
  const r = size * 0.4;
  toonPoly(ctx, [[cx - r * 0.9, cy + r * 0.3], [cx - r * 1.3, cy - r * 0.1], [cx - r * 0.6, cy + r * 0.55]], bodyColor, TOON_OUTLINE, 2);
  toonEllipse(ctx, cx - r * 0.9, cy - r * 0.3, cx + r * 0.6, cy + r * 0.95, bodyColor, TOON_OUTLINE, 2);
  toonEllipse(ctx, cx - r * 0.35, cy - r * 1.15, cx + r * 0.65, cy - r * 0.15, bodyColor, TOON_OUTLINE, 2);
  toonPoly(ctx, [[cx + r * 0.55, cy - r * 0.75], [cx + r * 1.05, cy - r * 0.6], [cx + r * 0.55, cy - r * 0.45]], beakColor, TOON_OUTLINE);
  toonEllipse(ctx, cx + r * 0.1, cy - r * 0.9, cx + r * 0.25, cy - r * 0.75, "black");
  toonPoly(ctx, [[cx - r * 0.1, cy + r * 0.85], [cx - r * 0.35, cy + r * 1.2], [cx + r * 0.1, cy + r * 1.05], [cx + r * 0.05, cy + r * 0.85]], beakColor, TOON_OUTLINE);
}

function toonFish(ctx, cx, cy, size, p) {
  const bodyColor = p.body_color, tailStyle = p.tail_style || "fin", blowhole = !!p.blowhole;
  const r = size * 0.42;
  toonEllipse(ctx, cx - r * 0.8, cy - r * 0.55, cx + r * 0.75, cy + r * 0.55, bodyColor, TOON_OUTLINE, 2);
  if (tailStyle === "fluke") {
    toonPoly(ctx, [[cx + r * 0.55, cy], [cx + r * 1.15, cy - r * 0.55], [cx + r * 0.95, cy], [cx + r * 1.15, cy + r * 0.55]], bodyColor, TOON_OUTLINE, 2);
  } else {
    toonPoly(ctx, [[cx + r * 0.55, cy], [cx + r * 1.3, cy - r * 0.5], [cx + r * 1.3, cy + r * 0.5]], bodyColor, TOON_OUTLINE, 2);
  }
  toonPoly(ctx, [[cx - r * 0.1, cy - r * 0.5], [cx + r * 0.15, cy - r * 0.95], [cx + r * 0.35, cy - r * 0.45]], bodyColor, TOON_OUTLINE);
  toonEllipse(ctx, cx - r * 0.45 - 5, cy - r * 0.1 - 5, cx - r * 0.45 + 5, cy - r * 0.1 + 5, "black");
  toonLine(ctx, [[cx - r * 0.1, cy + r * 0.15], [cx + r * 0.25, cy + r * 0.15]], TOON_OUTLINE, 2);
  if (blowhole) {
    toonLine(ctx, [[cx - r * 0.3, cy - r * 0.55], [cx - r * 0.3, cy - r * 0.85]], "#42A5F5", 3);
    toonArcOutline(ctx, cx - r * 0.45, cy - r * 1.0, cx - r * 0.15, cy - r * 0.7, 20, 140, "#42A5F5", 2);
  }
}

function toonInsect(ctx, cx, cy, size, p) {
  const bodyColor = p.body_color, stripeColor = p.stripe_color || null, wings = p.wings !== false;
  const r = size * 0.3;
  if (wings) {
    toonEllipse(ctx, cx - r * 1.3, cy - r * 1.0, cx - r * 0.2, cy - r * 0.1, "#E1F5FE", TOON_OUTLINE);
    toonEllipse(ctx, cx + r * 0.2, cy - r * 1.0, cx + r * 1.3, cy - r * 0.1, "#E1F5FE", TOON_OUTLINE);
  }
  toonEllipse(ctx, cx - r * 0.55, cy - r * 0.3, cx + r * 0.55, cy + r * 1.1, bodyColor, TOON_OUTLINE, 2);
  toonEllipse(ctx, cx - r * 0.4, cy - r * 1.0, cx + r * 0.4, cy - r * 0.25, bodyColor, TOON_OUTLINE, 2);
  if (stripeColor) {
    for (const dy of [0.05, 0.4, 0.75]) toonLine(ctx, [[cx - r * 0.5, cy + dy * r * 1.4], [cx + r * 0.5, cy + dy * r * 1.4]], stripeColor, 4);
  }
  toonEllipse(ctx, cx - r * 0.15 - 3, cy - r * 0.65 - 3, cx - r * 0.15 + 3, cy - r * 0.65 + 3, "black");
  toonEllipse(ctx, cx + r * 0.15 - 3, cy - r * 0.65 - 3, cx + r * 0.15 + 3, cy - r * 0.65 + 3, "black");
  toonLine(ctx, [[cx - r * 0.15, cy - r * 1.0], [cx - r * 0.3, cy - r * 1.3]], TOON_OUTLINE, 2);
  toonLine(ctx, [[cx + r * 0.15, cy - r * 1.0], [cx + r * 0.3, cy - r * 1.3]], TOON_OUTLINE, 2);
}

function toonRoundFood(ctx, cx, cy, size, p) {
  const color = p.color, stem = p.stem !== false, leaf = !!p.leaf, shine = p.shine !== false, kind = p.kind || "round";
  const r = size * 0.42;
  if (kind === "pear") {
    toonEllipse(ctx, cx - r * 0.85, cy - r * 0.35, cx + r * 0.85, cy + r * 1.15, color, TOON_OUTLINE, 2);
    toonEllipse(ctx, cx - r * 0.55, cy - r * 1.05, cx + r * 0.55, cy - r * 0.05, color, TOON_OUTLINE, 2);
  } else {
    toonEllipse(ctx, cx - r, cy - r * 0.85, cx + r, cy + r * 1.05, color, TOON_OUTLINE, 2);
  }
  if (shine) toonEllipse(ctx, cx - r * 0.45, cy - r * 0.55, cx - r * 0.1, cy - r * 0.2, "white", null);
  const topY = kind === "pear" ? cy - r * 1.05 : cy - r * 0.85;
  if (stem) toonLine(ctx, [[cx, topY], [cx + r * 0.15, topY - r * 0.35]], "#6D4C41", 4);
  if (leaf) toonEllipse(ctx, cx + r * 0.1, topY - r * 0.4, cx + r * 0.55, topY - r * 0.1, "#66BB6A", TOON_OUTLINE);
}

function toonVehicle(ctx, cx, cy, size, p) {
  const bodyColor = p.body_color, wheels = p.wheels || 2, cabin = p.cabin !== false;
  const w = size * 0.9, h = size * 0.4, x0 = cx - w / 2, y0 = cy - h / 2;
  toonRect(ctx, x0, y0, x0 + w, y0 + h, bodyColor, TOON_OUTLINE, 2);
  if (cabin) {
    toonPoly(ctx, [[x0 + w * 0.15, y0], [x0 + w * 0.35, y0 - h * 0.7], [x0 + w * 0.75, y0 - h * 0.7], [x0 + w * 0.85, y0]], bodyColor, TOON_OUTLINE, 2);
    toonRect(ctx, x0 + w * 0.4, y0 - h * 0.55, x0 + w * 0.7, y0 - h * 0.05, "#B3E5FC", TOON_OUTLINE);
  }
  const positions = wheels === 2 ? [x0 + w * 0.28, x0 + w * 0.72] : [x0 + w * 0.2, x0 + w * 0.5, x0 + w * 0.8];
  const wr = h * 0.32;
  for (const wx of positions) {
    toonEllipse(ctx, wx - wr, y0 + h - wr * 0.7, wx + wr, y0 + h + wr * 1.3, "#333", "#111", 2);
    toonEllipse(ctx, wx - wr * 0.35, y0 + h - wr * 0.1, wx + wr * 0.35, y0 + h + wr * 0.6, "#888");
  }
}

function toonBuilding(ctx, cx, cy, size, p) {
  const wallColor = p.wall_color, roofColor = p.roof_color, door = p.door !== false, kind = p.kind || "house";
  const w = size * 0.75, h = size * 0.55, x0 = cx - w / 2, y0 = cy - h / 2 + size * 0.1;
  if (kind === "tent") {
    toonPoly(ctx, [[x0 - size * 0.05, y0 + h], [cx, y0 - h * 0.55], [x0 + w + size * 0.05, y0 + h]], wallColor, TOON_OUTLINE, 2);
    toonPoly(ctx, [[cx, y0 - h * 0.55], [cx - w * 0.16, y0 + h], [cx + w * 0.16, y0 + h]], roofColor, TOON_OUTLINE, 2);
    toonLine(ctx, [[cx, y0 - h * 0.55], [cx, y0 + h]], TOON_OUTLINE, 2);
  } else if (kind === "igloo") {
    toonArcPie(ctx, x0, y0 - h * 0.5, x0 + w, y0 + h * 0.6, 0, 180, wallColor, TOON_OUTLINE, 2);
    toonRect(ctx, x0, y0 + h * 0.1, x0 + w, y0 + h * 0.6, wallColor, TOON_OUTLINE, 2);
    toonArcPie(ctx, cx - w * 0.18, y0 - h * 0.1, cx + w * 0.18, y0 + h * 0.6, 0, 180, roofColor, TOON_OUTLINE, 2);
    for (const dy of [0.05, 0.3]) toonLine(ctx, [[x0, y0 + h * (0.2 + dy)], [x0 + w, y0 + h * (0.2 + dy)]], TOON_OUTLINE, 1);
  } else {
    toonRect(ctx, x0, y0, x0 + w, y0 + h, wallColor, TOON_OUTLINE, 2);
    toonPoly(ctx, [[x0 - size * 0.08, y0], [cx, y0 - h * 0.75], [x0 + w + size * 0.08, y0]], roofColor, TOON_OUTLINE, 2);
    if (door) toonRect(ctx, cx - w * 0.12, y0 + h * 0.45, cx + w * 0.12, y0 + h, "#6D4C41", TOON_OUTLINE);
    toonRect(ctx, x0 + w * 0.18, y0 + h * 0.2, x0 + w * 0.38, y0 + h * 0.42, "#B3E5FC", TOON_OUTLINE);
    toonRect(ctx, x0 + w * 0.62, y0 + h * 0.2, x0 + w * 0.82, y0 + h * 0.42, "#B3E5FC", TOON_OUTLINE);
  }
}

function toonContainer(ctx, cx, cy, size, p) {
  const color = p.color, kind = p.kind || "cup", lidColor = p.lid_color || null, handle = !!p.handle, spout = !!p.spout;
  const w = size * 0.55, h = size * 0.6, x0 = cx - w / 2, y0 = cy - h / 2;
  if (kind === "jar") {
    toonRect(ctx, x0, y0 + h * 0.15, x0 + w, y0 + h, color, TOON_OUTLINE, 2);
    toonRect(ctx, x0 + w * 0.15, y0, x0 + w * 0.85, y0 + h * 0.18, lidColor || "#8D6E63", TOON_OUTLINE, 2);
    if (handle) toonArcOutline(ctx, x0 - w * 0.3, y0 + h * 0.25, x0 + w * 0.1, y0 + h * 0.85, 80, 200, TOON_OUTLINE, 4);
    if (spout) toonPoly(ctx, [[x0 + w * 0.9, y0 + h * 0.3], [x0 + w * 1.25, y0 + h * 0.1], [x0 + w * 1.05, y0 + h * 0.45]], color, TOON_OUTLINE, 2);
  } else if (kind === "box") {
    toonRect(ctx, x0, y0, x0 + w, y0 + h, color, TOON_OUTLINE, 2);
    toonLine(ctx, [[cx, y0], [cx, y0 + h]], TOON_OUTLINE, 2);
    toonLine(ctx, [[x0, y0 + h * 0.15], [x0 + w, y0 + h * 0.15]], TOON_OUTLINE, 2);
  } else if (kind === "bag") {
    toonPoly(ctx, [[x0 + w * 0.1, y0], [x0 + w * 0.9, y0], [x0 + w, y0 + h], [x0, y0 + h]], color, TOON_OUTLINE, 2);
    toonArcOutline(ctx, x0 + w * 0.25, y0 - h * 0.25, x0 + w * 0.75, y0 + h * 0.15, 0, 180, TOON_OUTLINE, 3);
  } else if (kind === "tub") {
    toonRect(ctx, x0 - w * 0.15, y0 + h * 0.35, x0 + w * 1.15, y0 + h, color, TOON_OUTLINE, 2);
    toonArcOutline(ctx, x0 - w * 0.25, y0 + h * 0.15, x0 + w * 0.05, y0 + h * 0.55, 90, 180, TOON_OUTLINE, 3);
    toonArcOutline(ctx, x0 + w * 0.95, y0 + h * 0.15, x0 + w * 1.25, y0 + h * 0.55, -90, 180, TOON_OUTLINE, 3);
  } else {
    toonRect(ctx, x0, y0 + h * 0.1, x0 + w * 0.8, y0 + h, color, TOON_OUTLINE, 2);
    toonArcOutline(ctx, x0 + w * 0.65, y0 + h * 0.25, x0 + w * 1.15, y0 + h * 0.75, 270, 180, TOON_OUTLINE, 4);
  }
}

function toonClothing(ctx, cx, cy, size, p) {
  const color = p.color, kind = p.kind || "shirt";
  const w = size * 0.7, h = size * 0.65, x0 = cx - w / 2, y0 = cy - h / 2;
  if (kind === "hat") {
    toonEllipse(ctx, x0, y0 + h * 0.55, x0 + w, y0 + h * 0.75, color, TOON_OUTLINE, 2);
    toonPoly(ctx, [[x0 + w * 0.25, y0 + h * 0.6], [x0 + w * 0.3, y0], [x0 + w * 0.7, y0], [x0 + w * 0.75, y0 + h * 0.6]], color, TOON_OUTLINE, 2);
  } else if (kind === "sock") {
    toonRect(ctx, x0 + w * 0.2, y0, x0 + w * 0.8, y0 + h * 0.6, color, TOON_OUTLINE, 2);
    toonPoly(ctx, [[x0 + w * 0.2, y0 + h * 0.6], [x0 + w * 0.8, y0 + h * 0.6], [x0 + w, y0 + h], [x0 + w * 0.15, y0 + h]], color, TOON_OUTLINE, 2);
  } else if (kind === "glove") {
    toonEllipse(ctx, x0 + w * 0.15, y0 + h * 0.25, x0 + w * 0.85, y0 + h, color, TOON_OUTLINE, 2);
    for (let i = 0; i < 4; i++) {
      const fx = x0 + w * (0.2 + i * 0.16);
      toonEllipse(ctx, fx, y0, fx + w * 0.14, y0 + h * 0.4, color, TOON_OUTLINE, 2);
    }
  } else if (kind === "mitt") {
    toonEllipse(ctx, x0 + w * 0.1, y0 + h * 0.15, x0 + w * 0.9, y0 + h, color, TOON_OUTLINE, 2);
    toonEllipse(ctx, x0 - w * 0.05, y0 + h * 0.35, x0 + w * 0.35, y0 + h * 0.75, color, TOON_OUTLINE, 2);
  } else if (kind === "dress") {
    toonPoly(ctx, [[x0 + w * 0.3, y0], [x0 + w * 0.7, y0], [x0 + w, y0 + h], [x0, y0 + h]], color, TOON_OUTLINE, 2);
    toonEllipse(ctx, x0 + w * 0.25, y0 - h * 0.12, x0 + w * 0.75, y0 + h * 0.12, color, TOON_OUTLINE, 2);
  } else if (kind === "pants") {
    toonRect(ctx, x0 + w * 0.1, y0, x0 + w * 0.9, y0 + h * 0.5, color, TOON_OUTLINE, 2);
    toonRect(ctx, x0 + w * 0.1, y0 + h * 0.5, x0 + w * 0.47, y0 + h, color, TOON_OUTLINE, 2);
    toonRect(ctx, x0 + w * 0.53, y0 + h * 0.5, x0 + w * 0.9, y0 + h, color, TOON_OUTLINE, 2);
  } else if (kind === "vest") {
    toonPoly(ctx, [[x0 + w * 0.3, y0], [x0 + w * 0.7, y0], [x0 + w * 0.8, y0 + h * 0.15], [x0 + w * 0.8, y0 + h],
      [x0 + w * 0.2, y0 + h], [x0 + w * 0.2, y0 + h * 0.15]], color, TOON_OUTLINE, 2);
    toonLine(ctx, [[cx, y0 + h * 0.05], [cx - w * 0.12, y0 + h * 0.4]], TOON_OUTLINE, 2);
    toonLine(ctx, [[cx, y0 + h * 0.05], [cx + w * 0.12, y0 + h * 0.4]], TOON_OUTLINE, 2);
  } else {
    toonPoly(ctx, [[x0 + w * 0.25, y0], [x0, y0 + h * 0.25], [x0 + w * 0.2, y0 + h * 0.4], [x0 + w * 0.25, y0 + h * 0.15],
      [x0 + w * 0.25, y0 + h], [x0 + w * 0.75, y0 + h], [x0 + w * 0.75, y0 + h * 0.15], [x0 + w * 0.8, y0 + h * 0.4],
      [x0 + w, y0 + h * 0.25], [x0 + w * 0.75, y0]], color, TOON_OUTLINE, 2);
  }
}

function toonPlant(ctx, cx, cy, size, p) {
  const color = p.color, kind = p.kind || "flower", stem = p.stem !== false;
  const r = size * 0.28;
  if (stem) toonLine(ctx, [[cx, cy + r * 0.3], [cx, cy + size * 0.5]], "#4CAF50", 5);
  if (kind === "tree") {
    toonRect(ctx, cx - size * 0.06, cy, cx + size * 0.06, cy + size * 0.45, "#795548", TOON_OUTLINE);
    toonEllipse(ctx, cx - r * 1.6, cy - r * 2.2, cx + r * 1.6, cy + r * 0.3, color, TOON_OUTLINE, 2);
  } else if (kind === "leaf") {
    toonPoly(ctx, [[cx, cy - r * 1.3], [cx + r * 0.9, cy], [cx, cy + r * 1.3], [cx - r * 0.9, cy]], color, TOON_OUTLINE, 2);
    toonLine(ctx, [[cx, cy - r * 1.2], [cx, cy + r * 1.2]], TOON_OUTLINE, 2);
  } else if (kind === "bud") {
    toonPoly(ctx, [[cx, cy - r * 1.1], [cx + r * 0.4, cy - r * 0.3], [cx, cy + r * 0.15], [cx - r * 0.4, cy - r * 0.3]], color, TOON_OUTLINE, 2, true);
  } else {
    for (let angle = 0; angle < 360; angle += 60) {
      const px = cx + r * 0.85 * Math.cos((angle * Math.PI) / 180), py = cy + r * 0.85 * Math.sin((angle * Math.PI) / 180);
      toonEllipse(ctx, px - r * 0.55, py - r * 0.55, px + r * 0.55, py + r * 0.55, color, TOON_OUTLINE, 1);
    }
    toonEllipse(ctx, cx - r * 0.5, cy - r * 0.5, cx + r * 0.5, cy + r * 0.5, "#FFEB3B", TOON_OUTLINE, 2);
  }
}

function toonSky(ctx, cx, cy, size, p) {
  const kind = p.kind || "sun", color = p.color || "#FFCA28";
  const r = size * 0.32;
  if (kind === "sun") {
    for (let angle = 0; angle < 360; angle += 30) {
      const x2 = cx + r * 1.6 * Math.cos((angle * Math.PI) / 180), y2 = cy + r * 1.6 * Math.sin((angle * Math.PI) / 180);
      toonLine(ctx, [[cx, cy], [x2, y2]], color, 4);
    }
    toonEllipse(ctx, cx - r, cy - r, cx + r, cy + r, color, TOON_OUTLINE, 2);
    toonEllipse(ctx, cx - r * 0.3, cy - r * 0.3, cx - r * 0.1, cy - r * 0.1, "black");
  } else if (kind === "moon") {
    toonEllipse(ctx, cx - r, cy - r, cx + r, cy + r, "#FFF9C4", TOON_OUTLINE, 2);
    toonEllipse(ctx, cx - r * 0.3, cy - r * 1.15, cx + r * 1.1, cy + r * 0.85, "white", null);
  } else if (kind === "cloud") {
    toonEllipse(ctx, cx - r * 1.3, cy - r * 0.2, cx - r * 0.3, cy + r * 0.6, color, TOON_OUTLINE, 2);
    toonEllipse(ctx, cx - r * 0.5, cy - r * 0.6, cx + r * 0.5, cy + r * 0.5, color, TOON_OUTLINE, 2);
    toonEllipse(ctx, cx + r * 0.2, cy - r * 0.1, cx + r * 1.2, cy + r * 0.6, color, TOON_OUTLINE, 2);
  } else if (kind === "fire") {
    toonPoly(ctx, [[cx, cy - r * 1.4], [cx + r * 0.8, cy + r * 0.2], [cx + r * 0.3, cy + r * 0.1], [cx + r * 0.5, cy + r * 1.0],
      [cx, cy + r * 0.5], [cx - r * 0.5, cy + r * 1.0], [cx - r * 0.3, cy + r * 0.1], [cx - r * 0.8, cy + r * 0.2]], color, TOON_OUTLINE, 2, true);
  } else if (kind === "rain") {
    toonEllipse(ctx, cx - r * 1.3, cy - r * 0.9, cx - r * 0.3, cy - r * 0.1, "#90A4AE", TOON_OUTLINE, 2);
    toonEllipse(ctx, cx - r * 0.5, cy - r * 1.2, cx + r * 0.5, cy - r * 0.2, "#90A4AE", TOON_OUTLINE, 2);
    toonEllipse(ctx, cx + r * 0.2, cy - r * 0.8, cx + r * 1.2, cy - r * 0.1, "#90A4AE", TOON_OUTLINE, 2);
    for (const dx of [-0.6, 0, 0.6]) toonLine(ctx, [[cx + dx * r, cy + r * 0.3], [cx + dx * r - 4, cy + r * 1.2]], "#42A5F5", 3);
  } else if (kind === "star") {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const ang = ((i * 36 - 90) * Math.PI) / 180;
      const rad = i % 2 === 0 ? r * 1.3 : r * 0.55;
      pts.push([cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)]);
    }
    toonPoly(ctx, pts, color, TOON_OUTLINE, 2);
  } else if (kind === "volcano") {
    toonPoly(ctx, [[cx - r * 1.3, cy + r * 0.9], [cx - r * 0.3, cy - r * 1.0], [cx + r * 0.3, cy - r * 1.0], [cx + r * 1.3, cy + r * 0.9]], "#8D6E63", TOON_OUTLINE, 2);
    toonPoly(ctx, [[cx - r * 0.3, cy - r * 1.0], [cx, cy - r * 1.5], [cx + r * 0.3, cy - r * 1.0]], "#E53935", TOON_OUTLINE);
  } else if (kind === "zap") {
    toonPoly(ctx, [[cx - r * 0.2, cy - r * 1.4], [cx + r * 0.5, cy - r * 0.1], [cx + r * 0.05, cy - r * 0.1],
      [cx + r * 0.3, cy + r * 1.4], [cx - r * 0.5, cy + r * 0.2], [cx - r * 0.1, cy + r * 0.2]], color, TOON_OUTLINE, 2);
  } else if (kind === "ice") {
    toonPoly(ctx, [[cx - r, cy - r * 0.6], [cx + r, cy - r * 0.6], [cx + r * 0.7, cy + r], [cx - r * 0.7, cy + r]], "#B3E5FC", TOON_OUTLINE, 2);
  } else if (kind === "hill") {
    toonArcPie(ctx, cx - r * 1.6, cy - r * 0.9, cx + r * 1.6, cy + r * 1.5, 0, 180, color, TOON_OUTLINE, 2);
  }
}

function toonBodypart(ctx, cx, cy, size, p) {
  const color = p.color, kind = p.kind || "hand";
  const r = size * 0.3;
  if (kind === "heart") {
    toonPoly(ctx, [[cx, cy + r * 0.9], [cx - r * 1.2, cy - r * 0.3], [cx - r * 0.55, cy - r * 1.1], [cx, cy - r * 0.5],
      [cx + r * 0.55, cy - r * 1.1], [cx + r * 1.2, cy - r * 0.3]], color, TOON_OUTLINE, 2, true);
  } else if (kind === "hand") {
    toonRect(ctx, cx - r * 0.45, cy - r * 0.2, cx + r * 0.45, cy + r * 1.1, color, TOON_OUTLINE, 2);
    for (const fx of [-0.4, -0.15, 0.1, 0.35]) toonRect(ctx, cx + fx * r, cy - r * 1.1, cx + (fx + 0.2) * r, cy - r * 0.15, color, TOON_OUTLINE, 2);
  } else if (kind === "ear") {
    toonEllipse(ctx, cx - r * 0.7, cy - r, cx + r * 0.7, cy + r, color, TOON_OUTLINE, 2);
    toonArcOutline(ctx, cx - r * 0.3, cy - r * 0.5, cx + r * 0.3, cy + r * 0.4, 270, 180, TOON_OUTLINE, 2);
  } else if (kind === "nose") {
    toonPoly(ctx, [[cx - r * 0.5, cy + r * 0.8], [cx - r * 0.2, cy - r], [cx + r * 0.2, cy - r], [cx + r * 0.5, cy + r * 0.8]], color, TOON_OUTLINE, 2, true);
    toonEllipse(ctx, cx - r * 0.3, cy + r * 0.5, cx - r * 0.05, cy + r * 0.75, TOON_OUTLINE);
    toonEllipse(ctx, cx + r * 0.05, cy + r * 0.5, cx + r * 0.3, cy + r * 0.75, TOON_OUTLINE);
  } else {
    toonLine(ctx, [[cx - r * 0.9, cy - r * 0.9], [cx + r * 0.9, cy + r * 0.9]], color, size * 0.36, false, "round");
    toonEllipse(ctx, cx - r * 0.9 - size * 0.1, cy - r * 0.9 - size * 0.1, cx - r * 0.9 + size * 0.1, cy - r * 0.9 + size * 0.1, color, TOON_OUTLINE, 2);
    toonEllipse(ctx, cx + r * 0.9 - size * 0.12, cy + r * 0.9 - size * 0.12, cx + r * 0.9 + size * 0.12, cy + r * 0.9 + size * 0.12, color, TOON_OUTLINE, 2);
  }
}

function toonInstrument(ctx, cx, cy, size, p) {
  const color = p.color, kind = p.kind || "guitar";
  const r = size * 0.35;
  if (["guitar", "ukulele", "violin"].includes(kind)) {
    toonEllipse(ctx, cx - r * 0.7, cy, cx + r * 0.7, cy + r * 1.3, color, TOON_OUTLINE, 2);
    toonEllipse(ctx, cx - r * 0.45, cy - r * 0.55, cx + r * 0.45, cy + r * 0.45, color, TOON_OUTLINE, 2);
    toonLine(ctx, [[cx, cy - r * 1.6], [cx, cy]], "#6D4C41", 6);
    toonEllipse(ctx, cx - r * 0.15, cy + r * 0.55, cx + r * 0.15, cy + r * 0.85, "black");
  } else if (kind === "drum") {
    toonRect(ctx, cx - r, cy - r * 0.6, cx + r, cy + r * 0.6, color, TOON_OUTLINE, 2);
    toonEllipse(ctx, cx - r, cy - r * 0.9, cx + r, cy - r * 0.3, "#EFEBE9", TOON_OUTLINE, 2);
    toonLine(ctx, [[cx - r * 0.6, cy - r * 1.3], [cx - r * 0.2, cy - r * 0.6]], "#6D4C41", 3);
    toonLine(ctx, [[cx + r * 0.6, cy - r * 1.3], [cx + r * 0.2, cy - r * 0.6]], "#6D4C41", 3);
  } else {
    const colors = ["#EF5350", "#FFA726", "#FFEE58", "#66BB6A", "#42A5F5"];
    const bw = r * 0.5;
    colors.forEach((c, i) => {
      const x0 = cx - r * 1.3 + i * bw;
      toonRect(ctx, x0, cy - r * 0.2 - i * 3, x0 + bw * 0.85, cy + r * 0.6, c, TOON_OUTLINE, 1);
    });
  }
}

function toonTool(ctx, cx, cy, size, p) {
  const color = p.color, kind = p.kind || "key";
  const r = size * 0.3;
  if (kind === "key") {
    toonEllipse(ctx, cx - r * 1.1, cy - r * 0.5, cx - r * 0.3, cy + r * 0.3, null, color, 5);
    toonLine(ctx, [[cx - r * 0.3, cy], [cx + r * 1.1, cy]], color, 5);
    toonLine(ctx, [[cx + r * 0.7, cy], [cx + r * 0.7, cy + r * 0.4]], color, 5);
    toonLine(ctx, [[cx + r * 1.05, cy], [cx + r * 1.05, cy + r * 0.3]], color, 5);
  } else if (kind === "brush") {
    toonRect(ctx, cx - r * 0.15, cy - r * 0.2, cx + r * 0.15, cy + r * 1.2, "#8D6E63", TOON_OUTLINE, 2);
    toonPoly(ctx, [[cx - r * 0.4, cy - r * 0.2], [cx + r * 0.4, cy - r * 0.2], [cx + r * 0.25, cy - r * 1.1], [cx - r * 0.25, cy - r * 1.1]], color, TOON_OUTLINE, 2);
  } else if (kind === "ring") {
    toonEllipse(ctx, cx - r * 0.85, cy - r * 0.2, cx + r * 0.85, cy + r * 1.1, null, color, 6);
    toonPoly(ctx, [[cx - r * 0.35, cy - r * 0.35], [cx, cy - r * 0.95], [cx + r * 0.35, cy - r * 0.35]], "#E1F5FE", TOON_OUTLINE, 2);
  } else if (kind === "axe") {
    toonLine(ctx, [[cx, cy - r * 1.2], [cx, cy + r * 1.2]], "#8D6E63", 6);
    toonPoly(ctx, [[cx, cy - r * 1.3], [cx + r * 0.9, cy - r * 0.9], [cx + r * 0.5, cy - r * 0.3], [cx, cy - r * 0.6]], color, TOON_OUTLINE, 2);
  } else if (kind === "needle") {
    toonLine(ctx, [[cx - r * 1.2, cy + r * 1.0], [cx + r * 1.0, cy - r * 1.2]], "#B0BEC5", 3);
    toonEllipse(ctx, cx + r * 0.75, cy - r * 1.35, cx + r * 1.15, cy - r * 0.95, null, "#B0BEC5", 3);
    toonLine(ctx, [[cx - r * 0.3, cy + r * 0.4], [cx - r * 0.9, cy + r * 1.0]], "#EF5350", 2);
  } else if (kind === "torch") {
    toonRect(ctx, cx - r * 0.35, cy - r * 0.1, cx + r * 0.35, cy + r * 1.1, color, TOON_OUTLINE, 2);
    toonEllipse(ctx, cx - r * 0.4, cy - r * 0.55, cx + r * 0.4, cy - r * 0.05, "#FFEE58", TOON_OUTLINE, 2);
  } else if (kind === "lock") {
    toonArcOutline(ctx, cx - r * 0.6, cy - r * 1.2, cx + r * 0.6, cy, 0, 180, color, 5);
    toonRect(ctx, cx - r * 0.75, cy - r * 0.15, cx + r * 0.75, cy + r * 0.95, color, TOON_OUTLINE, 2);
    toonEllipse(ctx, cx - r * 0.12, cy + r * 0.25, cx + r * 0.12, cy + r * 0.5, TOON_OUTLINE);
  } else {
    toonLine(ctx, [[cx, cy - r * 1.2], [cx, cy + r * 0.5]], "#8D6E63", 5);
    toonPoly(ctx, [[cx - r * 0.5, cy + r * 0.4], [cx + r * 0.5, cy + r * 0.4], [cx + r * 0.35, cy + r * 1.3], [cx - r * 0.35, cy + r * 1.3]], color, TOON_OUTLINE, 2);
  }
}

function toonSnake(ctx, cx, cy, size, p) {
  const color = p.color;
  toonLine(ctx, [[cx - size * 0.4, cy + size * 0.3], [cx - size * 0.1, cy - size * 0.2],
    [cx + size * 0.2, cy + size * 0.25], [cx + size * 0.4, cy - size * 0.1]], color, size * 0.22, true, "round");
  toonEllipse(ctx, cx + size * 0.32, cy - size * 0.22, cx + size * 0.5, cy - size * 0.04, color, TOON_OUTLINE, 2);
  toonEllipse(ctx, cx + size * 0.44, cy - size * 0.17, cx + size * 0.48, cy - size * 0.13, "black");
}

function toonOctopus(ctx, cx, cy, size, p) {
  const color = p.color, r = size * 0.32;
  toonEllipse(ctx, cx - r, cy - r * 1.1, cx + r, cy + r * 0.4, color, TOON_OUTLINE, 2);
  for (let i = 0; i < 5; i++) {
    const x0 = cx - r * 0.85 + i * r * 0.42;
    toonLine(ctx, [[x0, cy + r * 0.2], [x0 + (i % 2 ? r * 0.15 : -r * 0.15), cy + r * 1.1]], color, 6, false, "round");
  }
  toonEllipse(ctx, cx - r * 0.35 - 4, cy - r * 0.35 - 4, cx - r * 0.35 + 4, cy - r * 0.35 + 4, "black");
  toonEllipse(ctx, cx + r * 0.15 - 4, cy - r * 0.35 - 4, cx + r * 0.15 + 4, cy - r * 0.35 + 4, "black");
}

function toonCrab(ctx, cx, cy, size, p) {
  const color = p.color, r = size * 0.32;
  toonEllipse(ctx, cx - r, cy - r * 0.6, cx + r, cy + r * 0.5, color, TOON_OUTLINE, 2);
  toonPoly(ctx, [[cx - r * 1.5, cy - r * 0.5], [cx - r * 0.85, cy - r * 0.7], [cx - r * 0.95, cy - r * 0.1]], color, TOON_OUTLINE, 2);
  toonPoly(ctx, [[cx + r * 1.5, cy - r * 0.5], [cx + r * 0.85, cy - r * 0.7], [cx + r * 0.95, cy - r * 0.1]], color, TOON_OUTLINE, 2);
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const lx = cx + sx * r * (0.3 + i * 0.28);
      toonLine(ctx, [[lx, cy + r * 0.45], [lx + sx * r * 0.15, cy + r * 0.85]], color, 4);
    }
  }
  toonEllipse(ctx, cx - r * 0.3 - 4, cy - r * 0.35 - 4, cx - r * 0.3 + 4, cy - r * 0.35 + 4, "black");
  toonEllipse(ctx, cx + r * 0.3 - 4, cy - r * 0.35 - 4, cx + r * 0.3 + 4, cy - r * 0.35 + 4, "black");
}

function toonRobot(ctx, cx, cy, size, p) {
  const color = p.color, w = size * 0.6, h = size * 0.6, x0 = cx - w / 2, y0 = cy - h / 2;
  toonLine(ctx, [[cx, y0 - h * 0.25], [cx, y0]], TOON_OUTLINE, 3);
  toonEllipse(ctx, cx - 5, y0 - h * 0.35, cx + 5, y0 - h * 0.25, "#EF5350");
  toonRect(ctx, x0, y0, x0 + w, y0 + h, color, TOON_OUTLINE, 2);
  toonRect(ctx, x0 + w * 0.2, y0 + h * 0.2, x0 + w * 0.45, y0 + h * 0.45, "#90CAF9", TOON_OUTLINE, 2);
  toonRect(ctx, x0 + w * 0.55, y0 + h * 0.2, x0 + w * 0.8, y0 + h * 0.45, "#90CAF9", TOON_OUTLINE, 2);
  toonLine(ctx, [[x0 + w * 0.3, y0 + h * 0.7], [x0 + w * 0.7, y0 + h * 0.7]], TOON_OUTLINE, 3);
  toonRect(ctx, x0 - w * 0.15, y0 + h * 0.15, x0, y0 + h * 0.5, color, TOON_OUTLINE, 2);
  toonRect(ctx, x0 + w, y0 + h * 0.15, x0 + w * 1.15, y0 + h * 0.5, color, TOON_OUTLINE, 2);
}

function toonWedge(ctx, cx, cy, size, p) {
  const color = p.color, crustColor = p.crust_color || "#E8B96A", toppings = p.toppings !== false;
  const r = size * 0.45;
  toonPoly(ctx, [[cx, cy + r * 0.9], [cx - r * 0.85, cy - r * 0.7], [cx + r * 0.85, cy - r * 0.7]], color, TOON_OUTLINE, 2);
  toonLine(ctx, [[cx - r * 0.85, cy - r * 0.7], [cx + r * 0.85, cy - r * 0.7]], crustColor, 8);
  if (toppings) {
    for (const [dx, dy] of [[-0.25, -0.25], [0.2, -0.15], [0, 0.1]]) {
      toonEllipse(ctx, cx + dx * r - 7, cy + dy * r - 7, cx + dx * r + 7, cy + dy * r + 7, "#C62828", null);
    }
  }
}

function toonLayered(ctx, cx, cy, size, p) {
  const color = p.color, icingColor = p.icing_color || "#FFFFFF", candle = p.candle !== false;
  const w = size * 0.7, h = size * 0.35, x0 = cx - w / 2, y0 = cy - h / 2 + size * 0.15;
  toonRect(ctx, x0, y0, x0 + w, y0 + h, color, TOON_OUTLINE, 2);
  toonPoly(ctx, [[x0 - 4, y0], [x0 + w * 0.15, y0 - h * 0.35], [x0 + w * 0.3, y0], [x0 + w * 0.45, y0 - h * 0.35],
    [x0 + w * 0.6, y0], [x0 + w * 0.75, y0 - h * 0.35], [x0 + w + 4, y0]], icingColor, TOON_OUTLINE, 2);
  if (candle) {
    toonRect(ctx, cx - 4, y0 - h * 0.35 - size * 0.18, cx + 4, y0 - h * 0.35, "#EF5350", TOON_OUTLINE);
    toonEllipse(ctx, cx - 5, y0 - h * 0.35 - size * 0.28, cx + 5, y0 - h * 0.35 - size * 0.16, "#FFCA28", null);
  }
}

function toonCorn(ctx, cx, cy, size, p) {
  const color = p.color || "#FFD54F", huskColor = p.husk_color || "#7CB342";
  const r = size * 0.42;
  toonEllipse(ctx, cx - r * 0.4, cy - r * 1.1, cx + r * 0.4, cy + r * 1.1, color, TOON_OUTLINE, 2);
  for (let row = -4; row <= 4; row++) {
    for (const col of [-1, 1]) {
      toonEllipse(ctx, cx + col * r * 0.18 - 3, cy + row * r * 0.22 - 3, cx + col * r * 0.18 + 3, cy + row * r * 0.22 + 3, "#F9A825", null);
    }
  }
  toonPoly(ctx, [[cx - r * 0.4, cy - r * 0.3], [cx - r * 1.0, cy - r * 1.3], [cx - r * 0.1, cy - r * 0.9]], huskColor, TOON_OUTLINE, 2);
  toonPoly(ctx, [[cx + r * 0.4, cy - r * 0.3], [cx + r * 1.0, cy - r * 1.3], [cx + r * 0.1, cy - r * 0.9]], huskColor, TOON_OUTLINE, 2);
}

function toonLoaf(ctx, cx, cy, size, p) {
  const color = p.color || "#D7A86E";
  const w = size * 0.8, h = size * 0.5, x0 = cx - w / 2, y0 = cy - h / 2 + size * 0.1;
  toonPoly(ctx, [[x0, y0 + h * 0.3], [x0 + w * 0.1, y0], [x0 + w * 0.9, y0], [x0 + w, y0 + h * 0.3],
    [x0 + w, y0 + h], [x0, y0 + h]], color, TOON_OUTLINE, 2, true);
  for (let i = 0; i < 3; i++) {
    const cxi = x0 + w * (0.3 + i * 0.2);
    toonArcOutline(ctx, cxi - w * 0.08, y0 - h * 0.1, cxi + w * 0.08, y0 + h * 0.25, 0, 180, "#8D6E63", 2);
  }
}

function toonPlane(ctx, cx, cy, size, p) {
  const color = p.color || "#B0BEC5";
  const r = size * 0.42;
  toonPoly(ctx, [[cx - r * 1.1, cy], [cx + r * 0.9, cy - r * 0.15], [cx + r * 1.2, cy], [cx + r * 0.9, cy + r * 0.15]], color, TOON_OUTLINE, 2);
  toonPoly(ctx, [[cx - r * 0.2, cy], [cx + r * 0.1, cy - r * 0.9], [cx + r * 0.35, cy - r * 0.15]], color, TOON_OUTLINE, 2);
  toonPoly(ctx, [[cx - r * 0.2, cy], [cx + r * 0.1, cy + r * 0.9], [cx + r * 0.35, cy + r * 0.15]], color, TOON_OUTLINE, 2);
  toonPoly(ctx, [[cx - r * 0.9, cy], [cx - r * 1.1, cy - r * 0.45], [cx - r * 0.6, cy - r * 0.1]], color, TOON_OUTLINE, 2);
}

function toonBoat(ctx, cx, cy, size, p) {
  const hullColor = p.hull_color || "#8D6E63", sailColor = p.sail_color || "#FFFFFF";
  const w = size * 0.85, h = size * 0.32, x0 = cx - w / 2, y0 = cy + size * 0.1;
  toonPoly(ctx, [[x0, y0], [x0 + w, y0], [x0 + w * 0.82, y0 + h], [x0 + w * 0.18, y0 + h]], hullColor, TOON_OUTLINE, 2);
  toonLine(ctx, [[cx, y0], [cx, y0 - size * 0.7]], "#6D4C41", 4);
  toonPoly(ctx, [[cx, y0 - size * 0.7], [cx + size * 0.35, y0], [cx, y0]], sailColor, TOON_OUTLINE, 2);
}

function toonCrown(ctx, cx, cy, size, p) {
  const color = p.color || "#FFD700", gemColor = p.gem_color || "#E53935";
  const w = size * 0.7, h = size * 0.42, x0 = cx - w / 2, y0 = cy - h / 2 + size * 0.1;
  toonPoly(ctx, [[x0, y0 + h], [x0, y0 + h * 0.35], [x0 + w * 0.2, y0], [x0 + w * 0.35, y0 + h * 0.4],
    [x0 + w * 0.5, y0 - h * 0.15], [x0 + w * 0.65, y0 + h * 0.4], [x0 + w * 0.8, y0],
    [x0 + w, y0 + h * 0.35], [x0 + w, y0 + h]], color, TOON_OUTLINE, 2);
  for (const dx of [0.25, 0.5, 0.75]) {
    toonEllipse(ctx, x0 + w * dx - 5, y0 + h * 0.55 - 5, x0 + w * dx + 5, y0 + h * 0.55 + 5, gemColor, null);
  }
}

function toonLamp(ctx, cx, cy, size, p) {
  const shadeColor = p.shade_color || "#FFCA28", baseColor = p.base_color || "#6D4C41";
  const w = size * 0.55;
  toonPoly(ctx, [[cx - w * 0.2, cy + size * 0.3], [cx + w * 0.2, cy + size * 0.3],
    [cx + w * 0.1, cy + size * 0.42], [cx - w * 0.1, cy + size * 0.42]], baseColor, TOON_OUTLINE, 2);
  toonLine(ctx, [[cx, cy + size * 0.3], [cx, cy - size * 0.05]], baseColor, 5);
  toonPoly(ctx, [[cx - w * 0.5, cy - size * 0.05], [cx + w * 0.5, cy - size * 0.05],
    [cx + w * 0.32, cy - size * 0.35], [cx - w * 0.32, cy - size * 0.35]], shadeColor, TOON_OUTLINE, 2);
}

function toonBook(ctx, cx, cy, size, p) {
  const coverColor = p.cover_color || "#5C6BC0", pageColor = p.page_color || "#FFF8E1";
  const w = size * 0.7, h = size * 0.55, x0 = cx - w / 2, y0 = cy - h / 2;
  toonRect(ctx, x0, y0, x0 + w, y0 + h, coverColor, TOON_OUTLINE, 2);
  toonRect(ctx, x0 + w * 0.08, y0 + h * 0.08, x0 + w * 0.92, y0 + h * 0.92, pageColor, TOON_OUTLINE, 1);
  toonLine(ctx, [[cx, y0 + h * 0.08], [cx, y0 + h * 0.92]], TOON_OUTLINE, 2);
  for (const dy of [0.3, 0.5, 0.7]) {
    toonLine(ctx, [[x0 + w * 0.15, y0 + h * dy], [cx - w * 0.05, y0 + h * dy]], "#BDBDBD", 1);
    toonLine(ctx, [[cx + w * 0.05, y0 + h * dy], [x0 + w * 0.85, y0 + h * dy]], "#BDBDBD", 1);
  }
}

function toonDice(ctx, cx, cy, size, p) {
  const color = p.color || "#FFFFFF";
  const w = size * 0.55, x0 = cx - w / 2, y0 = cy - w / 2;
  toonRect(ctx, x0, y0, x0 + w, y0 + w, color, TOON_OUTLINE, 2);
  for (const [dx, dy] of [[-0.25, -0.25], [0.25, 0.25], [0.25, -0.25], [-0.25, 0.25], [0, 0]]) {
    toonEllipse(ctx, cx + dx * w - 5, cy + dy * w - 5, cx + dx * w + 5, cy + dy * w + 5, "#212121", null);
  }
}

function toonClock(ctx, cx, cy, size, p) {
  const faceColor = p.face_color || "#FFFFFF";
  const r = size * 0.42;
  toonEllipse(ctx, cx - r, cy - r, cx + r, cy + r, faceColor, TOON_OUTLINE, 3);
  for (let angle = 0; angle < 360; angle += 30) {
    const x1 = cx + r * 0.85 * Math.cos((angle * Math.PI) / 180), y1 = cy + r * 0.85 * Math.sin((angle * Math.PI) / 180);
    const x2 = cx + r * 0.95 * Math.cos((angle * Math.PI) / 180), y2 = cy + r * 0.95 * Math.sin((angle * Math.PI) / 180);
    toonLine(ctx, [[x1, y1], [x2, y2]], TOON_OUTLINE, 2);
  }
  toonLine(ctx, [[cx, cy], [cx + r * 0.15, cy - r * 0.5]], TOON_OUTLINE, 3);
  toonLine(ctx, [[cx, cy], [cx + r * 0.45, cy + r * 0.15]], TOON_OUTLINE, 3);
  toonEllipse(ctx, cx - 4, cy - 4, cx + 4, cy + 4, TOON_OUTLINE);
}

function toonFlag(ctx, cx, cy, size, p) {
  const color = p.color || "#E53935";
  const h = size * 0.75;
  toonLine(ctx, [[cx - size * 0.25, cy - h * 0.5], [cx - size * 0.25, cy + h * 0.5]], "#6D4C41", 4);
  toonPoly(ctx, [[cx - size * 0.25, cy - h * 0.5], [cx + size * 0.35, cy - h * 0.3], [cx - size * 0.25, cy - h * 0.1]], color, TOON_OUTLINE, 2);
}

function toonTop(ctx, cx, cy, size, p) {
  const color = p.color || "#EF5350";
  const w = size * 0.6, h = size * 0.55;
  toonPoly(ctx, [[cx - w * 0.5, cy - h * 0.35], [cx + w * 0.5, cy - h * 0.35], [cx + w * 0.15, cy + h * 0.55], [cx - w * 0.15, cy + h * 0.55]], color, TOON_OUTLINE, 2);
  toonPoly(ctx, [[cx - w * 0.15, cy + h * 0.55], [cx + w * 0.15, cy + h * 0.55], [cx, cy + h * 0.75]], "#6D4C41", TOON_OUTLINE, 2);
  toonRect(ctx, cx - w * 0.08, cy - h * 0.55, cx + w * 0.08, cy - h * 0.3, "#6D4C41", TOON_OUTLINE);
  toonEllipse(ctx, cx - w * 0.5, cy - h * 0.45, cx + w * 0.5, cy - h * 0.25, color, TOON_OUTLINE, 2);
}

const TOON_TEMPLATES = {
  round_animal: toonRoundAnimal,
  bird: toonBird,
  fish: toonFish,
  insect: toonInsect,
  round_food: toonRoundFood,
  vehicle: toonVehicle,
  building: toonBuilding,
  container: toonContainer,
  clothing: toonClothing,
  plant: toonPlant,
  sky: toonSky,
  bodypart: toonBodypart,
  instrument: toonInstrument,
  tool: toonTool,
  snake: toonSnake,
  octopus: toonOctopus,
  crab: toonCrab,
  robot: toonRobot,
  wedge: toonWedge,
  layered: toonLayered,
  corn: toonCorn,
  loaf: toonLoaf,
  plane: toonPlane,
  boat: toonBoat,
  crown: toonCrown,
  lamp: toonLamp,
  book: toonBook,
  dice: toonDice,
  clock: toonClock,
  flag: toonFlag,
  top: toonTop,
};

function drawWordCartoon(ctx, cx, cy, size, word) {
  const spec = APP_DATA.WORD_CARTOON[word];
  if (!spec) return false;
  const [template, params] = spec;
  const fn = TOON_TEMPLATES[template];
  if (!fn) return false;
  fn(ctx, cx, cy, size, params || {});
  return true;
}
