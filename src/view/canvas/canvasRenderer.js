import { COLORS } from '../../data/gameConfig.js';
import { getBossPresentation } from '../../data/bossPresentation.js';
import { drawRoundRect } from '../../logic/engine/gameMath.js';

const drawTowerShape = (ctx, tower, x, y, color, alpha = 1) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  if (tower.shape === 'circle') {
    ctx.beginPath();
    ctx.arc(x, y, tower.radius, 0, Math.PI * 2);
    ctx.fill();
  } else if (tower.shape === 'square') {
    drawRoundRect(ctx, x - tower.radius, y - tower.radius, tower.radius * 2, tower.radius * 2, 4);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(x, y - tower.radius - 2);
    ctx.lineTo(x + tower.radius + 2, y + tower.radius);
    ctx.lineTo(x - tower.radius - 2, y + tower.radius);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
};

const drawTowerUpgradeBadge = (ctx, tower, x, y) => {
  if (!tower.level) {
    return;
  }

  const badgeWidth = 26;
  const badgeHeight = 14;
  const badgeX = x - badgeWidth / 2;
  const badgeY = y - tower.radius - 18;

  ctx.save();
  ctx.fillStyle = '#fef3c7';
  drawRoundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 7);
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#b45309';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`+${tower.level}`, x, badgeY + badgeHeight / 2 + 0.5);
  ctx.restore();
};

const drawBossBody = (ctx, enemy) => {
  const r = enemy.radius;
  const phaseLevel = (enemy.currentPhaseIndex ?? 0) + 1;
  ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : enemy.color;

  if (enemy.form === 'twins') {
    ctx.beginPath();
    ctx.arc(enemy.x - r * 0.45, enemy.y, r * 0.62, 0, Math.PI * 2);
    ctx.arc(enemy.x + r * 0.45, enemy.y, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.boss;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(enemy.x - r * 0.25, enemy.y);
    ctx.lineTo(enemy.x + r * 0.25, enemy.y);
    ctx.stroke();
    return;
  }

  if (enemy.form === 'twinSun') {
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, r * 0.68, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 3;
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      ctx.beginPath();
      ctx.moveTo(enemy.x + Math.cos(angle) * r * 0.82, enemy.y + Math.sin(angle) * r * 0.82);
      ctx.lineTo(enemy.x + Math.cos(angle) * r * 1.18, enemy.y + Math.sin(angle) * r * 1.18);
      ctx.stroke();
    }
    if (phaseLevel >= 3) {
      ctx.strokeStyle = 'rgba(255,245,184,0.95)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, r * 0.94, 0, Math.PI * 2);
      ctx.stroke();
      for (let index = 0; index < 4; index += 1) {
        const angle = (Math.PI * 2 * index) / 4 + Math.PI / 8;
        ctx.beginPath();
        ctx.moveTo(enemy.x + Math.cos(angle) * r * 1.02, enemy.y + Math.sin(angle) * r * 1.02);
        ctx.lineTo(enemy.x + Math.cos(angle) * r * 1.34, enemy.y + Math.sin(angle) * r * 1.34);
        ctx.stroke();
      }
    }
    return;
  }

  if (enemy.form === 'twinMoon') {
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, r * 0.74, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.bg;
    ctx.beginPath();
    ctx.arc(enemy.x + r * 0.24, enemy.y - r * 0.08, r * 0.56, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, r * 0.96, -Math.PI / 3, Math.PI / 2);
    ctx.stroke();
    if (phaseLevel >= 3) {
      ctx.strokeStyle = 'rgba(214,239,255,0.95)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(enemy.x - r * 0.08, enemy.y, r * 1.08, -Math.PI * 0.52, Math.PI * 0.68);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(enemy.x - r * 0.12, enemy.y, r * 0.78, -Math.PI * 0.46, Math.PI * 0.62);
      ctx.stroke();
    }
    return;
  }

  if (enemy.form === 'dragon') {
    for (let index = 3; index >= 0; index -= 1) {
      ctx.globalAlpha = 0.35 + index * 0.12;
      ctx.beginPath();
      ctx.ellipse(enemy.x - index * r * 0.42, enemy.y + Math.sin(index) * r * 0.18, r * (0.58 - index * 0.05), r * 0.42, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(enemy.x - r * 0.1, enemy.y - r * 0.88);
    ctx.lineTo(enemy.x + r * 0.26, enemy.y - r * 0.18);
    ctx.lineTo(enemy.x - r * 0.34, enemy.y - r * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(enemy.x + r * 0.12, enemy.y + r * 0.88);
    ctx.lineTo(enemy.x + r * 0.4, enemy.y + r * 0.22);
    ctx.lineTo(enemy.x - r * 0.18, enemy.y + r * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(enemy.x + r * 0.95, enemy.y);
    ctx.lineTo(enemy.x + r * 0.25, enemy.y - r * 0.65);
    ctx.lineTo(enemy.x + r * 0.28, enemy.y + r * 0.65);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.arc(enemy.x + r * 0.78, enemy.y - r * 0.12, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    if (phaseLevel >= 2) {
      ctx.strokeStyle = 'rgba(255,214,102,0.78)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(enemy.x + r * 0.62, enemy.y - r * 0.52);
      ctx.lineTo(enemy.x + r * 0.94, enemy.y - r * 0.9);
      ctx.moveTo(enemy.x + r * 0.66, enemy.y + r * 0.52);
      ctx.lineTo(enemy.x + r * 1.02, enemy.y + r * 0.9);
      ctx.stroke();
    }
    if (phaseLevel >= 3) {
      ctx.fillStyle = 'rgba(255,214,102,0.32)';
      ctx.beginPath();
      ctx.ellipse(enemy.x + r * 0.18, enemy.y, r * 0.56, r * 0.92, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (enemy.form === 'spider') {
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y, r * 0.78, r * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.arc(enemy.x + r * 0.24, enemy.y - r * 0.08, r * 0.14, 0, Math.PI * 2);
    ctx.arc(enemy.x - r * 0.06, enemy.y + r * 0.06, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = enemy.color;
    ctx.lineWidth = 4;
    for (let side = -1; side <= 1; side += 2) {
      for (let leg = 0; leg < 4; leg += 1) {
        const y = enemy.y - r * 0.45 + leg * r * 0.3;
        ctx.beginPath();
        ctx.moveTo(enemy.x + side * r * 0.45, y);
        ctx.lineTo(enemy.x + side * r * 1.15, y + (leg - 1.5) * 5);
        ctx.stroke();
      }
    }
    if (phaseLevel >= 2) {
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(enemy.x - r * 0.32, enemy.y - r * 0.14);
      ctx.lineTo(enemy.x + r * 0.3, enemy.y + r * 0.1);
      ctx.moveTo(enemy.x - r * 0.26, enemy.y + r * 0.18);
      ctx.lineTo(enemy.x + r * 0.22, enemy.y - r * 0.2);
      ctx.stroke();
    }
    if (phaseLevel >= 3) {
      ctx.fillStyle = 'rgba(217,249,157,0.3)';
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(enemy.x + side * r * 0.34, enemy.y - r * 0.18, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return;
  }

  if (enemy.form === 'astrolabe') {
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = enemy.color;
    ctx.lineWidth = 3;
    for (const rotation of [0, Math.PI / 3, -Math.PI / 3]) {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(rotation);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.1, r * 0.36, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (let index = 0; index < 3; index += 1) {
      const angle = (Math.PI * 2 * index) / 3 + (enemy.currentPhaseIndex ?? 0) * 0.35;
      ctx.beginPath();
      ctx.arc(enemy.x + Math.cos(angle) * r * 0.9, enemy.y + Math.sin(angle) * r * 0.9, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
    if (phaseLevel >= 2) {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, r * 1.24, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (phaseLevel >= 3) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (enemy.form === 'forge') {
    drawRoundRect(ctx, enemy.x - r * 0.82, enemy.y - r * 0.7, r * 1.64, r * 1.4, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(enemy.x - r * 0.5, enemy.y - r * 0.18, r, r * 0.36);
    return;
  }

  if (enemy.form === 'conductor') {
    ctx.beginPath();
    ctx.moveTo(enemy.x, enemy.y - r);
    ctx.lineTo(enemy.x + r * 0.82, enemy.y);
    ctx.lineTo(enemy.x, enemy.y + r);
    ctx.lineTo(enemy.x - r * 0.82, enemy.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.boss;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(enemy.x - r, enemy.y - r * 0.65);
    ctx.lineTo(enemy.x + r, enemy.y + r * 0.65);
    ctx.stroke();
    return;
  }

  if (enemy.form === 'labyrinth') {
    drawRoundRect(ctx, enemy.x - r, enemy.y - r, r * 2, r * 2, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(enemy.x - r * 0.6, enemy.y - r * 0.5);
    ctx.lineTo(enemy.x + r * 0.5, enemy.y - r * 0.5);
    ctx.lineTo(enemy.x + r * 0.5, enemy.y + r * 0.15);
    ctx.lineTo(enemy.x - r * 0.45, enemy.y + r * 0.15);
    ctx.lineTo(enemy.x - r * 0.45, enemy.y + r * 0.62);
    ctx.stroke();
    return;
  }

  if (enemy.form === 'bloom') {
    for (let petal = 0; petal < 6; petal += 1) {
      const angle = (Math.PI * 2 * petal) / 6;
      ctx.beginPath();
      ctx.ellipse(enemy.x + Math.cos(angle) * r * 0.42, enemy.y + Math.sin(angle) * r * 0.42, r * 0.36, r * 0.68, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = COLORS.boss;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  drawRoundRect(ctx, enemy.x - r, enemy.y - r, r * 2, r * 2, 5);
  ctx.fill();
};

const getHazardGlyph = (hazard) => {
  if (hazard.type === 'area') {
    if (['gravity', 'singularity', 'horizon', 'star'].includes(hazard.label)) return '◎';
    if (['web', 'nest', 'brood', 'shade', 'spore', 'garden', 'poison', 'vine', 'silk'].includes(hazard.label)) return '✳';
    if (['frost', 'prison', 'moon'].includes(hazard.label)) return '✦';
    if (['mortar', 'bunker', 'meteor', 'ember', 'dive', 'slag', 'inferno', 'eclipse'].includes(hazard.label)) return '✹';
    if (['wall', 'gate'].includes(hazard.label)) return '□';
    if (['beat', 'coin'].includes(hazard.label)) return '◌';
  }

  if (['charge', 'ram', 'hunt', 'slash', 'solar', 'breath', 'strafe'].includes(hazard.label)) return '>>';
  if (['rail', 'crosshair', 'grid', 'overload', 'tempo', 'orbit', 'lock'].includes(hazard.label)) return '||';
  if (['refract', 'lattice', 'mirror', 'flare', 'shadow', 'crossfire', 'sunbolt', 'moonbolt'].includes(hazard.label)) return '<>';
  if (['formation', 'wall', 'gate', 'maze'].includes(hazard.label)) return '[]';
  if (['brand', 'coinline'].includes(hazard.label)) return '//';
  return '';
};

const drawBossPhaseAura = (ctx, enemy) => {
  const timer = enemy.bossState.phaseIntroTimer ?? 0;
  if (timer <= 0) return;

  const duration = enemy.bossState.phaseIntroDuration ?? 1;
  const t = Math.max(0, Math.min(1, timer / duration));
  const eased = 1 - t;
  const radius = enemy.radius + 14 + eased * 20;
  const rotation = eased * Math.PI * 1.6 * (enemy.uid % 2 === 0 ? 1 : -1);
  const shardCount = 4 + (enemy.currentPhaseIndex ?? 0) * 2;

  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.rotate(rotation);
  ctx.globalAlpha = 0.2 + t * 0.45;
  ctx.strokeStyle = enemy.color;
  ctx.lineWidth = 2 + t * 2;
  ctx.setLineDash([10, 7]);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.strokeRect(-radius * 0.72, -radius * 0.72, radius * 1.44, radius * 1.44);

  ctx.fillStyle = enemy.color;
  ctx.globalAlpha = 0.22 + t * 0.28;
  for (let index = 0; index < shardCount; index += 1) {
    const angle = (Math.PI * 2 * index) / shardCount;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 5, y - 10);
    ctx.lineTo(x + 5, y - 10);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
};

const drawBossShowcaseAccent = (ctx, enemy) => {
  const phaseLevel = (enemy.currentPhaseIndex ?? 0) + 1;
  const pulse = 0.72 + Math.sin((enemy.x + enemy.y + enemy.uid) * 0.01 + phaseLevel) * 0.08;

  ctx.save();
  ctx.translate(enemy.x, enemy.y);

  if (enemy.form === 'dragon') {
    ctx.globalAlpha = 0.18 + phaseLevel * 0.05;
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.moveTo(-enemy.radius * 0.28, -enemy.radius * 0.16);
    ctx.quadraticCurveTo(-enemy.radius * (1.2 + phaseLevel * 0.08), -enemy.radius * (1 + phaseLevel * 0.06), -enemy.radius * 0.1, -enemy.radius * 0.3);
    ctx.quadraticCurveTo(-enemy.radius * 0.9, -enemy.radius * 0.1, -enemy.radius * 0.15, 0);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-enemy.radius * 0.12, enemy.radius * 0.18);
    ctx.quadraticCurveTo(-enemy.radius * (1.05 + phaseLevel * 0.1), enemy.radius * (0.95 + phaseLevel * 0.06), -enemy.radius * 0.08, enemy.radius * 0.34);
    ctx.quadraticCurveTo(-enemy.radius * 0.88, enemy.radius * 0.18, -enemy.radius * 0.04, 0.08);
    ctx.closePath();
    ctx.fill();
    if (phaseLevel >= 2) {
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-enemy.radius * 0.2, 0);
      ctx.lineTo(-enemy.radius * 1.1, -enemy.radius * 0.46);
      ctx.moveTo(-enemy.radius * 0.12, enemy.radius * 0.1);
      ctx.lineTo(-enemy.radius * 1.02, enemy.radius * 0.52);
      ctx.stroke();
    }
    if (phaseLevel >= 3) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = 'rgba(255,196,87,0.85)';
      for (let index = 0; index < 3; index += 1) {
        ctx.beginPath();
        ctx.arc(-enemy.radius * (0.55 + index * 0.22), Math.sin(index) * enemy.radius * 0.18, enemy.radius * (0.08 + index * 0.02), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  if (enemy.form === 'spider') {
    ctx.globalAlpha = 0.16 + phaseLevel * 0.04;
    ctx.strokeStyle = enemy.color;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 7]);
    for (let ring = 0; ring < phaseLevel; ring += 1) {
      const radius = enemy.radius * (1 + ring * 0.28);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      for (let spoke = 0; spoke < 6; spoke += 1) {
        const angle = (Math.PI * 2 * spoke) / 6 + ring * 0.22;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * enemy.radius * 0.34, Math.sin(angle) * enemy.radius * 0.34);
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        ctx.stroke();
      }
    }
  }

  if (enemy.form === 'astrolabe') {
    ctx.globalAlpha = 0.22 + phaseLevel * 0.04;
    ctx.strokeStyle = enemy.color;
    ctx.lineWidth = 2;
    ctx.rotate((enemy.currentPhaseIndex ?? 0) * 0.35 + enemy.uid * 0.04);
    for (let ring = 0; ring < Math.min(3, phaseLevel + 1); ring += 1) {
      const radius = enemy.radius * (0.92 + ring * 0.32);
      ctx.setLineDash(ring % 2 === 0 ? [5, 8] : [2, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      for (let node = 0; node < 3 + ring; node += 1) {
        const angle = (Math.PI * 2 * node) / (3 + ring);
        ctx.fillStyle = ring === 2 ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.38)';
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, enemy.radius * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  if (enemy.form === 'twinSun' || enemy.form === 'twinMoon') {
    ctx.globalAlpha = 0.16 + phaseLevel * 0.05;
    ctx.strokeStyle = enemy.form === 'twinSun' ? 'rgba(255,211,102,0.9)' : 'rgba(148,212,255,0.9)';
    ctx.lineWidth = 2;
    ctx.setLineDash(enemy.form === 'twinSun' ? [9, 6] : [4, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * (1.05 + phaseLevel * 0.16), 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(phaseLevel * 0.28);
    ctx.setLineDash([]);
    for (let index = 0; index < phaseLevel + 1; index += 1) {
      const angle = (Math.PI * 2 * index) / (phaseLevel + 1);
      const radius = enemy.radius * (0.92 + phaseLevel * 0.08);
      ctx.fillStyle = enemy.form === 'twinSun' ? 'rgba(255,245,184,0.78)' : 'rgba(214,239,255,0.72)';
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, enemy.radius * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
};

const drawBossEncounterLinks = (ctx, enemies) => {
  const encounterGroups = new Map();
  for (const enemy of enemies) {
    if (!enemy.isBoss || !enemy.encounterUid) continue;
    const list = encounterGroups.get(enemy.encounterUid) ?? [];
    list.push(enemy);
    encounterGroups.set(enemy.encounterUid, list);
  }

  for (const members of encounterGroups.values()) {
    if (members.length !== 2) continue;
    const [a, b] = members;
    const midX = (a.x + b.x) * 0.5;
    const midY = (a.y + b.y) * 0.5;
    const distance = dist(a, b);
    const beamAlpha = Math.max(0.14, Math.min(0.34, 0.36 - distance / 900));

    ctx.save();
    ctx.globalAlpha = beamAlpha;
    ctx.strokeStyle = 'rgba(255,255,255,0.68)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.arc(midX, midY, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = a.twinRole === 'sun' ? a.color : b.color;
    ctx.beginPath();
    ctx.arc(midX, midY, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
};

export const getBossPhaseHint = (boss, activePhaseIndex) => {
  const phaseTier = Math.max(0, Math.min(2, activePhaseIndex));

  const phaseHintsByForm = {
    commander: ['Advance', 'Shield Wall', 'Breakthrough'],
    hunter: ['Probe', 'Pincer', 'Execution'],
    fortress: ['Siege', 'Fortify', 'Crush'],
    prism: ['Refraction', 'Mirrors', 'Overload'],
    hive: ['Nest', 'Swarm', 'Collapse'],
    frostJudge: ['Slowfield', 'Freeze Mark', 'Judgment'],
    railWarlord: ['Targeting', 'Suppression', 'Kill Lane'],
    collector: ['Tax', 'Escort', 'Repossess'],
    twinSun: ['Pressure', 'Crossfire', 'Eclipse'],
    twinMoon: ['Snare', 'Lockdown', 'Eclipse'],
    dragon: ['Strafe', 'Air Supremacy', 'Inferno Dive'],
    spider: ['Webs', 'Encircle', 'Nest Bloom'],
    astrolabe: ['Gravity', 'Orbital Lock', 'Event Horizon'],
    forge: ['Armor', 'Sacrifice', 'Detonation'],
    conductor: ['Tempo', 'Syncopate', 'Finale'],
    labyrinth: ['Corridor', 'Gate Shift', 'Dead End'],
    bloom: ['Seed', 'Blight', 'Canopy'],
  };

  const hints = phaseHintsByForm[boss.form];
  if (hints?.[phaseTier]) {
    return hints[phaseTier];
  }

  return phaseTier === 0 ? 'Setup' : phaseTier === 1 ? 'Pressure' : 'Burst';
};

export const getBossPhaseTone = (boss, activePhaseIndex) => {
  const phaseTier = Math.max(0, Math.min(2, activePhaseIndex));
  const tonesByForm = {
    commander: ['#93c5fd', '#60a5fa', '#2563eb'],
    hunter: ['#fca5a5', '#fb7185', '#e11d48'],
    fortress: ['#cbd5e1', '#94a3b8', '#64748b'],
    prism: ['#c4b5fd', '#a78bfa', '#7c3aed'],
    hive: ['#86efac', '#4ade80', '#16a34a'],
    frostJudge: ['#bfdbfe', '#93c5fd', '#38bdf8'],
    railWarlord: ['#fda4af', '#fb7185', '#e11d48'],
    collector: ['#fde68a', '#fbbf24', '#f59e0b'],
    twinSun: ['#fde68a', '#fbbf24', '#f59e0b'],
    twinMoon: ['#bfdbfe', '#93c5fd', '#60a5fa'],
    dragon: ['#fdba74', '#fb923c', '#ea580c'],
    spider: ['#bef264', '#a3e635', '#65a30d'],
    astrolabe: ['#c4b5fd', '#a78bfa', '#8b5cf6'],
    forge: ['#fdba74', '#f97316', '#c2410c'],
    conductor: ['#f9a8d4', '#f472b6', '#db2777'],
    labyrinth: ['#d8b4fe', '#c084fc', '#9333ea'],
    bloom: ['#86efac', '#4ade80', '#22c55e'],
  };

  const tones = tonesByForm[boss.form];
  return tones?.[phaseTier] ?? boss.color ?? '#ffffff';
};

export const getBossPhaseCalloutText = (boss, activePhaseIndex) => {
  const phaseTier = Math.max(0, Math.min(2, activePhaseIndex));

  const calloutsByForm = {
    commander: [
      'The commander is still testing the front. Respect the formation before greedily expanding.',
      'The line is hardening now. Shield support will make the lane feel narrower.',
      'The formation is committing to a breakthrough. Expect the push to arrive as one heavy beat.',
    ],
    hunter: [
      'The hunter is probing for bad positioning. Stay mobile and wait for the overcommit.',
      'The pursuit pattern is tightening. Feints and side pressure will punish planted play.',
      'The hunter has shifted into execution range. Failed reads will be punished much faster now.',
    ],
    fortress: [
      'The fortress is still a slow wall. Start the damage race before the lane collapses.',
      'Armor and fortification are stacking up now. Endurance matters more than burst alone.',
      'The wall is turning into a crush pattern. Surviving the advance is the fight now.',
    ],
    prism: [
      'The prism is teaching its beam geometry. Watch intersections before you look for damage.',
      'Mirror lines are multiplying. Safe angles will move even if the boss itself barely does.',
      'Refraction is overloading the arena. Pattern reading matters more than holding one spot.',
    ],
    hive: [
      'The hive is starting to claim territory. Deny fresh nest points before they snowball.',
      'Swarm pressure is rising now. Letting the board state grow is the real loss condition.',
      'The hive is ready to collapse the arena under numbers. Clear spawners before you tunnel the core.',
    ],
    frostJudge: [
      'The judge is laying out slow fields first. Protect your spacing before the punish arrives.',
      'Freeze marks are entering the pattern now. Stacked value will become a liability.',
      'Judgment range has opened. One frozen pocket can cost the whole lane if you stay grouped.',
    ],
    railWarlord: [
      'The warlord is establishing sight-lines. Clumped tower geometry is now a risk.',
      'Suppression lanes are forming. React to targeting lines before they become a grid.',
      'The kill lane is online. Linear defenses will get punished if they cannot break formation.',
    ],
    collector: [
      'The collector is still stealing tempo, not just money. Protect your economy line early.',
      'Escort runs are becoming more aggressive. A delayed response now costs future pacing too.',
      'The repossession pattern is live. Letting the boss loop tax cycles will snowball the whole wave.',
    ],
    twinSun: [
      'The twins are beginning to sync up. Watch where the two bodies overlap their lanes.',
      'The pair is now forcing crossfire patterns. Positioning mistakes will compound quickly.',
      'The twins are closing the arena together now. Crossfire patterns will collapse space faster.',
    ],
    twinMoon: [
      'Moon pressure is entering the pattern. Watch for the body that restricts movement first.',
      'Lockdown support is thickening now. Bad movement will feed the partner easier openings.',
      'The lunar half is closing the trap with the sun twin. Escape lanes will vanish much faster.',
    ],
    dragon: [
      'Air space is tightening. Lateral dodges will hold better than backing straight away.',
      'The dragon is rewriting safe ground now. Breath and buffet windows will keep shifting the lane.',
      'The dragon is sealing the field. Dive aftermath will shred what used to be safe ground.',
    ],
    spider: [
      'The matriarch is building territory now. Track web zones and encirclement angles first.',
      'Brood pressure is joining the webs. Exits will fail if you ignore body-blockers.',
      'The nest is reaching endgame density. Webs and brood points will choke escape lanes together.',
    ],
    astrolabe: [
      'Orbital geometry is forming. Leave turning room before the gravity lines fully settle.',
      'The astrolabe is teaching displacement now. Old safe positions are becoming temporary.',
      'The singularity is starting to close. Pulls and lock lines will turn old safe corners into traps.',
    ],
    forge: [
      'The forge is still gathering fuel. Do not let the support wave become free armor.',
      'Sacrifice timing is entering the fight now. Small enemies are no longer harmless background noise.',
      'The forge is converting the arena into burst windows. Thin the fuel wave before the detonation comes.',
    ],
    conductor: [
      'The conductor is setting the beat. Read the rhythm before you chase damage windows.',
      'The pattern is syncopating now. Move for the next pulse before the current one resolves.',
      'The finale pattern is opening. Treat the fight like timing, not chaos.',
    ],
    labyrinth: [
      'The keeper is sketching routes now. Preserve at least one clean escape line.',
      'Gate shifts are reshaping the arena. Familiar movement paths will stop being reliable.',
      'The maze is compressing into dead ends. Bad geometry will become the real source of damage.',
    ],
    bloom: [
      'The bloom is planting contamination lines. Leave infected edges before they mature.',
      'Spread pressure is accelerating now. Propagation nodes matter more than the boss body alone.',
      'The garden is entering attrition mode. Hesitation will let the arena decay around you.',
    ],
  };

  const callouts = calloutsByForm[boss.form];
  if (callouts?.[phaseTier]) {
    return callouts[phaseTier];
  }

  return phaseTier >= 2
    ? 'This boss is entering its high-pressure phase. Tempo and space are both changing now.'
    : 'The boss is changing its attack structure. Be ready to swap response patterns.';
};

const drawImpactWaveAccent = (ctx, impactWave, alpha) => {
  const progress = 1 - alpha;
  const accentColor = impactWave.accentColor ?? impactWave.color;
  const secondaryColor = impactWave.secondaryColor ?? '#ffffff';
  const nodeCount = impactWave.nodeCount ?? 6;

  if (impactWave.style === 'twinFinisher') {
    ctx.save();
    ctx.translate(impactWave.x, impactWave.y);
    ctx.rotate(progress * Math.PI * 1.4);
    ctx.globalAlpha = alpha * 0.9;
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.ellipse(0, 0, impactWave.radius * 0.92, impactWave.radius * 0.54, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(-progress * Math.PI * 2);
    ctx.strokeStyle = accentColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, impactWave.radius * 0.54, impactWave.radius * 0.92, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let index = 0; index < nodeCount; index += 1) {
      const angle = (Math.PI * 2 * index) / nodeCount;
      ctx.fillStyle = index % 2 === 0 ? accentColor : secondaryColor;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * impactWave.radius * 0.78, Math.sin(angle) * impactWave.radius * 0.44, impactWave.radius * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = alpha * 0.5;
    ctx.lineWidth = 1.8;
    if (impactWave.anchorA && impactWave.anchorB) {
      ctx.strokeStyle = secondaryColor;
      ctx.setLineDash([4, 10]);
      ctx.beginPath();
      ctx.moveTo(impactWave.anchorA.x, impactWave.anchorA.y);
      ctx.lineTo(impactWave.anchorB.x, impactWave.anchorB.y);
      ctx.stroke();
    }
    for (const anchor of [impactWave.anchorA, impactWave.anchorB]) {
      if (!anchor) continue;
      ctx.strokeStyle = anchor.color ?? accentColor;
      ctx.beginPath();
      ctx.moveTo(impactWave.x, impactWave.y);
      ctx.lineTo(anchor.x, anchor.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (impactWave.style === 'dragonFinisher') {
    ctx.save();
    ctx.translate(impactWave.x, impactWave.y);
    ctx.rotate((impactWave.rotation ?? 0) + progress * 0.45);
    for (let index = 0; index < 3; index += 1) {
      ctx.globalAlpha = alpha * (0.75 - index * 0.12);
      ctx.strokeStyle = index === 1 ? secondaryColor : accentColor;
      ctx.lineWidth = 2 + index * 0.8;
      ctx.setLineDash(index === 2 ? [10, 8] : []);
      ctx.beginPath();
      ctx.arc(0, 0, impactWave.radius * (0.45 + index * 0.22), -0.95, 0.95);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    for (let index = 0; index < 4; index += 1) {
      const flameX = -impactWave.radius * (0.22 + index * 0.16);
      const flameY = Math.sin(progress * 6 + index) * impactWave.radius * 0.16;
      ctx.globalAlpha = alpha * (0.5 - index * 0.08);
      ctx.fillStyle = index % 2 === 0 ? accentColor : secondaryColor;
      ctx.beginPath();
      ctx.moveTo(flameX, flameY - impactWave.radius * 0.08);
      ctx.quadraticCurveTo(flameX - impactWave.radius * 0.08, flameY, flameX, flameY + impactWave.radius * 0.08);
      ctx.quadraticCurveTo(flameX + impactWave.radius * 0.06, flameY, flameX, flameY - impactWave.radius * 0.08);
      ctx.fill();
    }
    ctx.restore();
  }

  if (impactWave.style === 'spiderFinisher') {
    ctx.save();
    ctx.translate(impactWave.x, impactWave.y);
    ctx.rotate(progress * 0.3);
    ctx.globalAlpha = alpha * 0.85;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 8]);
    for (let ring = 0; ring < 2; ring += 1) {
      const radius = impactWave.radius * (0.46 + ring * 0.34);
      ctx.beginPath();
      for (let index = 0; index < nodeCount; index += 1) {
        const angle = (Math.PI * 2 * index) / nodeCount;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * 0.86;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.strokeStyle = secondaryColor;
    for (let index = 0; index < nodeCount; index += 1) {
      const angle = (Math.PI * 2 * index) / nodeCount;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * impactWave.radius * 0.26, Math.sin(angle) * impactWave.radius * 0.22);
      ctx.lineTo(Math.cos(angle) * impactWave.radius * 0.8, Math.sin(angle) * impactWave.radius * 0.68);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (impactWave.style === 'astrolabeFinisher') {
    ctx.save();
    ctx.translate(impactWave.x, impactWave.y);
    ctx.rotate((impactWave.rotation ?? 0) - progress * 0.65);
    for (let ring = 0; ring < 3; ring += 1) {
      ctx.globalAlpha = alpha * (0.86 - ring * 0.18);
      ctx.strokeStyle = ring === 1 ? secondaryColor : accentColor;
      ctx.lineWidth = ring === 1 ? 1.8 : 2.4;
      ctx.setLineDash(ring === 1 ? [3, 9] : [8, 7]);
      ctx.beginPath();
      ctx.arc(0, 0, impactWave.radius * (0.42 + ring * 0.22), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    for (let index = 0; index < nodeCount; index += 1) {
      const angle = (Math.PI * 2 * index) / nodeCount;
      const x = Math.cos(angle) * impactWave.radius * 0.86;
      const y = Math.sin(angle) * impactWave.radius * 0.86;
      ctx.globalAlpha = alpha * 0.75;
      ctx.strokeStyle = accentColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = index % 2 === 0 ? secondaryColor : accentColor;
      ctx.beginPath();
      ctx.arc(x, y, impactWave.radius * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
};

const drawAreaHazardAccent = (ctx, hazard, progress) => {
  const alpha = 0.16 + (1 - progress) * 0.18;

  if (hazard.label === 'eclipse') {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(hazard.x - hazard.radius * 0.14, hazard.y, hazard.radius * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha * 0.85;
    ctx.fillStyle = hazard.color;
    ctx.beginPath();
    ctx.arc(hazard.x - hazard.radius * 0.04, hazard.y, hazard.radius * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (hazard.label === 'inferno') {
    ctx.save();
    ctx.translate(hazard.x, hazard.y);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1.8;
    for (let index = 0; index < 4; index += 1) {
      const angle = (Math.PI * 2 * index) / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * hazard.radius * 0.2, Math.sin(angle) * hazard.radius * 0.2);
      ctx.quadraticCurveTo(
        Math.cos(angle + 0.18) * hazard.radius * 0.52,
        Math.sin(angle + 0.18) * hazard.radius * 0.52,
        Math.cos(angle) * hazard.radius * 0.8,
        Math.sin(angle) * hazard.radius * 0.8
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  if (hazard.label === 'nest') {
    ctx.save();
    ctx.translate(hazard.x, hazard.y);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fef3c7';
    for (let index = 0; index < 3; index += 1) {
      const angle = (Math.PI * 2 * index) / 3 - Math.PI / 2;
      const x = Math.cos(angle) * hazard.radius * 0.78;
      const y = Math.sin(angle) * hazard.radius * 0.78;
      ctx.beginPath();
      ctx.moveTo(x, y - hazard.radius * 0.06);
      ctx.lineTo(x - hazard.radius * 0.05, y + hazard.radius * 0.06);
      ctx.lineTo(x + hazard.radius * 0.05, y + hazard.radius * 0.06);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  if (hazard.label === 'horizon') {
    ctx.save();
    ctx.translate(hazard.x, hazard.y);
    ctx.rotate((1 - progress) * 0.8);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6;
      const x = Math.cos(angle) * hazard.radius * 0.68;
      const y = Math.sin(angle) * hazard.radius * 0.68;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6;
      const x = Math.cos(angle) * hazard.radius * 0.68;
      const y = Math.sin(angle) * hazard.radius * 0.68;
      ctx.fillStyle = index % 2 === 0 ? '#ffffff' : hazard.color;
      ctx.beginPath();
      ctx.arc(x, y, hazard.radius * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
};

const drawLineHazardAccent = (ctx, hazard, progress) => {
  const dx = hazard.x2 - hazard.x;
  const dy = hazard.y2 - hazard.y;
  const length = Math.hypot(dx, dy);
  if (length <= 0.001) return;

  const alpha = 0.18 + (1 - progress) * 0.18;
  const angle = Math.atan2(dy, dx);
  const midX = (hazard.x + hazard.x2) * 0.5;
  const midY = (hazard.y + hazard.y2) * 0.5;

  if (hazard.label === 'crossfire') {
    ctx.save();
    ctx.translate(midX, midY);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    const size = Math.max(12, hazard.width * 1.2);
    ctx.beginPath();
    ctx.moveTo(-size, -size);
    ctx.lineTo(size, size);
    ctx.moveTo(-size, size);
    ctx.lineTo(size, -size);
    ctx.stroke();
    ctx.restore();
  }

  if (hazard.label === 'flare' || hazard.label === 'shadow') {
    ctx.save();
    ctx.translate(midX, midY);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = hazard.label === 'flare' ? '#fde68a' : '#e0e7ff';
    ctx.lineWidth = 1.4;
    const offset = Math.max(10, hazard.width * 1.1);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(-length * 0.18, side * offset);
      ctx.lineTo(0, side * (offset * 0.36));
      ctx.lineTo(length * 0.18, side * offset);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (hazard.label === 'breath' || hazard.label === 'strafe' || hazard.label === 'diveTrail') {
    ctx.save();
    ctx.translate(hazard.x, hazard.y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = hazard.label === 'diveTrail' ? '#ffd166' : 'rgba(255,255,255,0.78)';
    ctx.lineWidth = 1.6;
    const amplitude = hazard.label === 'diveTrail' ? hazard.width * 0.48 : hazard.width * 0.34;
    for (let step = 0; step < 4; step += 1) {
      const start = (length * step) / 4;
      const end = start + length * 0.18;
      ctx.beginPath();
      ctx.moveTo(start, 0);
      ctx.quadraticCurveTo((start + end) * 0.5, -amplitude, end, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (hazard.label === 'orbit' || hazard.label === 'lock') {
    ctx.save();
    ctx.translate(midX, midY);
    ctx.rotate(angle + (hazard.label === 'orbit' ? (1 - progress) * 0.6 : 0));
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(10, hazard.width), 0, Math.PI * 2);
    ctx.stroke();
    const ringRadius = Math.max(16, hazard.width * 1.65);
    for (let index = 0; index < 4; index += 1) {
      const nodeAngle = (Math.PI * 2 * index) / 4;
      ctx.fillStyle = index % 2 === 0 ? '#ffffff' : hazard.color;
      ctx.beginPath();
      ctx.arc(Math.cos(nodeAngle) * ringRadius, Math.sin(nodeAngle) * ringRadius, Math.max(2.5, hazard.width * 0.22), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
};


export const drawGameScene = (ctx, canvas, { state, getTowerById, getDebugDragEntity }) => {
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    const shakeRatio =
      state.camera.shakeTimer > 0 && state.camera.shakeDuration > 0 ? state.camera.shakeTimer / state.camera.shakeDuration : 0;
    const shakeStrength = (state.camera.shakeStrength ?? 0) * shakeRatio;
    const shakeAngle = state.gameTime * 30 + (state.camera.shakeSeed ?? 0);
    const cameraX = state.camera.x + Math.cos(shakeAngle) * shakeStrength;
    const cameraY = state.camera.y + Math.sin(shakeAngle * 1.18) * shakeStrength * 0.72;

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2 - cameraX, height / 2 - cameraY);

    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const gridSize = 60;
    const startX = Math.floor((cameraX - width / 2) / gridSize) * gridSize;
    const startY = Math.floor((cameraY - height / 2) / gridSize) * gridSize;
    for (let x = startX; x < cameraX + width / 2; x += gridSize) {
      ctx.moveTo(x, cameraY - height / 2);
      ctx.lineTo(x, cameraY + height / 2);
    }
    for (let y = startY; y < cameraY + height / 2; y += gridSize) {
      ctx.moveTo(cameraX - width / 2, y);
      ctx.lineTo(cameraX + width / 2, y);
    }
    ctx.stroke();

    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    for (const tower of state.towers) {
      ctx.fillStyle = COLORS.towerBase;
      drawRoundRect(ctx, tower.x - tower.radius - 2, tower.y - tower.radius - 2, (tower.radius + 2) * 2, (tower.radius + 2) * 2, 6);
      ctx.fill();
      drawTowerShape(ctx, tower, tower.x, tower.y, tower.color);
      drawTowerUpgradeBadge(ctx, tower, tower.x, tower.y);
      if (tower.frozenTimer > 0) {
        ctx.strokeStyle = COLORS.towerFrost;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (tower.hp < tower.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(tower.x - 15, tower.y + tower.radius + 8, 30, 4);
        ctx.fillStyle = COLORS.success;
        ctx.fillRect(tower.x - 15, tower.y + tower.radius + 8, 30 * (tower.hp / tower.maxHp), 4);
      }
    }

    for (const drop of state.drops) {
      ctx.fillStyle = drop.color;
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y - drop.radius);
      ctx.lineTo(drop.x + drop.radius, drop.y);
      ctx.lineTo(drop.x, drop.y + drop.radius);
      ctx.lineTo(drop.x - drop.radius, drop.y);
      ctx.closePath();
      ctx.fill();
    }

    drawBossEncounterLinks(ctx, state.enemies);

    for (const enemy of state.enemies) {
      if (enemy.burrowed) {
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.ellipse(enemy.x, enemy.y, enemy.radius * 1.4, enemy.radius * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }
      ctx.save();
      ctx.globalAlpha = enemy.phased ? 0.42 : 1;
      if (enemy.isBoss) {
        drawBossPhaseAura(ctx, enemy);
        drawBossShowcaseAccent(ctx, enemy);
        drawBossBody(ctx, enemy);
      } else {
        ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : enemy.color;
        drawRoundRect(ctx, enemy.x - enemy.radius, enemy.y - enemy.radius, enemy.radius * 2, enemy.radius * 2, 5);
        ctx.fill();
      }
      if (enemy.shield > 0) {
        ctx.strokeStyle = COLORS.enemyShield;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius + 5, 0, Math.PI * 2 * (enemy.shield / Math.max(enemy.maxShield, enemy.shield)));
        ctx.stroke();
      }
      if (enemy.slowRatio < 1) {
        ctx.strokeStyle = COLORS.towerFrost;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (enemy.isBoss) {
        ctx.strokeStyle = COLORS.boss;
        ctx.lineWidth = 3;
        ctx.strokeRect(enemy.x - enemy.radius - 3, enemy.y - enemy.radius - 3, (enemy.radius + 3) * 2, (enemy.radius + 3) * 2);
        if (enemy.phases?.[enemy.currentPhaseIndex]) {
          const phaseTextWidth = Math.max(38, enemy.phases[enemy.currentPhaseIndex].name.length * 13);
          ctx.fillStyle = enemy.bossState.phaseIntroTimer > 0 ? `${enemy.color}22` : 'rgba(255,255,255,0.92)';
          drawRoundRect(ctx, enemy.x - phaseTextWidth / 2, enemy.y - enemy.radius - 29, phaseTextWidth, 18, 9);
          ctx.fill();
          ctx.strokeStyle = enemy.bossState.phaseIntroTimer > 0 ? enemy.color : COLORS.boss;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = enemy.bossState.phaseIntroTimer > 0 ? enemy.color : COLORS.boss;
          ctx.font = enemy.bossState.phaseIntroTimer > 0 ? 'bold 13px system-ui, sans-serif' : 'bold 12px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(enemy.phases[enemy.currentPhaseIndex].name, enemy.x, enemy.y - enemy.radius - 16);
        }
      }
      if (enemy.hp < enemy.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(enemy.x - 20, enemy.y - enemy.radius - 10, 40, 4);
        ctx.fillStyle = enemy.isBoss ? COLORS.boss : COLORS.enemyBasic;
        ctx.fillRect(enemy.x - 20, enemy.y - enemy.radius - 10, 40 * (enemy.hp / enemy.maxHp), 4);
      }
      ctx.restore();
    }

    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, state.player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.playerStroke;
    ctx.lineWidth = 3;
    ctx.stroke();

    for (const impactWave of state.impactWaves) {
      const alpha = impactWave.life / impactWave.maxLife;
      ctx.save();
      ctx.setLineDash(impactWave.dash ?? []);
      ctx.globalAlpha = alpha * impactWave.fillAlpha;
      ctx.fillStyle = impactWave.color;
      ctx.beginPath();
      ctx.arc(impactWave.x, impactWave.y, impactWave.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = impactWave.color;
      ctx.lineWidth = impactWave.lineWidth;
      ctx.beginPath();
      ctx.arc(impactWave.x, impactWave.y, impactWave.radius, 0, Math.PI * 2);
      ctx.stroke();
      if (impactWave.spokes) {
        ctx.translate(impactWave.x, impactWave.y);
        ctx.rotate((1 - alpha) * Math.PI * (impactWave.spin ?? 0));
        for (let index = 0; index < impactWave.spokes; index += 1) {
          const angle = (Math.PI * 2 * index) / impactWave.spokes;
          const inner = impactWave.radius * 0.55;
          const outer = impactWave.radius + 8;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
          ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
          ctx.stroke();
        }
      }
      ctx.restore();
      if (impactWave.style) {
        drawImpactWaveAccent(ctx, impactWave, alpha);
      }
    }
    ctx.globalAlpha = 1;

    for (const hazard of state.hazards) {
      const progress = Math.max(0.15, hazard.timer / hazard.maxTimer);
      ctx.save();
      ctx.globalAlpha = 0.25 + (1 - progress) * 0.35;
      ctx.strokeStyle = hazard.color;
      if (hazard.type === 'area') {
        ctx.fillStyle = hazard.color;
        ctx.globalAlpha = 0.09 + (1 - progress) * 0.12;
        ctx.beginPath();
        ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.3 + (1 - progress) * 0.45;
        ctx.lineWidth = 3;
        if (hazard.label === 'web' || hazard.label === 'nest' || hazard.label === 'shade' || hazard.label === 'silk') ctx.setLineDash([4, 8]);
        else if (hazard.label === 'brood') ctx.setLineDash([10, 6]);
        else if (hazard.label === 'frost' || hazard.label === 'prison' || hazard.label === 'moon') ctx.setLineDash([18, 6]);
        else if (hazard.label === 'gravity' || hazard.label === 'singularity' || hazard.label === 'horizon') ctx.setLineDash([3, 7]);
        else if (hazard.label === 'star') ctx.setLineDash([2, 10]);
        else if (hazard.label === 'mortar' || hazard.label === 'bunker') ctx.setLineDash([16, 10]);
        else if (hazard.label === 'ember' || hazard.label === 'meteor' || hazard.label === 'dive' || hazard.label === 'inferno' || hazard.label === 'eclipse') ctx.setLineDash([8, 6]);
        else if (hazard.label === 'slag') ctx.setLineDash([14, 6]);
        else if (hazard.label === 'beat') ctx.setLineDash([3, 11]);
        else if (hazard.label === 'coin') ctx.setLineDash([6, 12]);
        else if (hazard.label === 'spore' || hazard.label === 'garden' || hazard.label === 'poison') ctx.setLineDash([5, 9]);
        else ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
        ctx.stroke();
        if (hazard.pulsesRemaining > 1) {
          ctx.globalAlpha = 0.16 + (1 - progress) * 0.18;
          ctx.beginPath();
          ctx.arc(hazard.x, hazard.y, hazard.radius * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
        if (hazard.label === 'web' || hazard.label === 'silk' || hazard.label === 'nest') {
          ctx.globalAlpha = 0.18 + (1 - progress) * 0.16;
          ctx.strokeStyle = hazard.color;
          ctx.lineWidth = 1.4;
          ctx.setLineDash([]);
          for (let spoke = 0; spoke < 6; spoke += 1) {
            const angle = (Math.PI * 2 * spoke) / 6;
            ctx.beginPath();
            ctx.moveTo(hazard.x, hazard.y);
            ctx.lineTo(hazard.x + Math.cos(angle) * hazard.radius, hazard.y + Math.sin(angle) * hazard.radius);
            ctx.stroke();
          }
        }
        if (hazard.label === 'gravity' || hazard.label === 'singularity' || hazard.label === 'horizon') {
          ctx.globalAlpha = 0.16 + (1 - progress) * 0.18;
          ctx.strokeStyle = hazard.color;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(hazard.x, hazard.y, Math.max(12, hazard.radius * 0.32), 0, Math.PI * 2);
          ctx.stroke();
          if (hazard.label === 'singularity') {
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, Math.max(8, hazard.radius * 0.18), 0, Math.PI * 2);
            ctx.fill();
          }
        }
        if (hazard.label === 'eclipse' || hazard.label === 'inferno') {
          ctx.globalAlpha = 0.16 + (1 - progress) * 0.14;
          ctx.beginPath();
          ctx.arc(hazard.x, hazard.y, hazard.radius * 0.72, 0, Math.PI * 2);
          ctx.stroke();
        }
        drawAreaHazardAccent(ctx, hazard, progress);
        const areaGlyph = getHazardGlyph(hazard);
        if (areaGlyph) {
          ctx.globalAlpha = 0.34 + (1 - progress) * 0.26;
          ctx.fillStyle = hazard.color;
          ctx.font = `bold ${Math.max(12, Math.round(hazard.radius * 0.22))}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(areaGlyph, hazard.x, hazard.y);
        }
      } else {
        ctx.lineWidth = hazard.width * (0.7 + (1 - progress) * 0.5);
        if (hazard.label === 'formation' || hazard.label === 'wall') ctx.setLineDash([18, 8]);
        else if (hazard.label === 'charge' || hazard.label === 'ram' || hazard.label === 'solar' || hazard.label === 'breath' || hazard.label === 'strafe' || hazard.label === 'diveTrail') ctx.setLineDash([24, 10]);
        else if (hazard.label === 'mark' || hazard.label === 'slash' || hazard.label === 'hunt') ctx.setLineDash([8, 10]);
        else if (hazard.label === 'refract' || hazard.label === 'lattice' || hazard.label === 'mirror' || hazard.label === 'flare' || hazard.label === 'shadow' || hazard.label === 'crossfire' || hazard.label === 'sunbolt' || hazard.label === 'moonbolt') ctx.setLineDash([4, 6]);
        else if (hazard.label === 'rail' || hazard.label === 'crosshair' || hazard.label === 'grid' || hazard.label === 'overload' || hazard.label === 'orbit' || hazard.label === 'lock') ctx.setLineDash([2, 8]);
        else if (hazard.label === 'coinline') ctx.setLineDash([10, 14]);
        else if (hazard.label === 'brood') ctx.setLineDash([14, 6]);
        else if (hazard.label === 'brand' || hazard.label === 'tempo') ctx.setLineDash([6, 10]);
        else if (hazard.label === 'gate' || hazard.label === 'maze') ctx.setLineDash([20, 6]);
        else if (hazard.label === 'vine') ctx.setLineDash([5, 7]);
        else ctx.setLineDash([14, 10]);
        ctx.beginPath();
        ctx.moveTo(hazard.x, hazard.y);
        ctx.lineTo(hazard.x2, hazard.y2);
        ctx.stroke();
        if (hazard.label === 'refract' || hazard.label === 'lattice') {
          ctx.globalAlpha = 0.14 + (1 - progress) * 0.12;
          ctx.lineWidth = Math.max(2, hazard.width * 0.26);
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(hazard.x, hazard.y);
          ctx.lineTo(hazard.x2, hazard.y2);
          ctx.stroke();
        }
        if (hazard.label === 'crossfire' || hazard.label === 'orbit' || hazard.label === 'lock') {
          const midX = (hazard.x + hazard.x2) * 0.5;
          const midY = (hazard.y + hazard.y2) * 0.5;
          ctx.globalAlpha = 0.2 + (1 - progress) * 0.22;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(midX, midY, Math.max(8, hazard.width * 0.9), 0, Math.PI * 2);
          ctx.stroke();
        }
        if (hazard.label === 'breath' || hazard.label === 'strafe') {
          ctx.globalAlpha = 0.12 + (1 - progress) * 0.12;
          ctx.lineWidth = Math.max(3, hazard.width * 1.5);
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(hazard.x, hazard.y);
          ctx.lineTo(hazard.x2, hazard.y2);
          ctx.stroke();
        }
        drawLineHazardAccent(ctx, hazard, progress);
        const dx = hazard.x2 - hazard.x;
        const dy = hazard.y2 - hazard.y;
        const angle = Math.atan2(dy, dx);
        const headSize = Math.max(8, hazard.width * 0.8);
        const glyph = getHazardGlyph(hazard);
        ctx.save();
        ctx.translate(hazard.x2, hazard.y2);
        ctx.rotate(angle);
        ctx.globalAlpha = 0.3 + (1 - progress) * 0.34;
        ctx.fillStyle = hazard.color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-headSize, headSize * 0.45);
        ctx.lineTo(-headSize, -headSize * 0.45);
        ctx.closePath();
        ctx.fill();
        if (glyph) {
          ctx.translate(-Math.hypot(dx, dy) * 0.5, 0);
          ctx.rotate(-angle);
          ctx.font = `bold ${Math.max(11, Math.round(hazard.width * 1.15))}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(glyph, 0, 0);
        }
        ctx.restore();
      }
      ctx.restore();
    }

    ctx.shadowBlur = 4;
    for (const projectile of state.projectiles) {
      ctx.fillStyle = projectile.color;
      if (projectile.kind === 'cannon') {
        ctx.save();
        ctx.translate(projectile.x, projectile.y);
        ctx.rotate(Math.atan2(projectile.vy, projectile.vx));
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.arc(0, 0, projectile.radius + 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = projectile.color;
        drawRoundRect(ctx, -projectile.radius, -projectile.radius, projectile.radius * 2, projectile.radius * 2, 3);
        ctx.fill();
        ctx.restore();
      } else if (projectile.kind === 'sniper') {
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = projectile.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(projectile.previousX, projectile.previousY);
        ctx.lineTo(projectile.x, projectile.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.translate(projectile.x, projectile.y);
        ctx.rotate(Math.atan2(projectile.vy, projectile.vx));
        ctx.beginPath();
        ctx.moveTo(projectile.radius * 3, 0);
        ctx.lineTo(-projectile.radius * 2, projectile.radius);
        ctx.lineTo(-projectile.radius * 2, -projectile.radius);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const dragTower = state.dragPlacement.active && state.dragPlacement.kind === 'tower' ? getTowerById(state.dragPlacement.towerId) : null;
    if (dragTower) {
      const placementColor = state.dragPlacement.canPlace ? COLORS.success : COLORS.danger;
      ctx.fillStyle = `${placementColor}22`;
      ctx.strokeStyle = placementColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(state.dragPlacement.worldX, state.dragPlacement.worldY, dragTower.range, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawTowerShape(ctx, dragTower, state.dragPlacement.worldX, state.dragPlacement.worldY, placementColor, 0.75);
    }

    if (state.dragPlacement.active && state.dragPlacement.kind !== 'tower') {
      const entity = getDebugDragEntity?.(state.dragPlacement.kind, state.dragPlacement.entityId);
      if (entity) {
        ctx.save();
        ctx.globalAlpha = 0.72;
        if (state.dragPlacement.kind === 'boss') {
          drawBossShowcaseAccent(ctx, {
            ...entity,
            x: state.dragPlacement.worldX,
            y: state.dragPlacement.worldY,
            uid: -1,
            currentPhaseIndex: 1,
            bossState: {},
            hitFlash: 0,
          });
          drawBossBody(ctx, {
            ...entity,
            x: state.dragPlacement.worldX,
            y: state.dragPlacement.worldY,
            uid: -1,
            currentPhaseIndex: 1,
            bossState: {},
            hitFlash: 0,
          });
          ctx.strokeStyle = COLORS.boss;
          ctx.lineWidth = 3;
          ctx.strokeRect(state.dragPlacement.worldX - entity.radius - 4, state.dragPlacement.worldY - entity.radius - 4, (entity.radius + 4) * 2, (entity.radius + 4) * 2);
        } else {
          ctx.fillStyle = entity.color;
          drawRoundRect(ctx, state.dragPlacement.worldX - entity.radius, state.dragPlacement.worldY - entity.radius, entity.radius * 2, entity.radius * 2, 5);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    for (const particle of state.particles) {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.life / particle.maxLife;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    for (const floatingText of state.floatingTexts) {
      ctx.font = floatingText.font ?? 'bold 14px system-ui, sans-serif';
      ctx.fillStyle = floatingText.color;
      ctx.globalAlpha = floatingText.life / floatingText.maxLife;
      if (floatingText.outlineColor) {
        ctx.strokeStyle = floatingText.outlineColor;
        ctx.lineWidth = 3;
        ctx.strokeText(floatingText.text, floatingText.x, floatingText.y);
      }
      ctx.fillText(floatingText.text, floatingText.x, floatingText.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    if (state.joystick.active) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.beginPath();
      ctx.arc(state.joystick.startX, state.joystick.startY, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(state.joystick.currentX, state.joystick.currentY, 20, 0, Math.PI * 2);
      ctx.fill();
    }
  };

