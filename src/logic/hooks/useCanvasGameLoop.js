import { useEffect } from 'react';
import { dist, toWorldPoint } from '../engine/gameMath';

const MOVEMENT_KEYS = ['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'];
const JOYSTICK_MAX_DISTANCE = 50;

const setMovementKey = (keys, key, active) => {
  if (!MOVEMENT_KEYS.includes(key)) {
    return;
  }

  if (key.includes('up')) keys.w = active;
  else if (key.includes('down')) keys.s = active;
  else if (key.includes('left')) keys.a = active;
  else if (key.includes('right')) keys.d = active;
  else keys[key] = active;
};

const updateJoystickFromPoint = (joystick, clientX, clientY) => {
  joystick.currentX = clientX;
  joystick.currentY = clientY;

  const dx = clientX - joystick.startX;
  const dy = clientY - joystick.startY;
  const distance = Math.hypot(dx, dy);

  if (distance > 0) {
    joystick.dirX = (dx / distance) * Math.min(distance / JOYSTICK_MAX_DISTANCE, 1);
    joystick.dirY = (dy / distance) * Math.min(distance / JOYSTICK_MAX_DISTANCE, 1);
  }
};

export default function useCanvasGameLoop({
  canvasRef,
  game,
  gameState,
  rewardActive,
  resumeAudio,
  closeTowerContextMenu,
  setTowerContextMenu,
  updateDragPlacement,
  tryBuildDraggedTower,
  update,
  drawScene,
}) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return undefined;
    }

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      game.current.isMobile = window.innerWidth < 768;
    };

    const handleKeyDown = (event) => {
      setMovementKey(game.current.keys, event.key.toLowerCase(), true);
    };

    const handleKeyUp = (event) => {
      setMovementKey(game.current.keys, event.key.toLowerCase(), false);
    };

    const handlePointerDown = (event) => {
      void resumeAudio();
      closeTowerContextMenu();
      if (gameState !== 'PLAYING' || rewardActive || game.current.dragPlacement.active) return;

      const isTouch = event.type.includes('touch');
      if (isTouch) {
        for (let i = 0; i < event.touches.length; i += 1) {
          const touch = event.touches[i];
          if (!game.current.joystick.active) {
            game.current.joystick = { active: true, touchId: touch.identifier, startX: touch.clientX, startY: touch.clientY, currentX: touch.clientX, currentY: touch.clientY, dirX: 0, dirY: 0 };
            break;
          }
        }
      } else {
        game.current.joystick = { active: true, startX: event.clientX, startY: event.clientY, currentX: event.clientX, currentY: event.clientY, dirX: 0, dirY: 0 };
      }
    };

    const handlePointerMove = (event) => {
      const isTouch = event.type.includes('touch');
      if ((game.current.joystick.active || game.current.dragPlacement.active) && event.cancelable) {
        event.preventDefault();
      }

      if (isTouch) {
        let dragTouch = null;
        let joystickTouch = null;

        for (let i = 0; i < event.touches.length; i += 1) {
          const touch = event.touches[i];
          if (game.current.joystick.active && touch.identifier === game.current.joystick.touchId) {
            joystickTouch = touch;
          } else if (game.current.dragPlacement.active && touch.identifier === game.current.dragPlacement.touchId) {
            dragTouch = touch;
          } else if (!game.current.joystick.active && !game.current.dragPlacement.active && i === 0) {
            dragTouch = touch;
          }
        }

        if (joystickTouch) {
          updateJoystickFromPoint(game.current.joystick, joystickTouch.clientX, joystickTouch.clientY);
        }

        if (dragTouch) {
          game.current.pointer.x = dragTouch.clientX;
          game.current.pointer.y = dragTouch.clientY;
          if (game.current.dragPlacement.active) {
            updateDragPlacement(dragTouch.clientX, dragTouch.clientY);
          }
        }
        return;
      }

      const clientX = event.clientX;
      const clientY = event.clientY;
      game.current.pointer.x = clientX;
      game.current.pointer.y = clientY;

      if (game.current.dragPlacement.active) {
        updateDragPlacement(clientX, clientY);
        return;
      }

      if (game.current.joystick.active) {
        updateJoystickFromPoint(game.current.joystick, clientX, clientY);
      }
    };

    const handlePointerUp = (event) => {
      const isTouch = event.type.includes('touch');

      if (isTouch) {
        for (let i = 0; i < event.changedTouches.length; i += 1) {
          const touch = event.changedTouches[i];
          if (game.current.joystick.active && touch.identifier === game.current.joystick.touchId) {
            game.current.joystick.active = false;
            game.current.joystick.dirX = 0;
            game.current.joystick.dirY = 0;
            game.current.joystick.touchId = null;
          }
          if (game.current.dragPlacement.active && touch.identifier === game.current.dragPlacement.touchId) {
            tryBuildDraggedTower(touch.clientX, touch.clientY);
          }
        }
        return;
      }

      if (game.current.dragPlacement.active) {
        tryBuildDraggedTower(event.clientX, event.clientY);
      }

      game.current.joystick.active = false;
      game.current.joystick.dirX = 0;
      game.current.joystick.dirY = 0;
    };

    const handleContextMenu = (event) => {
      event.preventDefault();
      if (gameState !== 'PLAYING') return;

      const worldPoint = toWorldPoint(event.clientX, event.clientY, game.current.camera, window.innerWidth, window.innerHeight);
      const tower = game.current.towers.find((candidate) => dist(candidate, worldPoint) <= candidate.radius + 10);
      if (tower) {
        setTowerContextMenu({ type: 'instance', towerUid: tower.uid, towerId: tower.id, x: event.clientX, y: event.clientY });
      }
    };

    let animationFrameId;
    const loop = (timestamp) => {
      if (!game.current.lastTime) game.current.lastTime = timestamp;
      const dt = (timestamp - game.current.lastTime) / 1000;
      game.current.lastTime = timestamp;
      if (gameState === 'PLAYING') update(dt);
      drawScene(ctx, canvas);
      animationFrameId = window.requestAnimationFrame(loop);
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('contextmenu', handleContextMenu);
    canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    resizeCanvas();
    animationFrameId = window.requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousedown', handlePointerDown);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      canvas.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, rewardActive]);
}
