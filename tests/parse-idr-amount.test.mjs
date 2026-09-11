import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { parseIdrAmount } from '../lib/parse-idr-amount.mjs';

test('parseIdrAmount accepts documented integer, suffix, and grouped formats', () => {
  const cases = new Map([
    ['150k', 150_000],
    ['150rb', 150_000],
    ['1.5jt', 1_500_000],
    ['1,5jt', 1_500_000],
    ['2m', 2_000_000],
    ['200000', 200_000],
    ['200.000', 200_000],
    ['1,000,000', 1_000_000],
  ]);

  for (const [input, expected] of cases) {
    assert.equal(parseIdrAmount(input), expected, input);
  }
});

test('parseIdrAmount rejects partial, malformed, zero, and negative inputs', () => {
  for (const input of ['50abc', '1.2.3jt', '10_k', '1e6', '0', '-100', '', 'jt']) {
    assert.equal(parseIdrAmount(input), null, input);
  }
});

test('generated Telegram parser uses the same strict amount contract', async () => {
  const workflow = JSON.parse(readFileSync(new URL('../midas-bot.n8n.json', import.meta.url), 'utf8'));
  const parserCode = workflow.nodes.find(node => node.name === 'Parse Incoming Message').parameters.jsCode;
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

  async function parse(text) {
    const nodes = {
      Config: { telegramChatId: 42, botToken: 'test' },
      'Telegram Webhook': { body: { message: { text, chat: { id: 42 }, from: { first_name: 'Test' } } } },
    };
    const $ = name => ({ first: () => ({ json: nodes[name] }) });
    const result = await new AsyncFunction('$', parserCode)($);
    return result[0].json;
  }

  assert.equal((await parse('/buy BTC 1,5jt')).modalArg, 1_500_000);
  assert.equal((await parse('/risk BTC 1.5jt')).modalArg, 1_500_000);
  assert.equal((await parse('/buy BTC 50abc')).invalidModal, '50abc');
});
