// Drawing only: world coordinates, targeting and combat never read these sizes.
// Crop transparent padding, then use one scale for both axes to retain anatomy.
export const FIELD_SPRITES = Object.freeze({
  bandit: Object.freeze({ source: [242, 102, 528, 1330], height: 69, eliteScale: 1.04 }),
  tiger: Object.freeze({ source: [31, 3, 213, 253], height: 91, eliteScale: 1.03 }),
});
export function fieldSpriteSize(art, elite = false) {
  const profile = FIELD_SPRITES[art];
  if (!profile) return null;
  const h = profile.height * (elite ? profile.eliteScale : 1);
  return { w: h * profile.source[2] / profile.source[3], h };
}
