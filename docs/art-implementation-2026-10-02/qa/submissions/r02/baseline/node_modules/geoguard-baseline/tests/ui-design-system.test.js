import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readProjectFile = (relativePath) => readFile(path.join(repoRoot, relativePath), 'utf8');

const COMPONENT_POLICIES = [
  {
    file: 'src/view/components/BossEditorPanel.jsx',
    requires: ['./ui.jsx', '../designSystem.js'],
  },
  {
    file: 'src/view/components/BuildBar.jsx',
    requires: ['./ui.jsx', '../designSystem.js'],
  },
  {
    file: 'src/view/components/DebugSpawnPanel.jsx',
    requires: ['./ui.jsx', '../designSystem.js'],
    allowedRawButtonReason: 'Segment controls intentionally use ui.segment tokens.',
  },
  {
    file: 'src/view/components/GameHud.jsx',
    requires: ['./ui.jsx'],
  },
  {
    file: 'src/view/components/OverlayScreen.jsx',
    requires: ['./ui.jsx'],
  },
  {
    file: 'src/view/components/StatusBanner.jsx',
    requires: ['./ui.jsx', '../designSystem.js'],
  },
  {
    file: 'src/view/components/TowerContextMenu.jsx',
    requires: ['./ui.jsx'],
  },
  {
    file: 'src/view/components/WaveRewardOverlay.jsx',
    requires: ['./ui.jsx', '../designSystem.js'],
    allowedRawButtonReason: 'Reward cards are repeated interactive cards backed by ui.card.interactive.',
  },
];

const LEGACY_SURFACE_PATTERNS = [
  /rounded-(?:2xl|3xl)/,
  /bg-white\/80\s+(?:p|px|py)-/,
  /shadow-sm\s+backdrop-blur/,
];

test('primary React UI components consume the shared design system entry points', async () => {
  for (const policy of COMPONENT_POLICIES) {
    const source = await readProjectFile(policy.file);

    for (const requiredImport of policy.requires) {
      assert.match(source, new RegExp(`from ['"]${requiredImport.replace('.', '\\.')}['"]`), `${policy.file} should import ${requiredImport}`);
    }
  }
});

test('UI surfaces avoid legacy one-off panel class clusters', async () => {
  for (const policy of COMPONENT_POLICIES) {
    const source = await readProjectFile(policy.file);

    for (const pattern of LEGACY_SURFACE_PATTERNS) {
      assert.equal(pattern.test(source), false, `${policy.file} still contains legacy surface styling matching ${pattern}`);
    }
  }
});

test('raw button usage stays limited to documented non-command card or segment cases', async () => {
  for (const policy of COMPONENT_POLICIES) {
    const source = await readProjectFile(policy.file);
    const rawButtonCount = (source.match(/<button\b/g) ?? []).length;

    if (rawButtonCount === 0) {
      continue;
    }

    assert.ok(policy.allowedRawButtonReason, `${policy.file} should use Button instead of raw <button>`);
    if (policy.file.endsWith('DebugSpawnPanel.jsx')) {
      assert.match(source, /ui\.segment\.item/, 'DebugSpawnPanel raw buttons should be backed by ui.segment tokens');
    }
    if (policy.file.endsWith('WaveRewardOverlay.jsx')) {
      assert.match(source, /ui\.card\.interactive/, 'WaveRewardOverlay reward buttons should be backed by ui.card.interactive');
    }
  }
});

test('canvas renderer remains independent from React UI primitives', async () => {
  const source = await readProjectFile('src/view/canvas/canvasRenderer.js');

  assert.equal(source.includes('components/ui'), false);
  assert.equal(source.includes('designSystem'), false);
});
