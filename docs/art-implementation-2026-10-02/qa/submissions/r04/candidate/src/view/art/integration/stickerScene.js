import { clamp01 } from '../contracts.js';
import { callArt } from './assetRegistry.js';
import { getWorldView, applyWorldView } from './worldCamera.js';

const INK = '#4B281C';
const getAnchors = (registry, actor, frame) => {
  try { return registry.characters.module.getCharacterAnchors(actor, frame); }
  catch (error) {
    const message = `characters.getCharacterAnchors: ${error?.message ?? error}`;
    if (!registry.drawErrors.includes(message) && registry.drawErrors.length < 16) registry.drawErrors.push(message);
    return null;
  }
};
const roundedPanel = (ctx, x, y, width, height, radius = 5) => {
  ctx.beginPath(); ctx.roundRect(x, y, width, height, radius);
};
const drawLabels = (ctx, actor, anchors) => {
  const root = anchors?.root ?? { x: actor.x, y: actor.y + actor.radius };
  ctx.save(); ctx.shadowBlur = 0; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (actor.hp < actor.maxHp || actor.domain === 'mechanic') {
    const width = actor.domain === 'boss' ? 46 : 30;
    const y = root.y + 5;
    ctx.fillStyle = '#FFF9EF'; ctx.strokeStyle = INK; ctx.lineWidth = 1;
    roundedPanel(ctx, actor.x - width / 2, y, width, 5, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#F4ADA0';
    const fill = (width - 2) * clamp01(actor.hp / Math.max(1, actor.maxHp));
    if (fill > 0) ctx.fillRect(actor.x - width / 2 + 1, y + 1, fill, 3);
  }
  if (actor.domain === 'tower' && actor.level > 0) {
    const x = (anchors?.bounds?.x ?? actor.x - actor.radius) + (anchors?.bounds?.width ?? actor.radius * 2) + 2;
    const y = actor.y - actor.radius - 7;
    ctx.fillStyle = '#F8DDAA'; roundedPanel(ctx, x - 8, y - 6, 20, 14, 6); ctx.fill();
    ctx.fillStyle = INK; ctx.font = 'bold 10px system-ui, sans-serif'; ctx.fillText(`+${actor.level}`, x + 2, y + 1);
  }
  if (actor.mechanic?.kind === 'courier') {
    ctx.fillStyle = INK; ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(`追回 ${actor.mechanic.cargo}`, actor.x, (anchors?.bounds?.y ?? actor.y - actor.radius) - 9);
  }
  ctx.restore();
};

const fallbackHazard = (ctx, hazard, pass) => {
  ctx.save(); ctx.strokeStyle = '#DE6654'; ctx.fillStyle = '#F4ADA0';
  ctx.globalAlpha = pass === 'fill' ? 0.18 : 0.9;
  ctx.beginPath();
  if (hazard.type === 'area') ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
  else {
    const length = Math.hypot(hazard.x2 - hazard.x, hazard.y2 - hazard.y);
    ctx.translate(hazard.x, hazard.y); ctx.rotate(Math.atan2(hazard.y2 - hazard.y, hazard.x2 - hazard.x));
    ctx.moveTo(0, -hazard.width); ctx.lineTo(length, -hazard.width);
    ctx.arc(length, 0, hazard.width, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(0, hazard.width); ctx.arc(0, 0, hazard.width, Math.PI / 2, Math.PI * 1.5);
    ctx.closePath();
  }
  if (pass === 'fill') ctx.fill(); else { ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]); ctx.stroke(); }
  ctx.restore();
};

// Returns false only when the whole scene should use the retained legacy renderer.
export const drawStickerScene = (ctx, canvas, { state, art, getTowerById, getDebugDragEntity, paused, fallbackBody }) => {
  const registry = art?.registry, runtime = art?.runtime;
  if (!runtime || !registry?.characters?.module || !registry?.world?.module || registry.status === 'failed') return false;
  const dpr = globalThis.window?.devicePixelRatio || 1;
  const width = canvas.width / dpr, height = canvas.height / dpr;
  const view = getWorldView(state, width, height);
  const camera = { x: view.x, y: view.y };
  const scene = runtime.prepare(state, { width: width / view.zoom, height: height / view.zoom, dpr }, camera, paused);
  const { frame } = scene, characterAssets = registry.characters.assets, worldAssets = registry.world.assets;
  const world = (method, ...args) => callArt(registry, ctx, 'world', method, args);
  const renderBody = (actor, entity, domain) => {
    const drawn = callArt(registry, ctx, 'characters', 'drawCharacter', [actor, frame, characterAssets]);
    if (!drawn) {
      registry.fallbackArtIds.add(actor.artId);
      ctx.save(); ctx.globalAlpha = actor.alpha; fallbackBody(ctx, entity, domain); ctx.restore();
    }
    return drawn;
  };
  ctx.save();
  ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; ctx.globalAlpha = 1;
  ctx.fillStyle = '#FFF9EF'; ctx.fillRect(0, 0, width, height);
  applyWorldView(ctx, view);
  world('drawWorldBackground', frame, worldAssets);
  for (const hazard of scene.hazards) if (!world('drawHazard', hazard, frame, worldAssets, 'fill')) fallbackHazard(ctx, hazard, 'fill');

  const actors = scene.actors.map(entry => ({ ...entry, anchors: getAnchors(registry, entry.actor, frame) }));
  const actorByKey = new Map(actors.map(entry => [entry.actor.key, entry]));
  for (const entry of actors) world('drawActorOverlay', entry.actor, entry.anchors, frame, worldAssets, 'shadow');
  for (const item of scene.items.filter(item => item.kind === 'drop')) world('drawWorldItem', item, frame, worldAssets);
  // Sorting a temporary presentation list never changes simulation update order.
  actors.sort((a, b) => (a.anchors?.root?.y ?? a.actor.y) - (b.anchors?.root?.y ?? b.actor.y));
  for (const entry of actors) renderBody(entry.actor, entry.entity, entry.actor.domain);
  for (const actor of scene.retired) callArt(registry, ctx, 'characters', 'drawCharacter', [actor, frame, characterAssets]);

  for (const item of scene.items.filter(item => item.kind !== 'drop')) {
    if (item.kind === 'feedback' && item.data.type === 'shot') {
      const source = actorByKey.get(item.sourceKey);
      const muzzles = source?.anchors?.muzzles ?? [];
      const muzzle = muzzles.length ? muzzles[item.shotIndex % muzzles.length] : null;
      const position = muzzle ?? { x: item.x, y: item.y };
      // Anchors supply the actual deformed hole position; each real burst bullet
      // supplies its own trajectory, including spread around the body's aim.
      const shotAnchors = source?.anchors ? { ...source.anchors, muzzles: muzzles.map(anchor => ({ ...anchor, axisAngle: item.angle })) } : null;
      world('drawWorldItem', { ...item, ...position, anchors: shotAnchors,
        angle: item.angle, data: { ...item.data, position: { x: position.x, y: position.y } } }, frame, worldAssets);
    } else world('drawWorldItem', item, frame, worldAssets);
  }
  for (const hazard of scene.hazards) if (!world('drawHazard', hazard, frame, worldAssets, 'boundary')) fallbackHazard(ctx, hazard, 'boundary');
  for (const entry of actors) {
    world('drawActorOverlay', entry.actor, entry.anchors, frame, worldAssets, 'status');
    drawLabels(ctx, entry.actor, entry.anchors);
  }
  for (const item of scene.links) world('drawWorldItem', item, frame, worldAssets);

  const drag = state.dragPlacement;
  if (drag.active) {
    const entity = drag.kind === 'tower' ? getTowerById(drag.towerId) : getDebugDragEntity?.(drag.kind, drag.entityId);
    if (entity) {
      const ghost = { ...entity, x: drag.worldX, y: drag.worldY, uid: 'ghost', bossState: {}, hp: entity.hp, isBoss: drag.kind === 'boss' };
      const actor = { ...scene.actorForGhost(ghost, drag.kind === 'tower' ? 'tower' : 'enemy'), alpha: 0.52, pose: 'neutral' };
      renderBody(actor, ghost, actor.domain);
      if (drag.kind === 'tower') {
        const placement = { x: drag.worldX, y: drag.worldY, radius: entity.radius, range: entity.range,
          artId: actor.artId, canPlace: drag.canPlace, invalidReason: drag.invalidReason, alpha: 0.65 };
        world('drawPlacement', placement, frame, worldAssets);
        const text = drag.canPlace ? '可放置' : drag.invalidReason || '位置无效';
        ctx.save(); ctx.font = 'bold 12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const labelWidth = ctx.measureText(text).width + 18, labelY = drag.worldY - entity.radius - 24;
        ctx.fillStyle = '#FFF9EF'; ctx.strokeStyle = INK; ctx.lineWidth = 1;
        roundedPanel(ctx, drag.worldX - labelWidth / 2, labelY - 10, labelWidth, 20); ctx.fill(); ctx.stroke();
        ctx.fillStyle = INK; ctx.fillText(text, drag.worldX, labelY); ctx.restore();
      }
    }
  }
  for (const text of state.floatingTexts) {
    ctx.save(); ctx.textAlign = 'center'; ctx.font = text.font ?? 'bold 14px system-ui, sans-serif';
    ctx.globalAlpha = clamp01(text.life / text.maxLife); ctx.fillStyle = INK;
    ctx.strokeStyle = '#FFF9EF'; ctx.lineWidth = 2; ctx.strokeText(text.text, text.x, text.y); ctx.fillText(text.text, text.x, text.y); ctx.restore();
  }
  ctx.restore();
  if (state.joystick.active) {
    ctx.save(); ctx.fillStyle = 'rgba(75,40,28,0.10)'; ctx.beginPath();
    ctx.arc(state.joystick.startX, state.joystick.startY, 50, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(182,212,174,0.65)'; ctx.beginPath();
    ctx.arc(state.joystick.currentX, state.joystick.currentY, 20, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  return true;
};
