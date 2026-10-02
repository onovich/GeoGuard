import { RIGS, PALETTE } from './rigData.js';

const identity = [1, 0, 0, 1, 0, 0];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
export const transformPoint = (m, p) => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
export const multiply = (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
const at = (x, y, sx = 1, sy = sx) => [sx, 0, 0, sy, x * (1 - sx), y * (1 - sy)];
const translateRotate = (p, angle) => [Math.cos(angle), Math.sin(angle), -Math.sin(angle), Math.cos(angle), p[0], p[1]];

export function sampleSoftPose(actor) {
  const progress = clamp(finite(actor.poseProgress), 0, 1);
  let sx = 1;
  let sy = 1;
  switch (actor.pose) {
    case 'squash': sx = 1.1; sy = 0.75; break;
    case 'stretch': sx = 0.89; sy = 1.14; break;
    case 'move': {
      const phase = Math.sin(2 * Math.PI * finite(actor.poseTime) / 0.72);
      sx = 1 - phase * 0.055;
      sy = 1 + phase * 0.085;
      break;
    }
    case 'windup': {
      const compression = Math.sin(progress * Math.PI / 2);
      sx = 1 + compression * 0.07;
      sy = 1 - compression * 0.15;
      break;
    }
    case 'attack': {
      const pulse = Math.sin(progress * Math.PI);
      sx = 1 - pulse * 0.025;
      sy = 1 + pulse * 0.045;
      break;
    }
    case 'trigger':
      if (actor.artId !== 'mechanic:SEAL') { sy = 1 + 0.025 * Math.sin(progress * Math.PI); sx = 2 - sy; }
      break;
    default: break;
  }
  return { sx, sy };
}

const normalizeAngle = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));

function launcherMatrix(rig, actor, soft, flip) {
  const launcher = rig.launcher;
  if (!launcher) return null;
  const up = actor.facing === 'up';
  const pivot = transformPoint(soft, up && launcher.upPivot ? launcher.upPivot : launcher.pivot);
  const aim = finite(actor.aimAngle, up ? -Math.PI / 2 : flip < 0 ? Math.PI : 0);
  if (up && launcher.upShapes) {
    const residual = clamp(normalizeAngle(aim + Math.PI / 2), -0.22, 0.22);
    return { matrix: translateRotate(pivot, residual), pivot, angle: -Math.PI / 2 + residual, shapes: launcher.upShapes, muzzles: launcher.upMuzzles, up };
  }
  const residual = up ? clamp(normalizeAngle(aim + Math.PI / 2), -0.15, 0.15) : clamp(normalizeAngle(flip < 0 ? Math.PI - aim : aim), -0.44, 0.44);
  const angle = up ? launcher.upAngle ?? -0.58 : 0;
  const projected = angle + residual;
  return { matrix: translateRotate(pivot, projected), pivot, angle: projected, shapes: launcher.shapes, muzzles: launcher.muzzles, up };
}

export function buildCharacterPlan(actor, frame = {}) {
  const baseRig = RIGS[actor?.artId];
  if (!baseRig || !Number.isFinite(actor.x) || !Number.isFinite(actor.y) || !(actor.radius > 0)) return null;
  const abilityVariant = baseRig.abilityVariants?.[actor.boss?.castAbility]?.[actor.pose];
  const phaseVariant = baseRig.phaseVariants?.[actor.boss?.phaseIndex];
  const variantName = abilityVariant ?? baseRig.poseVariants?.[actor.pose] ?? phaseVariant;
  const variant = baseRig.variants?.[variantName];
  // Variants may replace artwork and local joints, never fixed collision/root geometry.
  const rig = variant ? { ...baseRig, shapes: variant.shapes ?? baseRig.shapes, joints: variant.joints ?? baseRig.joints, partTransforms: variant.partTransforms ?? baseRig.partTransforms } : baseRig;
  const { sx, sy } = sampleSoftPose(actor);
  const soft = at(rig.softPivot[0], rig.softPivot[1], sx, sy);
  const flip = actor.facing === 'left' ? -1 : 1;
  const scale = actor.radius / rig.collisionRadius;
  const world = [scale * flip, 0, 0, scale, actor.x - scale * flip * rig.center[0], actor.y - scale * rig.center[1]];
  const launcher = launcherMatrix(rig, actor, soft, flip);
  let shapes = rig.shapes;
  if (rig.brokenShapes && ['broken', 'fade'].includes(actor.pose)) {
    shapes = rig.brokenMode === 'replace-body'
      ? rig.shapes.flatMap((shape) => shape.id === rig.replaceBodyId ? rig.brokenShapes : [shape])
      : rig.brokenShapes;
  }
  const partMatrices = {};
  for (const [id, part] of Object.entries(rig.partTransforms ?? {})) {
    const progress = clamp(finite(actor.poseProgress), 0, 1);
    let weight = actor.pose === 'windup' ? Math.sin(progress * Math.PI / 2) : actor.pose === 'attack' ? Math.sin(progress * Math.PI) : 1;
    let angle = finite(part.angleByPose?.[actor.pose]) * weight;
    if (part.sway) angle += finite(part.sway.amplitude) * Math.sin(finite(actor.poseTime) * 2 * Math.PI / (part.sway.period || 1));
    angle = clamp(angle, part.angleMin ?? -Math.PI / 2, part.angleMax ?? Math.PI / 2);
    const pivot = part.pivot ?? rig.joints[id];
    if (!pivot) continue;
    const rotation = multiply(translateRotate(pivot, angle), [1, 0, 0, 1, -pivot[0], -pivot[1]]);
    if (part.rigid) {
      const attached = transformPoint(soft, pivot);
      partMatrices[id] = multiply(translateRotate(attached, angle), [1, 0, 0, 1, -pivot[0], -pivot[1]]);
    } else partMatrices[id] = multiply(soft, rotation);
  }
  const commands = shapes.map((shape) => {
    const deformation = shape.space === 'fixed' ? identity : soft;
    const parent = partMatrices[shape.partId] ?? deformation;
    const local = shape.mirrorX ? multiply(parent, [-1, 0, 0, 1, 256, 0]) : parent;
    return { shape, matrix: multiply(world, local) };
  });
  if (launcher) for (const shape of launcher.shapes) commands.push({ shape, matrix: multiply(world, launcher.matrix) });
  const fade = actor.pose === 'fade' ? 1 - clamp(finite(actor.poseProgress), 0, 1) : 1;
  return { artId: actor.artId, rig, actor, world, soft, launcher, partMatrices, commands, alpha: clamp(finite(actor.alpha, 1), 0, 1) * fade, hitFlash: clamp(finite(actor.hitFlash), 0, 1), reduced: frame.quality === 'reduced' };
}

const parsed = new Map();
export function pathCommands(d) {
  if (parsed.has(d)) return parsed.get(d);
  const tokens = d.match(/[MLCQZ]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? [];
  const arity = { M: 2, L: 2, C: 6, Q: 4, Z: 0 };
  const result = [];
  let cursor = 0;
  let op = 'M';
  while (cursor < tokens.length) {
    if (/^[A-Za-z]$/.test(tokens[cursor])) op = tokens[cursor++].toUpperCase();
    const count = arity[op];
    if (count === undefined) throw new Error(`Unsupported production path command ${op}`);
    const values = tokens.slice(cursor, cursor + count).map(Number);
    if (values.length !== count || values.some((v) => !Number.isFinite(v))) throw new Error('Invalid production path');
    result.push({ op, values });
    cursor += count;
    if (op === 'Z') op = 'M';
    else if (op === 'M') op = 'L';
  }
  parsed.set(d, result);
  return result;
}

function trace(ctx, shape) {
  if (shape.ellipse) ctx.ellipse(...shape.ellipse, 0, 0, 2 * Math.PI);
  else for (const { op, values } of pathCommands(shape.d)) {
    if (op === 'M') ctx.moveTo(...values);
    else if (op === 'L') ctx.lineTo(...values);
    else if (op === 'C') ctx.bezierCurveTo(...values);
    else if (op === 'Q') ctx.quadraticCurveTo(...values);
    else ctx.closePath();
  }
}

const compiled = new Map();
function getCompiledPath(shape) {
  if (typeof globalThis.Path2D !== 'function') return null;
  const key = shape.d ?? shape.ellipse.join(',');
  if (!compiled.has(key)) {
    const path = shape.d ? new globalThis.Path2D(shape.d) : new globalThis.Path2D();
    if (shape.ellipse) trace(path, shape);
    compiled.set(key, path);
  }
  return compiled.get(key);
}

export function primeCharacterPaths() {
  for (const rig of Object.values(RIGS)) for (const shape of [...rig.shapes, ...(rig.brokenShapes ?? []), ...(rig.launcher?.shapes ?? []), ...(rig.launcher?.upShapes ?? []), ...Object.values(rig.variants ?? {}).flatMap(v => v.shapes ?? [])]) {
    if (shape.d) pathCommands(shape.d);
    getCompiledPath(shape);
  }
}

const flashColors = new Map();
function paintColor(value, hitFlash) {
  const color = PALETTE[value] ?? value;
  if (!hitFlash || !/^#[0-9a-f]{6}$/i.test(color)) return color;
  const strength = Math.round(hitFlash * 32) / 32 * 0.78;
  const key = `${color}:${strength}`;
  if (!flashColors.has(key)) {
    const from = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16));
    const target = [255, 249, 239];
    flashColors.set(key, `#${from.map((v, i) => Math.round(v + (target[i] - v) * strength).toString(16).padStart(2, '0')).join('')}`);
  }
  return flashColors.get(key);
}

export function drawPlan(ctx, plan) {
  ctx.save();
  try {
    ctx.globalAlpha *= plan.alpha;
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const { shape, matrix } of plan.commands) {
      ctx.save();
      try {
        ctx.transform(...matrix);
        const path = getCompiledPath(shape);
        if (!path) { ctx.beginPath(); trace(ctx, shape); }
        if (shape.fill) { ctx.fillStyle = paintColor(shape.fill, plan.hitFlash); path ? ctx.fill(path) : ctx.fill(); }
        if (shape.stroke) { ctx.strokeStyle = paintColor(shape.stroke, plan.hitFlash); ctx.lineWidth = shape.width; path ? ctx.stroke(path) : ctx.stroke(); }
      } finally { ctx.restore(); }
    }
  } finally { ctx.restore(); }
}

const pointObject = (p) => ({ x: p[0], y: p[1] });
export function getPlanAnchors(plan) {
  const { rig, world, soft, launcher, partMatrices } = plan;
  const parts = {};
  for (const [id, joint] of Object.entries(rig.joints)) {
    const source = id.startsWith('foot-') ? joint : transformPoint(partMatrices[id] ?? soft, joint);
    parts[id] = { ...pointObject(transformPoint(world, source)), angle: 0 };
  }
  const muzzles = launcher ? launcher.muzzles.map((p, index) => {
    const source = transformPoint(launcher.matrix, p);
    // Visible bore plane uses an approved projection; flash follows the actual
    // world shot axis. Neither value changes the simulation projectile origin.
    const angle = finite(plan.actor.aimAngle, plan.actor.facing === 'up' ? -Math.PI / 2 : world[0] < 0 ? Math.PI : 0);
    return { id: `M${index + 1}`, ...pointObject(transformPoint(world, source)), axisAngle: normalizeAngle(angle) };
  }) : [];
  if (launcher) parts.launcher = { ...pointObject(transformPoint(world, launcher.pivot)), angle: world[0] < 0 ? Math.PI - launcher.angle : launcher.angle };
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  const include = (p, padding) => { minX = Math.min(minX, p[0] - padding); maxX = Math.max(maxX, p[0] + padding); minY = Math.min(minY, p[1] - padding); maxY = Math.max(maxY, p[1] + padding); };
  for (const { shape, matrix } of plan.commands) {
    const padding = (shape.stroke ? shape.width / 2 : 0) * Math.max(Math.hypot(matrix[0], matrix[1]), Math.hypot(matrix[2], matrix[3]));
    if (shape.ellipse) {
      const [cx, cy, rx, ry] = shape.ellipse;
      const p = transformPoint(matrix, [cx, cy]);
      const dx = Math.hypot(matrix[0] * rx, matrix[2] * ry); const dy = Math.hypot(matrix[1] * rx, matrix[3] * ry);
      include([p[0] - dx, p[1] - dy], padding); include([p[0] + dx, p[1] + dy], padding);
    } else for (const command of pathCommands(shape.d)) for (let i = 0; i < command.values.length; i += 2) include(transformPoint(matrix, [command.values[i], command.values[i + 1]]), padding);
  }
  return { root: pointObject(transformPoint(world, rig.root)), collisionCenter: pointObject(transformPoint(world, rig.center)), muzzles, parts, bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY } };
}

const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
export function planToSvg(plan, { width = 256, height = 256, viewBox = [0, 0, 256, 256] } = {}) {
  const shapes = plan.commands.map(({ shape, matrix }) => {
    const attrs = `id="${escape(shape.id)}" transform="matrix(${matrix.join(' ')})" fill="${shape.fill ? paintColor(shape.fill, plan.hitFlash) : 'none'}" stroke="${shape.stroke ? paintColor(shape.stroke, plan.hitFlash) : 'none'}" stroke-width="${shape.width}" stroke-linecap="round" stroke-linejoin="round"`;
    return shape.ellipse ? `<ellipse ${attrs} cx="${shape.ellipse[0]}" cy="${shape.ellipse[1]}" rx="${shape.ellipse[2]}" ry="${shape.ellipse[3]}"/>` : `<path ${attrs} d="${shape.d}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox.join(' ')}"><title>${escape(plan.artId)} body-only editable production source</title><metadata>schemaVersion=1; sourceCanvas=256x256; fixed root=${plan.rig.root.join(',')}; logical center=${plan.rig.center.join(',')}; body only, no shadow/projectile/summon/HUD</metadata><g opacity="${plan.alpha}">${shapes}</g></svg>`;
}
