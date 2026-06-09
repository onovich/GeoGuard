import { canPlaceTowerOnField } from './gameRules.js';
import { toWorldPoint } from './gameMath.js';

export const createEmptyDragPlacementState = () => ({
  active: false,
  kind: 'tower',
  entityId: null,
  towerId: null,
  pointerX: 0,
  pointerY: 0,
  worldX: 0,
  worldY: 0,
  canPlace: false,
  invalidReason: null,
});

export const createTowerDragPlacementState = ({ towerId, clientX, clientY, touchId = null }) => ({
  active: true,
  kind: 'tower',
  entityId: null,
  towerId,
  pointerX: clientX,
  pointerY: clientY,
  worldX: 0,
  worldY: 0,
  canPlace: false,
  invalidReason: null,
  touchId,
});

export const createDebugEntityDragPlacementState = ({ kind, entityId, clientX, clientY }) => ({
  active: true,
  kind,
  entityId,
  towerId: null,
  pointerX: clientX,
  pointerY: clientY,
  worldX: 0,
  worldY: 0,
  canPlace: true,
  invalidReason: null,
});

export const evaluateTowerPlacement = ({
  tower,
  clientX,
  clientY,
  camera,
  viewportWidth,
  viewportHeight,
  player,
  towers,
  enemies,
  money,
  infiniteMoney,
  invalidPlacementText,
  insufficientFundsText,
}) => {
  const worldPoint = toWorldPoint(clientX, clientY, camera, viewportWidth, viewportHeight);
  if (!tower) {
    return { worldPoint, canPlace: false, invalidReason: invalidPlacementText };
  }

  if (!infiniteMoney && money < tower.cost) {
    return { worldPoint, canPlace: false, invalidReason: insufficientFundsText };
  }

  if (!canPlaceTowerOnField(worldPoint, tower, player, towers, enemies)) {
    return { worldPoint, canPlace: false, invalidReason: invalidPlacementText };
  }

  return { worldPoint, canPlace: true, invalidReason: null };
};

export const updateDragPlacementState = ({
  dragPlacement,
  clientX,
  clientY,
  camera,
  viewportWidth,
  viewportHeight,
  tower,
  player,
  towers,
  enemies,
  money,
  infiniteMoney,
  invalidPlacementText,
  insufficientFundsText,
}) => {
  const worldPoint = toWorldPoint(clientX, clientY, camera, viewportWidth, viewportHeight);

  if (dragPlacement.kind !== 'tower') {
    return {
      ...dragPlacement,
      pointerX: clientX,
      pointerY: clientY,
      worldX: worldPoint.x,
      worldY: worldPoint.y,
      canPlace: true,
      invalidReason: null,
    };
  }

  const placement = evaluateTowerPlacement({
    tower,
    clientX,
    clientY,
    camera,
    viewportWidth,
    viewportHeight,
    player,
    towers,
    enemies,
    money,
    infiniteMoney,
    invalidPlacementText,
    insufficientFundsText,
  });

  return {
    ...dragPlacement,
    pointerX: clientX,
    pointerY: clientY,
    worldX: placement.worldPoint.x,
    worldY: placement.worldPoint.y,
    canPlace: placement.canPlace,
    invalidReason: placement.invalidReason,
  };
};
