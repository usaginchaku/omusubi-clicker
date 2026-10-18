const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const Game = require('../game.js');

const root = path.join(__dirname, '..');
const storageKey = 'omusubi-clicker-save-v2';
let compiledApp;

function loadCompiledApp() {
  if (!compiledApp) compiledApp = (async () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const babelUrl = html.match(/src="(https:[^"]+babel\.min\.js)"/)[1];
    const response = await fetch(babelUrl);
    assert.equal(response.ok, true, `Babel download: ${response.status}`);
    const compiler = vm.createContext({});
    vm.runInContext(await response.text(), compiler);
    const [, presets, sourcePath] = html.match(/<script type="text\/babel" data-presets="([^"]+)" src="([^"?]+)/);
    const source = fs.readFileSync(path.join(root, sourcePath), 'utf8');
    return compiler.Babel.transform(source, { presets: presets.split(',') }).code;
  })();
  return compiledApp;
}

// Exercise the real event handlers and effects while controlling suspension.
// State setters queue work until flush(), so pagehide can occur before a render.
function createRuntime(code, initialState, random = Math.random) {
  let now = initialState.savedAt;
  let hookIndex = 0;
  let component;
  let tree;
  let timerId = 0;
  let pendingState = [];
  let pendingEffects = [];
  const hooks = [];
  const intervals = new Map();
  const timeouts = new Map();
  const listeners = new Map();
  const storage = new Map([[storageKey, Game.encodeSave(initialState)]]);
  const sameDeps = (a, b) => a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
  const eventTarget = {
    addEventListener(name, callback) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(callback);
    },
    removeEventListener(name, callback) { listeners.get(name)?.delete(callback); },
  };
  const context = vm.createContext({
    Math: Object.create(Math, { random: { value: random } }),
    Date: class extends Date { static now() { return now; } },
    btoa,
    atob,
    React: {
      createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
      useState(initial) {
        const index = hookIndex++;
        if (!hooks[index]) hooks[index] = { value: typeof initial === 'function' ? initial() : initial };
        return [hooks[index].value, update => pendingState.push({ index, update })];
      },
      useRef(current) {
        const index = hookIndex++;
        if (!hooks[index]) hooks[index] = { current };
        return hooks[index];
      },
      useCallback(callback, deps) {
        const index = hookIndex++;
        if (!hooks[index] || !sameDeps(hooks[index].deps, deps)) hooks[index] = { callback, deps };
        return hooks[index].callback;
      },
      useEffect(effect, deps) {
        const index = hookIndex++;
        if (!hooks[index] || !sameDeps(hooks[index].deps, deps)) {
          const previous = hooks[index];
          hooks[index] = { deps };
          pendingEffects.push(() => {
            previous?.cleanup?.();
            hooks[index].cleanup = effect();
          });
        }
      },
    },
    ReactDOM: { createRoot: () => ({ render(element) { component = element.type; render(); } }) },
    document: { ...eventTarget, getElementById: () => ({}), visibilityState: 'visible' },
    window: eventTarget,
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
    setInterval(callback, delay) { const id = ++timerId; intervals.set(id, { callback, delay }); return id; },
    clearInterval: id => intervals.delete(id),
    setTimeout(callback, delay) { const id = ++timerId; timeouts.set(id, { callback, delay }); return id; },
    clearTimeout: id => timeouts.delete(id),
  });
  function render() {
    hookIndex = 0;
    tree = component();
    const effects = pendingEffects;
    pendingEffects = [];
    effects.forEach(effect => effect());
  }
  function flush() {
    for (let pass = 0; pendingState.length; pass++) {
      assert.ok(pass < 20, 'component must settle without an endless render loop');
      const updates = pendingState;
      pendingState = [];
      for (const { index, update } of updates) {
        hooks[index].value = typeof update === 'function' ? update(hooks[index].value) : update;
      }
      render();
    }
  }
  function find(node, predicate) {
    if (!node || typeof node !== 'object') return undefined;
    if (Array.isArray(node)) return node.map(child => find(child, predicate)).find(Boolean);
    return predicate(node) ? node : find(node.children, predicate);
  }
  vm.runInContext(fs.readFileSync(path.join(root, 'game.js'), 'utf8'), context);
  vm.runInContext(code, context);
  flush();
  return {
    advance(milliseconds) { now += milliseconds; },
    pagehide() { for (const callback of listeners.get('pagehide') || []) callback(); },
    clickOnigiri() {
      const button = find(tree, node => node.type === 'button' && node.props['aria-label'] === 'おむすびを握る');
      assert.ok(button, 'the main click button is rendered');
      button.props.onClick({ detail: 0, currentTarget: { parentElement: { getBoundingClientRect: () => ({ width: 260, height: 260, left: 0, top: 0 }) } } });
    },
    tick() {
      const productionTimer = [...intervals.values()].find(timer => timer.delay === 100);
      assert.ok(productionTimer, 'the production timer is registered');
      productionTimer.callback();
      flush();
    },
    flush,
    chooseQuantity(quantity) {
      const button = find(tree, node => node.type === 'button' && node.props['aria-label'] === `${quantity}個ずつ購入`);
      assert.ok(button);
      button.props.onClick();
      flush();
    },
    spawnGolden() {
      const timer = [...timeouts.values()].find(timer => timer.delay >= 25000 && timer.delay <= 45000);
      assert.ok(timer, 'a natural golden spawn is scheduled');
      timer.callback();
      flush();
    },
    claimGolden() {
      const button = find(tree, node => node.type === 'button' && node.props['aria-label'] === '金のおむすびをつかまえる');
      assert.ok(button);
      button.props.onClick();
    },
    caption() {
      const caption = find(tree, node => node.props?.className === 'play-caption');
      const text = node => node == null ? '' : Array.isArray(node) ? node.map(text).join('') : typeof node === 'object' ? text(node.children) : String(node);
      return text(caption);
    },
    saved: () => Game.decodeSave(storage.get(storageKey)).state,
    resumed: () => vm.runInContext('loadInitialGame().state', context),
  };
}

const startingGame = () => ({ ...Game.newGame(), rice: 100, totalRice: 100, owned: { obaachan: 1 }, savedAt: 1000 });

test('next purchase hint follows the selected bulk quantity and never promises an unaffordable buy', async () => {
  const runtime=createRuntime(await loadCompiledApp(), {...Game.newGame(),rice:15,totalRice:15,savedAt:1000});
  assert.match(runtime.caption(),/迎えられます/);
  runtime.chooseQuantity(10);
  assert.match(runtime.caption(),/10人.*あと 293 粒/);
  assert.doesNotMatch(runtime.caption(),/迎えられます/);
  runtime.chooseQuantity(1);
  assert.match(runtime.caption(),/迎えられます/);
});

test('golden harvest settles production before computing the bounded reward and immediately saves it', async () => {
  const runtime=createRuntime(await loadCompiledApp(),startingGame(),()=>0.1);
  runtime.advance(35000);
  runtime.spawnGolden();
  runtime.claimGolden();
  runtime.pagehide();
  assert.equal(runtime.saved().rice,147.5, '100 initial + 17.5 production + 30 golden reward');
  assert.equal(runtime.saved().goldenClicks,1);
  runtime.flush();
  runtime.tick();
  runtime.pagehide();
  assert.equal(runtime.saved().rice,147.5, 'rendering and saving do not repeat the reward');
});

test('pagehide settles ten suspended minutes before saving and never credits them twice', async () => {
  const runtime = createRuntime(await loadCompiledApp(), startingGame());
  runtime.advance(10 * 60 * 1000);
  runtime.pagehide();
  assert.equal(runtime.saved().rice, 400);
  assert.equal(runtime.saved().totalRice, 400);
  assert.equal(runtime.saved().savedAt, 601000);
  assert.equal(runtime.resumed().rice, 400, 'reopening preserves the credited ten minutes');

  runtime.flush();
  runtime.tick();
  runtime.pagehide();
  assert.equal(runtime.saved().rice, 400, 'the next production tick cannot credit the same time again');

  runtime.advance(2000);
  assert.equal(runtime.resumed().rice, 401, 'subsequent offline production starts at the actual save time');
});

test('a click immediately before pagehide survives even before React renders again', async () => {
  const runtime = createRuntime(await loadCompiledApp(), startingGame());
  runtime.clickOnigiri();
  runtime.pagehide();
  assert.equal(runtime.saved().rice, 101);
  assert.equal(runtime.saved().totalRice, 101);
  assert.equal(runtime.saved().clicks, 1);
  assert.equal(runtime.resumed().rice, 101);
  assert.equal(runtime.resumed().clicks, 1);
});
