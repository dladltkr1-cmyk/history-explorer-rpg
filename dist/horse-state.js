// One owned horse: available with the player, or in the selected home's slot.
// The existing horseUnlocked/mounted fields and taming rules remain in use.
export function hasHorseHome(s) {
  return Boolean(s.horseUnlocked && s.ancient?.country && s.ancient.home?.owned);
}
export function parkHorse(s, { enteringHome = false } = {}) {
  if (!hasHorseHome(s) || (!enteringHome && s.map !== 'ancient-village-' + s.ancient.country)) return false;
  s.mounted = false;
  s.horseParked = true;
  s.horseField = null;
  return true;
}
export function retrieveHorse(s) {
  if (s.ancient?.home?.commerce?.cart.active || !hasHorseHome(s) || !s.horseParked || s.map !== 'ancient-village-' + s.ancient.country) return false;
  s.horseParked = false;
  s.mounted = true;
  s.horseField = null;
  return true;
}
