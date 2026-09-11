import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const rootWorkflowText = readFileSync(new URL('../midas-bot.n8n.json', import.meta.url), 'utf8');
const dockerWorkflowText = readFileSync(new URL('../docker/n8n-data/midas-bot.n8n.json', import.meta.url), 'utf8');
const workflow = JSON.parse(rootWorkflowText);

test('generated workflow copies stay identical and all connections resolve', () => {
  assert.equal(rootWorkflowText, dockerWorkflowText);

  const names = new Set(workflow.nodes.map(node => node.name));
  const ids = new Set(workflow.nodes.map(node => node.id));
  assert.equal(names.size, workflow.nodes.length);
  assert.equal(ids.size, workflow.nodes.length);

  for (const [source, outputs] of Object.entries(workflow.connections)) {
    assert.ok(names.has(source), `missing source node: ${source}`);
    for (const channel of Object.values(outputs)) {
      for (const branch of channel) {
        for (const edge of branch) assert.ok(names.has(edge.node), `missing target node: ${edge.node}`);
      }
    }
  }
});

test('/news parser excludes articles older than 48 hours', async () => {
  const parserCode = workflow.nodes.find(node => node.name === 'Parse News Feed').parameters.jsCode;
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const recentDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toUTCString();
  const oldDate = new Date(Date.now() - 72 * 60 * 60 * 1000).toUTCString();
  const xml = `<rss><channel>
    <item><title>Recent market update - Source A</title><pubDate>${recentDate}</pubDate></item>
    <item><title>Stale market update - Source B</title><pubDate>${oldDate}</pubDate></item>
    <item><title>Missing date - Source C</title></item>
  </channel></rss>`;
  const $ = name => {
    assert.equal(name, 'Resolve News Target');
    return { first: () => ({ json: { coinName: 'Bitcoin', coinSymbol: 'BTC' } }) };
  };
  const $input = { first: () => ({ json: { data: xml } }) };
  const result = await new AsyncFunction('$', '$input', parserCode)($, $input);

  assert.equal(result[0].json.articleCount, 1);
  assert.equal(result[0].json.articles[0].title, 'Recent market update');
});

test('technical core keeps fixed MACD 12/26/9 and requires 35 daily points', () => {
  const source = readFileSync(new URL('../build-bot.mjs', import.meta.url), 'utf8');
  assert.match(source, /const fast = 12, slow = 26, sig = 9;/);
  assert.match(source, /if \(prices\.length < 35\)/);
});
