export const P = Object.freeze({
  cream: '#FFF9EF', ink: '#4B281C', mint: '#A8D8BC', mintShade: '#8BB99C',
  green: '#2F7556', sage: '#759D81', sageShade: '#5F8268', honey: '#F8DDAA',
  honeyShade: '#EAC581', coral: '#E7A08A', coralShade: '#CC8772', danger: '#E96F65',
  ice: '#C7E4F4', iceShade: '#9FC8E2', iceEdge: '#577DA3', lavender: '#C7B6DD',
  purple: '#9274AB', bone: '#F6EFE2', wash: '#EDF0DF', grass: '#CBD8BA', white: '#FFFDF3',
});

export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
export const finitePoint = (value) => Number.isFinite(value?.x) && Number.isFinite(value?.y);
export const number = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
export const handled = Object.freeze({ drawn: true });
export const unsupported = Object.freeze({ drawn: false, reason: 'unsupported' });
export const missing = Object.freeze({ drawn: false, reason: 'missing' });

export function isolated(ctx, alpha, draw) {
  ctx.save();
  try {
    ctx.globalAlpha *= clamp(alpha ?? 1);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.setLineDash([]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    draw();
  } finally { ctx.restore(); }
}

export function lifeAlpha(item) {
  if (Number.isFinite(item.alpha)) return clamp(item.alpha);
  return item.maxLife > 0 && Number.isFinite(item.life) ? clamp(item.life / item.maxLife) : 1;
}
