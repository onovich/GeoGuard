export const ART_SCHEMA_VERSION = 1;
export const clamp01 = (value) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
export const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;

export const freezeArtDto = (value) => {
  if (!import.meta.env?.DEV || !value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freezeArtDto(child);
  return Object.freeze(value);
};

// Art identities are namespaced; BASIC tower and BASIC enemy are different bodies.
export const getArtIdentity = (entity, domain = 'enemy') => {
  if (domain === 'hero') return 'hero:PLAYER';
  if (domain === 'tower') return `tower:${entity.id}`;
  if (entity.mechanic) return `mechanic:${entity.mechanic.kind.toUpperCase()}`;
  if (entity.isBoss) {
    if (entity.twinRole === 'sun' || entity.id === 'TWIN_SOL') return 'boss:TWINS_SUN';
    if (entity.twinRole === 'moon' || entity.id === 'TWIN_LUNA') return 'boss:TWINS_MOON';
    const baseId = entity.id?.replace(/_T[123]$/, '');
    // An encounter template has no body. Its drag preview uses the Sun member;
    // actual spawned members keep their distinct Sun/Moon identities above.
    return baseId === 'TWINS' ? 'boss:TWINS_SUN' : `boss:${baseId}`;
  }
  return `enemy:${entity.id}`;
};

export const getActorDomain = (entity, domain = 'enemy') =>
  domain !== 'enemy' ? domain : entity.mechanic ? 'mechanic' : entity.isBoss ? 'boss' : 'enemy';

export const validateActor = (actor) => Boolean(actor?.artId && actor.key &&
  [actor.x, actor.y, actor.radius, actor.poseTime, actor.aimAngle].every(Number.isFinite) && actor.radius > 0);

export const addBossHudArtIds = (groups, enemies) => {
  const byUid = new Map(enemies.filter(entity => entity.isBoss).map(entity => [entity.uid, entity]));
  return groups.map(group => ({ ...group, members: group.members.map(member => {
    const entity = byUid.get(member.id);
    return { ...member, artId: entity ? getArtIdentity(entity) : null };
  }) }));
};
