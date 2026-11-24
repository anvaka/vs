import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../src/lib/jsonpFetch.js', import.meta.url), 'utf8');
const { default: jsonpFetch } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

function fixture() {
  const scripts = [];
  globalThis.window = {};
  globalThis.document = {
    createElement: () => ({}),
    head: {
      appendChild: script => scripts.push(script),
      removeChild(script) {
        const index = scripts.indexOf(script);
        assert.notEqual(index, -1);
        scripts.splice(index, 1);
      }
    }
  };
  return scripts;
}

test('failed JSONP requests reject and release their script and callback', async () => {
  const scripts = fixture();
  const pending = jsonpFetch('https://example.invalid/?q=synthetic');
  const failure = new Error('synthetic load failure');
  const rejected = assert.rejects(pending, error => error === failure);
  scripts[0].onerror(failure);
  await rejected;
  assert.equal(scripts.length, 0);
  assert.deepEqual(Object.keys(window), []);
});

test('one failed request leaves a concurrent successful request intact', async () => {
  const scripts = fixture();
  const failed = jsonpFetch('https://example.invalid/?q=first');
  const success = jsonpFetch('https://example.invalid/?q=second');
  const secondScript = scripts[1];
  const secondName = new URL(secondScript.src).searchParams.get('callback');
  const rejected = assert.rejects(failed);
  scripts[0].onerror(new Error('synthetic failure'));
  await rejected;
  assert.deepEqual(scripts, [secondScript]);
  const response = ['synthetic', ['synthetic result']];
  window[secondName](response);
  assert.equal(await success, response);
  assert.equal(scripts.length, 0);
  assert.deepEqual(Object.keys(window), []);
});

test('successful requests still resolve and clean up', async () => {
  const scripts = fixture();
  const pending = jsonpFetch('https://example.invalid/?q=synthetic');
  const name = new URL(scripts[0].src).searchParams.get('callback');
  window[name]('result');
  assert.equal(await pending, 'result');
  assert.equal(scripts.length, 0);
  assert.deepEqual(Object.keys(window), []);
});
