const Game = (() => {
// ---------- 生産施設 ----------
const BUILDINGS = [
  { id: "obaachan", name: "おばあちゃん", desc: "心を込めて握ってくれる", baseCost: 15, cps: 0.5, icon: "👵" },
  { id: "suihanki", name: "炊飯器", desc: "自動でふっくら炊き上げる", baseCost: 100, cps: 4, icon: "🍚" },
  { id: "tanbo", name: "田んぼ", desc: "黄金の稲穂が実る", baseCost: 1100, cps: 12, icon: "🌾" },
  { id: "conbini", name: "コンビニ", desc: "24時間おむすび供給", baseCost: 12000, cps: 47, icon: "🏪" },
  { id: "tonya", name: "米問屋", desc: "米を大量に取り仕切る", baseCost: 130000, cps: 260, icon: "🏯" },
  { id: "robo", name: "田植えロボ", desc: "不眠不休で田植えする", baseCost: 1400000, cps: 1400, icon: "🤖" },
  { id: "jinja", name: "豊穣神社", desc: "五穀豊穣のご利益", baseCost: 20000000, cps: 7800, icon: "⛩️" },
  { id: "moon", name: "月面水田", desc: "月でも米は育つらしい", baseCost: 330000000, cps: 44000, icon: "🌕" },
];

// ---------- クリック強化 ----------
const UPGRADES = [
  { id: "shio", name: "塩むすび", desc: "クリック力 ×2", cost: 100, mult: 2, icon: "🧂" },
  { id: "ume", name: "梅干し", desc: "クリック力 ×2", cost: 1000, mult: 2, icon: "🔴" },
  { id: "sake", name: "焼き鮭", desc: "クリック力 ×2", cost: 10000, mult: 2, icon: "🐟" },
  { id: "mentai", name: "明太子", desc: "クリック力 ×2", cost: 100000, mult: 2, icon: "🌶️" },
  { id: "tunamayo", name: "ツナマヨ", desc: "クリック力 ×2", cost: 1000000, mult: 2, icon: "🥫" },
  { id: "gold_nori", name: "黄金の海苔", desc: "クリック力 ×2", cost: 10000000, mult: 2, icon: "✨" },
  { id: "bodakko", name: "ぼだっこ", desc: "秋田が誇る塩っぱい鮭。クリック力 ×3", cost: 77000000, mult: 3, icon: "🧡" },
];

// ---------- 工房:具材 ----------
const FILLINGS = [
  { id: "ume_f", name: "梅", icon: "🔴", buyBase: 300, valBase: 800 },
  { id: "konbu_f", name: "昆布", icon: "🟫", buyBase: 400, valBase: 1000 },
  { id: "sake_f", name: "鮭", icon: "🐟", buyBase: 500, valBase: 1200 },
  { id: "tuna_f", name: "ツナマヨ", icon: "🥫", buyBase: 650, valBase: 1500 },
  { id: "mentai_f", name: "明太子", icon: "🌶️", buyBase: 1000, valBase: 2200 },
  { id: "bodakko_f", name: "ぼだっこ", icon: "🧡", buyBase: 2400, valBase: 5000 },
];

// ---------- 工房:ブレンド米 ----------
const BRANDS = [
  { id: "blend", name: "標準ブレンド米", premium: 0, mult: 1.0 },
  { id: "koshi", name: "コシヒカリ", premium: 800, mult: 1.3 },
  { id: "akita", name: "あきたこまち", premium: 1500, mult: 1.5 },
  { id: "yume", name: "ゆめぴりか", premium: 3000, mult: 1.8 },
  { id: "ryu", name: "龍の瞳", premium: 8000, mult: 2.4 },
];

const RICE_PER_ONIGIRI = 2500;
const FARMER_BASE_COST = 50000;
const farmerCost = (n) => Math.ceil(FARMER_BASE_COST * Math.pow(1.6, n));

// ---------- スキン(能力つき) ----------
const SKINS = [
  {
    id: "plain", name: "プレーン", cost: 0, ability: "能力なし。素朴がいちばん",
    riceA: "#ffffff", riceB: "#efe8d8", edge: "#ded5c0", speck: "#e9e1cf", nori: "#2d4434", extra: null,
  },
  {
    id: "yukari", name: "ゆかり", cost: 50000, ability: "クリック力 +15%",
    riceA: "#f3e6f5", riceB: "#dcc3e3", edge: "#c5a8cf", speck: "#9b59b6", nori: "#2d4434", extra: "yukari",
  },
  {
    id: "genmai", name: "玄米", cost: 300000, ability: "毎秒生産 +10%",
    riceA: "#e8d9bd", riceB: "#cdb88f", edge: "#b09b72", speck: "#8d7548", nori: "#2d4434", extra: null,
  },
  {
    id: "yaki", name: "焼きおむすび", cost: 2000000, ability: "施設の価格 -5%",
    riceA: "#e8c27a", riceB: "#c98f3f", edge: "#a06d28", speck: "#8a5a1e", nori: null, extra: "yaki",
  },
  {
    id: "sekihan", name: "赤飯", cost: 10000000, ability: "金のおむすびの待ち時間 -25%",
    riceA: "#f2dede", riceB: "#dfb6b6", edge: "#c79090", speck: "#b76e6e", nori: "#2d4434", extra: "sekihan",
  },
  {
    id: "gold", name: "黄金おむすび", cost: 100000000, ability: "クリック力&毎秒生産 +15%",
    riceA: "#fff3c4", riceB: "#ffd766", edge: "#e0a92e", speck: "#d49a1a", nori: "#5c4a12", extra: "gold",
  },
];

// ---------- 実績 ----------
const ACHIEVEMENTS = [
  { id: "first", name: "はじめての一握り", desc: "おむすびを1回握る", cond: (s) => s.clicks >= 1 },
  { id: "c100", name: "握りの修行中", desc: "100回握る", cond: (s) => s.clicks >= 100 },
  { id: "c1000", name: "千回握り達成", desc: "1,000回握る", cond: (s) => s.clicks >= 1000 },
  { id: "c10000", name: "握りの鉄人", desc: "10,000回握る", cond: (s) => s.clicks >= 10000 },
  { id: "t1man", name: "米粒長者", desc: "累計1万粒", cond: (s) => s.totalRice >= 1e4 },
  { id: "t100man", name: "米百万石", desc: "累計100万粒", cond: (s) => s.totalRice >= 1e6 },
  { id: "t1oku", name: "億り米", desc: "累計1億粒", cond: (s) => s.totalRice >= 1e8 },
  { id: "t1cho", name: "米の王", desc: "累計1兆粒", cond: (s) => s.totalRice >= 1e12 },
  { id: "baachan10", name: "おばあちゃん大集合", desc: "おばあちゃんを10人", cond: (s) => (s.owned.obaachan || 0) >= 10 },
  { id: "tanbo10", name: "庄屋さま", desc: "田んぼを10枚", cond: (s) => (s.owned.tanbo || 0) >= 10 },
  { id: "conbini10", name: "フランチャイズ王", desc: "コンビニを10店舗", cond: (s) => (s.owned.conbini || 0) >= 10 },
  { id: "moon1", name: "月の開拓者", desc: "月面水田を所有する", cond: (s) => (s.owned.moon || 0) >= 1 },
  { id: "bodakko", name: "ぼだっこ通", desc: "ぼだっこを入手する", cond: (s) => !!s.upgrades.bodakko },
  { id: "allup", name: "全部のせ", desc: "全グレードアップを入手", cond: (s) => UPGRADES.every((u) => s.upgrades[u.id]) },
  { id: "gold1", name: "強運の持ち主", desc: "金のおむすびをクリック", cond: (s) => s.goldenClicks >= 1 },
  { id: "gold10", name: "豊穣の申し子", desc: "金のおむすびを10回クリック", cond: (s) => s.goldenClicks >= 10 },
  { id: "craft1", name: "おむすび屋開店", desc: "工房でおむすびを握る", cond: (s) => s.crafted >= 1 },
  { id: "sell100", name: "繁盛店", desc: "おむすびを100個売る", cond: (s) => s.sold >= 100 },
  { id: "profit", name: "商売上手", desc: "累計利益100万粒", cond: (s) => s.profit >= 1e6 },
  { id: "skin1", name: "おしゃれおむすび", desc: "スキンを購入する", cond: (s) => Object.keys(s.skinsOwned).length >= 2 },
  { id: "farmer5", name: "村いちばんの大地主", desc: "契約農家を5軒", cond: (s) => s.farmers >= 5 },
  { id: "hidden", name: "かくし味", desc: "ひみつの実績…", secret: true, cond: (s) => s.secret },
];

// The world gets stranger; the only currency and production loop stay the same.
const BUILDING_STORIES = [
  ["何個食べる？と聞きながら、もう握っている。", "肩たたき券", "おばあちゃん会議", "秘伝の目分量", "全員が本家"],
  ["炊けたよ、の音がいちばん好き。", "ふっくらモード", "保温の向こう側", "内釜が本気", "炊飯器の自我"],
  ["今年も豊作。去年も豊作。ちょっと怖い。", "かかしの有給", "合鴨の正社員", "稲穂の団結", "田んぼの意思"],
  ["店長のおすすめが全棚おむすび。", "海苔の開封革命", "おむすび専用レジ", "店長もおむすび", "本部、米に屈す"],
  ["米の話なら任せて。米以外の話も米になる。", "俵の二段積み", "米で払う給料", "俵の超高層化", "世界共通米"],
  ["人類よ、田植えをやめるな。私はやる。", "防水長靴", "田植え用ドリル", "泥まみれの叡智", "田植え最終形態"],
  ["神様もおかわりする。", "お供えのおかわり", "神様のエプロン", "五穀ぜんぶ米", "神託：もう一膳"],
  ["うさぎは餅つきをやめ、こちらへ転職した。", "無重力しゃもじ", "うさぎの転職届", "満月は炊きたて", "月面全田化"],
];
BUILDINGS.forEach((b, i) => { b.desc = BUILDING_STORIES[i][0]; b.upgradeNames = BUILDING_STORIES[i].slice(1); });
// Shorten the old midgame's long waits without reducing existing production.
[0.5, 4, 30, 160, 900, 5500, 35000, 260000].forEach((cps, i) => { BUILDINGS[i].cps = cps; });
BUILDINGS.push(
  { id: "university", name: "おこめ大学", desc: "学位は博士（炊き加減）。卒論はおいしかった。", baseCost: 5.1e9, cps: 1.8e6, icon: "🎓", upgradeNames: ["必修：蒸らし", "炊き加減の査読", "ノーベル米賞", "全知全農"] },
  { id: "collider", name: "巨大しゃもじ加速器", desc: "米粒を衝突させると、なぜか米粒が増える。", baseCost: 7.5e10, cps: 18.75e6, icon: "⚛️", upgradeNames: ["しゃもじ二刀流", "もちもち粒子", "米質量保存の無視", "大盛り統一理論"] },
  { id: "time", name: "時をかける炊飯器", desc: "明日のごはんを昨日炊く。予約機能の暴走。", baseCost: 1e12, cps: 250e6, icon: "⏳", upgradeNames: ["予約：紀元前", "昨日のおかわり", "因果の蒸らし", "炊ける前に食べる"] },
  { id: "planet", name: "惑星おむすび", desc: "海は味噌汁。北極は梅干し。移住したい。", baseCost: 1.4e13, cps: 3.5e9, icon: "🪐", upgradeNames: ["海苔の地殻", "梅干しマントル", "お弁当衛星", "惑星ごと大盛り"] },
  { id: "blackhole", name: "ブラックおひつ", desc: "光すら逃さない。でもごはんは出てくる。", baseCost: 1.7e14, cps: 42.5e9, icon: "🕳️", upgradeNames: ["事象のふち", "しゃもじ脱出速度", "ホーキング炊飯", "特異点のおこげ"] },
  { id: "parallel", name: "並行世界のおばあちゃん", desc: "どの宇宙でも「痩せた？」と言われる。", baseCost: 2.1e15, cps: 525e9, icon: "🪞", upgradeNames: ["実家へのポータル", "全宇宙の煮物", "多元的おすそわけ", "どこへ逃げても実家"] },
  { id: "concept", name: "概念精米所", desc: "「なんかお腹すいた」を米にする。", baseCost: 2.8e16, cps: 7e12, icon: "💭", upgradeNames: ["空腹の可視化", "概念のぬか取り", "思う、ゆえに米あり", "意味まで炊けた"] },
  { id: "narrator", name: "ナレーション工場", desc: "「そこには大量の米があった」。あった。", baseCost: 4e17, cps: 100e12, icon: "📖", upgradeNames: ["語尾に米", "行間に米", "伏線の炊き上げ", "作者も知らないおかわり"] },
  { id: "bigbang", name: "ビッグバン炊飯", desc: "宇宙の始まりは、炊飯完了の音だった。", baseCost: 6e18, cps: 1.5e15, icon: "💥", upgradeNames: ["宇宙の吸水", "インフレ炊飯", "背景放射は湯気", "創世記：いただきます"] },
  { id: "home", name: "実家", desc: "宇宙の外まで来たのに、おばあちゃんがいた。", baseCost: 1e20, cps: 25e15, icon: "🏠", upgradeNames: ["いつもの茶碗", "帰省ラッシュ（宇宙）", "まだあるよ", "お腹いっぱいのその先"] },
);

["人", "台", "枚", "店舗", "軒", "台", "社", "枚", "校", "基", "台", "個", "個", "人", "棟", "棟", "基", "軒"].forEach((unit, i) => { BUILDINGS[i].unit = unit; });

UPGRADES.forEach(u => { u.kind = "click"; });
UPGRADES[0].cost = 50;
const CLICK_FLAVORS = ["塩は少々。気持ちは山盛り。", "まんなかに酸っぱい太陽。", "鮭には、ここにいてほしい。", "ピリ辛で手が止まらない。", "会議で全員が賛成した。", "光る海苔。食費も光る。", "しょっぱさが米を呼ぶ。"];
UPGRADES.forEach((u, i) => { u.flavor = CLICK_FLAVORS[i]; });
UPGRADES.push(
  { id: "butter", name: "背徳のバター醤油", cost: 5e8, mult: 2, icon: "🧈", kind: "click", desc: "クリック力 ×2", flavor: "栄養士には明日話す。" },
  { id: "wasabi", name: "宇宙わさび", cost: 8e9, mult: 2, icon: "🌿", kind: "click", desc: "クリック力 ×2", flavor: "鼻の奥に銀河が見えた。" },
  { id: "horizon", name: "地平線まで海苔", cost: 1e11, mult: 3, icon: "🌊", kind: "click", desc: "クリック力 ×3", flavor: "巻くには地球を回す必要がある。" },
  { id: "mayo", name: "マヨネーズの永久機関", cost: 2e13, mult: 3, icon: "♾️", kind: "click", desc: "クリック力 ×3", flavor: "物理学者が匙を投げた。マヨをすくえた。" },
  { id: "love", name: "愛情（業務用）", cost: 4e16, mult: 5, icon: "♥", kind: "click", desc: "クリック力 ×5", flavor: "18リットル缶入り。愛は量れる。" },
);
for (const [i, clicks, cost, name, flavor] of [
  [0, 100, 1500, "指先に田んぼ", "手相に用水路がある。"],
  [1, 500, 150000, "十指がおばあちゃん", "全員に食べたか聞かれる。"],
  [2, 1500, 15e6, "手のひら炊飯革命", "握手すると炊ける。"],
  [3, 5000, 15e9, "この手が米宇宙", "手を洗うと銀河が流れる。"],
]) UPGRADES.push({ id: `finger_${i}`, name, flavor, kind: "finger", cost, clickNeed: clicks, share: 0.01, icon: "✋", desc: "1クリックに毎秒生産の1%を追加" });

const BUILDING_UPGRADE_FLAVORS = {
  obaachan: ["券に有効期限を書かない優しさ。", "議題：ちゃんと食べてる？", "レシピの単位が全部『このくらい』。", "分家という概念を認めない。"],
  suihanki: ["ボタンを一つ増やしただけでこのふっくら。", "昨日のごはんが今日より炊きたて。", "釜が本気なら、こちらも本気で食べる。", "『炊きたい』と初めて自分から言った。"],
  tanbo: ["鳥も一緒に休暇を取ってくれた。", "福利厚生は、虫食べ放題。", "倒伏しないと労使で合意。", "人類を養うと決めたらしい。"],
  conbini: ["①を引いたら、世界が変わった。", "年齢確認：梅干しは何年ものですか？", "人手不足への思い切った回答。", "会議室も炊飯室になった。"],
  tonya: ["二段目からは、夢も積める。", "給与明細の単位が俵。", "上層階ほど風通しがよく、米が乾く。", "為替レートは炊き加減で決まる。"],
  robo: ["足元が濡れないと、心も強い。", "なぜ田植えにドリルが必要かは聞かない。", "学習データの99%が泥。", "これ以上の田植えは、もはや田植えではない。"],
  jinja: ["神様の茶碗が、また空になっていた。", "神々しい。しかも撥水。", "分類学者には、あとで謝る。", "啓示が具体的で助かる。"],
  moon: ["ごはんが浮いても、よそう手は止めない。", "退職理由：もち以外も作りたい。", "新月はおかわり待ち。", "海と呼ばれていた場所も田んぼに。"],
  university: ["これを落とすと卒業できない。", "査読者2『水が少ない』。", "受賞スピーチ中にも炊ける。", "知らないことはない。休耕日もない。"],
  collider: ["右でよそって、左でおかわり。", "まだ観測されていない。食べてしまった。", "増えて困る人は、ここにはいない。", "すべての力は、おかわりに向かう。"],
  time: ["人類より先に、ごはんが待っている。", "昨日の自分が満腹になる仕組み。", "原因と結果を10分ほど置きます。", "食後に炊飯ボタンを押す新習慣。"],
  planet: ["プレートが動くと海苔がパリッと鳴る。", "地震の原因がすっぱい。", "毎朝、軌道上に配達される。", "質量が増えても、お値段はそのまま。"],
  blackhole: ["ふちまでよそっても、まだ入る。", "物理的には無理。おばあちゃんなら可能。", "遠い未来には、すべての穴が炊ける。", "宇宙でいちばん取りづらい場所。"],
  parallel: ["開けたら、もう玄関に米があった。", "鍋のサイズが次元を超えた。", "お返しのお返しが無限に届く。", "帰省の交通費はゼロになった。"],
  concept: ["お腹の音に、輪郭がついた。", "曖昧な部分を少し削ります。", "証明の途中ですが、おかわりどうぞ。", "分かった気がする。おいしい。"],
  narrator: ["むかしむかし、あるところに米。", "白い余白をよく見ると、全部米粒。", "第1章の炊飯器が、いま鳴った。", "書いてないのに増えている。"],
  bigbang: ["膨張する前に、30分ほど浸します。", "空間そのものが大盛りになる。", "宇宙は、まだ温かい。", "光あれ。ついでに味噌汁も。"],
  home: ["宇宙を救った人も、この茶碗を使う。", "渋滞の最後尾はアンドロメダ。", "それが、宇宙の基本法則だった。", "じゃあ、お土産に包んでおくね。"],
};
for (const b of BUILDINGS) {
  [1, 10, 25, 50].forEach((need, i) => UPGRADES.push({
    id: `${b.id}_tier${i}`, name: b.upgradeNames[i], kind: "building", building: b.id,
    need, cost: b.baseCost * [5, 50, 500, 5000][i], mult: 2, icon: b.icon,
    desc: `${b.name}の生産 ×2`, flavor: BUILDING_UPGRADE_FLAVORS[b.id][i],
  }));
}

SKINS.push(
  { id: "panda", name: "ぱんだむすび", cost: 2500, ability: "クリック力 +10%", riceA: "#ffffff", riceB: "#ebe8df", edge: "#d6d0c3", speck: "#e4ded1", nori: "#29333a", extra: "panda" },
  { id: "neko", name: "ねこむすび", cost: 3e6, ability: "クリック力 +20%", riceA: "#ffe6ba", riceB: "#eac28b", edge: "#c99054", speck: "#c68c50", nori: "#3b4b38", extra: "neko" },
  { id: "cosmos", name: "銀河むすび", cost: 5e10, ability: "毎秒生産 +25%", riceA: "#d9caff", riceB: "#8772d3", edge: "#6857a9", speck: "#fff4bf", nori: "#31315d", extra: "cosmos" },
);
SKINS.sort((a, b) => a.cost - b.cost);

// Old workshop achievements remain in imported collections, but new players never
// receive impossible objectives for a system that no longer exists.
for (const a of ACHIEVEMENTS) {
  if (["craft1", "sell100", "profit", "farmer5"].includes(a.id)) a.legacy = true;
}
const allup = ACHIEVEMENTS.find(a => a.id === "allup");
allup.desc = "最初の具材強化7種類を入手";
allup.cond = s => ["shio", "ume", "sake", "mentai", "tunamayo", "gold_nori", "bodakko"].every(id => s.upgrades[id]);
const ACHIEVEMENT_TITLES = [
  ["助っ人は最強", "親戚の集まりじゃない"], ["電気のちから", "ブレーカーとの戦い"],
  ["靴はもう泥だらけ", "地図がだいたい田"], ["温めますか？", "二軒先も当店"],
  ["俵で話そう", "米本位制"], ["機械も米が好き", "ロボット三原則に田植え"],
  ["神頼みも生産活動", "神様のシフト表"], ["月にもおかわり", "月がきれいですね（収穫期）"],
  ["おこめの偏差値", "論文は全部おいしい"], ["科学的にもちもち", "物理法則、お休みです"],
  ["昨日も炊けてた", "未来の自分、ありがとう"], ["主食の惑星", "住民票は海苔の上"],
  ["吸い込むより炊く", "底なしのおかわり"], ["おばあちゃんは遍在する", "全宇宙で食べなさい"],
  ["空腹には実体があった", "もはや米という思想"], ["作者の都合で豊作", "この文も米になった"],
  ["創世の炊飯ボタン", "宇宙を50個炊きました"], ["ただいま", "どこまで行っても、いただきます"],
];
BUILDINGS.forEach((b, i) => {
  [1, 50].forEach((count, tier) => ACHIEVEMENTS.push({
    id: `${b.id}_ach${tier}`, name: ACHIEVEMENT_TITLES[i][tier],
    desc: `${b.name}を${count}${b.unit}迎える`, cond: s => (s.owned[b.id] || 0) >= count,
  }));
});
ACHIEVEMENTS.push(
  { id: "c25", name: "もう一個だけ", desc: "25回握る", cond: s => s.clicks >= 25 },
  { id: "c250", name: "手が勝手に", desc: "250回握る", cond: s => s.clicks >= 250 },
  { id: "c5000", name: "指紋がお米", desc: "5,000回握る", cond: s => s.clicks >= 5000 },
  { id: "t100", name: "一粒も残さない", desc: "累計100粒", cond: s => s.totalRice >= 100 },
  { id: "t1000", name: "お茶碗の向こう側", desc: "累計1,000粒", cond: s => s.totalRice >= 1000 },
  { id: "t1kei", name: "数えた人が帰ってこない", desc: "累計1京粒", cond: s => s.totalRice >= 1e16 },
  { id: "t1gai", name: "宇宙、おかわり", desc: "累計1垓粒", cond: s => s.totalRice >= 1e20 },
  { id: "up1", name: "ひと工夫", desc: "強化を1つ購入", cond: s => Object.values(s.upgrades).filter(Boolean).length >= 1 },
  { id: "up20", name: "工夫にもほどがある", desc: "強化を20種類購入", cond: s => Object.values(s.upgrades).filter(Boolean).length >= 20 },
  { id: "up50", name: "原形は米だった", desc: "強化を50種類購入", cond: s => Object.values(s.upgrades).filter(Boolean).length >= 50 },
  { id: "allbuild", name: "実家までの遠回り", desc: "全18種類の施設を所有", cond: s => BUILDINGS.every(b => s.owned[b.id] > 0) },
  { id: "gold50", name: "金のおむすびの常連", desc: "金のおむすびを50回つかまえる", cond: s => s.goldenClicks >= 50 },
  { id: "panda", name: "かわいいは主食", desc: "ぱんだむすびに着替える", cond: s => s.activeSkin === "panda" },
  { id: "neko", name: "にぎらせていただく", desc: "ねこむすびに着替える", cond: s => s.activeSkin === "neko" },
  { id: "news", name: "米の情報通", desc: "米ニュースを10回めくる", secret: true, cond: s => s.newsClicks >= 10 },
);

const CHAPTERS = [
  { at: 0, name: "台所のすみっこ", news: ["おむすび一個から始まる、ちょっと大げさな話。", "近所の猫、開店前から並ぶ。買うとは言っていない。", "塩を少々、と書かれたレシピ。少々の審議が続く。", "おばあちゃん「お腹すいてない？」。すいてなくても握る。"] },
  { at: 1000, name: "町じゅうおむすび", news: ["町内会、回覧板を海苔に変更。読後はおいしく。", "炊飯器の保温ランプ、町の夜景に認定。", "コンビニ新商品、鮭・梅・おむすびの具のおむすび。", "市民アンケート、好きな形の98%が三角に。"] },
  { at: 1e6, name: "だいたい米の国", news: ["国会、おかわりの是非で全会一致。", "米の生産量、グラフ用紙の外へ。紙を継ぎ足す。", "神社のおみくじ、全員『大盛り』。", "田植えロボ、夢の中でも田植え。労務は確認中。"] },
  { at: 1e9, name: "地球のお弁当化", news: ["月のうさぎ、杵をしゃもじに持ち替える。", "宇宙飛行士「地球は青かった。今は海苔が見える」。", "おこめ大学、入試問題は『水はどこまで？』。", "重力より強いおばあちゃんの『食べなさい』を観測。"] },
  { at: 1e12, name: "時空が炊けてきた", news: ["明日のごはん、昨日のおかわりとして到着。", "巨大しゃもじ加速器、今日もごはんをよそう。", "未来人、歴史改変より炊飯器の予約を優先。", "地球外生命体との初会話、『海苔はパリパリ派？』。"] },
  { at: 1e16, name: "米の概念が拡張中", news: ["ブラックホールに茶碗を差し入れ。おかわりが返る。", "並行世界でも実家から米が届いた。着払いだった。", "哲学者『米とは何か』。おばあちゃん『冷めるよ』。", "ナレーターが『豊作だった』と言ったので豊作になった。"] },
  { at: 1e20, name: "宇宙の外に実家", news: ["宇宙の終わりで『まだ食べる？』と聞かれた。", "ビッグバンの音はピーピーピー。全宇宙、炊飯完了。", "すべての謎が解けた。おばあちゃんだけが『知ってた』。", "銀河を何周しても、おむすびは手のひらに収まる。"] },
];
const chapterFor = total => CHAPTERS.filter(c => total >= c.at).at(-1);

function newGame() {
  return { v: 2, rice: 0, totalRice: 0, clicks: 0, owned: {}, upgrades: {}, goldenClicks: 0,
    unlocked: {}, skinsOwned: { plain: true }, activeSkin: "plain", secret: false,
    newsClicks: 0, savedAt: 0, crafted: 0, sold: 0, profit: 0, farmers: 0, inventory: [] };
}
const skinCps = id => ({ genmai: 1.1, gold: 1.15, cosmos: 1.25 }[id] || 1);
const skinClick = id => ({ yukari: 1.15, gold: 1.15, panda: 1.1, neko: 1.2 }[id] || 1);
function buildingMultiplier(s, id) {
  return UPGRADES.filter(u => u.building === id && s.upgrades[u.id]).reduce((m, u) => m * u.mult, 1);
}
function production(s) {
  return BUILDINGS.reduce((sum, b) => sum + b.cps * (s.owned[b.id] || 0) * buildingMultiplier(s, b.id), 0) * skinCps(s.activeSkin);
}
function clickPower(s) {
  const multiplier = UPGRADES.filter(u => u.kind === "click" && s.upgrades[u.id]).reduce((p, u) => p * u.mult, 1);
  const share = UPGRADES.filter(u => u.kind === "finger" && s.upgrades[u.id]).reduce((p, u) => p + u.share, 0);
  return (multiplier + production(s) * share) * skinClick(s.activeSkin);
}
function upgradeAvailable(s, u) {
  if (s.upgrades[u.id]) return false;
  if (u.kind === "building") return (s.owned[u.building] || 0) >= u.need;
  if (u.kind === "finger") return s.clicks >= u.clickNeed;
  return s.totalRice >= u.cost * 0.4;
}
const PURCHASE_QUANTITIES = [1, 10, 100, 1000];
function buildingPrice(s, b, quantity = 1) {
  if (!PURCHASE_QUANTITIES.includes(quantity)) return Infinity;
  let cost = 0;
  for (let i = 0; i < quantity; i++) cost += Math.ceil(b.baseCost * 1.15 ** ((s.owned[b.id] || 0) + i) * (s.activeSkin === "yaki" ? 0.95 : 1));
  return cost;
}
function buyBuilding(s, id, quantity = 1) {
  const b = BUILDINGS.find(x => x.id === id);
  if (!b) return s;
  const cost = buildingPrice(s, b, quantity);
  if (!Number.isFinite(cost) || s.rice < cost) return s;
  return { ...s, rice: s.rice - cost, owned: { ...s.owned, [id]: (s.owned[id] || 0) + quantity } };
}
function buyUpgrade(s, id) {
  const u = UPGRADES.find(x => x.id === id);
  if (!u || !upgradeAvailable(s, u) || s.rice < u.cost) return s;
  return { ...s, rice: s.rice - u.cost, upgrades: { ...s.upgrades, [id]: true } };
}
function buySkin(s, id) {
  const skin = SKINS.find(x => x.id === id);
  if (!skin || (!s.skinsOwned[id] && s.rice < skin.cost)) return s;
  return { ...s, rice: s.rice - (s.skinsOwned[id] ? 0 : skin.cost), skinsOwned: { ...s.skinsOwned, [id]: true }, activeSkin: id };
}
function awardAchievements(s) {
  const earned = ACHIEVEMENTS.filter(a => !s.unlocked[a.id] && a.cond(s));
  return earned.length ? { ...s, unlocked: { ...s.unlocked, ...Object.fromEntries(earned.map(a => [a.id, true])) } } : s;
}

function advanceProduction(s, since, now, boost = null) {
  const seconds = Math.min(4 * 3600, Math.max(0, (now - since) / 1000));
  const boosted = boost?.kind === "production" ? Math.min(seconds, Math.max(0, (boost.until - since) / 1000)) : 0;
  const gain = production(s) * (seconds + boosted * 6);
  return { ...s, rice: s.rice + gain, totalRice: s.totalRice + gain, savedAt: now };
}

// Validate the complete payload before replacing any active progress. Missing v1
// fields get defaults; malformed numbers/IDs are rejected, never silently reset.
function normalizeSave(data) {
  if (!data || typeof data !== "object" || ![1, 2].includes(data.v)) throw Error("version");
  const s = newGame();
  for (const key of ["rice", "totalRice", "clicks", "goldenClicks", "newsClicks", "savedAt", "crafted", "sold", "profit", "farmers"]) {
    if (data[key] === undefined) continue;
    if (typeof data[key] !== "number" || !Number.isFinite(data[key]) || Math.abs(data[key]) > 1e100 || (key !== "profit" && data[key] < 0)) throw Error(key);
    if (["clicks", "goldenClicks", "newsClicks", "crafted", "sold", "farmers", "savedAt"].includes(key) && !Number.isSafeInteger(data[key])) throw Error(key);
    s[key] = data[key];
  }
  for (const [key, ids, counts] of [
    ["owned", BUILDINGS.map(b => b.id), true], ["upgrades", UPGRADES.map(u => u.id)],
    ["unlocked", ACHIEVEMENTS.map(a => a.id)], ["skinsOwned", SKINS.map(x => x.id)],
  ]) {
    if (data[key] === undefined) continue;
    if (!data[key] || typeof data[key] !== "object" || Array.isArray(data[key])) throw Error(key);
    for (const [id, value] of Object.entries(data[key])) {
      if (!ids.includes(id)) throw Error(key + ":" + id);
      if (counts ? (!Number.isSafeInteger(value) || value < 0 || value > 1e6) : typeof value !== "boolean") throw Error(key);
      s[key][id] = value;
    }
  }
  s.skinsOwned.plain = true;
  if (data.activeSkin !== undefined) {
    if (!SKINS.some(x => x.id === data.activeSkin) || !s.skinsOwned[data.activeSkin]) throw Error("skin");
    s.activeSkin = data.activeSkin;
  }
  if (data.secret !== undefined && typeof data.secret !== "boolean") throw Error("secret");
  s.secret = !!data.secret;
  let refund = 0;
  if (data.inventory !== undefined) {
    if (!Array.isArray(data.inventory) || data.inventory.length > 1000) throw Error("inventory");
    for (const item of data.inventory) {
      const f = FILLINGS.find(x => x.id === item?.fid), b = BRANDS.find(x => x.id === item?.bid);
      if (!f || !b || !Number.isSafeInteger(item.count) || item.count < 0) throw Error("inventory");
      // Refund at the maximum possible old selling price so no timing decision or
      // expensive premium-rice purchase is penalized when the workshop is retired.
      refund += Math.ceil((RICE_PER_ONIGIRI + f.valBase * 1.5 * 2.5) * b.mult) * item.count;
    }
  }
  // Contracted farmers no longer have a use: return their entire purchase cost.
  if (data.v === 1) {
    if (s.farmers > 400) throw Error("farmers");
    for (let i = 0; i < s.farmers; i++) refund += farmerCost(i);
  }
  s.rice += refund;
  s.totalRice = Math.max(s.rice, s.totalRice + refund);
  return { state: awardAchievements(s), refund };
}
const SAVE_PREFIX = "OMSB1|";
function encodeSave(s) {
  return SAVE_PREFIX + btoa(unescape(encodeURIComponent(JSON.stringify({ ...s, v: 2 }))));
}
function decodeSave(code) {
  if (typeof code !== "string" || code.length > 1000000 || !code.startsWith(SAVE_PREFIX)) throw Error("prefix");
  return normalizeSave(JSON.parse(decodeURIComponent(escape(atob(code.slice(SAVE_PREFIX.length))))));
}
function offlineProgress(s, now) {
  const seconds = s.savedAt ? Math.min(4 * 3600, Math.max(0, (now - s.savedAt) / 1000)) : 0;
  const gain = production(s) * seconds;
  return { state: { ...s, rice: s.rice + gain, totalRice: s.totalRice + gain, savedAt: now }, gain };
}

return { BUILDINGS, UPGRADES, SKINS, ACHIEVEMENTS, CHAPTERS, PURCHASE_QUANTITIES, chapterFor, newGame,
  production, clickPower, buildingMultiplier, skinCps, buildingPrice, upgradeAvailable,
  buyBuilding, buyUpgrade, buySkin, awardAchievements, advanceProduction, normalizeSave, encodeSave, decodeSave, offlineProgress };
})();
if (typeof module !== "undefined") module.exports = Game;

