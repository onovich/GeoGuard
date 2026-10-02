import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = path.join(repoRoot, 'src');
const sourceExtensions = new Set(['.js', '.jsx']);

const normalize = (value) => value.replaceAll(path.sep, '/');
const toProjectPath = (absolutePath) => normalize(path.relative(repoRoot, absolutePath));

const collectSourceFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(absolutePath)));
      continue;
    }
    if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(absolutePath);
    }
  }

  return files;
};

const importPattern = /import\s+(?:[^'"()]+?\s+from\s+)?['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

const extractImports = (source) => {
  const imports = [];
  let match;
  while ((match = importPattern.exec(source))) {
    imports.push(match[1] ?? match[2]);
  }
  return imports;
};

const resolveLocalImport = (importerPath, specifier) => {
  if (!specifier.startsWith('.')) {
    return null;
  }

  const basePath = path.resolve(path.dirname(importerPath), specifier);
  const candidates = [basePath, `${basePath}.js`, `${basePath}.jsx`, path.join(basePath, 'index.js'), path.join(basePath, 'index.jsx')];
  const candidate = candidates.find((item) => item.startsWith(srcRoot));
  return candidate ? toProjectPath(candidate) : null;
};

const getImportGraph = async () => {
  const files = await collectSourceFiles(srcRoot);
  const graph = [];

  for (const absolutePath of files) {
    const source = await readFile(absolutePath, 'utf8');
    const importer = toProjectPath(absolutePath);
    for (const specifier of extractImports(source)) {
      graph.push({
        importer,
        specifier,
        target: resolveLocalImport(absolutePath, specifier),
      });
    }
  }

  return graph;
};

const assertNoImports = (graph, importerPrefix, forbiddenTargetPrefixes, message) => {
  const violations = graph.filter(
    ({ importer, target }) =>
      importer.startsWith(importerPrefix) && target && forbiddenTargetPrefixes.some((prefix) => target.startsWith(prefix))
  );

  assert.deepEqual(
    violations.map(({ importer, specifier, target }) => `${importer} -> ${specifier} (${target})`),
    [],
    message
  );
};

test('data modules do not depend on logic or view layers', async () => {
  const graph = await getImportGraph();

  assertNoImports(graph, 'src/data/', ['src/logic/', 'src/view/'], 'data modules must remain dependency roots');
});

test('engine modules stay independent from React hooks and view layers', async () => {
  const graph = await getImportGraph();

  assertNoImports(
    graph,
    'src/logic/engine/',
    ['src/logic/hooks/', 'src/view/'],
    'engine modules should expose reusable runtime rules without React/view dependencies'
  );
});

test('React hooks do not depend on UI components or design-system primitives', async () => {
  const graph = await getImportGraph();

  assertNoImports(
    graph,
    'src/logic/hooks/',
    ['src/view/components/', 'src/view/screens/', 'src/view/designSystem.js'],
    'hooks should orchestrate runtime state without importing UI components'
  );
});

test('canvas renderer stays drawing-only and does not depend on React UI', async () => {
  const graph = await getImportGraph();

  assertNoImports(
    graph,
    'src/view/canvas/',
    ['src/logic/hooks/', 'src/view/components/', 'src/view/screens/', 'src/view/designSystem.js'],
    'canvas modules should draw runtime state without importing React UI'
  );
});

test('React components do not import runtime engine or hook modules directly', async () => {
  const graph = await getImportGraph();

  assertNoImports(
    graph,
    'src/view/components/',
    ['src/logic/'],
    'components should receive behavior through props instead of importing logic modules'
  );
});

test('screen composition does not bypass hooks by importing engine modules directly', async () => {
  const graph = await getImportGraph();

  assertNoImports(
    graph,
    'src/view/screens/',
    ['src/logic/engine/'],
    'screens should compose hooks and components, not call engine modules directly'
  );
});

test('Boss phase presentation helpers stay in data instead of canvas', async () => {
  const canvasSource = await readFile(path.join(repoRoot, 'src/view/canvas/canvasRenderer.js'), 'utf8');
  const bossPresentationSource = await readFile(path.join(repoRoot, 'src/data/bossPresentation.js'), 'utf8');

  assert.equal(canvasSource.includes('getBossPhaseHint'), false);
  assert.equal(canvasSource.includes('getBossPhaseTone'), false);
  assert.equal(canvasSource.includes('getBossPhaseCalloutText'), false);
  assert.match(bossPresentationSource, /getBossPhasePresentation/);
});
