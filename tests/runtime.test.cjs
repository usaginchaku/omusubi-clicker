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
function createRuntime(code, initialState, random = Math.random, options = {}) {
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
  const storage = new Map([[storageKey, options.storedCode ?? Game.encodeSave(initialState)]]);
  const clipboard = [];
  const downloads = [];
  const objectUrls = new Map();
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
    Date: class extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } },
    btoa,
    atob,
    Blob,
    navigator: { clipboard: { async writeText(text) { if (options.clipboardDenied) throw Error('denied'); clipboard.push(text); } } },
    URL: {
      createObjectURL(blob) { const url=`blob:test-${objectUrls.size}`; objectUrls.set(url,blob); return url; },
      revokeObjectURL: url => objectUrls.delete(url),
    },
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
    document: { ...eventTarget, getElementById: () => ({}), visibilityState: 'visible',
      body: { appendChild() {} },
      createElement: () => ({ click() { if (options.downloadFailed) throw Error('download'); downloads.push({name:this.download,blob:objectUrls.get(this.href)}); }, remove() {} }),
    },
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
  // React does not render booleans produced by conditional children.
  const text = node => node == null || typeof node === 'boolean' ? '' : Array.isArray(node) ? node.map(text).join('') : typeof node === 'object' ? text(node.children) : String(node);
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
    async press(label) {
      const button=find(tree,node=>node.type==='button' && text(node)===label);
      assert.ok(button, `button ${label} is rendered`);
      assert.ok(!button.props.disabled, `button ${label} is enabled`);
      await button.props.onClick();
      flush();
    },
    async importFile(file) {
      const input=find(tree,node=>node.type==='input' && node.props.type==='file');
      const target={files:[file],value:'selected.txt'};
      await input.props.onChange({target});
      flush();
      assert.equal(target.value,'', 'same file can be chosen again');
    },
    clipboard, downloads,
    importBackup: () => storage.get(storageKey+'-before-import'),
    saveMessage: () => text(find(tree,node=>node.props.className==='save-message')),
    saveCode: () => find(tree,node=>node.props.id==='save-code')?.props.value,
    manualCodeOpen: () => find(tree,node=>node.type==='details' && text(node).includes('コードで読み込む'))?.props.open,
    toasts: () => text(find(tree,node=>node.props.className==='toast-area')),
    screenText: () => text(tree),
    chooseQuantity(quantity) {
      const button = find(tree, node => node.type === 'button' && node.props['aria-label'] === `${quantity}個ずつ購入`);
      assert.ok(button);
      button.props.onClick();
      flush();
    },
    spawnGolden() {
      const timer = [...timeouts.values()].find(timer => timer.delay >= 12000 && timer.delay <= 45000);
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
      return text(caption);
    },
    saved: () => Game.decodeSave(storage.get(storageKey)).state,
    resumed: () => vm.runInContext('loadInitialGame().state', context),
  };
}

const startingGame = () => ({ ...Game.newGame(), rice: 100, totalRice: 100, owned: { obaachan: 1 }, savedAt: 1000 });

test('golden effects coexist, a fast double tap claims once, and pagehide saves the immediate frenzy click', async () => {
  let roll=.6;
  const runtime=createRuntime(await loadCompiledApp(),{...startingGame(),upgrades:{finger_0:true}},()=>roll);
  runtime.spawnGolden();
  runtime.claimGolden();
  runtime.claimGolden();
  runtime.flush();
  runtime.advance(26000);
  roll=.96;
  runtime.spawnGolden();
  runtime.claimGolden();
  runtime.clickOnigiri(); // before React renders the new effect
  runtime.pagehide();
  assert.equal(runtime.saved().goldenClicks,2);
  assert.equal(runtime.saved().rice,100 + .5*26*7 + (1+.5*7*.02)*777);
  runtime.flush();
  assert.match(runtime.caption(),/生産 ×7.*クリック ×777/);
  runtime.advance(60000);
  runtime.pagehide();
  assert.equal(runtime.saved().rice,100 + .5*(30*7+56) + 1.07*777);
  runtime.tick();
  assert.doesNotMatch(runtime.caption(),/×777/);
});

test('fifteen non-frenzy catches survive a reload, the next catch guarantees 777x and the burst reports its earnings once', async () => {
  const code=await loadCompiledApp();
  const runtime=createRuntime(code,startingGame(),()=>.1);
  for(let i=0;i<15;i++) { runtime.spawnGolden(); runtime.claimGolden(); runtime.flush(); }
  runtime.pagehide();
  assert.equal(runtime.saved().goldenMisses,15);
  assert.equal(runtime.saved().goldenClicks,15);
  const resumed=createRuntime(code,runtime.saved(),()=>.1);
  resumed.spawnGolden(); resumed.claimGolden(); resumed.claimGolden();
  resumed.clickOnigiri(); resumed.clickOnigiri(); resumed.pagehide(); resumed.flush();
  assert.equal(resumed.saved().goldenMisses,0);
  assert.equal(resumed.saved().goldenClicks,16, 'double tap does not count twice');
  assert.equal(resumed.saved().rice-runtime.saved().rice,1554);
  assert.match(resumed.caption(),/クリック ×777/);
  resumed.advance(13000); resumed.tick();
  assert.match(resumed.toasts(),/神の手で 1,554 粒！ 2回握った/);
  resumed.tick();
  assert.equal((resumed.toasts().match(/2回握った/g)||[]).length,1);
});

test('copy exports current progress including unrendered clicks; failure reveals manual copying', async () => {
  for (const clipboardDenied of [false,true]) {
    const runtime=createRuntime(await loadCompiledApp(),startingGame(),Math.random,{clipboardDenied});
    await runtime.press('セーブ');
    runtime.advance(10000);
    runtime.clickOnigiri();
    await runtime.press('最新コードをコピー');
    assert.equal(Game.decodeSave(runtime.saveCode()).state.rice,106);
    if (clipboardDenied) {
      assert.equal(runtime.clipboard.length,0);
      assert.match(runtime.saveMessage(),/自動コピーができません/);
      assert.equal(runtime.manualCodeOpen(),true);
    } else {
      assert.equal(runtime.clipboard[0],runtime.saveCode());
      assert.match(runtime.saveMessage(),/全部コピーしました/);
    }
  }
});

test('txt download round-trips through the real file import handler without extra offline income', async () => {
  const runtime=createRuntime(await loadCompiledApp(),startingGame());
  await runtime.press('セーブ');
  runtime.advance(10000);
  runtime.clickOnigiri();
  await runtime.press('ファイルに保存');
  assert.equal(runtime.downloads.length,1);
  const file=runtime.downloads[0];
  assert.match(file.name,/^omusubi-.*\.txt$/);
  const code=await file.blob.text();
  assert.equal(Game.decodeSave(code).state.rice,106);
  runtime.advance(3600000);
  await runtime.importFile(new Blob(['\ufeff'+code+'\n']));
  assert.equal(Game.decodeSave(runtime.importBackup()).state.rice,1906, 'pre-import progress includes the elapsed hour');
  assert.equal(runtime.saved().rice,106);
  assert.equal(runtime.saved().clicks,1);
  assert.match(runtime.saveMessage(),/復元しました/);
  runtime.pagehide();
  assert.equal(runtime.saved().rice,106);
  await runtime.importFile(file.blob);
  assert.equal(runtime.saved().rice,106);
});

test('blocked corrupted saves export their original bytes and keep them as the pre-import backup', async () => {
  const original='OMSB1|broken-base64';
  const runtime=createRuntime(await loadCompiledApp(),startingGame(),Math.random,{storedCode:original});
  await runtime.press('セーブ');
  await runtime.press('保護中コードをコピー');
  assert.equal(runtime.clipboard[0],original);
  await runtime.press('ファイルに保存');
  assert.equal(await runtime.downloads[0].blob.text(),original);
  await runtime.importFile(new Blob([Game.encodeSave(startingGame())]));
  assert.equal(runtime.importBackup(),original);
  await runtime.press('読み込み前のデータを保存');
  assert.equal(await runtime.downloads[1].blob.text(),original);
  assert.equal(runtime.saved().rice,100);
});

test('malformed, oversized and unreadable files preserve progress and report errors', async () => {
  const runtime=createRuntime(await loadCompiledApp(),startingGame());
  await runtime.press('セーブ');
  for (const file of [new Blob(['not a save']),{size:1000001,text(){throw Error('must not read oversized file');}},{size:1,async text(){throw Error('unreadable');}}]) {
    await runtime.importFile(file);
    assert.match(runtime.saveMessage(),/今の進行はそのまま/);
    assert.equal(runtime.saved().rice,100);
    runtime.pagehide();
    assert.equal(runtime.saved().rice,100);
  }
});

test('import clears temporary effects and cancelled file selection does nothing', async () => {
  const runtime=createRuntime(await loadCompiledApp(),startingGame(),()=>.96);
  runtime.spawnGolden(); runtime.claimGolden(); runtime.flush();
  assert.match(runtime.caption(),/クリック ×777/);
  await runtime.press('セーブ');
  await runtime.importFile(undefined);
  assert.match(runtime.caption(),/クリック ×777/);
  await runtime.importFile(new Blob([Game.encodeSave(startingGame())]));
  assert.doesNotMatch(runtime.caption(),/×777/);
  runtime.clickOnigiri(); runtime.pagehide();
  assert.equal(runtime.saved().rice,101);
});

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

test('welcoming a regular saves once, grows production and shows the same rates in the collection', async () => {
  const state=Game.awardAchievements({...startingGame(),rice:10000,totalRice:10000,clicks:250,owned:{obaachan:10,suihanki:10},upgrades:{shio:true}});
  const runtime=createRuntime(await loadCompiledApp(),state);
  await runtime.press('図鑑');
  await runtime.press('常連 0/4');
  assert.match(runtime.screenText(),/しゃもじを持った猫/);
  await runtime.press('しゃもじを持った猫を迎える · 1,000 粒');
  runtime.pagehide();
  const bought=runtime.saved();
  assert.equal(bought.rice,9000);
  assert.equal(bought.upgrades.regular_cat,true);
  assert.ok(Game.production(bought)>Game.production(state));
  assert.match(runtime.screenText(),/手は貸す。肉球は貸さない。/);
  await runtime.press('話す');
  runtime.pagehide();
  assert.equal(runtime.saved().rice,9000, 'conversation is free and grants no farmable reward');
  assert.match(runtime.screenText(),/まかないの鮭だけ/);
  runtime.advance(1000); runtime.tick(); runtime.pagehide();
  assert.equal(runtime.saved().rice,9000+Game.production(bought));
  await runtime.press('施設のようす');
  assert.match(runtime.screenText(),/合計 毎秒/);
  await runtime.press('セーブ');
  await runtime.press('最新コードをコピー');
  assert.equal(Game.decodeSave(runtime.clipboard[0]).state.upgrades.regular_cat,true);
});
