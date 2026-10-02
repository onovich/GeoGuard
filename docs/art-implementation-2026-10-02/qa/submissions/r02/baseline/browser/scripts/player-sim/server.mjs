import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createPlayerSimulation } from './engine.mjs';

const sessions = new Map();
const output = '.tmp/player-playtest/audit';
mkdirSync(output, { recursive: true });
const server = createServer(async (request, response) => {
  try {
    if (request.method !== 'POST') throw new Error('Use POST /create, /observe, /act or /debrief');
    let text = ''; for await (const chunk of request) { text += chunk; if (text.length > 16384) throw new Error('Request too large'); }
    const body = JSON.parse(text || '{}');
    let result;
    if (request.url === '/create') {
      const sim = createPlayerSimulation(body), session = randomUUID();
      sessions.set(session, sim); result = { session, observation: sim.observe() };
    } else {
      const sim = sessions.get(body.session); if (!sim) throw new Error('Unknown session');
      if (request.url === '/observe') result = { observation: sim.observe() };
      else if (request.url === '/act') result = sim.act(body.action);
      else if (request.url === '/debrief') result = { debrief: sim.debrief() };
      else throw new Error('Unknown endpoint');
      if (result.debrief) writeFileSync(`${output}/${body.session}.json`, JSON.stringify(sim.exportAudit(), null, 2) + '\n');
    }
    response.writeHead(200, { 'Content-Type': 'application/json' }); response.end(JSON.stringify(result));
  } catch (error) { response.writeHead(400, { 'Content-Type': 'application/json' }); response.end(JSON.stringify({ error: error.message })); }
});
server.listen(5181, '127.0.0.1', () => console.log('GeoGuard player simulation API listening on http://127.0.0.1:5181'));
