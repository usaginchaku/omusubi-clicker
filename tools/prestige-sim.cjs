// Multi-year pacing model for 新米（転生）. It follows the app loop
// (advanceProduction -> action -> awardAchievements) with the real Game engine.
// A bot is not a person: it never gets bored, misreads or idles unexpectedly.
// Usage: node tools/prestige-sim.cjs profile=casual years=12 seed=1 yearMin=240 ratio=1 [bonus=0.01 unit=1e9] [json]
//   profile: casual | active | idle. ratio: rebirth once the gain reaches
//   ratio x current seeds (and the yearly 1兆 gate is met). bonus/unit try
//   other constants on a copy of game.js without editing it.
const fs = require('fs');
const path = require('path');
const Module = require('module');

function loadGame(overrides = {}) {
  let src = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
  if (overrides.bonus !== undefined) src = src.replace(/const SEED_BONUS = [^;]+;/, `const SEED_BONUS = ${Number(overrides.bonus)};`);
  if (overrides.unit !== undefined) src = src.replace(/const SEED_UNIT = [^;]+;/, `const SEED_UNIT = ${Number(overrides.unit)};`);
  if (overrides.root !== undefined) src = src.replace(/const SEED_ROOT = [^;]+;/, `const SEED_ROOT = ${Number(overrides.root)};`);
  if (overrides.power !== undefined) src = src.replace(/const SEED_POWER = [^;]+;/, `const SEED_POWER = ${Number(overrides.power)};`);
  if (overrides.heir !== undefined) {
    // heir=10,100,1000,10000 moves the four heirloom thresholds.
    const at = String(overrides.heir).split(',').map(Number);
    let i = 0;
    src = src.replace(/(\{ id: "heir_\w+", seeds: )\d+/g, (_, head) => head + at[i++]);
  }
  const m = new Module(path.join(__dirname, 'game-variant.js'));
  m._compile(src, path.join(__dirname, 'game-variant.js'));
  return m.exports;
}

const PROFILES = {
  // Clicks in short bursts, checks the shop every 5 s, catches 60% of golden.
  casual: { cps: 1, buyEvery: 5000, catchRate: 0.6, catchDelay: 4000 },
  // Fast clicker who watches the screen: the stress case for runaway pacing.
  active: { cps: 5, buyEvery: 1000, catchRate: 1, catchDelay: 2000 },
  // Leaves the tab open, rarely clicks, buys every 30 s, catches 20% of golden.
  idle: { cps: 0.1, buyEvery: 30000, catchRate: 0.2, catchDelay: 8000 },
};

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Plays one year from state `start` until `stop(s)` is true or maxMs passes.
function playYear(G, start, profile, seed, stop, maxMs) {
  const p = PROFILES[profile];
  const award = G.awardAchievements;
  const spawnRand = rng(seed * 2654435761), effectRand = rng(seed * 2246822519 + 0x5bd1e995), catchRand = rng(seed * 97 + 13);
  let s = award({ ...start, savedAt: 0 }), boosts = {}, last = 0, jackpot = 0, earned = 0;
  const marks = {};
  const mark = (key, t) => { if (marks[key] === undefined) marks[key] = t; };
  const settle = now => { if (now > last) { const before = s.totalRice; s = award(G.advanceProduction(s, last, now, boosts)); earned += s.totalRice - before; last = now; } };
  let nextCatch;
  const schedule = t => {
    const settings = G.goldenSettings(s);
    const wait = (25000 + spawnRand() * 20000) * settings.wait;
    // A missed golden disappears after its lifetime; the next one is scheduled then.
    nextCatch = catchRand() < p.catchRate ? { t: t + wait + p.catchDelay, hit: true } : { t: t + wait + settings.lifetime * 1000, hit: false };
  };
  schedule(0);
  const catchGolden = t => {
    settle(t);
    const kind = G.goldenOutcome(s, effectRand());
    s = award({ ...s, goldenClicks: s.goldenClicks + 1, goldenMisses: kind === 'click' ? 0 : s.goldenMisses + 1 });
    if (kind === 'harvest') { const bonus = G.goldenHarvest(s); s = award({ ...s, rice: s.rice + bonus, totalRice: s.totalRice + bonus }); earned += bonus; }
    else boosts = G.addGoldenBoost(boosts, kind, s, t);
  };
  const click = t => {
    settle(t);
    const gain = G.activeClickPower(s, boosts, t);
    if (boosts.click > t) jackpot += gain;
    earned += gain;
    s = award({ ...s, rice: s.rice + gain, totalRice: s.totalRice + gain, clicks: s.clicks + 1 });
  };
  const buyTick = t => {
    settle(t);
    for (let n = 0; n < 60; n++) {
      const goldenUp = G.UPGRADES.find(u => u.kind === 'golden' && G.upgradeAvailable(s, u));
      if (goldenUp && s.rice >= goldenUp.cost) { s = award(G.buyUpgrade(s, goldenUp.id)); continue; }
      const rate = G.production(s) + G.clickPower(s) * p.cps;
      const wealthy = { ...s, rice: 1e300 };
      const choices = [
        ...G.BUILDINGS.filter((b, i) => i === 0 || s.totalRice >= b.baseCost * 0.25 || s.owned[b.id])
          .map(b => ({ id: b.id, building: true, cost: G.buildingPrice(s, b), after: award(G.buyBuilding(wealthy, b.id)) })),
        ...G.UPGRADES.filter(u => u.kind !== 'golden' && G.upgradeAvailable(s, u))
          .map(u => ({ id: u.id, building: false, cost: u.cost, after: award(G.buyUpgrade(wealthy, u.id)) })),
      ].map(c => ({ ...c, payback: c.cost / (G.production(c.after) + G.clickPower(c.after) * p.cps - rate) }))
        .filter(c => Number.isFinite(c.payback) && c.payback > 0).sort((a, b) => a.payback - b.payback);
      const choice = choices[0];
      if (!choice || s.rice < choice.cost) break;
      s = award(choice.building ? G.buyBuilding(s, choice.id) : G.buyUpgrade(s, choice.id));
      if (choice.building) mark(choice.id, t);
    }
    // Collections are bought once they cost at most a quarter of the savings.
    for (const r of G.REGULARS) if (G.upgradeAvailable(s, G.UPGRADES.find(u => u.id === r.id)) && s.rice >= r.cost * 4) s = award(G.buyUpgrade(s, r.id));
    for (const r of G.RECIPES) if (!s.recipes[r.id] && s.rice >= r.cost * 4) s = award(G.cookRecipe(s, r.id));
    for (const o of G.OUTINGS) for (const r of G.RECIPES) if (s.rice >= o.cost * 4) s = award(G.sendMeal(s, o.id, r.id));
    if (s.activeSkin !== 'shinmai') s = award(G.buySkin(s, 'shinmai'));
  };
  const clickMs = p.cps ? 1000 / p.cps : Infinity;
  let clickIndex = 1, buyIndex = 1;
  for (;;) {
    const tClick = clickIndex * clickMs, tBuy = buyIndex * p.buyEvery;
    const expiries = [boosts.click, boosts.production].filter(x => x > last);
    const tExpiry = expiries.length ? Math.min(...expiries) : Infinity;
    const t = Math.min(tExpiry, nextCatch.t, tClick, tBuy);
    if (t > maxMs) { settle(maxMs); break; }
    if (t === tExpiry) settle(t);
    else if (t === nextCatch.t) { if (nextCatch.hit) catchGolden(t); else settle(t); schedule(t); }
    else if (t === tClick) { click(t); clickIndex++; }
    else {
      buyTick(t); buyIndex++;
      for (const at of [1e9, 1e12, 1e16, 1e20]) if (s.totalRice >= at) mark('total' + at.toExponential(0).replace('+', ''), t);
      if (G.canRebirth && G.canRebirth(s)) mark('gate', t);
      if (stop(s, t)) break;
    }
  }
  return { state: s, ms: last, marks, jackpotShare: earned ? jackpot / earned : 0 };
}

const minutes = ms => ms === undefined ? null : Math.round(ms / 6000) / 10;
function summaryOf(G, r, year, hours) {
  const s = r.state;
  return {
    year, minutes: minutes(r.ms), hoursSoFar: Math.round(hours * 100) / 100,
    seedsBefore: G.seedCount(s), gain: G.rebirthGain(s), multiplier: Number(G.seedMultiplier(s).toFixed(2)),
    kept: G.keptKinds(s).length - 1,
    totalRice: Number(s.totalRice.toPrecision(3)), lifetime: Number(G.allTimeRice(s).toPrecision(3)), cps: Number(G.production(s).toPrecision(3)),
    facilityTypes: G.BUILDINGS.filter(b => s.owned[b.id] > 0).length,
    achievements: G.achievementCount(s), postcards: G.postcardCount(s),
    jackpotShare: Number(r.jackpotShare.toFixed(2)),
    at: Object.fromEntries(['conbini', 'moon', 'university', 'time', 'home', 'gate', 'total1e16', 'total1e20'].map(k => [k, minutes(r.marks[k])]).filter(([, v]) => v !== null)),
  };
}

function runYears(G, { profile = 'casual', years = 12, seed = 1, yearMin = 240, ratio = 1, hours = Infinity } = {}) {
  let s = G.newGame(), totalMs = 0;
  const rows = [];
  for (let y = 1; y <= years && totalMs < hours * 3600000; y++) {
    // ratio < 0 never rebirths: the same bot playing the game as it was before.
    // ratio=rate: rebirth once seeds gained per minute of this year have fallen
    // 10% below their best, the usual near-optimal rule for this kind of reset.
    let best = 0;
    const stop = ratio === 'rate' ? (st, t) => {
      // A +1 seed right after the yearly gate is not a real peak to cash in.
      if (!G.canRebirth(st) || G.rebirthGain(st) < 0.05 * G.seedCount(st)) return false;
      const rate = G.rebirthGain(st) / t;
      best = Math.max(best, rate);
      return rate < best * 0.9;
    } : st => ratio >= 0 && G.canRebirth(st) && G.rebirthGain(st) >= ratio * G.seedCount(st);
    const r = playYear(G, s, profile, seed * 100 + y, stop, Math.min(yearMin * 60000, hours * 3600000 - totalMs));
    totalMs += r.ms;
    rows.push(summaryOf(G, r, y, totalMs / 3600000));
    if (ratio < 0 || !G.canRebirth(r.state)) break;
    s = G.rebirth(r.state, 0).state;
  }
  return rows;
}

if (require.main === module) {
  const args = Object.fromEntries(process.argv.slice(2).map(a => a.includes('=') ? a.split('=') : [a, true]));
  const opts = { profile: args.profile || 'casual', years: Number(args.years || 12), seed: Number(args.seed || 1), yearMin: Number(args.yearMin || 240), ratio: args.ratio === 'rate' ? 'rate' : Number(args.ratio ?? 1), hours: Number(args.hours || Infinity) };
  if (!PROFILES[opts.profile] || !(opts.years >= 1 && opts.years <= 200)) throw Error('profile casual|active|idle, years 1..200');
  const G = loadGame({ bonus: args.bonus, unit: args.unit, root: args.root, power: args.power, heir: args.heir });
  const rows = runYears(G, opts);
  for (const row of rows) {
    // brief: years 1-8, then every 5th year and the last one.
    if (args.brief && row.year > 8 && row.year % 5 && row !== rows.at(-1)) continue;
    if (args.json) console.log(JSON.stringify(row));
    else console.log(`Y${row.year} ${row.minutes}m (計${row.hoursSoFar}h) 種${row.seedsBefore}+${row.gain} ×${row.multiplier} 持越${row.kept} 通算${row.lifetime.toExponential(1)} 施設${row.facilityTypes} 実績${row.achievements} 絵${row.postcards} 777率${row.jackpotShare} ` + Object.entries(row.at).map(([k, v]) => `${k}@${v}`).join(' '));
  }
  // Hours of play until each seed stage is banked by a rebirth.
  const reached = n => rows.find(r => r.seedsBefore + r.gain >= n)?.hoursSoFar ?? null;
  console.log(JSON.stringify({ profile: opts.profile, ratio: opts.ratio, hoursToSeeds: Object.fromEntries([10, 1000, 100000, 1000000, 10000000].map(n => [n, reached(n)])),
    hoursToAll18: rows.find(r => r.facilityTypes === 18)?.hoursSoFar ?? null, hoursTo101Achievements: rows.find(r => r.achievements >= 101)?.hoursSoFar ?? null, hoursTo27Postcards: rows.find(r => r.postcards >= 27)?.hoursSoFar ?? null }));
}

module.exports = { loadGame, playYear, runYears, PROFILES };
