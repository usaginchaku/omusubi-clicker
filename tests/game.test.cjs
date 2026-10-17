const { test } = require('node:test');
const assert = require('node:assert/strict');
const G = require('../game.js');

test('content IDs are unique and every facility has four reachable upgrades', () => {
  for (const list of [G.BUILDINGS, G.UPGRADES, G.ACHIEVEMENTS, G.SKINS]) {
    assert.equal(new Set(list.map(x => x.id)).size, list.length);
  }
  for (const b of G.BUILDINGS) {
    assert.ok(b.cps > 0 && b.baseCost > 0);
    assert.equal(G.UPGRADES.filter(u => u.building === b.id).length, 4);
  }
});

test('15 hand clicks buy the first producer, which really produces 0.5 per second', () => {
  let s = G.newGame();
  for (let i=0; i<15; i++) { const gain=G.clickPower(s); s={...s,rice:s.rice+gain,totalRice:s.totalRice+gain,clicks:s.clicks+1}; }
  s = G.buyBuilding(s, 'obaachan');
  assert.equal(s.rice, 0);
  assert.equal(s.owned.obaachan, 1);
  assert.equal(G.production(s), 0.5);
  assert.equal(G.buyBuilding(s, 'obaachan'), s);
});

test('bulk cost equals repeated singles including rounding and skin discount', () => {
  for (const activeSkin of ['plain','yaki']) for (const quantity of [1,10,100]) {
    const s = {...G.newGame(),rice:1e20,activeSkin,owned:{suihanki:7}};
    const bulk = G.buyBuilding(s,'suihanki',quantity);
    let singles=s;
    for (let i=0;i<quantity;i++) singles=G.buyBuilding(singles,'suihanki');
    assert.equal(bulk.owned.suihanki, singles.owned.suihanki);
    const b=G.BUILDINGS.find(x=>x.id==='suihanki');
    let sum=0;
    for(let i=0;i<quantity;i++) sum+=G.buildingPrice({...s,owned:{suihanki:7+i}},b);
    assert.equal(G.buildingPrice(s,b,quantity),sum);
  }
});

test('bulk purchase cannot overspend and unsupported quantities do nothing', () => {
  const s={...G.newGame(),rice:150};
  assert.equal(G.buyBuilding(s,'obaachan',10),s);
  assert.equal(G.buyBuilding(s,'obaachan',-1),s);
  assert.equal(G.buyBuilding(s,'missing'),s);
});

test('facility upgrades require ownership, double only their facility, and cannot repeat', () => {
  let s={...G.newGame(),rice:10000,totalRice:10000};
  assert.equal(G.buyUpgrade(s,'obaachan_tier0'),s);
  s={...s,owned:{obaachan:1,suihanki:1}};
  const bought=G.buyUpgrade(s,'obaachan_tier0');
  assert.equal(G.production(s),4.5);
  assert.equal(G.production(bought),5);
  assert.equal(bought.rice,9925);
  assert.equal(G.buyUpgrade(bought,'obaachan_tier0'),bought);
});

test('click upgrades and production-linked fingers combine with skin bonuses', () => {
  const s={...G.newGame(),owned:{suihanki:10},upgrades:{shio:true,finger_0:true},activeSkin:'panda'};
  assert.equal(G.production(s),40);
  assert.equal(G.clickPower(s),2.4*1.1);
  assert.equal(G.upgradeAvailable({...s,clicks:0},G.UPGRADES.find(u=>u.id==='finger_1')),false);
});

test('skins charge once and preserve production when changing back', () => {
  const s={...G.newGame(),rice:2500};
  const panda=G.buySkin(s,'panda');
  assert.equal(panda.rice,0);
  assert.equal(G.buySkin(panda,'plain').activeSkin,'plain');
  assert.equal(G.buySkin(G.buySkin(panda,'plain'),'panda').rice,0);
  assert.equal(G.buySkin(s,'cosmos'),s);
});

test('old saves preserve possessions, achievements, and upgrade IDs', () => {
  const legacy={v:1,rice:123.5,totalRice:10000,clicks:30,owned:{obaachan:5},upgrades:{shio:true},unlocked:{craft1:true},skinsOwned:{plain:true,yukari:true},activeSkin:'yukari'};
  const {state,refund}=G.normalizeSave(legacy);
  assert.equal(state.rice,123.5);
  assert.equal(state.owned.obaachan,5);
  assert.equal(state.upgrades.shio,true);
  assert.equal(state.unlocked.craft1,true);
  assert.equal(state.activeSkin,'yukari');
  assert.equal(refund,0);
});

test('retired inventory uses maximum former sale prices and farmers are fully refunded once', () => {
  const old={v:1,rice:100,totalRice:1000,farmers:2,inventory:[{fid:'ume_f',bid:'blend',count:2},{fid:'bodakko_f',bid:'ryu',count:3}]};
  const {state,refund}=G.normalizeSave(old);
  assert.equal(refund,2*5500 + 3*51000 + 50000 + 80000);
  assert.equal(state.rice,100+refund);
  assert.deepEqual(state.inventory,[]);
  const roundtrip=G.decodeSave(G.encodeSave(state));
  assert.equal(roundtrip.refund,0);
  assert.equal(roundtrip.state.rice,state.rice);
  assert.equal(roundtrip.state.farmers,2);
});

test('malformed saves are rejected before they can replace progress', () => {
  for (const bad of [null,{v:3},{v:2,rice:-1},{v:2,rice:Infinity},{v:2,rice:'5'},
    {v:1,owned:{obaachan:-1}},{v:1,owned:{obaachan:1.5}}, {v:2,owned:{typo:1}},
    {v:2,activeSkin:'gold'}, {v:2,inventory:[{fid:'missing',bid:'blend',count:1}]},
    {v:2,upgrades:[]},{v:2,secret:'yes'}]) assert.throws(()=>G.normalizeSave(bad));
  assert.throws(()=>G.decodeSave('bad code'));
});

test('save round trip keeps all current fields and never carries a temporary boost', () => {
  const s={...G.newGame(),rice:12.25,totalRice:50,clicks:25,newsClicks:11,secret:true,savedAt:12345,upgrades:{shio:true},skinsOwned:{plain:true,panda:true},activeSkin:'panda'};
  const out=G.decodeSave(G.encodeSave(s)).state;
  for(const key of ['rice','totalRice','clicks','newsClicks','secret','savedAt','activeSkin']) assert.equal(out[key],s[key]);
  assert.equal(out.unlocked.c25,true);
  assert.equal(out.unlocked.news,true);
});

test('offline production uses upgrades, caps at four hours, and ignores backwards clocks', () => {
  const s={...G.newGame(),owned:{obaachan:1},upgrades:{obaachan_tier0:true},savedAt:1000};
  const resumed=G.offlineProgress(s,1000+24*3600000);
  assert.equal(resumed.gain,14400);
  assert.equal(G.offlineProgress(resumed.state,resumed.state.savedAt).gain,0);
  assert.equal(G.offlineProgress(s,500).gain,0);
  assert.equal(G.offlineProgress(G.newGame(),Date.now()).gain,0);
});

test('production settles only the active boost interval, including across suspension', () => {
  const s={...G.newGame(),owned:{obaachan:1},rice:100,totalRice:100};
  const boost={kind:'production',until:31000};
  const out=G.advanceProduction(s,1000,61000,boost);
  assert.equal(out.rice,100 + .5 * (30 * 7 + 30));
  assert.equal(out.savedAt,61000);
  assert.equal(G.advanceProduction(out,61000,61000,boost).rice,out.rice);
  assert.equal(G.advanceProduction(s,1000,1000+24*3600000).rice,7300);
});

test('new achievement collection contains no retired workshop objectives', () => {
  const active=G.ACHIEVEMENTS.filter(a=>!a.legacy);
  for(const id of ['craft1','sell100','profit','farmer5']) assert.ok(!active.some(a=>a.id===id));
  const s={...G.newGame(),clicks:25,totalRice:100,owned:{obaachan:1}};
  const awarded=G.awardAchievements(s);
  assert.equal(awarded.unlocked.first,true);
  assert.equal(awarded.unlocked.c25,true);
  assert.equal(awarded.unlocked.obaachan_ach0,true);
  assert.equal(G.awardAchievements(awarded),awarded);
});
