const { test } = require('node:test');
const assert = require('node:assert/strict');
const G = require('../game.js');

const ready = (extra = {}) => G.awardAchievements({ ...G.newGame(), rice: 5e11, totalRice: 1e12, clicks: 120, goldenClicks: 30, goldenMisses: 15, newsClicks: 4, secret: true,
  owned: { obaachan: 10, suihanki: 10 }, recipes: { shio_musubi: true }, souvenirs: { 'engawa:shio_musubi': true }, activePlate: 'plain',
  skinsOwned: { plain: true, panda: true }, activeSkin: 'panda',
  upgrades: { shio: true, ume: true, finger_0: true, pair_kitchen: true, obaachan_tier0: true, lucky_cat: true, lucky_thermos: true, regular_cat: true }, ...extra });

test('seed thresholds are exact, a year needs 1兆 and the first gate pays 10 seeds', () => {
  for (const n of [1, 10, 1000, 1e5, 1e6, 1e7]) {
    assert.equal(G.seedsFor(G.riceForSeeds(n)), n);
    assert.equal(G.seedsFor(G.riceForSeeds(n) * (1 - 1e-12)), n - 1);
  }
  assert.equal(G.canRebirth({ ...G.newGame(), totalRice: 1e12 - 1 }), false);
  assert.equal(G.canRebirth(ready()), true);
  assert.equal(G.rebirthGain(ready()), 10);
  const early = { ...G.newGame(), totalRice: 1e11, rice: 1e11 };
  assert.equal(G.rebirth(early, 5).state, early, 'below the gate nothing changes');
  // Once seeds are large, a fresh 1兆 year may add less than one seed.
  const veteran = { ...G.newGame(), pastRice: G.riceForSeeds(1e6), rebirths: 3, totalRice: 1e12 };
  assert.equal(G.rebirthGain(veteran), 0);
  assert.equal(G.canRebirth(veteran), false);
});

test('rebirth resets this year, keeps collections and records, and repeating it is inert', () => {
  const s = ready();
  const { state: next, gain } = G.rebirth(s, 777);
  assert.equal(gain, 10);
  assert.deepEqual([next.rice, next.totalRice, next.owned, next.savedAt, next.rebirths, next.pastRice], [0, 0, {}, 777, 1, 1e12]);
  for (const key of ['clicks', 'goldenClicks', 'goldenMisses', 'newsClicks', 'secret', 'recipes', 'souvenirs', 'activePlate', 'skinsOwned', 'activeSkin'])
    assert.deepEqual(next[key], s[key], key);
  for (const id of Object.keys(s.unlocked)) assert.equal(next.unlocked[id], true, `achievement ${id} stays`);
  assert.equal(next.unlocked.rebirth1, true);
  assert.equal(next.unlocked.seeds10, true);
  // 10 seeds keep the golden upgrades; regulars always stay; the rest resets.
  assert.deepEqual(next.upgrades, { lucky_cat: true, lucky_thermos: true, regular_cat: true });
  assert.equal(G.goldenOutcome(next, 0), 'click', 'the 16th-catch guarantee survives the new year');
  assert.equal(G.chapterFor(next.totalRice).name, '台所のすみっこ');
  const again = G.rebirth(next, 900);
  assert.equal(again.gain, 0);
  assert.equal(again.state, next);
  assert.equal(G.seedMultiplier(next), 1 + 10 ** 0.4 * 0.2);
});

test('seeds depend only on all rice ever made, so splitting a year into many rebirths gains nothing', () => {
  let split = ready({ totalRice: 1e12 });
  split = G.rebirth(split, 0).state;
  split = G.rebirth({ ...split, totalRice: 7e12 }, 0).state;
  const once = G.rebirth(ready({ totalRice: 8e12 }), 0).state;
  assert.equal(G.seedCount(split), 20);
  assert.equal(G.seedCount(once), 20);
  assert.equal(split.pastRice, once.pastRice);
});

test('heirloom stages carry exactly the listed upgrade kinds and never the facility tiers', () => {
  const upgrades = Object.fromEntries(G.UPGRADES.map(u => [u.id, true]));
  const kept = seeds => {
    // Cross the threshold during this rebirth: past rice just below, this year above.
    const total = Math.max(1e12, G.riceForSeeds(seeds) * 0.02);
    const s = { ...ready({ upgrades }), pastRice: G.riceForSeeds(seeds) - total / 2, rebirths: 1, totalRice: total };
    const { state: next, gain } = G.rebirth(s, 0);
    assert.ok(gain >= 1 && G.seedCount(next) >= seeds && G.seedCount(s) < seeds);
    return new Set(G.UPGRADES.filter(u => next.upgrades[u.id]).map(u => u.kind));
  };
  assert.deepEqual([...kept(10)].sort(), ['golden', 'regular']);
  assert.deepEqual([...kept(1000)].sort(), ['click', 'golden', 'regular']);
  assert.deepEqual([...kept(1e5)].sort(), ['click', 'finger', 'golden', 'pair', 'regular']);
  assert.equal(kept(1e7).has('building'), false);
  assert.deepEqual(G.HEIRLOOMS.map(h => h.seeds), [10, 1000, 1e5, 1e6]);
});

test('seed bonus scales every facility rate and production the same way, with diminishing returns', () => {
  const base = { ...G.newGame(), owned: { obaachan: 3, tanbo: 2 }, upgrades: { tanbo_tier0: true } };
  const seeded = { ...base, pastRice: G.riceForSeeds(1000), rebirths: 1 };
  const sum = s => G.BUILDINGS.reduce((t, b) => t + G.buildingRate(s, b) * (s.owned[b.id] || 0), 0);
  assert.ok(Math.abs(sum(seeded) - G.production(seeded)) < 1e-9);
  assert.ok(Math.abs(G.production(seeded) / G.production(base) - G.seedMultiplier(seeded)) < 1e-12);
  const bonus = n => G.seedMultiplier({ pastRice: G.riceForSeeds(n) }) - 1;
  assert.ok(Math.abs(bonus(1e4) / bonus(1e3) - 10 ** 0.4) < 1e-9, '10x seeds is about 2.5x the bonus');
  assert.equal(G.seedMultiplier(G.newGame()), 1);
});

test('rice medals count all years while chapters, discoveries and upgrade sightings follow this year', () => {
  const s = G.awardAchievements({ ...G.newGame(), pastRice: 1e20, rebirths: 1, totalRice: 0 });
  assert.equal(s.unlocked.t1gai, true);
  assert.match(G.ACHIEVEMENTS.find(a => a.id === 't1gai').desc, /通算1垓粒/);
  assert.equal(G.chapterFor(s.totalRice).name, '台所のすみっこ');
  assert.equal(G.upgradeAvailable(s, G.UPGRADES.find(u => u.id === 'shio')), false);
  assert.ok(G.ACHIEVEMENTS.filter(a => /^(rebirth|seeds)\d/.test(a.id)).length === 8);
});

test('the 新米むすび skin needs a million seeds and cannot be bought with rice', () => {
  const rich = { ...G.newGame(), rice: 1e30, totalRice: 1e30 };
  assert.equal(G.buySkin(rich, 'shinmai'), rich);
  const seeded = { ...rich, pastRice: G.riceForSeeds(1e6), rebirths: 2 };
  const worn = G.buySkin(seeded, 'shinmai');
  assert.equal(worn.activeSkin, 'shinmai');
  assert.equal(worn.rice, 1e30, 'free once earned');
  assert.ok(G.production({ ...worn, owned: { obaachan: 1 } }) > G.production({ ...seeded, owned: { obaachan: 1 } }));
  assert.throws(() => G.decodeSave(G.encodeSave({ ...rich, skinsOwned: { plain: true, shinmai: true } })), /skin/);
  assert.equal(G.decodeSave(G.encodeSave(worn)).state.activeSkin, 'shinmai');
});

test('rebirth fields round-trip, old saves start in year one and malformed values are rejected', () => {
  const next = G.rebirth(ready(), 5).state;
  const loaded = G.decodeSave(G.encodeSave(next)).state;
  assert.deepEqual([loaded.pastRice, loaded.rebirths, G.seedCount(loaded)], [1e12, 1, 10]);
  const old = { ...ready() };
  delete old.pastRice; delete old.rebirths;
  const v1 = G.normalizeSave({ ...old, v: 1 }).state;
  assert.deepEqual([v1.pastRice, v1.rebirths], [0, 0]);
  assert.equal(G.normalizeSave({ ...old, v: 2 }).state.totalRice, 1e12);
  for (const bad of [
    { rebirths: -1 }, { rebirths: 1.5 }, { rebirths: '1' }, { rebirths: 2e6, pastRice: 1e40 },
    { pastRice: -1, rebirths: 1 }, { pastRice: NaN, rebirths: 1 }, { pastRice: Infinity, rebirths: 1 }, { pastRice: 1e101, rebirths: 1 }, { pastRice: '1e12', rebirths: 1 },
    { pastRice: 1e12, rebirths: 0 }, { pastRice: 0, rebirths: 1 }, { pastRice: 1e12, rebirths: 11 },
  ]) assert.throws(() => G.normalizeSave({ ...next, ...bad }), undefined, JSON.stringify(bad));
  assert.throws(() => G.normalizeSave({ ...next, upgrades: { heir_golden: true } }), /upgrades/);
  assert.throws(() => G.normalizeSave({ ...next, unlocked: { seeds_fake: true } }), /unlocked/);
});

test('a v1 save with retired workshop refunds still migrates and can rebirth without double refunds', () => {
  const v1 = { v: 1, rice: 0, totalRice: 1e12, farmers: 2, inventory: [{ fid: 'ume_f', bid: 'blend', count: 1 }], owned: { obaachan: 1 } };
  const { state, refund } = G.normalizeSave(v1);
  assert.ok(refund > 0);
  const next = G.rebirth(state, 0).state;
  assert.equal(next.pastRice, state.totalRice);
  const reloaded = G.decodeSave(G.encodeSave(next));
  assert.equal(reloaded.refund, 0, 'a v2 code never refunds again');
  assert.equal(reloaded.state.farmers, 2);
});
