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

test('/news parser enforces 48-hour age and tolerates up to 10 minutes of clock drift', async () => {
  const parserCode = workflow.nodes.find(node => node.name === 'Parse News Feed').parameters.jsCode;
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const recentDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toUTCString();
  const toleratedFutureDate = new Date(Date.now() + 5 * 60 * 1000).toUTCString();
  const rejectedFutureDate = new Date(Date.now() + 11 * 60 * 1000).toUTCString();
  const oldDate = new Date(Date.now() - 72 * 60 * 60 * 1000).toUTCString();
  const xml = `<rss><channel>
    <item><title>Recent market update - Source A</title><pubDate>${recentDate}</pubDate></item>
    <item><title>Clock drift update - Source B</title><pubDate>${toleratedFutureDate}</pubDate></item>
    <item><title>Far future update - Source C</title><pubDate>${rejectedFutureDate}</pubDate></item>
    <item><title>Stale market update - Source B</title><pubDate>${oldDate}</pubDate></item>
    <item><title>Missing date - Source D</title></item>
  </channel></rss>`;
  const $ = name => {
    assert.equal(name, 'Resolve News Target');
    return { first: () => ({ json: { coinName: 'Bitcoin', coinSymbol: 'BTC' } }) };
  };
  const $input = { first: () => ({ json: { data: xml } }) };
  const result = await new AsyncFunction('$', '$input', parserCode)($, $input);

  assert.equal(result[0].json.articleCount, 2);
  assert.deepEqual(
    result[0].json.articles.map(article => article.title),
    ['Recent market update', 'Clock drift update'],
  );
});

test('technical core keeps fixed MACD 12/26/9 and requires 35 daily points', () => {
  const source = readFileSync(new URL('../build-bot.mjs', import.meta.url), 'utf8');
  assert.match(source, /const fast = 12, slow = 26, sig = 9;/);
  assert.match(source, /if \(prices\.length < 35\)/);
});

test('workflow exposes stock and futures analysis without any order-execution path', () => {
  const router = workflow.nodes.find(node => node.name === 'Command Router');
  const commandOutputs = router.parameters.rules.values.map(rule => rule.outputKey);
  assert.ok(commandOutputs.includes('stock'));
  assert.ok(commandOutputs.includes('futures'));

  const names = new Set(workflow.nodes.map(node => node.name));
  for (const required of [
    'Prepare Market Command',
    'Execute Market Analysis',
    'Parse Market Analysis Result',
    'Prepare Gemini Market Prompt',
    'Gemini Market Research',
    'Build Market Report',
    'Save Market Analysis',
  ]) assert.ok(names.has(required), `missing market analysis node: ${required}`);

  for (const name of ['Execute Market Analysis', 'Read History']) {
    assert.equal(typeof workflow.nodes.find(node => node.name === name).parameters.executeOnce, 'boolean');
  }

  const marketNodeNames = [...names].filter(name => /Stock|Futures|Market Analysis|Gemini Market/.test(name));
  assert.equal(marketNodeNames.some(name => /Order|Buy|Sell|Execute Trade/i.test(name)), false);
});

test('market workflow keeps deterministic verdict outside Gemini and uses the local analysis CLI', () => {
  const prepare = workflow.nodes.find(node => node.name === 'Prepare Market Command').parameters.jsCode;
  const prompt = workflow.nodes.find(node => node.name === 'Prepare Gemini Market Prompt').parameters.jsCode;
  const report = workflow.nodes.find(node => node.name === 'Build Market Report').parameters.jsCode;

  assert.match(prepare, /market_analysis_cli\.mjs/);
  assert.match(prepare, /stock\|futures/);
  assert.match(prompt, /DILARANG mengubah angka/);
  assert.match(report, /analysis\.verdict/);
  assert.doesNotMatch(report, /(?:verdict|analysisVerdict)\s*=\s*[^;]*aiAnalysis/);
});

test('/rec supports coin, stock, and futures while plain /rec defaults to coin', async () => {
  const names = new Set(workflow.nodes.map(node => node.name));
  for (const required of [
    'Prepare Recommendation',
    'Recommendation Type',
    'Execute Market Recommendations',
    'Parse Market Recommendations',
    'Format Market Recommendations',
    'Send Market Recommendations',
  ]) assert.ok(names.has(required), `missing recommendation node: ${required}`);

  const prepareCode = workflow.nodes.find(node => node.name === 'Prepare Recommendation').parameters.jsCode;
  assert.match(prepareCode, /coin\|stock\|futures/);
  assert.match(prepareCode, /\|\| 'coin'/);
  assert.match(prepareCode, /market_analysis_cli\.mjs recommend-/);

  const recType = workflow.nodes.find(node => node.name === 'Recommendation Type');
  assert.deepEqual(recType.parameters.rules.values.map(rule => rule.outputKey), ['coin', 'stock', 'futures']);
  const formatCode = workflow.nodes.find(node => node.name === 'Format Market Recommendations').parameters.jsCode;
  assert.match(formatCode, /executionAllowed/);
  assert.doesNotMatch(formatCode, /Gemini|geminiBody/);
});

test('/rec preparation and futures formatter execute with n8n-compatible payloads', async () => {
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const prepareCode = workflow.nodes.find(node => node.name === 'Prepare Recommendation').parameters.jsCode;
  const runPrepare = async args => new AsyncFunction('$', prepareCode)(name => ({
    first: () => ({ json: name === 'Config'
      ? { telegramChatId: '1', botToken: 'token' }
      : { args, chatId: '1' } }),
  }));
  assert.equal((await runPrepare(''))[0].json.recommendationMode, 'coin');
  assert.match((await runPrepare('stock'))[0].json.dbCmd, /recommend-stock$/);
  assert.match((await runPrepare('futures'))[0].json.dbCmd, /recommend-futures$/);
  assert.equal((await runPrepare('forex'))[0].json.recommendationMode, 'invalid');

  const formatCode = workflow.nodes.find(node => node.name === 'Format Market Recommendations').parameters.jsCode;
  const context = {
    recommendationMode: 'futures',
    recommendations: {
      assetClass: 'crypto_perpetual', scannedCount: 1,
      candidates: [{
        symbol: 'BTCUSDT', side: 'LONG', setup: 'PULLBACK', price: 100,
        rankScore: 75, executionAllowed: false,
        factors: { technicalScore: 70, rsi14: 52, adx14: 28, fundingRatePct: 0.01, oiChangePct: 4, oiRegime: 'PRICE_UP_OI_UP', support: 95, resistance: 110 },
      }],
    },
  };
  const formatted = await new AsyncFunction('$', formatCode)(name => ({
    first: () => ({ json: name === 'Config' ? { telegramChatId: '1', botToken: 'token' } : context }),
  }));
  assert.match(formatted[0].json.telegramMessage, /BTCUSDT — LONG PULLBACK/);
  assert.match(formatted[0].json.telegramMessage, /analysis-only/);
});
