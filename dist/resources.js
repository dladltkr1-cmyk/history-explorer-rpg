export const BERRY_REGROW_MS = 180000;
export const FISH_REGROW_MS = 240000;

export function resourceKind(entity) {
  if (entity.type === 'berry') return 'berry';
  if (entity.type === 'loot' && entity.resource === 'fish') return 'fish';
  return null;
}

export function resourceReady(state, entity, now = Date.now()) {
  const kind = resourceKind(entity);
  if (!kind) return !state.opened.includes(entity.id);
  const nextAt = state.resources?.[entity.id]?.nextAt || 0;
  // Fish move to a new bank spot when the area refreshes.
  return kind === 'fish' ? nextAt === 0 : nextAt <= now;
}

export function harvestResource(state, entity, now = Date.now()) {
  if (!resourceReady(state, entity, now)) return false;
  const kind = resourceKind(entity);
  if (kind) {
    state.resources ??= {};
    const previous = state.resources[entity.id] || {};
    state.resources[entity.id] = {
      nextAt: now + (kind === 'berry' ? BERRY_REGROW_MS : FISH_REGROW_MS),
      slot: previous.slot ?? 0,
    };
  } else state.opened.push(entity.id);
  return true;
}

export function refreshResources(state, map, now = Date.now(), random = Math.random) {
  let changed = false;
  for (const entity of map.entities) {
    if (resourceKind(entity) !== 'fish') continue;
    const record = state.resources?.[entity.id];
    if (!record) {
      if (entity.spots?.[0]) [entity.x, entity.y] = entity.spots[0];
      continue;
    }
    if (record.nextAt && record.nextAt <= now) {
      record.nextAt = 0;
      const spots = entity.spots || [[entity.x, entity.y]];
      const old = record.slot % spots.length;
      record.slot = spots.length > 1
        ? (old + 1 + Math.floor(random() * (spots.length - 1))) % spots.length
        : 0;
      changed = true;
    }
    const spot = (entity.spots || [[entity.x, entity.y]])[record.slot || 0];
    if (spot) [entity.x, entity.y] = spot;
  }
  return changed;
}
