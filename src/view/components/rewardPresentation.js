const plainArrow = text => String(text ?? '').replace(/\s*->\s*/g, ' → ');

// Compare live blueprint values with the actual offer's materialized values.
// Missing current data never produces an inferred delta.
export function getRewardPresentation(choice, towerTypes = []) {
  const tower = towerTypes.find(item => item.id === choice.towerId);
  const text = String(choice.detail ?? '');
  const fields = [['伤害', 'damage'], ['射程', 'range'], ['射击间隔', 'fireRate']];
  const improvements = [];
  const comparisons = fields.map(([label, field]) => {
    const after = text.match(new RegExp(`${label}\\s+(\\d+(?:\\.\\d+)?)(秒)?`));
    if (!after) return null;
    const before = tower?.[field];
    const suffix = after[2] ?? '';
    if (Number.isFinite(before) && (field === 'fireRate' ? Number(after[1]) < before : Number(after[1]) > before)) improvements.push(label);
    return `${label} ${Number.isFinite(before) ? `${before} → ` : ''}${after[1]}${suffix}`;
  }).filter(Boolean);
  return {
    title: choice.towerId ? choice.title.replace(/^(解锁|升级)\s*/, '').replace(/\s*蓝图$/, '') : choice.title,
    subtitle: plainArrow(choice.subtitle),
    comparisons,
    improvements,
  };
}

export const formatRewardStat = text => plainArrow(text).replace(/^造价:\s*/, '造价 ');
