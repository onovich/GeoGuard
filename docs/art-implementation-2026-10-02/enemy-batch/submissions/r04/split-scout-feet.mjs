import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ENEMY_RIGS } from '../../../../../src/view/art/characters/enemyRigData.js';

const out = import.meta.dirname, root = path.resolve(out, '../../../../..'), modulePath = path.join(root, 'src/view/art/characters/enemyRigData.js');
if (fs.existsSync(path.join(out, 'before-rigs.json'))) throw new Error('Do not apply the source split twice');
const originalSource = fs.readFileSync(modulePath, 'utf8');
fs.writeFileSync(path.join(out, 'before-enemyRigData.js'), originalSource, 'utf8');
fs.writeFileSync(path.join(out, 'before-rigs.json'), `${JSON.stringify(ENEMY_RIGS, null, 2)}\n`, 'utf8');
const records = [];
let nextSource = originalSource;
const middle = (a, b) => a.map((n, i) => (n + b[i]) / 2);
for (const variant of ['crouch', 'chase']) for (const id of ['long-leg-left', 'long-leg-right']) {
  const shape = ENEMY_RIGS['enemy:SCOUT'].variants[variant].shapes.find(s => s.id === id);
  const tokens = shape.d.match(/[MCZ]|-?(?:\d+\.?\d*|\.\d+)/g), commands = [];
  let i = 0, current, curveIndex = 0;
  while (i < tokens.length) {
    const op = tokens[i++], count = op === 'M' ? 2 : op === 'C' ? 6 : 0;
    const values = tokens.slice(i, i + count).map(Number); i += count;
    if (op === 'M') { current = values; commands.push({ op, values }); }
    else if (op === 'C') {
      curveIndex++;
      if (curveIndex === 2) {
        const c = [current, values.slice(0, 2), values.slice(2, 4), values.slice(4, 6)], a = middle(c[0], c[1]), b = middle(c[1], c[2]), d = middle(c[2], c[3]), e = middle(a, b), f = middle(b, d), p = middle(e, f);
        commands.push({ op: 'C', values: [...a, ...e, ...p] }, { op: 'C', values: [...f, ...d, ...c[3]] });
        records.push({ variant, shapeId: id, fromD: shape.d, originalCubicIndex: 2, splitAt: .5, originalControlPolygon: c, splitControlPolygons: [[c[0], a, e, p], [p, f, d, c[3]]] });
      } else commands.push({ op, values });
      current = values.slice(4, 6);
    } else commands.push({ op, values: [] });
  }
  if (curveIndex !== 4) throw new Error('Expected SCOUT four-cubic target');
  const toD = commands.map(c => `${c.op}${c.values.join(' ')}`).join(' ');
  const count = nextSource.split(shape.d).length - 1;
  if (count !== 1) throw new Error(`Expected one exact authored path occurrence: ${variant}/${id}`);
  nextSource = nextSource.replace(shape.d, toD); records.at(-1).toD = toD;
}
fs.writeFileSync(modulePath, nextSource, 'utf8');
fs.writeFileSync(path.join(out, 'split-proof.json'), `${JSON.stringify({ scope: 'Only SCOUT crouch/chase left/right leg paths; original C2 exactly split at t=.5 per primary instruction', beforeModuleSha256: crypto.createHash('sha256').update(originalSource).digest('hex'), afterModuleSha256: crypto.createHash('sha256').update(nextSource).digest('hex'), records }, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ pathsChanged: records.length, sourceModule: 'enemyRigData.js', otherFieldsChanged: 0 }));
