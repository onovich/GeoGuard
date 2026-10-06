import { clamp01 } from '../contracts.js';
import { callArt } from './assetRegistry.js';
import { getWorldView, applyWorldView } from './worldCamera.js';
import {sourceImage,sourceNineSlice} from '../world/sourcePixels.js';
import {originalEffectsData} from '../world/originalEffectsData.js';
const requiredWorldSourceKeys=Object.keys(originalEffectsData);

const INK = '#4B281C';
const getAnchors = (registry, actor, frame) => {
  try { return registry.characters.module.getCharacterAnchors(actor, frame); }
  catch (error) {
    const message = `characters.getCharacterAnchors: ${error?.message ?? error}`;
    if (!registry.drawErrors.includes(message) && registry.drawErrors.length < 16) registry.drawErrors.push(message);
    return null;
  }
};
const drawLabels = (ctx, actor, anchors, assets) => {
  if(assets?.onSourceDraw)assets={...assets,sourceContext:{kind:"actor-label",key:actor.key,uid:actor.uid,artId:actor.artId}};
  const root = anchors?.root ?? { x: actor.x, y: actor.y + actor.radius };
  ctx.save(); ctx.shadowBlur = 0; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (actor.hp < actor.maxHp || actor.domain === 'mechanic') {
    const width = actor.domain === 'boss' ? 46 : 30;
    const y = root.y + 5;
    // Dynamic health fill is functional geometry; its outline is the actual B02 skin.
    ctx.fillStyle='#FFF9EF';ctx.fillRect(actor.x-width/2+1,y+1,width-2,3);
    ctx.fillStyle = '#F4ADA0';
    const fill = (width - 2) * clamp01(actor.hp / Math.max(1, actor.maxHp));
    if (fill > 0) ctx.fillRect(actor.x - width / 2 + 1, y + 1, fill, 3);
    sourceNineSlice(ctx,assets,'world:hp-frame',actor.x-width/2,y,width,5,21);
  }
  if (actor.domain === 'tower' && actor.level > 0) {
    const x = (anchors?.bounds?.x ?? actor.x - actor.radius) + (anchors?.bounds?.width ?? actor.radius * 2) + 2;
    const y = actor.y - actor.radius - 7;
    if(actor.level<=4)sourceImage(ctx,assets,'world:level-'+actor.level,x+2,y+1,14,14);
    else {sourceNineSlice(ctx,assets,'ui:keycap',x-8,y-6,20,14,9);ctx.fillStyle=INK;ctx.font='bold 10px system-ui, sans-serif';ctx.fillText('+'+actor.level,x+2,y+1);}
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

// Player art never falls back to the retained program-authored renderer.
// An unavailable source registry shows an explicit loading/failure diagnostic.
export const drawStickerScene = (ctx, canvas, { state, art, getTowerById, getDebugDragEntity, paused, presentationDpr, presentationZoom }) => {
  const registry = art?.registry, runtime = art?.runtime;
  const timed=(key,work)=>{if(!art?.profile)return work();const start=performance.now();try{return work()}finally{art.profile(key,performance.now()-start)}};
  if (!runtime || !registry?.characters?.module || !registry?.world?.module || ['failed','partial'].includes(registry.status)) {
    const dpr=presentationDpr??globalThis.window?.devicePixelRatio??1;
    ctx.save();ctx.fillStyle='#FFF9EF';ctx.fillRect(0,0,canvas.width/dpr,canvas.height/dpr);
    ctx.fillStyle=INK;ctx.font='16px system-ui, sans-serif';ctx.textAlign='center';
    ctx.fillText(['failed','partial'].includes(registry?.status)?'美术资源加载失败，请刷新重试':'正在加载原画资源…',canvas.width/dpr/2,canvas.height/dpr/2);ctx.restore();
    return true;
  }
  const dpr = presentationDpr??globalThis.window?.devicePixelRatio??1;
  const width = canvas.width / dpr, height = canvas.height / dpr;
  const view = getWorldView(state, width, height);
  if(Number.isFinite(presentationZoom)&&presentationZoom>0)view.zoom=presentationZoom; // Explicit QA overview adapter, never collision.
  const camera = { x: view.x, y: view.y };
  const scene = timed('prepare',()=>runtime.prepare(state, { width: width / view.zoom, height: height / view.zoom, dpr }, camera, paused));
  const { frame } = scene, characterAssets = registry.characters.assets;
  const runtimeMissing=[];const worldAssets={...registry.world.assets,onMissingSource:key=>{runtimeMissing.push(key);registry.fatalSourceMissing=true}};
  const missing=scene.actors.filter(({actor})=>!characterAssets?.originalBodies?.[actor.artId]).map(({actor})=>actor.artId);
  missing.push(...requiredWorldSourceKeys.filter(key=>!worldAssets.originalEffects?.[key]));
  registry.fatalSourceMissing=missing.length>0;
  if(missing.length){
    const message='原画资源缺失：'+[...new Set(missing)].join('、');
    if(!registry.drawErrors.includes(message))registry.drawErrors.push(message);
    ctx.save();ctx.fillStyle='#FFF9EF';ctx.fillRect(0,0,width,height);ctx.fillStyle=INK;ctx.font='16px system-ui, sans-serif';ctx.textAlign='center';ctx.fillText('美术资源不完整，游戏已暂停，请刷新重试',width/2,height/2-14);ctx.fillText(message,width/2,height/2+14);ctx.restore();return true;
  }
  const world = (method, ...args) => {const result=timed('world:'+method+':'+(method==='drawActorOverlay'?args.at(-1):args[0]?.kind??args[0]?.type??''),()=>callArt(registry,ctx,'world',method,args));if(!result){runtimeMissing.push(method+':'+(args[0]?.artId??args[0]?.key??args[0]?.type??'source'));registry.fatalSourceMissing=true;registry.status='failed'}return result};
  const renderBody = (actor, entity, domain) => {
    const drawn = timed('body:'+actor.artId,()=>callArt(registry, ctx, 'characters', 'drawCharacter', [actor, frame, characterAssets]));
    if (!drawn) {
      registry.fallbackArtIds.add(actor.artId);
      runtimeMissing.push('body:'+actor.artId);registry.fatalSourceMissing=true;registry.status='failed';
      // An original-source character decode failure must remain observable;
      // never silently replace its pixels with the retained authored renderer.
      const message=`missing original body: ${actor.artId}`;
      if(!registry.drawErrors.includes(message)&&registry.drawErrors.length<16)registry.drawErrors.push(message);
      return false;
    }
    return drawn;
  };
  ctx.save();
  ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; ctx.globalAlpha = 1;
  ctx.fillStyle = '#FFF9EF'; ctx.fillRect(0, 0, width, height);
  applyWorldView(ctx, view);
  world('drawWorldBackground', frame, worldAssets);
  for (const hazard of scene.hazards) if (!world('drawHazard', hazard, frame, worldAssets, 'fill')) fallbackHazard(ctx, hazard, 'fill');

  const actors = scene.actors.map(entry => {const anchors=timed('anchors:'+entry.actor.artId,()=>getAnchors(registry,entry.actor,frame));if(!anchors){runtimeMissing.push('anchors:'+entry.actor.artId);registry.fatalSourceMissing=true;registry.status='failed'}return {...entry,anchors};});
  const actorByKey = new Map(actors.map(entry => [entry.actor.key, entry]));
  for (const entry of actors) world('drawActorOverlay', entry.actor, entry.anchors, frame, worldAssets, 'shadow');
  for (const item of scene.items.filter(item => item.kind === 'drop')) world('drawWorldItem', item, frame, worldAssets);
  // Sorting a temporary presentation list never changes simulation update order.
  actors.sort((a, b) => (a.anchors?.root?.y ?? a.actor.y) - (b.anchors?.root?.y ?? b.actor.y));
  for (const entry of actors) renderBody(entry.actor, entry.entity, entry.actor.domain);
  for (const actor of scene.retired) renderBody(actor,null,actor.domain);

  for (const item of scene.items.filter(item => item.kind !== 'drop')) {
    if (item.kind === 'feedback' && item.data.type === 'shot') {
      const source = actorByKey.get(item.sourceKey);
      const muzzles = source?.anchors?.muzzles ?? [];
      const muzzle = muzzles.length ? muzzles[item.shotIndex % muzzles.length] : null;
      const accepted=item.data?.birthOrigin?.accepted;
      const position = Number.isFinite(accepted?.x)&&Number.isFinite(accepted?.y)?accepted:{x:item.x,y:item.y};
      // Flash position is immutable accepted actual birth, including near-field clamp.
      // Anchors provide diagnostic/source aperture geometry only; each real burst bullet
      // supplies its own trajectory, including spread around the body's aim.
      const shotAnchors = source?.anchors ? { ...source.anchors, muzzles: muzzles.map(anchor => ({ ...anchor, axisAngle: item.angle })) } : null;
      world('drawWorldItem', { ...item, ...position, anchors: shotAnchors,
        angle: item.angle, data: { ...item.data, position: { x: position.x, y: position.y } } }, frame, worldAssets);
    } else if(item.kind==='projectile'){const owner=actorByKey.get(item.sourceKey);world('drawWorldItem',{...item,ownerSourceBounds:owner?.anchors?.bounds??null},frame,worldAssets);} else world('drawWorldItem', item, frame, worldAssets);
  }
  for (const hazard of scene.hazards) if (!world('drawHazard', hazard, frame, worldAssets, 'boundary')) fallbackHazard(ctx, hazard, 'boundary');
  for (const entry of actors) {
    world('drawActorOverlay', entry.actor, entry.anchors, frame, worldAssets, 'status');
    timed('labels',()=>drawLabels(ctx, entry.actor, entry.anchors, worldAssets));
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
        sourceNineSlice(ctx,worldAssets,'ui:panel',drag.worldX-labelWidth/2,labelY-10,labelWidth,20,12);
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
  if(runtimeMissing.length){const message='原画绘制失败：'+[...new Set(runtimeMissing)].join('、');if(!registry.drawErrors.includes(message))registry.drawErrors.push(message);ctx.save();ctx.fillStyle='#FFF9EF';ctx.fillRect(0,0,width,height);ctx.fillStyle=INK;ctx.font='16px system-ui, sans-serif';ctx.textAlign='center';ctx.fillText('美术资源不完整，游戏已暂停，请刷新重试',width/2,height/2-14);ctx.fillText(message,width/2,height/2+14);ctx.restore();}
  return true;
};
