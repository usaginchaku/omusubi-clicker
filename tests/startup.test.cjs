const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

test('the deployed Babel preset produces a runnable classic React script', async () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const babelUrl = html.match(/src="(https:[^"]+babel\.min\.js)"/)[1];
  assert.match(babelUrl, /standalone@\d+\.\d+\.\d+\//);
  const response = await fetch(babelUrl);
  assert.equal(response.ok, true, `Babel download: ${response.status}`);
  const compiler = vm.createContext({});
  vm.runInContext(await response.text(), compiler);
  const [, presets, sourcePath] = html.match(/<script type="text\/babel" data-presets="([^"]+)" src="([^"?]+)/);
  const source = fs.readFileSync(path.join(__dirname, '..', sourcePath), 'utf8');
  const { code } = compiler.Babel.transform(source, { presets: presets.split(',') });

  // Reproduce the browser's classic-script execution, which rejects module imports.
  let rendered;
  const app = vm.createContext({
    React: {
      createElement: (type, props, ...children) => ({ type, props, children }),
      useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
      useRef: (current) => ({ current }),
      useCallback: (callback) => callback,
      useEffect: () => {},
    },
    ReactDOM: { createRoot: () => ({ render: (element) => { rendered = element.type(); } }) },
    document: { getElementById: () => ({}) },
    localStorage: { getItem: () => null },
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../game.js'), 'utf8'), app);
  new vm.Script(code).runInContext(app);
  assert.equal(rendered.type, 'div');
  assert.equal(rendered.props.className, 'root');
});
