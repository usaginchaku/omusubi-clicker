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
  // Keys listed here throw on write (quota) or silently store damaged bytes.
  const failing = new Set(options.failKeys || []);
  const corrupting = new Set(options.corruptKeys || []);
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
    window: { ...eventTarget, matchMedia: options.wide ? () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) : undefined },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => {
        if (failing.has(key)) throw Error('quota');
        storage.set(key, corrupting.has(key) ? value.slice(0, -1) : value);
      },
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
    async pressAria(label) {
      const button=find(tree,node=>node.type==='button' && node.props['aria-label']===label);
      assert.ok(button, `button ${label} is rendered`);
      assert.ok(!button.props.disabled, `button ${label} is enabled`);
      await button.props.onClick();
      flush();
    },
    button(label) { return find(tree,node=>node.type==='button' && text(node)===label); },
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
    stored: key => storage.get(key),
    failStorage(key, on = true) { if (on) failing.add(key); else failing.delete(key); },
    otherTabSaves() { for (const callback of listeners.get('storage') || []) callback({ key: storageKey, newValue: 'OMSB1|other-tab' }); flush(); },
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
  await runtime.press('ショップ');
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
  await runtime.press('施設');
  assert.match(runtime.screenText(),/合計 毎秒/);
  await runtime.press('セーブ');
  await runtime.press('最新コードをコピー');
  assert.equal(Game.decodeSave(runtime.clipboard[0]).state.upgrades.regular_cat,true);
});

test('cooking commits only at completion, saves before render and charges once on rapid taps', async () => {
  const state={...Game.newGame(),rice:200,totalRice:200,upgrades:{shio:true},savedAt:1000};
  const runtime=createRuntime(await loadCompiledApp(),state);
  await runtime.press('図鑑');
  await runtime.press('料理 0/3');
  await runtime.pressAria('塩むすびを作る');
  await runtime.press('米をよそう');
  const shape=runtime.button('きゅっと握る');
  shape.props.onClick(); shape.props.onClick(); runtime.flush();
  runtime.pagehide();
  assert.equal(runtime.saved().rice,200, 'preparation is free');
  assert.deepEqual(runtime.saved().recipes,{});
  const finish=runtime.button('完成させる · 150 粒');
  assert.ok(finish, 'rapid preparation cannot skip payment');
  finish.props.onClick(); finish.props.onClick();
  runtime.pagehide();
  assert.equal(runtime.saved().rice,50);
  assert.equal(runtime.saved().recipes.shio_musubi,true);
  assert.equal(runtime.saved().unlocked.recipe_shio_musubi,true);
  runtime.flush();
  assert.match(runtime.screenText(),/いいひとつまみだね/);
  await runtime.press('‹ 料理一覧');
  await runtime.pressAria('塩むすびを見る');
  runtime.pagehide();
  assert.equal(runtime.saved().rice,50, 'revisiting is free');
});

test('an unfinished dish can be left without charge and insufficient rice disables finishing', async () => {
  const state={...Game.newGame(),rice:149,totalRice:149,upgrades:{shio:true},savedAt:1000};
  const runtime=createRuntime(await loadCompiledApp(),state);
  await runtime.press('図鑑'); await runtime.press('料理 0/3');
  await runtime.pressAria('塩むすびを作る');
  await runtime.press('米をよそう'); await runtime.press('きゅっと握る');
  assert.equal(runtime.button('完成させる · 150 粒').props.disabled,true);
  assert.match(runtime.screenText(),/あと 1 粒/);
  await runtime.press('‹ 料理一覧'); runtime.pagehide();
  assert.equal(runtime.saved().rice,149);
  assert.deepEqual(runtime.saved().recipes,{});
});

test('finished dishes, free reactions and drawings survive save round-trip without creating rice', async () => {
  const state={...Game.newGame(),rice:6000,totalRice:6000,owned:{suihanki:10},upgrades:{regular_cat:true},savedAt:1000};
  const runtime=createRuntime(await loadCompiledApp(),state);
  await runtime.press('図鑑'); await runtime.press('料理 0/3');
  await runtime.pressAria('オムライスを作る');
  await runtime.press('ごはんを炒める'); await runtime.press('卵で包む');
  await runtime.press('完成させる · 5,000 粒');
  await runtime.press('感想を聞く'); await runtime.press('ケチャップで描く');
  assert.match(runtime.screenText(),/署名は肉球/);
  runtime.pagehide(); assert.equal(runtime.saved().rice,1000);
  await runtime.press('セーブ'); await runtime.press('最新コードをコピー');
  const saved=runtime.clipboard[0];
  assert.equal(Game.decodeSave(saved).state.recipes.omurice,true);
  await runtime.importFile(new Blob([saved]));
  await runtime.press('図鑑');
  assert.ok(runtime.button('料理を見る'), 'import resets the transient cooking scene');
  await runtime.pressAria('オムライスを見る');
  assert.match(runtime.screenText(),/何兆文字/);
  runtime.pagehide(); assert.equal(runtime.saved().rice,1000);
});

test('the expanded news reader retains the ten-page achievement and saves each turn', async () => {
  const runtime=createRuntime(await loadCompiledApp(),startingGame());
  await runtime.pressAria('米ニュースを読む');
  for(let i=0;i<9;i++) await runtime.press('次のニュース');
  runtime.pagehide();
  assert.equal(runtime.saved().newsClicks,9);
  assert.equal(runtime.saved().unlocked.news,undefined);
  await runtime.press('次のニュース'); runtime.pagehide();
  assert.equal(runtime.saved().unlocked.news,true);
  await runtime.press('閉じる'); runtime.pagehide();
  assert.equal(runtime.saved().newsClicks,10, 'closing does not count as turning a page');
});

const outingGame = () => ({...Game.newGame(), rice:10000, totalRice:10000, savedAt:1000,
  owned:{obaachan:10}, recipes:Object.fromEntries(Game.RECIPES.map(r=>[r.id,true]))});
async function openOutings(runtime, cooked=3) {
  await runtime.press('図鑑'); await runtime.press(`料理 ${cooked}/3`);
  await runtime.pressAria('おすそわけを開く');
}

test('delivery commits once before render and the collected postcard can be read for free', async () => {
  const runtime=createRuntime(await loadCompiledApp(),outingGame());
  await openOutings(runtime); await runtime.pressAria('となりの縁側へ');
  const send=runtime.button('届ける · 300 粒');
  send.props.onClick(); send.props.onClick(); runtime.pagehide();
  assert.equal(runtime.saved().rice,9700);
  assert.equal(runtime.saved().souvenirs['engawa:shio_musubi'],true);
  assert.equal(runtime.saved().unlocked.outing_first,true);
  runtime.flush(); assert.match(runtime.screenText(),/塩加減、似てきたね/);
  await runtime.press('‹ 届け先に戻る');
  await runtime.pressAria('塩むすびの絵はがきを読む');
  runtime.pagehide(); assert.equal(runtime.saved().rice,9700);
});

test('three deliveries earn a cosmetic plate, copy preserves it and import leaves the postcard scene', async () => {
  const runtime=createRuntime(await loadCompiledApp(),outingGame());
  await openOutings(runtime); await runtime.pressAria('となりの縁側へ');
  for(const recipe of Game.RECIPES) {
    await runtime.pressAria(`${recipe.name}を届ける`);
    if(recipe!==Game.RECIPES.at(-1)) await runtime.press('‹ 届け先に戻る');
  }
  assert.match(runtime.toasts(),/肉球のお皿をもらった/);
  await runtime.press('肉球のお皿を使う'); runtime.pagehide();
  assert.equal(runtime.saved().activePlate,'paw');
  assert.equal(runtime.saved().rice,9100);
  assert.equal(Game.postcardCount(runtime.saved()),3);
  await runtime.press('セーブ'); await runtime.press('最新コードをコピー');
  const code=runtime.clipboard[0];
  assert.equal(Game.decodeSave(code).state.activePlate,'paw');
  await runtime.importFile(new Blob([code])); await runtime.press('図鑑');
  assert.match(runtime.screenText(),/お皿：肉球のお皿/);
  assert.doesNotMatch(runtime.screenText(),/おむすびが背伸びしてる/);
  runtime.pagehide(); assert.equal(runtime.saved().rice,9100);
});

test('missing rice and uncooked recipes cannot be delivered; an old save still reaches its recipe', async () => {
  const old={...outingGame(),rice:299,recipes:{shio_musubi:true},upgrades:{shio:true}};
  delete old.souvenirs; delete old.activePlate;
  const runtime=createRuntime(await loadCompiledApp(),old);
  await openOutings(runtime,1); await runtime.pressAria('となりの縁側へ');
  assert.equal(runtime.button('届ける · 300 粒').props.disabled,true);
  assert.equal(runtime.button('まず料理を作る').props.disabled,true);
  assert.match(runtime.screenText(),/あと 1 粒/);
  await runtime.press('‹ 届け先一覧'); await runtime.press('‹ レシピ');
  await runtime.pressAria('塩むすびを見る'); runtime.pagehide();
  assert.equal(runtime.saved().rice,299);
  assert.deepEqual(runtime.saved().souvenirs,{});
});

test('every destination has three readable postcards and collection completion exposes the final plate', async () => {
  const complete={...outingGame(),souvenirs:Object.fromEntries(Game.OUTINGS.flatMap(o=>Game.RECIPES.map(r=>[`${o.id}:${r.id}`,true])))};
  const runtime=createRuntime(await loadCompiledApp(),complete);
  await openOutings(runtime);
  assert.match(runtime.screenText(),/27枚そろった/);
  for(const outing of Game.OUTINGS) {
    await runtime.pressAria(`${outing.name}へ`);
    for(const recipe of Game.RECIPES) {
      await runtime.pressAria(`${recipe.name}の絵はがきを読む`);
      assert.match(runtime.screenText(),new RegExp(`${outing.name}より`));
      assert.doesNotMatch(runtime.screenText(),/undefined/);
      await runtime.press('‹ 届け先に戻る');
    }
    await runtime.press('‹ 届け先一覧');
  }
  await runtime.pressAria('宇宙の外の実家へ'); await runtime.pressAria('塩むすびの絵はがきを読む');
  await runtime.press('虹のお皿を使う'); runtime.pagehide();
  assert.equal(runtime.saved().activePlate,'rainbow');
  assert.equal(runtime.saved().rice,10000);
});

test('phones open on the onigiri tab; shop, skins in the collection and saving stay one tap away', async () => {
  const runtime=createRuntime(await loadCompiledApp(),{...startingGame(),rice:3000,totalRice:3000});
  const hasDot=label=>JSON.stringify(runtime.button(label)).includes('買える強化があります');
  assert.ok(runtime.button('握る'));
  assert.equal(runtime.button('施設'),undefined,'no shop list competes with the onigiri');
  assert.ok(hasDot('ショップ'),'affordable upgrades are signalled from the onigiri tab');
  runtime.clickOnigiri();
  await runtime.press('ショップ');
  assert.ok(runtime.button('施設') && !hasDot('ショップ'));
  await runtime.press('図鑑'); await runtime.press('きせかえ');
  await runtime.press('ぱんだむすびクリック力 +10%2,500 粒');
  runtime.clickOnigiri(); // the slim bar keeps the onigiri tappable on other tabs
  runtime.pagehide();
  assert.equal(runtime.saved().activeSkin,'panda');
  assert.equal(runtime.saved().clicks,2);
  assert.equal(runtime.saved().rice,3000+1-2500+Game.clickPower(runtime.saved()));
  await runtime.press('握る');
  assert.equal(runtime.button('きせかえ'),undefined);
  await runtime.press('セーブ'); await runtime.press('最新コードをコピー');
  assert.equal(Game.decodeSave(runtime.clipboard[0]).state.activeSkin,'panda');
});

test('wide screens keep the shop beside the onigiri without a separate tap tab', async () => {
  const runtime=createRuntime(await loadCompiledApp(),startingGame(),Math.random,{wide:true});
  assert.equal(runtime.button('握る'),undefined);
  assert.equal(runtime.button('ショップ').props['aria-current'],'page');
  assert.ok(runtime.button('施設'));
  runtime.clickOnigiri(); runtime.pagehide();
  assert.equal(runtime.saved().rice,101);
});

const rebirthKey = storageKey + '-before-rebirth';
const harvestGame = () => Game.awardAchievements({ ...Game.newGame(), rice: 4e11, totalRice: 1e12, clicks: 300, goldenClicks: 7, goldenMisses: 3, savedAt: 1000,
  owned: { obaachan: 10, suihanki: 10 }, upgrades: { shio: true, lucky_cat: true, obaachan_tier0: true, regular_cat: true },
  recipes: { shio_musubi: true }, souvenirs: { 'engawa:shio_musubi': true }, skinsOwned: { plain: true, panda: true }, activeSkin: 'panda' });
async function openRebirth(runtime) {
  await runtime.press('図鑑');
  if (runtime.button('‹ 実績')) await runtime.press('‹ 実績');
  await runtime.pressAria('新米（転生）を開く');
}

test('rebirth shows its reward and losses, backs up first, and a double tap before render resets only once', async () => {
  const runtime = createRuntime(await loadCompiledApp(), harvestGame());
  await openRebirth(runtime);
  assert.match(runtime.screenText(), /今なら種もみ \+10粒 → 全生産 ×1\.5/);
  await runtime.press('新米にする…');
  const screen = runtime.screenText();
  assert.match(screen, /もらえる.*種もみ \+10粒.*金の段取り/);
  assert.match(screen, /最初に戻る.*米粒 4000億粒・施設 20個・ショップの強化 2個/);
  assert.match(screen, /残る.*実績・料理・絵はがき・お皿・きせかえ・常連.*持ち越す強化 1個/);
  runtime.clickOnigiri(); // before React renders: belongs to the backed-up year
  const go = runtime.button('新米にする · 種もみ +10');
  go.props.onClick(); go.props.onClick();
  runtime.pagehide();
  const year2 = runtime.saved();
  assert.equal(year2.rebirths, 1);
  assert.equal(Game.seedCount(year2), 10);
  assert.equal(year2.pastRice, 1e12 + Game.clickPower(harvestGame()));
  assert.deepEqual([year2.rice, year2.totalRice, year2.owned], [0, 0, {}]);
  assert.deepEqual(year2.upgrades, { lucky_cat: true, regular_cat: true });
  assert.equal(year2.clicks, 301);
  assert.equal(year2.goldenMisses, 3, 'the 777x guarantee keeps counting');
  assert.equal(year2.activeSkin, 'panda');
  assert.equal(year2.souvenirs['engawa:shio_musubi'], true);
  assert.equal(year2.unlocked.rebirth1, true);
  const backup = Game.decodeSave(runtime.stored(rebirthKey)).state;
  assert.equal(backup.rebirths, 0);
  assert.equal(backup.clicks, 301);
  runtime.flush();
  assert.match(runtime.toasts(), /新米の季節！ 種もみ \+10粒/);
  assert.match(runtime.screenText(), /2年目が始まりました/);
  assert.equal(runtime.button('新米にする…').props.disabled, true);
  assert.match(runtime.screenText(), /今年の累計1兆粒で新米にできます/);
  assert.equal(runtime.resumed().rebirths, 1, 'reloading keeps the new year without another reward');
  assert.equal(Game.canRebirth(runtime.resumed()), false);
});

test('a backup that cannot be stored or read back cancels the rebirth without changing progress', async () => {
  for (const options of [{ failKeys: [rebirthKey] }, { corruptKeys: [rebirthKey] }, { failKeys: [storageKey] }]) {
    const runtime = createRuntime(await loadCompiledApp(), harvestGame(), Math.random, options);
    await openRebirth(runtime);
    await runtime.press('新米にする…');
    await runtime.press('新米にする · 種もみ +10');
    assert.match(runtime.screenText(), /新米にしませんでした。今の進行はそのままです/);
    assert.ok(runtime.button('新米にする…'), 'the confirmation closes');
    runtime.failStorage(storageKey, false);
    runtime.pagehide();
    assert.equal(runtime.saved().rebirths, 0);
    assert.equal(runtime.saved().owned.obaachan, 10);
    assert.equal(runtime.saved().totalRice, 1e12);
  }
});

test('restoring the pre-rebirth backup returns the old year and rebirthing again yields the same seeds', async () => {
  const runtime = createRuntime(await loadCompiledApp(), harvestGame());
  await openRebirth(runtime);
  await runtime.press('新米にする…');
  await runtime.press('新米にする · 種もみ +10');
  runtime.advance(60000); runtime.clickOnigiri();
  await runtime.press('セーブ');
  await runtime.press('新米前のデータを保存');
  assert.equal(Game.decodeSave(await runtime.downloads[0].blob.text()).state.rebirths, 0);
  await runtime.press('新米前に戻す…');
  await runtime.press('新米前に戻す');
  runtime.pagehide();
  assert.equal(runtime.saved().rebirths, 0);
  assert.equal(runtime.saved().owned.obaachan, 10);
  assert.equal(Game.decodeSave(runtime.importBackup()).state.rebirths, 1, 'the second year is kept as the pre-import data');
  await openRebirth(runtime);
  assert.doesNotMatch(runtime.screenText(), /年目が始まりました/, 'a restore clears the old rebirth notice');
  await runtime.press('新米にする…');
  await runtime.press('新米にする · 種もみ +10');
  runtime.pagehide();
  assert.equal(Game.seedCount(runtime.saved()), 10, 'restore and repeat cannot multiply seeds');
});

test('rebirth ends active golden effects, warns first, and is refused while another tab owns the save', async () => {
  const runtime = createRuntime(await loadCompiledApp(), harvestGame(), () => .96);
  runtime.spawnGolden(); runtime.claimGolden(); runtime.flush();
  assert.match(runtime.caption(), /クリック ×777/);
  await openRebirth(runtime);
  await runtime.press('新米にする…');
  assert.match(runtime.screenText(), /発動中の金のおむすびの効果は終わります/);
  await runtime.press('新米にする · 種もみ +10');
  await runtime.press('握る');
  assert.doesNotMatch(runtime.caption(), /×777/);
  runtime.clickOnigiri(); runtime.pagehide();
  assert.ok(Math.abs(runtime.saved().rice - 1.1) < 1e-9, 'the next click is an ordinary click (panda +10%)');

  const other = createRuntime(await loadCompiledApp(), harvestGame());
  await openRebirth(other);
  await other.press('新米にする…');
  other.otherTabSaves();
  await other.press('新米にする · 種もみ +10');
  assert.match(other.screenText(), /自動保存が停止中のため、新米にしませんでした/);
  assert.equal(other.stored(rebirthKey), undefined);
});

test('the first chance is announced once and marked on the collection tab; shop rates include seeds', async () => {
  // No waiting regular or new recipe, so the collection dot can only mean the rebirth.
  const regulars = Object.fromEntries(Game.REGULARS.map(r => [r.id, true]));
  const runtime = createRuntime(await loadCompiledApp(), { ...harvestGame(), totalRice: 1e12 - 5, rice: 0, owned: { obaachan: 10 }, upgrades: { shio: true, ...regulars }, unlocked: {} });
  const dot = () => JSON.stringify(runtime.button('図鑑')).includes('図鑑に新しい発見があります');
  assert.equal(dot(), false);
  for (let i = 0; i < 5; i++) runtime.clickOnigiri();
  runtime.flush();
  assert.match(runtime.toasts(), /今年1兆粒！/);
  assert.equal(dot(), true);
  runtime.tick();
  assert.equal((runtime.toasts().match(/今年1兆粒/g) || []).length, 1);
  const seeded = Game.awardAchievements({ ...Game.newGame(), pastRice: Game.riceForSeeds(1000), rebirths: 1, rice: 100, totalRice: 100, owned: { obaachan: 2 }, savedAt: 1000 });
  const year = createRuntime(await loadCompiledApp(), seeded);
  await year.press('ショップ');
  const rate = Game.buildingRate(seeded, Game.BUILDINGS[0]);
  assert.ok(Math.abs(rate * 2 - Game.production(seeded)) < 1e-9);
  assert.match(year.screenText(), new RegExp(`1人で毎秒 ${rate.toLocaleString('ja-JP', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} 粒`));
  await year.press('図鑑');
  assert.match(year.screenText(), /今年 100 粒 · 通算/);
});

test('shop rows say it with layout: price, owned count and milestone progress, no repeated captions', async () => {
  const runtime = createRuntime(await loadCompiledApp(), { ...Game.newGame(), rice: 1e6, totalRice: 1e6, owned: { obaachan: 3 } });
  await runtime.press('ショップ');
  const screen = runtime.screenText();
  assert.match(screen, /所持 3/);
  assert.match(screen, /3\/\d+/, 'milestone progress is a count, not a sentence');
  assert.doesNotMatch(screen, /で次の強化解放|個購入|人購入/);
  await runtime.press('図鑑'); await runtime.press('きせかえ');
  assert.doesNotMatch(runtime.screenText(), /着替えると能力も変わる/);
});
