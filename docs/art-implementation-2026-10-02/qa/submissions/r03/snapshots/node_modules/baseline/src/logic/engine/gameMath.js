export const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

export const rand = (min, max) => Math.random() * (max - min) + min;

export const toWorldPoint = (screenX, screenY, camera, viewportWidth, viewportHeight, zoom = 1) => ({
  x: (screenX - viewportWidth / 2) / zoom + camera.x,
  y: (screenY - viewportHeight / 2) / zoom + camera.y,
});

export const formatTime = (time) => `${Math.floor(time / 60).toString().padStart(2, '0')}:${(time % 60).toString().padStart(2, '0')}`;

export const drawRoundRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
};