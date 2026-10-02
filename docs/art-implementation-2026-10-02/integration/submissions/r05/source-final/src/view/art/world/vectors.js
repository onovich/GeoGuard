// Editable source commands: normalized center for shots, left-rear M for flashes.
// No DOM, Path2D creation or RNG at module import; paths compile once in loadWorldArt.
export const vectors = Object.freeze({
  seed: [['M',-1,0],['C',-1,-.56,-.52,-1,0,-1],['C',.56,-1,1,-.5,1,0],['C',1,.56,.5,1,0,1],['C',-.56,1,-1,.5,-1,0],['Z']],
  lance: [['M',-1,0],['C',-.45,-.75,.38,-1.1,1,0],['C',.45,.9,-.4,.9,-1,0],['Z']],
  flash: [['M',0,0],['C',0,-.28,.25,-.38,.42,-.28],['C',.34,-.87,.96,-.9,1.01,-.37],['C',1.6,-.44,1.76,.12,1.11,.3],['C',1.04,.95,.35,.82,.4,.31],['C',.08,.38,0,.2,0,0],['Z']],
  star: [['M',0,0],['C',.78,-.04,1.02,-.14,1.1,-.78],['C',1.16,-.14,1.3,-.03,2.04,0],['C',1.3,.04,1.16,.14,1.1,.78],['C',1.02,.14,.78,.03,0,0],['Z']],
  patchA: [['M',-.95,.18],['C',-.98,-.05,-.55,-.12,-.58,-.35],['C',-.6,-.57,-.12,-.38,.12,-.55],['C',.6,-.67,.7,-.3,.9,-.26],['C',1.1,-.05,.87,.16,.52,.18],['C',.25,.18,.45,.48,.12,.5],['C',-.18,.61,-.8,.46,-.65,.25],['C',-.56,.13,-.95,.35,-.95,.18],['Z']],
  patchB: [['M',-1,-.05],['C',-.94,-.38,-.67,-.23,-.52,-.48],['C',-.25,-.7,.11,-.33,.38,-.42],['C',.67,-.56,.91,-.27,1,.03],['C',.93,.34,.38,.18,.49,.43],['C',.26,.59,-.11,.45,-.38,.34],['C',-.65,.13,-.93,.3,-1,-.05],['Z']],
  chip: [['M',-.6,-1],['L',.35,-.8],['L',.7,.9],['L',-.25,.4],['L',-.6,0],['Z']],
  leaf: [['M',0,-1],['C',.8,-.6,.7,.65,0,1],['C',-.5,.35,-.7,-.7,0,-1],['Z']],
  diamond: [['M',0,-1],['L',.77,0],['L',0,1],['L',-.77,0],['Z']],
});

function trace(target, commands) {
  for (const [op, ...v] of commands) {
    if (op === 'M') target.moveTo(...v);
    else if (op === 'L') target.lineTo(...v);
    else if (op === 'C') target.bezierCurveTo(...v);
    else target.closePath();
  }
}

export function compileVectors() {
  const paths = {};
  if (typeof globalThis.Path2D === 'function') {
    for (const [key, commands] of Object.entries(vectors)) {
      const path = new globalThis.Path2D();
      trace(path, commands);
      paths[key] = path;
    }
  }
  return { paths, commands: vectors };
}

export function vector(ctx, assets, key, fill, stroke, width = .07) {
  const path = assets?.paths?.[key];
  if (!path) { ctx.beginPath(); trace(ctx, vectors[key]); }
  if (fill) { ctx.fillStyle = fill; path ? ctx.fill(path) : ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; path ? ctx.stroke(path) : ctx.stroke(); }
}

export function ellipse(ctx, x, y, rx, ry, fill, stroke, width = 1) {
  ctx.beginPath(); ctx.ellipse(x,y,Math.max(0,rx),Math.max(0,ry),0,0,Math.PI*2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

export function segment(ctx, x, y, x2, y2, color, width = 1) {
  ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x2,y2); ctx.strokeStyle=color; ctx.lineWidth=width; ctx.stroke();
}
