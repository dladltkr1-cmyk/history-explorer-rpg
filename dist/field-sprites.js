// Drawing only: world coordinates, targeting and combat never read these sizes.
// Crop transparent padding, then use one scale for both axes to retain anatomy.
export const FIELD_SPRITES = Object.freeze({
  ancientHelperNorth:Object.freeze({source:[67,19,121,217],height:61,eliteScale:1}),
  ancientHelperRiver:Object.freeze({source:[0,0,116,240],height:61,eliteScale:1}),
  ancientHelperPlain:Object.freeze({source:[68,19,120,217],height:61,eliteScale:1}),
  kingJumong: Object.freeze({source:[358,107,587,1087],height:66,eliteScale:1}),
  kingOnjo: Object.freeze({source:[340,85,575,1106],height:66,eliteScale:1}),
  kingHyeokgeose: Object.freeze({source:[375,99,490,1083],height:66,eliteScale:1}),
  kingSuro: Object.freeze({source:[343,80,570,1124],height:66,eliteScale:1}),
  bandit: Object.freeze({ source: [242, 102, 528, 1330], height: 69, eliteScale: 1.04 }),
  tiger: Object.freeze({ source: [31, 3, 213, 253], height: 91, eliteScale: 1.03 }),
});
export function fieldSpriteSize(art, elite = false) {
  const profile = FIELD_SPRITES[art];
  if (!profile) return null;
  const h = profile.height * (elite ? profile.eliteScale : 1);
  return { w: h * profile.source[2] / profile.source[3], h };
}
