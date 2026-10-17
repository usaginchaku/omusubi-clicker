// A pacing check, not a prediction of human enjoyment. No golden bonuses.
// Buys the best payback available, saving until it is affordable.
const G = require('../game.js');
let s = G.newGame();
const seen = new Set();
const clicksPerSecond = Number(process.argv[2] || 2);
const duration = Number(process.argv[3] || 3600);
if (![0, 1, 2, 4].includes(clicksPerSecond) || !Number.isInteger(duration) || duration < 1 || duration > 86400) throw Error('Use clicks/sec 0,1,2,4 and duration 1..86400 seconds');
// An idle run starts with one grandma, purchased with the opening 15 clicks.
if (!clicksPerSecond) s={...s,clicks:15,totalRice:15,owned:{obaachan:1}};
for(let time=1;time<=duration;time++) {
  const gain=G.production(s)+G.clickPower(s)*clicksPerSecond;
  s={...s,rice:s.rice+gain,totalRice:s.totalRice+gain,clicks:s.clicks+clicksPerSecond};
  const rate=G.production(s)+G.clickPower(s)*clicksPerSecond;
  const wealthy={...s,rice:1e100};
  const choices=[
    ...G.BUILDINGS.filter((b,i)=>i===0||s.totalRice>=b.baseCost*.25||s.owned[b.id]).map(b=>({id:b.id,name:b.name,cost:G.buildingPrice(s,b),after:G.buyBuilding(wealthy,b.id),buy:x=>G.buyBuilding(x,b.id)})),
    ...G.UPGRADES.filter(u=>G.upgradeAvailable(s,u)).map(u=>({id:u.id,name:u.name,cost:u.cost,after:G.buyUpgrade(wealthy,u.id),buy:x=>G.buyUpgrade(x,u.id)})),
  ].map(c=>({...c,payback:c.cost/(G.production(c.after)+G.clickPower(c.after)*clicksPerSecond-rate)}))
    .filter(c=>Number.isFinite(c.payback)&&c.payback>0).sort((a,b)=>a.payback-b.payback);
  const choice=choices[0];
  if(choice&&s.rice>=choice.cost) {
    s=choice.buy(s);
    if(!seen.has(choice.id)&&G.BUILDINGS.some(b=>b.id===choice.id)) {
      seen.add(choice.id);
      console.log(`${time}s: ${choice.name} / ${G.production(s).toFixed(1)} grains/sec`);
    }
  }
}
console.log(JSON.stringify({seconds:duration,clicksPerSecond,totalRice:Math.floor(s.totalRice),cps:Math.round(G.production(s)),facilities:seen.size,upgrades:Object.keys(s.upgrades).length}));
