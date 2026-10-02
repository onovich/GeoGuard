// Presentation only: never use this viewport for wave spawning or collision.
export const DESKTOP_WORLD_ZOOM = 1.25;
export const getWorldView = (state, width, height) => {
  const { camera } = state;
  const ratio = camera.shakeTimer > 0 && camera.shakeDuration > 0 ? camera.shakeTimer / camera.shakeDuration : 0;
  const strength = (camera.shakeStrength ?? 0) * ratio;
  const angle = state.gameTime * 30 + (camera.shakeSeed ?? 0);
  const zoom = width >= 768 ? DESKTOP_WORLD_ZOOM : 1;
  return { width, height, zoom,
    x: camera.x + Math.cos(angle) * strength,
    y: camera.y + Math.sin(angle * 1.18) * strength * 0.72 };
};
export const worldToScreen = (point, view) => ({
  x: view.width / 2 + (point.x - view.x) * view.zoom,
  y: view.height / 2 + (point.y - view.y) * view.zoom,
});
export const screenToWorld = (point, view) => ({
  x: (point.x - view.width / 2) / view.zoom + view.x,
  y: (point.y - view.height / 2) / view.zoom + view.y,
});
export const applyWorldView = (ctx, view) => {
  ctx.translate(view.width / 2, view.height / 2);
  ctx.scale(view.zoom, view.zoom);
  ctx.translate(-view.x, -view.y);
};
// The frozen placement engine accepts unzoomed CSS coordinates. Adapt its input
// at the hook boundary, then retain real CSS coordinates for UI cancellation.
export const placementInput = (state, clientX, clientY, width, height) => {
  const point = screenToWorld({ x: clientX, y: clientY }, getWorldView(state, width, height));
  return { clientX: point.x - state.camera.x + width / 2,
    clientY: point.y - state.camera.y + height / 2,
    camera: state.camera, viewportWidth: width, viewportHeight: height };
};
