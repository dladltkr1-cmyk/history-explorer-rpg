# Character art, version 25

Generated with the built-in image generation tool; sources are transparent 1536×1024 PNGs. These are project assets, not standalone illustration deliverables.

Art brief: original, ordinary schoolchild SD RPG sprites with thin dark outlines, matte simple shading and clear silhouettes. Avoid handsome anime/webtoon hero styling, sharp jaw, eyelashes, glossy highlights and coarse low-resolution blocks. Six columns and three directions (front, left, rear). Outfit sheet: teal explorer jacket, ochre light vest, warm red coat/scarf, mustard activewear, white taekwondo uniform, teal/navy football kit without branding. Head sheet: short, spiky, swept back, ponytail, twin ponytails, bob. Blank eye area supports the existing four eye choices. Peach skin and brown hair support palette masks.

`layout.json` registers source crops to the same 256×256 cell. `../../build-avatar-v25.mjs` assembles colour variants, eye shapes and the same idle/two-walk-frame sequence. The main entry is `../../build-avatar-assets.mjs`.

The five runtime PNG atlases and `avatarSource(appearance,direction,pose)` API remain. The face atlas includes a hair-style axis to preserve the source face boundary of each hairstyle; numeric player appearance IDs and saved state are unchanged. No new player fields.
