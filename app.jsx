const { useState, useEffect, useRef, useCallback } = React;

const { BUILDINGS, UPGRADES, SKINS, ACHIEVEMENTS } = Game;

// ---------- 実績メダルSVG ----------
function AchIcon({ id, done }) {
  const ringA = done ? "#ffd97a" : "#4a5a74";
  const ringB = done ? "#e8a13d" : "#36465f";
  const fg = done ? "#5c4310" : "#7787a0";
  const glyph = (() => {
    switch (id) {
      case "first": // 米一粒
        return <ellipse cx="16" cy="16" rx="6" ry="3.4" fill={fg} transform="rotate(-25 16 16)" />;
      case "c100": // 米三粒
        return (<g fill={fg}>
          <ellipse cx="12" cy="13" rx="4.5" ry="2.5" transform="rotate(-30 12 13)" />
          <ellipse cx="20" cy="14" rx="4.5" ry="2.5" transform="rotate(25 20 14)" />
          <ellipse cx="16" cy="20" rx="4.5" ry="2.5" />
        </g>);
      case "c1000": // おむすび
        return <path d="M16 8 L24 21 Q24 23 21.5 23.5 Q16 25 10.5 23.5 Q8 23 8 21 Z" fill={fg} />;
      case "c10000": // おむすび+星
        return (<g>
          <path d="M16 9 L23 20 Q23 22 21 22.5 Q16 24 11 22.5 Q9 22 9 20 Z" fill={fg} />
          <path d="M23 8 l1 2 2 .3 -1.5 1.5 .4 2 -1.9 -1 -1.9 1 .4 -2 -1.5 -1.5 2 -.3 z" fill={done ? "#fff" : fg} />
        </g>);
      case "t1man": // 小判
        return (<g>
          <ellipse cx="16" cy="16" rx="8" ry="5.5" fill={fg} />
          <ellipse cx="16" cy="16" rx="4.5" ry="2.8" fill="none" stroke={done ? "#ffd97a" : "#36465f"} strokeWidth="1.4" />
        </g>);
      case "t100man": // 小判の山
        return (<g fill={fg}>
          <ellipse cx="12" cy="19" rx="6.5" ry="3.6" />
          <ellipse cx="20" cy="17" rx="6.5" ry="3.6" />
          <ellipse cx="16" cy="13" rx="6.5" ry="3.6" stroke={ringB} strokeWidth="0.8" />
        </g>);
      case "t1oku": // 王冠
        return <path d="M9 21 L8 11 L12.5 15 L16 9 L19.5 15 L24 11 L23 21 Z" fill={fg} />;
      case "t1cho": // 王冠+宝石
        return (<g>
          <path d="M9 21 L8 11 L12.5 15 L16 9 L19.5 15 L24 11 L23 21 Z" fill={fg} />
          <circle cx="16" cy="17" r="2.2" fill={done ? "#e94f37" : "#5a6a84"} />
        </g>);
      case "baachan10": // おばあちゃんの眼鏡
        return (<g stroke={fg} strokeWidth="2" fill="none">
          <circle cx="11" cy="16" r="4" />
          <circle cx="21" cy="16" r="4" />
          <path d="M15 16 L17 16" />
        </g>);
      case "tanbo10": // 稲穂
        return (<g stroke={fg} strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M16 24 L16 10" />
          <path d="M16 13 Q11 11 10 7" />
          <path d="M16 16 Q21 14 22 10" />
          <path d="M16 19 Q12 18 11 14" />
        </g>);
      case "conbini10": // 店
        return (<g fill={fg}>
          <rect x="9" y="14" width="14" height="9" rx="1" />
          <path d="M8 14 L24 14 L22 9 L10 9 Z" fill={done ? "#e94f37" : "#5a6a84"} />
          <rect x="14" y="17" width="4" height="6" fill={done ? "#fff" : "#36465f"} />
        </g>);
      case "moon1": // 三日月
        return <path d="M20 8 A9 9 0 1 0 20 24 A7 7 0 1 1 20 8 Z" fill={fg} />;
      case "bodakko": // 鮭の切り身
        return (<g>
          <path d="M9 16 Q16 9 24 13 Q22 20 13 21 Q10 20 9 16 Z" fill={done ? "#e8762d" : fg} />
          <path d="M12 18 Q16 15 21 15" stroke={done ? "#fff" : "#36465f"} strokeWidth="1.4" fill="none" />
        </g>);
      case "allup": // 放射の星
        return (<g fill={fg}>
          <path d="M16 7 L18 13 L24 13 L19 17 L21 24 L16 19.5 L11 24 L13 17 L8 13 L14 13 Z" />
        </g>);
      case "gold1": // 金おむすび
        return <path d="M16 8 L24 21 Q24 23 21.5 23.5 Q16 25 10.5 23.5 Q8 23 8 21 Z" fill={done ? "#ffce3d" : fg} stroke={done ? "#b8860b" : "none"} strokeWidth="1" />;
      case "gold10": // 金おむすび+キラ
        return (<g>
          <path d="M16 10 L23 21 Q23 22.5 21 23 Q16 24.5 11 23 Q9 22.5 9 21 Z" fill={done ? "#ffce3d" : fg} />
          <path d="M7 9 l.8 1.8 1.8 .8 -1.8 .8 -.8 1.8 -.8 -1.8 -1.8 -.8 1.8 -.8 z" fill={done ? "#fff" : fg} />
          <path d="M24 7 l.7 1.5 1.5 .7 -1.5 .7 -.7 1.5 -.7 -1.5 -1.5 -.7 1.5 -.7 z" fill={done ? "#fff" : fg} />
        </g>);
      case "craft1": // 握る手(三角を包む)
        return (<g>
          <path d="M16 10 L22 20 Q22 21.5 20 22 Q16 23 12 22 Q10 21.5 10 20 Z" fill={fg} />
          <path d="M7 14 Q10 11 13 13 M25 14 Q22 11 19 13" stroke={fg} strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>);
      case "sell100": // のれん
        return (<g fill={fg}>
          <rect x="8" y="9" width="16" height="3" rx="1" />
          <rect x="9" y="12" width="4" height="10" />
          <rect x="14" y="12" width="4" height="10" />
          <rect x="19" y="12" width="4" height="10" />
        </g>);
      case "profit": // 上昇チャート
        return (<g stroke={fg} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 22 L13 17 L17 19 L24 11" />
          <path d="M19 11 L24 11 L24 16" />
        </g>);
      case "skin1": // パレット
        return (<g>
          <path d="M16 8 A8 8 0 1 0 16 24 Q19 24 18 21 Q17 18 20 18 L22 18 A8 8 0 0 0 16 8 Z" fill={fg} />
          <circle cx="12" cy="13" r="1.6" fill={done ? "#9b59b6" : "#36465f"} />
          <circle cx="17" cy="11" r="1.6" fill={done ? "#e94f37" : "#36465f"} />
          <circle cx="11" cy="18" r="1.6" fill={done ? "#7ec97e" : "#36465f"} />
        </g>);
      case "farmer5": // 麦わら帽子
        return (<g fill={fg}>
          <ellipse cx="16" cy="19" rx="10" ry="3.4" />
          <path d="M10 19 Q10 11 16 11 Q22 11 22 19 Z" />
          <rect x="10" y="16" width="12" height="2.4" fill={done ? "#e94f37" : "#5a6a84"} />
        </g>);
      case "hidden": // ?マーク
        return (<text x="16" y="22" textAnchor="middle" fontSize="16" fontWeight="bold" fill={fg} fontFamily="sans-serif">?</text>);
      default:
        return <circle cx="16" cy="16" r="6" fill={fg} />;
    }
  })();
  return (
    <svg width="34" height="34" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="15" fill={ringB} />
      <circle cx="16" cy="16" r="13" fill={done ? "#fdf3d7" : "#2a374c"} stroke={ringA} strokeWidth="2" />
      {glyph}
    </svg>
  );
}

// 日本式の数値フォーマット(万・億・兆・京)
function fmt(n) {
  const neg = n < 0;
  n = Math.abs(n);
  let out;
  if (n < 1e4) out = Math.floor(n).toLocaleString("ja-JP");
  else {
    const units = [[1e68, "無量大数"], [1e64, "不可思議"], [1e60, "那由他"], [1e56, "阿僧祇"], [1e52, "恒河沙"], [1e48, "極"], [1e44, "載"], [1e40, "正"], [1e36, "澗"], [1e32, "溝"], [1e28, "穣"], [1e24, "秭"], [1e20, "垓"], [1e16, "京"], [1e12, "兆"], [1e8, "億"], [1e4, "万"]];
    if (n >= 1e72) return (neg ? "−" : "") + n.toExponential(2);
    out = Math.floor(n).toLocaleString("ja-JP");
    for (const [v, u] of units) {
      if (n >= v) {
        const x = n / v;
        out = (x >= 100 ? Math.floor(x) : x.toFixed(x >= 10 ? 1 : 2)) + u;
        break;
      }
    }
  }
  return (neg ? "-" : "") + out;
}

// 生産量:小数点第1位まで
function fmtCps(n) {
  if (n >= 1e4) return fmt(n);
  return n.toLocaleString("ja-JP", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

// ---------- 粒感のあるおむすびSVG ----------
function OnigiriSVG({ skin }) {
  const svgId = React.useId().replace(/:/g, "");
  const rim = [
    [100, 21, -5], [82, 28, -40], [118, 28, 40], [68, 42, -50], [132, 42, 50],
    [56, 62, -55], [144, 62, 55], [45, 84, -60], [155, 84, 60],
    [36, 106, -65], [164, 106, 65], [31, 128, -75], [169, 128, 75],
    [38, 148, -85], [162, 148, 85], [56, 160, 80], [144, 160, -80],
    [78, 167, 88], [122, 167, -88], [100, 169, 90],
  ];
  return (
    <svg width="240" height="240" viewBox="0 0 200 200">
      <defs>
        <radialGradient id={`riceShine-${svgId}`} cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor={skin.riceA} />
          <stop offset="70%" stopColor={skin.riceA} />
          <stop offset="100%" stopColor={skin.riceB} />
        </radialGradient>
        <filter id={`rough-${svgId}`} x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="6" />
        </filter>
      </defs>
      <g filter={`url(#rough-${svgId})`}>
        <path
          d="M100 22 C 116 22 126 32 136 48 L 166 100 C 176 117 178 134 166 146
             C 150 162 124 170 100 170 C 76 170 50 162 34 146
             C 22 134 24 117 34 100 L 64 48 C 74 32 84 22 100 22 Z"
          fill={`url(#riceShine-${svgId})`}
          stroke={skin.edge}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {rim.map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx="6.5" ry="3.4" fill={skin.riceA}
            stroke={skin.edge} strokeWidth="1.2" transform={`rotate(${r} ${x} ${y})`} />
        ))}
      </g>
      <ellipse cx="72" cy="52" rx="16" ry="9" fill="#ffffff" opacity="0.6" transform="rotate(-32 72 52)" />
      {[[130, 62, 18], [52, 100, 25], [150, 108, -15], [110, 55, -8], [70, 78, 30], [140, 86, -25], [60, 124, 12], [92, 64, -18]].map(
        ([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx="5.5" ry="2.8" fill={skin.speck} opacity="0.7" transform={`rotate(${r} ${x} ${y})`} />
        )
      )}
      {skin.extra === "yukari" &&
        [[88, 50, 0], [120, 70, 40], [65, 90, -30], [140, 60, 70], [105, 110, 20], [75, 65, 55], [135, 115, -45]].map(([x, y, r], i) => (
          <rect key={i} x={x} y={y} width="5" height="2.2" rx="1" fill="#7d3c98" transform={`rotate(${r} ${x} ${y})`} />
        ))}
      {skin.extra === "sekihan" &&
        [[85, 55], [120, 65], [65, 95], [140, 95], [100, 75], [115, 105]].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx="4.5" ry="3.2" fill="#8e3b46" />
        ))}
      {skin.extra === "yaki" && (
        <g stroke="#8a4a12" strokeWidth="5" strokeLinecap="round" opacity="0.65">
          <path d="M62 60 Q100 50 138 60" fill="none" />
          <path d="M52 92 Q100 82 148 92" fill="none" />
          <path d="M50 124 Q100 114 150 124" fill="none" />
        </g>
      )}
      {skin.extra === "gold" &&
        [[70, 50], [130, 55], [55, 100], [150, 95], [100, 40]].map(([x, y], i) => (
          <text key={i} x={x} y={y} fontSize="13" opacity="0.9">✦</text>
        ))}
      {skin.extra === "cosmos" && <g fill="#fff4c4">
        {[[70,55],[120,45],[145,78],[55,114],[111,66]].map(([x,y], i) => <path key={i} d={`M${x} ${y-5} l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5z`} />)}
      </g>}
      {skin.extra === "panda" && <g fill="#29333a">
        <circle cx="65" cy="42" r="14" /><circle cx="135" cy="42" r="14" />
        <ellipse cx="80" cy="90" rx="13" ry="15" transform="rotate(25 80 90)" />
        <ellipse cx="120" cy="90" rx="13" ry="15" transform="rotate(-25 120 90)" />
      </g>}
      {skin.extra === "neko" && <g stroke="#c99054" strokeWidth="3" fill="#ffe6ba">
        <path d="M52 67 L48 28 L84 43 Z M116 43 L152 28 L148 67 Z" />
        <path d="M47 96 L65 100 M48 108 L65 106 M135 100 L153 96 M135 106 L152 108" stroke="#805c3c" />
      </g>}
      {skin.nori && (
        <>
          <path
            d="M66 122 L 134 122 C 136 122 138 124 138 126 L 138 158
               C 126 165 112 168 100 168 C 88 168 74 165 62 158
               L 62 126 C 62 124 64 122 66 122 Z"
            fill={skin.nori} stroke="#22352a" strokeWidth="2"
          />
          <ellipse cx="78" cy="136" rx="9" ry="4" fill="#ffffff" opacity="0.12" transform="rotate(-10 78 136)" />
        </>
      )}
      <circle cx="80" cy="90" r="6.5" fill="#3b3530" />
      <circle cx="120" cy="90" r="6.5" fill="#3b3530" />
      <circle cx="82.5" cy="87.5" r="2.4" fill="#ffffff" />
      <circle cx="122.5" cy="87.5" r="2.4" fill="#ffffff" />
      <path d="M92 100 Q100 109 108 100" stroke="#3b3530" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <ellipse cx="64" cy="101" rx="8" ry="5" fill="#f8b9aa" opacity="0.75" />
      <ellipse cx="136" cy="101" rx="8" ry="5" fill="#f8b9aa" opacity="0.75" />
    </svg>
  );
}

const STORAGE_KEY = "omusubi-clicker-save-v2";
function loadInitialGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { state: Game.newGame(), notice: "", error: "" };
    const loaded = Game.decodeSave(raw);
    const offline = Game.offlineProgress(loaded.state, Date.now());
    return { state: offline.state, error: "", notice: offline.gain >= 1 ? `おかえり！ 留守中に ${fmt(offline.gain)} 粒できました。` : "" };
  } catch {
    return { state: Game.newGame(), notice: "", error: "端末のセーブを読み込めませんでした。元データを保護するため、自動保存を停止しています。セーブコードから復元できます。" };
  }
}

function OnigiriClicker() {
  const [initial] = useState(loadInitialGame);
  const [game, renderGame] = useState(initial.state);
  const { rice, totalRice, clicks, owned, upgrades, unlocked, skinsOwned, activeSkin } = game;
  const [tab, setTab] = useState("shop");
  const [shopTab, setShopTab] = useState("buildings");
  const [collectionTab, setCollectionTab] = useState("achievements");
  const [achFilter, setAchFilter] = useState("all");
  const [quantity, setQuantity] = useState(1);
  const [particles, setParticles] = useState([]);
  const [squish, setSquish] = useState(false);
  const [golden, setGolden] = useState(null);
  const [boost, setBoost] = useState(null);
  const [clock, setClock] = useState(Date.now());
  const [newsIndex, setNewsIndex] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [notice, setNotice] = useState(initial.notice);
  const [saveText, setSaveText] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [storageError, setStorageError] = useState(initial.error);
  const [lastSaved, setLastSaved] = useState(0);
  const gameRef = useRef(game);
  const boostRef = useRef(boost);
  const blocked = useRef(!!initial.error);
  const pid = useRef(0);
  const titleClicks = useRef(0);
  const lastTick = useRef(Date.now());
  const goldTimer = useRef(null);
  const squishTimer = useRef(null);
  const seenAchievements = useRef({ ...initial.state.unlocked });
  boostRef.current = boost;

  // Settle elapsed production before any action or save. The ref is committed
  // immediately so pagehide also includes actions React has not rendered yet.
  const setGame = useCallback(update => {
    const now = Date.now();
    const current = Game.advanceProduction(gameRef.current, lastTick.current, now, boostRef.current);
    lastTick.current = now;
    const next = Game.awardAchievements(typeof update === "function" ? update(current) : update);
    gameRef.current = next;
    renderGame(next);
    return next;
  }, []);

  const skin = SKINS.find(s => s.id === activeSkin) || SKINS[0];
  const baseCps = Game.production(game);
  const remaining = boost ? Math.max(0, Math.ceil((boost.until - clock) / 1000)) : 0;
  const cps = baseCps * (remaining > 0 && boost.kind === "production" ? 7 : 1);
  const clickPower = Game.clickPower(game) * (remaining > 0 ? (boost.kind === "click" ? 77 : 7) : 1);
  const chapter = Game.chapterFor(totalRice);
  const availableUpgrades = UPGRADES.filter(u => Game.upgradeAvailable(game, u)).sort((a, b) => a.cost - b.cost);
  const affordableUpgrades = availableUpgrades.filter(u => rice >= u.cost).length;
  const collectedUpgrades = UPGRADES.filter(u => upgrades[u.id]);
  const achievements = ACHIEVEMENTS.filter(a => !a.legacy || unlocked[a.id]);
  const achCount = achievements.filter(a => unlocked[a.id]).length;
  const shownAchievements = achievements.filter(a => achFilter === "all" || (achFilter === "done" ? unlocked[a.id] : !unlocked[a.id]));
  const visibleBuildings = BUILDINGS.filter((b, i) => i === 0 || totalRice >= b.baseCost * 0.25 || owned[b.id] > 0);
  const nextBuilding = BUILDINGS.find(b => !visibleBuildings.includes(b));

  const pushToast = useCallback(msg => {
    const id = pid.current++;
    setToasts(t => [...t.slice(-2), { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setGame(s => s);
      setClock(Date.now());
    }, 100);
    return () => clearInterval(t);
  }, [setGame]);

  useEffect(() => {
    const fresh = ACHIEVEMENTS.filter(a => unlocked[a.id] && !seenAchievements.current[a.id]);
    seenAchievements.current = { ...unlocked };
    if (fresh.length) pushToast(`実績「${fresh[0].name}」${fresh.length > 1 ? ` ほか${fresh.length - 1}件` : ""}`);
  }, [unlocked, pushToast]);

  useEffect(() => {
    const save = () => {
      if (blocked.current) return;
      try {
        const snapshot = setGame(s => s);
        localStorage.setItem(STORAGE_KEY, Game.encodeSave(snapshot));
        setLastSaved(snapshot.savedAt);
        setStorageError("");
      } catch {
        setStorageError("端末に保存できません。セーブコードを書き出して保管してください。");
      }
    };
    const onVisibility = () => { if (document.visibilityState === "hidden") save(); };
    const onStorage = e => {
      if (e.key === STORAGE_KEY && e.newValue) {
        blocked.current = true;
        setStorageError("別のタブで進行が保存されました。このタブの自動保存は停止中です。続けるタブを1つにして、再読み込みしてください。");
      }
    };
    const t = setInterval(save, 5000);
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(t);
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
    };
  }, [setGame]);

  useEffect(() => {
    let timer;
    const schedule = () => {
      const speedup = gameRef.current.activeSkin === "sekihan" ? 0.75 : 1;
      timer = setTimeout(() => {
        setGolden({ x: 8 + Math.random() * 65, y: 8 + Math.random() * 48 });
        goldTimer.current = setTimeout(() => setGolden(null), 10000);
        schedule();
      }, (25000 + Math.random() * 20000) * speedup);
    };
    schedule();
    return () => { clearTimeout(timer); clearTimeout(goldTimer.current); };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNewsIndex(n => n + 1), 14000);
    return () => clearInterval(t);
  }, []);

  const handleClick = e => {
    const effect = boostRef.current;
    const multiplier = effect && effect.until > Date.now() ? (effect.kind === "click" ? 77 : 7) : 1;
    let gain;
    setGame(s => {
      gain = Game.clickPower(s) * multiplier;
      return { ...s, rice: s.rice + gain, totalRice: s.totalRice + gain, clicks: s.clicks + 1 };
    });
    setSquish(true);
    clearTimeout(squishTimer.current);
    squishTimer.current = setTimeout(() => setSquish(false), 100);
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    const x = e.detail === 0 ? rect.width / 2 : e.clientX - rect.left;
    const y = e.detail === 0 ? rect.height / 2 : e.clientY - rect.top;
    const id = pid.current++;
    setParticles(p => [...p.slice(-14), { id, x, y, text: `+${fmtCps(gain).replace(/\.0$/, "")}` }]);
    setTimeout(() => setParticles(p => p.filter(q => q.id !== id)), 800);
  };
  const clickGolden = () => {
    if (!golden) return;
    setGolden(null);
    clearTimeout(goldTimer.current);
    const roll = Math.random();
    setGame(s => ({ ...s, goldenClicks: s.goldenClicks + 1 }));
    if (roll < 0.45) {
      const bonus = Math.max(baseCps * 120, Game.clickPower(game) * 100, 100);
      setGame(s => ({ ...s, rice: s.rice + bonus, totalRice: s.totalRice + bonus }));
      pushToast(`豊作！ ${fmt(bonus)} 粒、どこからともなく届いた。`);
    } else {
      const kind = roll < 0.8 ? "production" : "click";
      boostRef.current = { kind, until: Date.now() + (kind === "production" ? 30000 : 12000) };
      setBoost(boostRef.current);
      pushToast(kind === "production" ? "炊飯祭り！ 30秒間、生産とクリックが7倍！" : "神の手！ 12秒間、クリックが77倍！");
    }
  };
  const buy = b => setGame(s => Game.buyBuilding(s, b.id, quantity));
  const buyUpgrade = u => {
    if (rice < u.cost || !Game.upgradeAvailable(game, u)) return;
    setGame(s => Game.buyUpgrade(s, u.id));
    pushToast(`${u.name}：${u.desc}`);
  };
  const buySkin = s => {
    setGame(g => Game.buySkin(g, s.id));
    pushToast(`${s.name}に着替えました`);
  };
  const pokeTitle = () => {
    titleClicks.current++;
    if (titleClicks.current === 7 && !game.secret) {
      setGame(s => ({ ...s, secret: true }));
      pushToast("そこも握るとは思わなかった。");
    }
  };
  const exportSave = () => {
    setSaveText(Game.encodeSave(setGame(s => s)));
    setSaveMessage("書き出しました。コードをコピーして保管できます。");
  };
  const importSave = () => {
    try {
      const loaded = Game.decodeSave(saveText.trim());
      // Imports restore exactly the encoded progress. Offline gains apply only on
      // local resume, so re-importing a code cannot mint repeated offline income.
      setGame(loaded.state);
      lastTick.current = Date.now();
      seenAchievements.current = { ...loaded.state.unlocked };
      boostRef.current = null;
      setBoost(null); setGolden(null); clearTimeout(goldTimer.current);
      setParticles([]); setNotice("");
      blocked.current = false;
      setStorageError("");
      try {
        localStorage.setItem(STORAGE_KEY, Game.encodeSave({ ...loaded.state, savedAt: Date.now() }));
        setLastSaved(Date.now());
      } catch { setStorageError("端末に保存できません。元のセーブコードを保管してください。"); }
      setSaveMessage(loaded.refund > 0 ? `復元しました。旧工房の在庫・契約農家を ${fmt(loaded.refund)} 粒に戻しました。` : "セーブデータを復元しました。おかえり！");
    } catch {
      setSaveMessage("読み込めませんでした。コードを確認してください。今の進行はそのままです。");
    }
  };

  return (
    <div className="root" style={{ "--rice-a": skin.riceA, "--rice-b": skin.riceB }}>
      <header className="header">
        <h1 className="title"><button className="title-emoji" aria-label="ひみつのおむすび" onClick={pokeTitle}>🍙</button> おむすびくりっかー</h1>
        <div className="chapter">{chapter.name}</div>
      </header>
      <main className="main">
        <section className="play-side" aria-label="おむすびを握る場所">
          <div className="stats">
            <div className="rice-count">{fmt(rice)} <span>米粒</span></div>
            <div className="cps">毎秒 <b>{fmtCps(cps)}</b> 粒 <span>／</span> 1クリック <b>{fmtCps(clickPower).replace(/\.0$/, "")}</b> 粒</div>
          </div>
          <div className={`left ${remaining > 0 ? "boosting" : ""}`}>
            <div className="rice-orbit" aria-hidden="true" />
            <button className={`onigiri-btn ${squish ? "squish" : ""}`} onClick={handleClick} aria-label="おむすびを握る"><OnigiriSVG skin={skin} /></button>
            {particles.map(p => <span key={p.id} className="particle" style={{ left: p.x, top: p.y }}>{p.text}</span>)}
            {golden && <button className="golden" style={{ left: `${golden.x}%`, top: `${golden.y}%` }} onClick={clickGolden} aria-label="金のおむすびをつかまえる">🍙<span>金！</span></button>}
          </div>
          <div className="play-caption">
            {remaining > 0 ? <span className="boost-label">{boost.kind === "production" ? "炊飯祭り ×7" : "神の手 クリック×77"} · あと{remaining}秒</span> : clicks < 10 ? "おむすびをタップして、最初の15粒を。" : activeSkin !== "plain" ? `${skin.name} · ${skin.ability}` : "握るほど、世界がちょっとおかしくなる。"}
          </div>
          <button className="news" aria-label="米ニュースをめくる" onClick={() => { setNewsIndex(n => n + 1); setGame(s => ({ ...s, newsClicks: s.newsClicks + 1 })); }}>
            <span className="news-label">米ニュース <span aria-hidden="true">↻</span></span>
            <span className="news-text">{chapter.news[newsIndex % chapter.news.length]}</span>
          </button>
          {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="おかえりのお知らせを閉じる">×</button></div>}
          {storageError && <div className="storage-warning" role="alert">{storageError}</div>}
        </section>
        <section className="right" aria-label="おむすび帝国">
          <nav className="tabbar" aria-label="ゲームメニュー">
            {[['shop','ショップ'],['collection','図鑑'],['skin','きせかえ'],['save','セーブ']].map(([id,label]) =>
              <button key={id} className={`tabbtn ${tab === id ? "active" : ""}`} aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>{label}</button>)}
          </nav>
          <div className="panel-content" key={`${tab}-${shopTab}-${collectionTab}`}>
          {tab === "shop" && <>
            <div className="subnav" aria-label="ショップの種類">
              <button className={shopTab === "buildings" ? "selected" : ""} aria-pressed={shopTab === "buildings"} onClick={() => setShopTab("buildings")}>施設</button>
              <button className={shopTab === "upgrades" ? "selected" : ""} aria-pressed={shopTab === "upgrades"} onClick={() => setShopTab("upgrades")}>強化 {affordableUpgrades > 0 && <span className="count-badge">{affordableUpgrades}</span>}</button>
            </div>
            {shopTab === "buildings" ? <>
              <div className="shop-toolbar"><span>持っているだけで米粒を生産</span><div className="quantity" aria-label="購入数">{Game.PURCHASE_QUANTITIES.map(n => <button key={n} aria-label={`${n}個ずつ購入`} aria-pressed={quantity === n} onClick={() => setQuantity(n)}>{n}</button>)}</div></div>
              {visibleBuildings.map(b => {
                const n = owned[b.id] || 0, cost = Game.buildingPrice(game, b, quantity);
                const rate = b.cps * Game.buildingMultiplier(game, b.id) * Game.skinCps(activeSkin);
                return <button key={b.id} className={`shop-item ${rice >= cost ? "affordable" : ""}`} disabled={rice < cost} onClick={() => buy(b)}>
                  <span className="shop-icon" aria-hidden="true">{b.icon}</span>
                  <span className="shop-body"><span className="shop-name">{b.name}</span><span className="shop-desc">{b.desc}</span><span className="production">1{b.unit}で毎秒 {fmtCps(rate)} 粒</span></span>
                  <span className="shop-meta"><span className="shop-cost">{fmt(cost)} 粒</span><span className="shop-owned">所持 {n}{b.unit}</span>{quantity > 1 && <span className="shop-desc">{quantity}{b.unit}購入</span>}</span>
                </button>;
              })}
              {nextBuilding && <div className="next-building"><span>？ 次の施設</span><span>累計 {fmt(nextBuilding.baseCost * 0.25)} 粒で発見</span></div>}
            </> : <>
              <p className="panel-help">具材でクリック強化。施設を増やすと、その施設の強化も解放。</p>
              {availableUpgrades.length === 0 && <div className="empty-state">まずは米粒を集めよう。累計20粒で最初の強化が見つかるよ。</div>}
              {availableUpgrades.map(u => <button key={u.id} className={`shop-item upgrade-item ${rice >= u.cost ? "affordable" : ""}`} disabled={rice < u.cost} onClick={() => buyUpgrade(u)}>
                <span className="shop-icon" aria-hidden="true">{u.icon}</span><span className="shop-body"><span className="shop-name">{u.name}</span><span className="production">{u.desc}</span><span className="shop-desc">{u.flavor}</span></span><span className="shop-cost">{fmt(u.cost)} 粒</span>
              </button>)}
              {collectedUpgrades.length > 0 && <details className="owned-upgrades"><summary>購入済みの強化 {collectedUpgrades.length} / {UPGRADES.length}</summary>{collectedUpgrades.map(u => <div key={u.id}><b>{u.name}</b><span>{u.desc}</span></div>)}</details>}
            </>}
          </>}
          {tab === "collection" && <>
            <div className="subnav" aria-label="図鑑の種類"><button aria-pressed={collectionTab === "achievements"} className={collectionTab === "achievements" ? "selected" : ""} onClick={() => setCollectionTab("achievements")}>実績 {achCount}/{achievements.length}</button><button aria-pressed={collectionTab === "buildings"} className={collectionTab === "buildings" ? "selected" : ""} onClick={() => setCollectionTab("buildings")}>施設のようす</button></div>
            {collectionTab === "achievements" ? <>
              <div className="ach-progress"><span style={{width:`${achCount / achievements.length * 100}%`}} /></div>
              <div className="filters" aria-label="実績の絞り込み">{[['all','すべて'],['todo','未達成'],['done','達成済み']].map(([id,label]) => <button key={id} aria-pressed={achFilter === id} onClick={() => setAchFilter(id)}>{label}</button>)}</div>
              {shownAchievements.length === 0 && <p className="empty-state">これから最初のひとつを。</p>}
              {shownAchievements.map(a => <div key={a.id} className={`ach-item ${unlocked[a.id] ? "done" : "locked"}`}><AchIcon id={a.id} done={!!unlocked[a.id]} /><div><div className="ach-name">{a.secret && !unlocked[a.id] ? "ひみつの実績" : a.name}</div><div className="ach-desc">{a.secret && !unlocked[a.id] ? "いつもと違うところに、何かある。" : a.desc}{a.legacy ? " · 旧工房の記念" : ""}</div></div>{unlocked[a.id] && <span className="ach-check" aria-label="達成">✓</span>}</div>)}
            </> : <>
              {BUILDINGS.every(b => !owned[b.id]) && <p className="empty-state">ショップで最初のおばあちゃんを迎えよう。</p>}
              {BUILDINGS.filter(b => owned[b.id]).map(b => <div key={b.id} className="building-row"><div className="building-head"><b>{b.name}</b><span>×{owned[b.id]}</span></div><p className="shop-desc">{b.desc}</p><div className="building-icons" aria-hidden="true">{b.icon.repeat(Math.min(owned[b.id], 16))}{owned[b.id] > 16 && ` +${owned[b.id]-16}`}</div><div className="production">合計 毎秒 {fmtCps(b.cps * owned[b.id] * Game.buildingMultiplier(game,b.id) * Game.skinCps(activeSkin))} 粒</div></div>)}
            </>}
          </>}
          {tab === "skin" && <>
            <p className="panel-help">着替えると能力も変わる。購入済みなら何度でも。</p>
            <div className="skin-grid">{SKINS.map(s => <button key={s.id} className={`skin-card ${activeSkin === s.id ? "active" : ""}`} aria-pressed={activeSkin === s.id} disabled={!skinsOwned[s.id] && rice < s.cost} onClick={() => buySkin(s)}>
              <div className="skin-preview" aria-hidden="true"><OnigiriSVG skin={s} /></div><div className="skin-name">{s.name}</div><div className="skin-ab">{s.ability}</div><div className="skin-price">{activeSkin === s.id ? "着用中" : skinsOwned[s.id] ? "着替える" : `${fmt(s.cost)} 粒`}</div>
            </button>)}</div>
          </>}
          {tab === "save" && <>
            <div className="save-status"><b>{storageError ? "自動保存を確認してください" : "この端末に自動保存"}</b><span>{lastSaved ? `最終保存 ${new Date(lastSaved).toLocaleTimeString('ja-JP')}` : "5秒ごと・画面を閉じるときに保存"}</span></div>
            <p className="panel-help">閉じている間も最大4時間、生産が進みます。別の端末へ移るときはコードを書き出してください。</p>
            <label htmlFor="save-code" className="section-label">セーブコード</label>
            <textarea id="save-code" className="save-area" value={saveText} onChange={e => setSaveText(e.target.value)} placeholder="書き出すか、保存してあるコードを貼り付ける" spellCheck="false" />
            <div className="craft-row"><button className="craft-btn" onClick={exportSave}>書き出す</button><button className="craft-btn" disabled={!saveText.trim()} onClick={importSave}>読み込む</button></div>
            <p className="save-message" role="status">{saveMessage}</p>
            <details className="save-help"><summary>遊び方・旧セーブについて</summary><p>おむすびを握って米粒を集め、施設を買うと自動生産。強化でさらに増えます。金のおむすびを見つけたらタップ！</p><p>旧版のコードも読み込めます。旧工房の在庫は最高売値で米粒に、契約農家は購入費用に戻します。取得した実績も残ります。</p><p>読み込みは現在の進行を置き換えます。先に「書き出す」で今のコードを保管できます。自動保存はこのブラウザ・このサイト専用です。</p></details>
          </>}
          </div>
        </section>
      </main>
      <footer className="footer-stats">累計 {fmt(totalRice)} 粒 <span>·</span> {clicks.toLocaleString('ja-JP')} 回握った <span>·</span> 実績 {achCount}/{achievements.length}</footer>
      <div className="toast-area" role="status" aria-live="polite">{toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<OnigiriClicker />);

