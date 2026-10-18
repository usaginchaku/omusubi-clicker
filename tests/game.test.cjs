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
  const power=now=>G.activeClickPower(s,boosts,now);
  assert.ok(Math.abs(power(26000)-(2+4*7*.02)*777)<1e-9);
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
  assert.equal(G.addGoldenBoost({},'production',s,1000).production,31000, 'thermos extends the click burst only');
  s=G.buyUpgrade({...s,goldenClicks:77},'lucky_schedule');
  const settings=G.goldenSettings({...s,activeSkin:'sekihan'});
  assert.ok(Math.abs(settings.wait-.48)<1e-12);
  assert.equal(settings.lifetime,60);
  assert.deepEqual(G.decodeSave(G.encodeSave(s)).state.upgrades,s.upgrades);
});

test('buying during a burst improves future clicks without recursively amplifying the current jackpot', () => {
  const s={...G.newGame(),rice:1e12,clicks:2000,owned:{suihanki:1},upgrades:{shio:true,finger_0:true}};
  let boosts=G.addGoldenBoost({},'click',s,1000);
  let bought=G.buyBuilding(s,'moon');
  bought=G.buyUpgrade(bought,'finger_1');
  bought=G.buySkin(bought,'panda');
  assert.ok(G.clickPower(bought)>G.clickPower(s)*1000);
  assert.equal(G.activeClickPower(bought,boosts,1001),G.activeClickPower(s,boosts,1001));
  boosts=G.addGoldenBoost(boosts,'production',bought,2000);
  assert.ok(Math.abs(G.activeClickPower(bought,boosts,2000)-(2+4*.02*7)*777)<1e-9, 'a later festival still boosts the captured production share');
  assert.equal(G.activeClickPower(bought,boosts,14000),G.clickPower(bought,7), 'new facilities and upgrades apply normally at the exact end');
  boosts=G.addGoldenBoost(boosts,'click',bought,15000);
  assert.ok(Math.abs(G.activeClickPower(bought,boosts,15000)/G.clickPower(bought,7)-777)<1e-9, 'the next burst uses the improved production');
});

test('golden dry spells are bounded and persist while older saves start with zero misses', () => {
  const s={...G.newGame(),goldenClicks:15,goldenMisses:15};
  assert.equal(G.goldenOutcome(s,0),'click');
  assert.equal(G.goldenOutcome({...s,goldenMisses:14},.1),'harvest');
  assert.equal(G.goldenOutcome({...s,goldenMisses:14},.919),'production');
  assert.equal(G.goldenOutcome({...s,goldenMisses:0},.92),'click');
  const restored=G.decodeSave(G.encodeSave(s)).state;
  assert.equal(restored.goldenMisses,15);
  assert.equal(G.goldenOutcome(restored,.5),'click');
  assert.equal(G.normalizeSave({v:2,goldenClicks:99}).state.goldenMisses,0);
  for (const goldenMisses of [-1,1.5,16,'15',Infinity]) assert.throws(()=>G.normalizeSave({...s,goldenMisses}));
  assert.throws(()=>G.normalizeSave({...s,goldenClicks:1}));
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

test('later ingredients add useful production-linked clicks without multiplying the whole click amount', () => {
  const s={...G.newGame(),rice:1e8,totalRice:1e8,owned:{moon:10},upgrades:{shio:true,finger_0:true}};
  const bought=G.buyUpgrade(s,'sake');
  assert.equal(G.clickPower(bought)-G.clickPower(s),2+G.production(s)*.005);
  assert.equal(G.clickPower(bought,7),4+G.production(s)*7*.025);
  assert.equal(G.production(bought),G.production(s), 'ingredients affect clicking, not idle production');
  assert.equal(G.UPGRADES.filter(u=>u.kind==='click').reduce((n,u)=>n+u.share,0),.1);
  const boosts=G.addGoldenBoost({},'click',s,1000);
  assert.equal(G.activeClickPower(bought,boosts,1001),G.activeClickPower(s,boosts,1001));
  assert.equal(G.activeClickPower(bought,boosts,14000),G.clickPower(bought));
});

test('pair recipes require both facilities and improve only that pair once', () => {
  const s={...G.newGame(),rice:5000,owned:{obaachan:10,suihanki:9,tanbo:1},upgrades:{obaachan_tier0:true}};
  assert.equal(G.upgradeAvailable({...s,totalRice:1e9},G.PAIR_UPGRADES[0]),false, 'the displayed next recipe uses ownership, not lifetime income');
  assert.equal(G.buyUpgrade(s,'pair_kitchen'),s);
  const ready={...s,owned:{...s.owned,suihanki:10}};
  const bought=G.buyUpgrade(ready,'pair_kitchen');
  assert.equal(bought.rice,2500);
  assert.equal(G.buildingMultiplier(bought,'obaachan'),2.5);
  assert.equal(G.buildingMultiplier(bought,'suihanki'),1.25);
  assert.equal(G.buildingMultiplier(bought,'tanbo'),1);
  assert.equal(G.production(bought),(10+40)*1.25+30);
  assert.equal(G.buyUpgrade(bought,'pair_kitchen'),bought);
  assert.equal(G.decodeSave(G.encodeSave(bought)).state.upgrades.pair_kitchen,true);
});

test('regulars count only earned active achievements and their support adds instead of compounding', () => {
  const earned=Object.fromEntries(G.ACHIEVEMENTS.filter(a=>!a.legacy).slice(0,8).map(a=>[a.id,true]));
  const s={...G.newGame(),rice:5000,owned:{suihanki:10},unlocked:{...earned,craft1:true,up50:false,unknown:true}};
  assert.equal(G.achievementCount(s),8);
  assert.equal(G.regularMultiplier(s),1, 'meeting the milestone is not a free purchase');
  assert.equal(G.buyUpgrade({...s,unlocked:{}},'regular_cat').upgrades.regular_cat,undefined);
  assert.equal(G.buyUpgrade({...s,rice:999},'regular_cat').upgrades.regular_cat,undefined);
  const bought=G.buyUpgrade(s,'regular_cat');
  assert.equal(bought.rice,4000);
  assert.equal(G.production(bought),40*1.02);
  assert.equal(G.buyUpgrade(bought,'regular_cat'),bought);
  const more={...bought,upgrades:{...bought.upgrades,regular_cooker:true}};
  assert.equal(G.regularMultiplier(more),1.04);
  assert.equal(G.offlineProgress({...more,savedAt:1000},11000).gain,40*1.04*10);
});

test('regular and pair purchases survive saves, old saves need no migration and newly earned achievements strengthen support', () => {
  const old=G.normalizeSave({v:2,rice:1e9,totalRice:1e9,clicks:1600,owned:{obaachan:50,suihanki:50,tanbo:10},upgrades:{shio:true}}).state;
  assert.equal(G.regularMultiplier(old),1);
  const bought=G.awardAchievements(G.buyUpgrade(G.buyUpgrade(old,'pair_kitchen'),'regular_cat'));
  assert.ok(bought.upgrades.regular_cat && bought.unlocked.regular1 && bought.unlocked.pair1);
  assert.ok(G.regularMultiplier(bought)>1+G.achievementCount(old)*.0025);
  const restored=G.decodeSave(G.encodeSave(bought)).state;
  assert.equal(G.production(restored),G.production(bought));
  assert.equal(G.clickPower(restored),G.clickPower(bought));
  assert.throws(()=>G.normalizeSave({...bought,upgrades:{regular_cat:1}}));
});

test('new 25-facility medals preserve the existing 1 and 50 milestone IDs', () => {
  for(const count of [24,25,49,50]) {
    const s=G.awardAchievements({...G.newGame(),owned:{suihanki:count}});
    assert.equal(s.unlocked.suihanki_ach0,true);
    assert.equal(!!s.unlocked.suihanki_ach2,count>=25);
    assert.equal(!!s.unlocked.suihanki_ach1,count>=50);
    const restored=G.decodeSave(G.encodeSave(s)).state;
    assert.equal(!!restored.unlocked.suihanki_ach2,count>=25);
  }
});

test('regular support earned mid-frenzy strengthens normal play but cannot amplify that frenzy snapshot', () => {
  const s=G.awardAchievements({...G.newGame(),rice:1e6,totalRice:1e6,clicks:500,owned:{obaachan:10,suihanki:10},upgrades:{finger_0:true}});
  const boosts=G.addGoldenBoost({},'click',s,1000);
  const bought=G.awardAchievements(G.buyUpgrade(s,'regular_cat'));
  assert.ok(G.production(bought)>G.production(s));
  assert.equal(G.activeClickPower(bought,boosts,1001),G.activeClickPower(s,boosts,1001));
  assert.equal(G.activeClickPower(bought,boosts,14000),G.clickPower(bought));
});

test('recipes unlock exactly at their ownership boundaries and stay discovered after cooking', () => {
  const base=G.newGame();
  assert.deepEqual(G.RECIPES.map(r=>[r.id,r.cost]),[['shio_musubi',150],['omurice',5000],['rice_burger',50000]]);
  assert.equal(G.recipeUnlocked(base,'shio_musubi'),false);
  assert.equal(G.recipeUnlocked({...base,upgrades:{shio:false}},'shio_musubi'),false);
  assert.equal(G.recipeUnlocked({...base,upgrades:{shio:true}},'shio_musubi'),true);
  assert.equal(G.recipeUnlocked({...base,owned:{suihanki:9}},'omurice'),false);
  assert.equal(G.recipeUnlocked({...base,owned:{suihanki:10}},'omurice'),true);
  assert.equal(G.recipeUnlocked({...base,owned:{tanbo:9,conbini:1}},'rice_burger'),false);
  assert.equal(G.recipeUnlocked({...base,owned:{tanbo:10,conbini:0}},'rice_burger'),false);
  assert.equal(G.recipeUnlocked({...base,owned:{tanbo:10,conbini:1}},'rice_burger'),true);
  assert.equal(G.recipeUnlocked(base,'missing'),false);
  const cooked=G.cookRecipe({...base,rice:150,upgrades:{shio:true}},'shio_musubi');
  assert.equal(G.recipeUnlocked(cooked,'shio_musubi'),true, 'completed recipes remain viewable');
  assert.equal(G.recipeUnlocked({...base,recipes:{shio_musubi:true}},'shio_musubi'),true, 'a restored finished recipe is always viewable');
});

test('cooking charges the exact fixed cost once and never creates currency or legacy stats', () => {
  const s={...G.newGame(),rice:5000,totalRice:1e6,crafted:3,sold:4,profit:-5,owned:{suihanki:10}};
  for (const bad of [{...s,rice:4999.99},{...s,owned:{suihanki:9}}]) assert.equal(G.cookRecipe(bad,'omurice'),bad);
  assert.equal(G.cookRecipe(s,'missing'),s);
  assert.equal(G.cookRecipe(s,'rice_burger'),s);
  const cooked=G.cookRecipe(s,'omurice');
  assert.equal(cooked.rice,0);
  assert.deepEqual(cooked.recipes,{omurice:true});
  for (const key of ['totalRice','crafted','sold','profit','clicks','goldenClicks']) assert.equal(cooked[key],s[key]);
  assert.deepEqual(cooked.upgrades,s.upgrades);
  assert.equal(G.production(cooked),G.production(s), 'no direct multiplier before the achievement');
  const rich={...cooked,rice:1e9};
  assert.equal(G.cookRecipe(rich,'omurice'),rich, 'already finished recipes are not charged again');
  assert.deepEqual(s.recipes,{}, 'the original state is not mutated');
});

test('recipe achievements are stable and only strengthen regular support', () => {
  const s={...G.newGame(),rice:1e5,owned:{suihanki:10,tanbo:10,conbini:1},upgrades:{shio:true,regular_cat:true}};
  let out=G.awardAchievements(s);
  for (const r of G.RECIPES) {
    assert.equal(out.unlocked[`recipe_${r.id}`],undefined);
    out=G.awardAchievements(G.cookRecipe(out,r.id));
    assert.equal(out.unlocked[`recipe_${r.id}`],true);
  }
  const before=G.awardAchievements(s);
  assert.equal(G.achievementCount(out),G.achievementCount(before)+3);
  assert.ok(Math.abs(G.regularMultiplier(out)-(G.regularMultiplier(before)+3*.0025))<1e-12);
  assert.ok(Math.abs(G.production(out)/G.production(before)-G.regularMultiplier(out)/G.regularMultiplier(before))<1e-12);
});

test('old saves without recipes load identically and recipe progress round-trips', () => {
  for (const v of [1,2]) {
    const old={v,rice:500,totalRice:9000,clicks:40,owned:{suihanki:10},upgrades:{shio:true},unlocked:{first:true}};
    const {state,refund}=G.normalizeSave(old);
    assert.equal(refund,0);
    assert.deepEqual(state.recipes,{});
    assert.equal(state.rice,500);
    assert.equal(state.owned.suihanki,10);
    assert.deepEqual(state,G.normalizeSave({...old,recipes:{}}).state);
  }
  const s=G.awardAchievements(G.cookRecipe({...G.newGame(),rice:1000,totalRice:1000,upgrades:{shio:true}},'shio_musubi'));
  const restored=G.decodeSave(G.encodeSave(s)).state;
  assert.deepEqual(restored.recipes,{shio_musubi:true});
  assert.equal(restored.rice,850);
  assert.equal(restored.unlocked.recipe_shio_musubi,true);
  assert.equal(G.cookRecipe({...restored,rice:1e9},'shio_musubi').rice,1e9);
  assert.equal(G.normalizeSave({v:2,recipes:{omurice:false}}).state.recipes.omurice,false);
});

test('invalid recipe saves are rejected instead of silently dropping progress', () => {
  for (const recipes of [[],['omurice'],null,'omurice',1,{typo:true},{omurice:1},{omurice:'true'},{omurice:null}]) {
    assert.throws(()=>G.normalizeSave({v:2,rice:100,recipes}));
  }
});

test('a recipe achievement earned mid-frenzy cannot change the frozen 777 snapshot', () => {
  const s=G.awardAchievements({...G.newGame(),rice:1e6,totalRice:1e6,clicks:500,owned:{obaachan:10,suihanki:10},upgrades:{finger_0:true,regular_cat:true}});
  const boosts=G.addGoldenBoost({},'click',s,1000);
  const cooked=G.awardAchievements(G.cookRecipe(s,'omurice'));
  assert.equal(cooked.unlocked.recipe_omurice,true);
  assert.ok(G.production(cooked)>G.production(s));
  assert.equal(G.activeClickPower(cooked,boosts,1001),G.activeClickPower(s,boosts,1001));
  assert.equal(G.activeClickPower(cooked,boosts,14000),G.clickPower(cooked));
});

const allRecipes={shio_musubi:true,omurice:true,rice_burger:true};
const allOwned=()=>Object.fromEntries(G.OUTINGS.map(o=>[o.building,o.need]));

test('outings match the fixed table and unlock at the ownership boundary or a recorded postcard', () => {
  assert.deepEqual(G.OUTINGS.map(o=>[o.id,o.name,o.building,o.need,o.cost]),[
    ['engawa','となりの縁側','obaachan',10,300],['picnic','田んぼのピクニック','tanbo',10,18000],
    ['night','深夜のコンビニ','conbini',10,100000],['shrine','神様のお昼休み','jinja',10,20000000],
    ['moon','月面遠足','moon',10,150000000],['campus','おこめ大学の学食','university',25,3000000000],
    ['yesterday','昨日への差し入れ','time',25,400000000000],['parallel','並行世界の持ち寄り会','parallel',50,1500000000000000],
    ['home','宇宙の外の実家','home',100,150000000000000000000]]);
  for (const o of G.OUTINGS) {
    assert.ok(G.BUILDINGS.some(b=>b.id===o.building));
    assert.deepEqual(Object.keys(o).sort(),['building','cost','id','name','need']);
  }
  const base=G.newGame();
  assert.deepEqual(base.souvenirs,{});
  assert.equal(base.activePlate,'plain');
  for (const o of G.OUTINGS) {
    assert.equal(G.outingUnlocked({...base,owned:{[o.building]:o.need-1}},o.id),false);
    assert.equal(G.outingUnlocked({...base,owned:{[o.building]:o.need}},o.id),true);
    assert.equal(G.outingUnlocked({...base,souvenirs:{[`${o.id}:omurice`]:true}},o.id),true, 'a recorded postcard keeps the destination reviewable');
    assert.equal(G.outingUnlocked({...base,souvenirs:{[`${o.id}:omurice`]:false}},o.id),false);
  }
  assert.equal(G.outingUnlocked({...base,owned:allOwned()},'missing'),false);
});

test('sending a meal charges the exact cost once, grants no currency and never mutates', () => {
  const s={...G.newGame(),rice:300,totalRice:1e6,crafted:3,sold:4,profit:-5,owned:{obaachan:10},recipes:{omurice:true}};
  const frozen=JSON.stringify(s);
  for (const bad of [
    [{...s,rice:299.99},'engawa','omurice'],
    [{...s,owned:{obaachan:9}},'engawa','omurice'],
    [{...s,owned:{obaachan:9},souvenirs:{'engawa:shio_musubi':true}},'engawa','omurice'],
    [s,'engawa','shio_musubi'],
    [{...s,recipes:{omurice:false}},'engawa','omurice'],
    [s,'missing','omurice'],
    [s,'engawa','missing'],
    [s,'picnic','omurice'],
    [{...s,souvenirs:{'engawa:omurice':true}},'engawa','omurice'],
  ]) assert.equal(G.sendMeal(...bad),bad[0]);
  const sent=G.sendMeal(s,'engawa','omurice');
  assert.equal(sent.rice,0);
  assert.deepEqual(sent.souvenirs,{'engawa:omurice':true});
  assert.equal(G.postcardCount(sent),1);
  for (const key of ['totalRice','crafted','sold','profit','clicks','goldenClicks']) assert.equal(sent[key],s[key]);
  assert.deepEqual(sent.recipes,s.recipes);
  assert.deepEqual(sent.upgrades,s.upgrades);
  assert.deepEqual(sent.owned,s.owned);
  assert.equal(G.production(sent),G.production(s));
  const rich={...sent,rice:1e9};
  assert.equal(G.sendMeal(rich,'engawa','omurice'),rich, 'a repeat visit is free and records nothing new');
  assert.equal(JSON.stringify(s),frozen, 'the original state is not mutated');
});

test('all 27 destination and recipe pairs can be collected exactly once', () => {
  // Fund each destination separately: one 1.5e20 balance would swamp smaller costs.
  let s={...G.newGame(),totalRice:123,owned:allOwned(),recipes:allRecipes};
  for (const o of G.OUTINGS) {
    s={...s,rice:o.cost*3};
    for (const r of G.RECIPES) {
      const before=s;
      s=G.sendMeal(s,o.id,r.id);
      assert.equal(s.rice,before.rice-o.cost);
      assert.equal(G.sendMeal({...s,rice:1e30},o.id,r.id).rice,1e30);
    }
    assert.equal(s.rice,0, 'every fixed cost was spent');
  }
  assert.equal(G.postcardCount(s),27);
  assert.equal(Object.keys(s.souvenirs).length,27);
  assert.equal(s.totalRice,123);
  const lapsed={...s,owned:{}};
  for (const o of G.OUTINGS) assert.equal(G.outingUnlocked(lapsed,o.id),true, 'collections stay reviewable without facilities');
  assert.equal(G.postcardCount({souvenirs:{'engawa:omurice':false,'picnic:omurice':true}}),1);
});

test('plates unlock at postcard thresholds and switch freely without cost or multiplier', () => {
  assert.deepEqual(G.PLATES,[{id:'plain',name:'いつものお皿',need:0},{id:'paw',name:'肉球のお皿',need:3},{id:'moon',name:'月のお皿',need:12},{id:'rainbow',name:'虹のお皿',need:27}]);
  const keys=G.OUTINGS.flatMap(o=>G.RECIPES.map(r=>`${o.id}:${r.id}`));
  const withCards=n=>({...G.newGame(),rice:77,owned:{obaachan:5},souvenirs:Object.fromEntries(keys.slice(0,n).map(k=>[k,true]))});
  for (const p of G.PLATES) {
    if (p.need>0) {
      const short=withCards(p.need-1);
      assert.equal(G.selectPlate(short,p.id),short);
    }
    const s=withCards(p.need), picked=G.selectPlate(s,p.id);
    assert.equal(picked.activePlate,p.id);
    assert.equal(picked.rice,77);
    assert.equal(G.production(picked),G.production(s));
    assert.equal(G.clickPower(picked),G.clickPower(s));
  }
  const full=withCards(27);
  let s=full;
  for (const id of ['rainbow','plain','moon','paw','rainbow']) s=G.selectPlate(s,id);
  assert.equal(s.activePlate,'rainbow');
  assert.equal(s.rice,77);
  assert.equal(G.selectPlate(full,'missing'),full);
});

test('old saves gain an empty collection and outing progress round-trips', () => {
  for (const v of [1,2]) {
    const old={v,rice:500,totalRice:9000,owned:{obaachan:10},recipes:{omurice:true}};
    const {state}=G.normalizeSave(old);
    assert.deepEqual(state.souvenirs,{});
    assert.equal(state.activePlate,'plain');
    assert.deepEqual(state,G.normalizeSave({...old,souvenirs:{},activePlate:'plain'}).state);
  }
  let s={...G.newGame(),rice:1e4,totalRice:1e4,owned:{obaachan:10,tanbo:10},recipes:allRecipes};
  for (const id of ['shio_musubi','omurice','rice_burger']) s=G.sendMeal(s,'engawa',id);
  s=G.awardAchievements(G.selectPlate(s,'paw'));
  const code=G.encodeSave(s);
  assert.ok(code.startsWith('OMSB1|'));
  const restored=G.decodeSave(code).state;
  assert.equal(restored.v,2);
  assert.deepEqual(restored.souvenirs,s.souvenirs);
  assert.equal(restored.activePlate,'paw');
  assert.equal(restored.rice,s.rice);
  assert.equal(restored.unlocked.outing_first,true);
  assert.equal(G.sendMeal({...restored,rice:1e9},'engawa','omurice').rice,1e9);
  const lapsed=G.normalizeSave({v:2,souvenirs:{'home:omurice':true}}).state;
  assert.equal(lapsed.souvenirs['home:omurice'],true, 'collections may outlive the facilities and recipes');
  assert.equal(G.outingUnlocked(lapsed,'home'),true);
  assert.equal(G.normalizeSave({v:2,souvenirs:{'engawa:omurice':false}}).state.souvenirs['engawa:omurice'],false);
});

test('invalid souvenir and plate saves are rejected', () => {
  for (const souvenirs of [[],['engawa:omurice'],null,'engawa:omurice',1,{typo:true},{'engawa:typo':true},{'typo:omurice':true},{engawa:true},{'engawa:omurice':1},{'engawa:omurice':'true'},{'engawa:omurice':null}]) {
    assert.throws(()=>G.normalizeSave({v:2,rice:100,souvenirs}));
  }
  const three={'engawa:shio_musubi':true,'engawa:omurice':true,'engawa:rice_burger':true};
  for (const activePlate of [null,'',1,'missing','moon',{id:'paw'}]) {
    assert.throws(()=>G.normalizeSave({v:2,souvenirs:three,activePlate}));
  }
  assert.throws(()=>G.normalizeSave({v:2,souvenirs:{...three,'engawa:omurice':false},activePlate:'paw'}), 'false records do not count');
  assert.equal(G.normalizeSave({v:2,souvenirs:three,activePlate:'paw'}).state.activePlate,'paw');
});

test('outing achievements are stable and only strengthen regular support', () => {
  const ids=['outing_first','outing_twelve','outing_all','outing_world'];
  for (const id of ids) {
    const a=G.ACHIEVEMENTS.find(x=>x.id===id);
    assert.ok(a && a.name && a.desc && !a.legacy);
  }
  const cost=G.OUTINGS.reduce((sum,o)=>sum+o.cost*3,0);
  const start=G.awardAchievements({...G.newGame(),rice:cost*2,owned:allOwned(),recipes:allRecipes,upgrades:{regular_cat:true}});
  for (const id of ids) assert.equal(start.unlocked[id],undefined);
  let s=start;
  const at={};
  // Fill one recipe across every destination first so "world" lands before "all".
  const order=G.RECIPES.flatMap(r=>G.OUTINGS.map(o=>[o.id,r.id]));
  order.forEach(([o,r],i)=>{
    s=G.awardAchievements(G.sendMeal(s,o,r));
    for (const id of ids) if (s.unlocked[id] && at[id]===undefined) at[id]=i+1;
  });
  assert.deepEqual(at,{outing_first:1,outing_world:9,outing_twelve:12,outing_all:27});
  assert.equal(G.achievementCount(s),G.achievementCount(start)+4);
  assert.ok(Math.abs(G.regularMultiplier(s)-(G.regularMultiplier(start)+4*.0025))<1e-12);
  assert.ok(Math.abs(G.production(s)/G.production(start)-G.regularMultiplier(s)/G.regularMultiplier(start))<1e-12);
  const partial=G.awardAchievements({...G.newGame(),souvenirs:Object.fromEntries(G.OUTINGS.slice(0,8).flatMap(o=>G.RECIPES.map(r=>[`${o.id}:${r.id}`,true])))});
  assert.equal(partial.unlocked.outing_twelve,true);
  assert.equal(partial.unlocked.outing_world,undefined, '24 cards at 8 places are not every destination');
});

test('an outing achievement earned mid-frenzy cannot change the frozen 777 snapshot', () => {
  const s=G.awardAchievements({...G.newGame(),rice:1e6,totalRice:1e6,clicks:500,owned:{obaachan:10,suihanki:10},recipes:{omurice:true},upgrades:{finger_0:true,regular_cat:true}});
  const boosts=G.addGoldenBoost({},'click',s,1000);
  const sent=G.awardAchievements(G.sendMeal(s,'engawa','omurice'));
  assert.equal(sent.unlocked.outing_first,true);
  assert.ok(G.production(sent)>G.production(s));
  assert.equal(G.activeClickPower(sent,boosts,1001),G.activeClickPower(s,boosts,1001));
  assert.equal(G.activeClickPower(sent,boosts,14000),G.clickPower(sent));
});
