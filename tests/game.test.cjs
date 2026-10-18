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
  for (const activeSkin of ['plain','yaki']) for (const quantity of [1,10,100,1000]) {
    const s = {...G.newGame(),rice:1e70,activeSkin,owned:{suihanki:7}};
    const bulk = G.buyBuilding(s,'suihanki',quantity);
    let singles=s;
    for (let i=0;i<quantity;i++) singles=G.buyBuilding(singles,'suihanki');
    assert.equal(bulk.owned.suihanki, singles.owned.suihanki);
    const b=G.BUILDINGS.find(x=>x.id==='suihanki');
    let sum=0;
    for(let i=0;i<quantity;i++) sum+=G.buildingPrice({...s,owned:{suihanki:7+i}},b);
    assert.equal(G.buildingPrice(s,b,quantity),sum);
    assert.equal(bulk.rice,s.rice-sum);
  }
});

test('1000 producers cost the full increasing total and never grant a partial purchase', () => {
  const s=G.newGame(), b=G.BUILDINGS[0];
  const cost=G.buildingPrice(s,b,1000);
  assert.ok(Number.isFinite(cost) && cost>G.buildingPrice(s,b,100)*10);
  const short={...s,rice:cost*.999};
  assert.equal(G.buyBuilding(short,b.id,1000),short);
  const bought=G.buyBuilding({...s,rice:cost},b.id,1000);
  assert.equal(bought.rice,0);
  assert.equal(bought.owned[b.id],1000);
  assert.equal(G.decodeSave(G.encodeSave(bought)).state.owned[b.id],1000);
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
  assert.equal(G.clickPower(s),2.8*1.1);
  assert.equal(G.upgradeAvailable({...s,clicks:0},G.UPGRADES.find(u=>u.id==='finger_1')),false);
});

test('100 clicks open an early affordable skill, and finger skills keep manual play useful later', () => {
  const first=G.UPGRADES.find(u=>u.id==='finger_0');
  const opening={...G.newGame(),rice:500,clicks:99,owned:{suihanki:2,tanbo:1}};
  assert.equal(G.buyUpgrade(opening,first.id),opening);
  const bought=G.buyUpgrade({...opening,clicks:100},first.id);
  assert.equal(bought.rice,0);
  assert.ok(G.clickPower(bought)>G.clickPower(opening)*1.5);
  const late={...G.newGame(),owned:{moon:10},upgrades:Object.fromEntries([0,1,2,3].map(i=>[`finger_${i}`,true]))};
  assert.ok(G.clickPower(late)*2 >= G.production(late)*.4, 'two clicks per second add at least 40% to late production');
  assert.equal(G.decodeSave(G.encodeSave(bought)).state.upgrades.finger_0,true);
});

test('golden harvest stays modest when broke and is bounded by savings and production', () => {
  assert.equal(G.goldenHarvest(G.newGame()),13);
  const busy={...G.newGame(),rice:0,owned:{moon:100}};
  assert.equal(G.goldenHarvest(busy),13, 'large factories do not give a huge free refill after spending');
  assert.equal(G.goldenHarvest({...busy,rice:1000}),163);
  const saver={...G.newGame(),rice:1e9,owned:{obaachan:1}};
  assert.equal(G.goldenHarvest(saver),43, 'large savings cannot bypass a small production base');
});

test('building milestones advance through real unlock thresholds and finish at fifty', () => {
  for(const [owned,need] of [[0,1],[1,10],[9,10],[10,25],[25,50]]) {
    assert.equal(G.nextBuildingUpgrade({...G.newGame(),owned:{obaachan:owned}},'obaachan').need,need);
  }
  assert.equal(G.nextBuildingUpgrade({...G.newGame(),owned:{obaachan:50}},'obaachan'),undefined);
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
  const boost={production:31000,click:14000};
  const out=G.advanceProduction(s,1000,61000,boost);
  assert.equal(out.rice,100 + .5 * (30 * 7 + 30));
  assert.equal(out.savedAt,61000);
  assert.equal(G.advanceProduction(out,61000,61000,boost).rice,out.rice);
  assert.equal(G.advanceProduction(s,1000,1000+24*3600000).rice,7300);
});

test('rare 777x clicks stack with production-linked fingers, refresh independently and expire exactly', () => {
  const s={...G.newGame(),owned:{suihanki:1},upgrades:{shio:true,finger_0:true}};
  let boosts=G.addGoldenBoost({},'production',s,1000);
  boosts=G.addGoldenBoost(boosts,'click',s,26000);
  const power=now=>G.clickPower(s,G.boostMultiplier(boosts,'production',now))*G.boostMultiplier(boosts,'click',now);
  assert.equal(power(26000),(2+4*7*.02)*777);
  assert.equal(power(31000),(2+4*.02)*777, 'production expires while click frenzy remains');
  assert.equal(power(39000),2+4*.02, 'click effect ends at its boundary');
  boosts=G.addGoldenBoost(boosts,'click',s,30000);
  assert.equal(boosts.production,31000);
  assert.equal(boosts.click,43000, 'same effect refreshes, rather than stacking duration');
  assert.equal(G.boostMultiplier(boosts,'click',30000),777, 'never 777 squared');
});

test('golden upgrades unlock by catches, preserve save IDs and improve timing multiplicatively', () => {
  let s={...G.newGame(),rice:1e9,totalRice:1e9,goldenClicks:6};
  assert.equal(G.buyUpgrade(s,'lucky_cat'),s);
  s=G.buyUpgrade({...s,goldenClicks:7},'lucky_cat');
  assert.deepEqual(G.goldenSettings(s),{wait:.8,lifetime:30,duration:1});
  s=G.buyUpgrade({...s,goldenClicks:27},'lucky_thermos');
  assert.equal(G.addGoldenBoost({},'click',s,1000).click,27000);
  assert.equal(G.addGoldenBoost({},'production',s,1000).production,61000);
  s=G.buyUpgrade({...s,goldenClicks:77},'lucky_schedule');
  const settings=G.goldenSettings({...s,activeSkin:'sekihan'});
  assert.ok(Math.abs(settings.wait-.48)<1e-12);
  assert.equal(settings.lifetime,60);
  assert.deepEqual(G.decodeSave(G.encodeSave(s)).state.upgrades,s.upgrades);
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
