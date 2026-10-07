// Render-only camera. Coordinates, movement and interaction distances stay in world pixels.
export const FIELD_ZOOM = 1.18;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export function fieldZoom(map, width, height, playing = true) {
  const indoor = ['room', 'interior', 'cave'].includes(map.theme);
  const small = (map.w <= 12 && map.h <= 10) ||
    (map.w * 64 <= width * .85 && map.h * 64 <= height * .85);
  return playing && !indoor && !small ? FIELD_ZOOM : 1;
}
export function createFieldCamera() {
  let scene = '', aheadX = 0, aheadY = 0;
  return {
    reset() { scene = ''; aheadX = aheadY = 0; },
    update({map, width, height, x, y, direction = {x:0,y:0}, dt = 0, playing = true, safe}) {
      const zoom = fieldZoom(map, width, height, playing);
      const viewW = width / zoom, viewH = height / zoom;
      const key = `${map.id}:${width}:${height}:${zoom}:${playing}`;
      if (key !== scene) { scene = key; aheadX = aheadY = 0; }
      const fixed = zoom === 1;
      const length = Math.hypot(direction.x, direction.y);
      const leadX = !fixed && length ? direction.x / length * Math.min(42, width * .035) / zoom : 0;
      const leadY = !fixed && length ? direction.y / length * Math.min(34, height * .04) / zoom : 0;
      // Only the small look-ahead is eased; player tracking has no positional lag.
      const blend = 1 - Math.exp(-12 * Math.max(0, dt));
      aheadX += (leadX - aheadX) * blend;
      aheadY += (leadY - aheadY) * blend;
      if (Math.abs(aheadX) < .01) aheadX = 0;
      if (Math.abs(aheadY) < .01) aheadY = 0;
      const area = safe || {left:0,right:width,top:0,bottom:height};
      const anchorX = clamp(width * (playing ? .5 : .65), area.left + 32 * zoom, area.right - 32 * zoom);
      const anchorY = clamp(height * .56, area.top + 85 * zoom, area.bottom - 36 * zoom);
      const bounded = (target, size, view) => size <= view ? (size - view) / 2 : clamp(target, 0, size - view);
      return {
        x: bounded(x * 64 + aheadX - anchorX / zoom, map.w * 64, viewW),
        y: bounded(y * 64 + aheadY - anchorY / zoom, map.h * 64, viewH),
        zoom, viewW, viewH, aheadX, aheadY,
      };
    },
  };
}
