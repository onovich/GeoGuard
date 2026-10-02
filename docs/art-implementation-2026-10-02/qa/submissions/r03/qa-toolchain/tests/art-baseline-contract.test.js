import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT,fileHash,compareManifests,sha256}from'../scripts/art-validation/common.mjs';

const directory=path.join(ROOT,'docs/art-implementation-2026-10-02/integration/submissions/r01');
test('QA pins the primary-approved integration packet and every listed contract file',()=>{
  assert.equal(fileHash(path.join(directory,'packet.json')),'b068cd8cc19d808dd60f1b0eba855feeb11f019f8911ad8da8b17f1ba9d1b2ba');
  const packet=JSON.parse(fs.readFileSync(path.join(directory,'packet.json')));
  for(const file of packet.files)assert.equal(fileHash(path.join(directory,file.path)),file.sha256,file.path);
});
test('QA action sampling ledger must retain exact 48 identities and 375 source action keys',()=>{
  const source=JSON.parse(fs.readFileSync(path.join(directory,'state-reuse-375.json'))).actions;
  const identities=JSON.parse(fs.readFileSync(path.join(directory,'identity-map.json'))).identities;
  assert.equal(identities.length,48);assert.equal(source.length,375);assert.equal(new Set(source.map(a=>a.key)).size,375);
  assert.deepEqual([...new Set(source.map(a=>a.artKey))].sort(),identities.map(i=>i.artKey).sort());
  const anatomy=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/art-direction/sticker-bible-2026-10-01/action-consistency/anatomy-lock.json')));
  assert.deepEqual(source.map(a=>a.key).sort(),anatomy.items.flatMap(i=>i.actions.map(a=>`${i.key}/${a.action}`)).sort());
});
test('EOL-only source classification never exempts token or numeric changes',()=>{
  const manifest=text=>[{path:'src/logic/engine/probe.js',sha256:sha256(text),normalizedTextSha256:sha256(text.replaceAll('\r\n','\n'))}];
  assert.equal(compareManifests(manifest('hp=100;\n'),manifest('hp=100;\r\n'))[0].kind,'line_endings_only');
  assert.equal(compareManifests(manifest('hp=100;\n'),manifest('hp=101;\r\n'))[0].kind,'content_change_or_unavailable_normalization');
  assert.equal(compareManifests(manifest('hp=100;\n'),manifest('hp =100;\r\n'))[0].kind,'content_change_or_unavailable_normalization');
});
