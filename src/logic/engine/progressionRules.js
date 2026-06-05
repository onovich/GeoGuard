export const shouldAutoRunWaveFlow = ({ mode, debugWaveFlow }) => mode !== 'debug' || debugWaveFlow;

export const resolveWaveTick = ({ wave, dt, enemyCount, autoRun }) => {
  if (!autoRun) {
    return {
      wave,
      spawnEnemyKeys: [],
      spawnBoss: false,
    };
  }

  const nextWave = {
    ...wave,
    queue: [...wave.queue],
  };
  const spawnEnemyKeys = [];

  while (nextWave.queue.length > 0 && nextWave.spawnTimer >= nextWave.spawnInterval) {
    nextWave.spawnTimer -= nextWave.spawnInterval;
    spawnEnemyKeys.push(nextWave.queue.shift());
  }

  nextWave.spawnTimer += dt;

  const spawnBoss = nextWave.queue.length === 0 && !nextWave.bossSpawned && enemyCount === 0;
  if (spawnBoss) {
    nextWave.bossSpawned = true;
  }

  return {
    wave: nextWave,
    spawnEnemyKeys,
    spawnBoss,
  };
};

export const resolveRewardFollowUp = ({ mode, debugWaveFlow, currentWave }) => {
  if (mode === 'debug' && !debugWaveFlow) {
    return { type: 'debug-stay' };
  }

  return {
    type: 'start-next-wave',
    waveNumber: currentWave + 1,
  };
};
