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
const IMPORT_BACKUP_KEY = `${STORAGE_KEY}-before-import`;
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
  const [boosts, setBoosts] = useState({});
  const [clock, setClock] = useState(Date.now());
  const [newsIndex, setNewsIndex] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [notice, setNotice] = useState(initial.notice);
  const [saveText, setSaveText] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [showSaveCode, setShowSaveCode] = useState(false);
  const [readingFile, setReadingFile] = useState(false);
  const [importBackup, setImportBackup] = useState(() => {
    try { return localStorage.getItem(IMPORT_BACKUP_KEY) || ""; } catch { return ""; }
  });
  const [storageError, setStorageError] = useState(initial.error);
  const [lastSaved, setLastSaved] = useState(0);
  const gameRef = useRef(game);
  const boostRef = useRef(boosts);
  const frenzyRun = useRef(null);
  const saveCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const readingFileRef = useRef(false);
  const blocked = useRef(!!initial.error);
  const pid = useRef(0);
  const titleClicks = useRef(0);
  const lastTick = useRef(Date.now());
  const goldTimer = useRef(null);
  const goldenAvailable = useRef(false);
  const scheduleGolden = useRef(null);
  const squishTimer = useRef(null);
  const seenAchievements = useRef({ ...initial.state.unlocked });

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
  const activeBoosts = Object.entries(Game.GOLDEN_EFFECTS).filter(([kind]) => boosts[kind] > clock);
  const productionBoost = Game.boostMultiplier(boosts, "production", clock);
  const cps = baseCps * productionBoost;
  const clickPower = Game.activeClickPower(game, boosts, clock);
  const chapter = Game.chapterFor(totalRice);
  const availableUpgrades = UPGRADES.filter(u => Game.upgradeAvailable(game, u)).sort((a, b) => a.cost - b.cost);
  const affordableUpgrades = availableUpgrades.filter(u => rice >= u.cost).length;
  const collectedUpgrades = UPGRADES.filter(u => upgrades[u.id]);
  const achievements = ACHIEVEMENTS.filter(a => !a.legacy || unlocked[a.id]);
  const achCount = achievements.filter(a => unlocked[a.id]).length;
  const shownAchievements = achievements.filter(a => achFilter === "all" || (achFilter === "done" ? unlocked[a.id] : !unlocked[a.id]));
  const visibleBuildings = BUILDINGS.filter((b, i) => i === 0 || totalRice >= b.baseCost * 0.25 || owned[b.id] > 0);
  const nextBuilding = BUILDINGS.find(b => !visibleBuildings.includes(b));
  const firstUnowned = visibleBuildings.find(b => !owned[b.id]);
  const goalCost = firstUnowned ? Game.buildingPrice(game, firstUnowned, quantity) : 0;
  const featuredUpgrade = availableUpgrades[0];
  const nextFinger = UPGRADES.find(u => u.kind === "finger" && clicks < u.clickNeed && !upgrades[u.id]);
  const nextGoldenUpgrade = UPGRADES.find(u => u.kind === "golden" && game.goldenClicks < u.goldenNeed && !upgrades[u.id]);

  const pushToast = useCallback(msg => {
    const id = pid.current++;
    setToasts(t => [...t.slice(-2), { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setGame(s => s);
      setClock(Date.now());
      if (frenzyRun.current && Date.now() >= frenzyRun.current.until) {
        const result = frenzyRun.current;
        frenzyRun.current = null;
        if (result.clicks) pushToast(`神の手で ${fmt(result.earned)} 粒！ ${result.clicks}回握った`);
      }
    }, 100);
    return () => clearInterval(t);
  }, [setGame, pushToast]);

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
      clearTimeout(timer);
      const settings = Game.goldenSettings(gameRef.current);
      timer = setTimeout(() => {
        goldenAvailable.current = true;
        setGolden({ x: 8 + Math.random() * 65, y: 8 + Math.random() * 48 });
        goldTimer.current = setTimeout(() => {
          goldenAvailable.current = false;
          setGolden(null);
          schedule();
        }, Game.goldenSettings(gameRef.current).lifetime * 1000);
      }, (25000 + Math.random() * 20000) * settings.wait);
    };
    scheduleGolden.current = schedule;
    schedule();
    return () => { clearTimeout(timer); clearTimeout(goldTimer.current); scheduleGolden.current = null; };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNewsIndex(n => n + 1), 14000);
    return () => clearInterval(t);
  }, []);

  const handleClick = e => {
    const now = Date.now();
    let gain;
    setGame(s => {
      gain = Game.activeClickPower(s, boostRef.current, now);
      return { ...s, rice: s.rice + gain, totalRice: s.totalRice + gain, clicks: s.clicks + 1 };
    });
    if (frenzyRun.current?.until > now) {
      frenzyRun.current.earned += gain;
      frenzyRun.current.clicks++;
    }
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
    if (!goldenAvailable.current) return;
    goldenAvailable.current = false;
    setGolden(null);
    clearTimeout(goldTimer.current);
    // Settle before choosing the result; the dry-spell counter is saved with the
    // catch so reloading cannot silently erase progress toward the guarantee.
    let kind;
    const snapshot = setGame(s => {
      kind = Game.goldenOutcome(s, Math.random());
      return { ...s, goldenClicks: s.goldenClicks + 1, goldenMisses: kind === "click" ? 0 : s.goldenMisses + 1 };
    });
    if (kind === "harvest") {
      let bonus;
      setGame(s => {
        bonus = Game.goldenHarvest(s);
        return { ...s, rice: s.rice + bonus, totalRice: s.totalRice + bonus };
      });
      pushToast(`豊作！ ${fmt(bonus)} 粒、どこからともなく届いた。`);
    } else {
      const now = Date.now();
      boostRef.current = Game.addGoldenBoost(boostRef.current, kind, snapshot, now);
      if (kind === "click") {
        const previous = frenzyRun.current?.until > now ? frenzyRun.current : { earned: 0, clicks: 0 };
        frenzyRun.current = { ...previous, until: boostRef.current.click };
      }
      setBoosts(boostRef.current);
      setClock(now);
      const seconds = Game.goldenDuration(snapshot, kind);
      pushToast(kind === "production" ? `炊飯祭り！ ${seconds}秒間、生産が7倍！` : `神の手！ ${seconds}秒間、クリックが777倍！`);
    }
    scheduleGolden.current?.();
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
  const makeSaveCode = () => {
    // A blocked tab may be showing a fallback new game or stale progress.
    // Export the protected bytes instead of presenting that fallback as a backup.
    if (blocked.current) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) { setSaveText(raw); return raw; }
      } catch {}
      setSaveMessage("端末の保護中データを読み出せませんでした。今のデータは変更していません。");
      return null;
    }
    const code = Game.encodeSave(setGame(s => s));
    setSaveText(code);
    return code;
  };
  const copySave = async () => {
    const code = makeSaveCode();
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setSaveMessage(blocked.current ? "端末に残っている保護中のコードを全部コピーしました。" : "最新のセーブコードを全部コピーしました。");
    } catch {
      setShowSaveCode(true);
      setSaveMessage("自動コピーができませんでした。「全選択」してコピーするか、ファイルに保存してください。");
    }
  };
  const downloadSave = (code, prefix = "omusubi") => {
    if (!code) return;
    let url, link;
    try {
      url = URL.createObjectURL(new Blob([code], { type: "text/plain;charset=utf-8" }));
      link = document.createElement("a");
      link.href = url;
      link.download = `${prefix}-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
      document.body.appendChild(link);
      link.click();
      setSaveMessage("セーブファイルのダウンロードを開始しました。");
    } catch {
      setSaveMessage("ファイルを書き出せませんでした。コードのコピーをお試しください。");
    } finally {
      link?.remove();
      if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };
  const importSave = code => {
    try {
      const loaded = Game.decodeSave(code.trim());
      // Retain one pre-import snapshot, including an unreadable protected save.
      // Keep it in memory too, so a full/blocked storage still permits download.
      const previous = blocked.current ? localStorage.getItem(STORAGE_KEY) : Game.encodeSave(setGame(s => s));
      if (previous) setImportBackup(previous);
      // Imports restore exactly the encoded progress. Offline gains apply only on
      // local resume, so re-importing a code cannot mint repeated offline income.
      setGame(loaded.state);
      lastTick.current = Date.now();
      seenAchievements.current = { ...loaded.state.unlocked };
      boostRef.current = {};
      frenzyRun.current = null;
      goldenAvailable.current = false;
      setBoosts({}); setGolden(null); clearTimeout(goldTimer.current);
      scheduleGolden.current?.();
      setParticles([]); setNotice("");
      blocked.current = false;
      setStorageError("");
      try {
        if (previous) localStorage.setItem(IMPORT_BACKUP_KEY, previous);
        localStorage.setItem(STORAGE_KEY, Game.encodeSave({ ...loaded.state, savedAt: Date.now() }));
        setLastSaved(Date.now());
      } catch { setStorageError("端末に保存できません。元のセーブコードを保管してください。"); }
      setSaveMessage(loaded.refund > 0 ? `復元しました。旧工房の在庫・契約農家を ${fmt(loaded.refund)} 粒に戻しました。` : "セーブデータを復元しました。おかえり！");
      setSaveText(code.trim());
    } catch {
      setSaveMessage("読み込めませんでした。コードを確認してください。今の進行はそのままです。");
    }
  };
  const importFile = async e => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file || readingFileRef.current) return;
    readingFileRef.current = true;
    setReadingFile(true);
    try {
      if (file.size > 1000000) throw Error("size");
      importSave(await file.text());
    } catch {
      setSaveMessage("ファイルを読めませんでした。1MB以下のセーブ用テキストを選んでください。今の進行はそのままです。");
    } finally {
      readingFileRef.current = false;
      setReadingFile(false);
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
          <div className={`left ${activeBoosts.length ? "boosting" : ""} ${activeBoosts.length === 2 ? "combo" : ""}`}>
            <div className="rice-orbit" aria-hidden="true" />
            <button className={`onigiri-btn ${squish ? "squish" : ""}`} onClick={handleClick} aria-label="おむすびを握る"><OnigiriSVG skin={skin} /></button>
            {particles.map(p => <span key={p.id} className="particle" style={{ left: p.x, top: p.y }}>{p.text}</span>)}
            {golden && <button className="golden" style={{ left: `${golden.x}%`, top: `${golden.y}%` }} onClick={clickGolden} aria-label="金のおむすびをつかまえる">🍙<span>金！</span></button>}
          </div>
          <div className="play-caption">
            {activeBoosts.length > 0 ? <span className="boost-label">{activeBoosts.map(([kind, effect]) => <span key={kind}>{kind === "production" ? "生産" : "クリック"} ×{effect.multiplier} · {Math.ceil((boosts[kind] - clock) / 1000)}秒</span>)}</span> : firstUnowned ? <span className={rice >= goalCost ? "goal-ready" : ""}>{firstUnowned.name}{quantity > 1 ? ` ${quantity}${firstUnowned.unit}` : ""} {rice >= goalCost ? "を迎えられます！" : `まで、あと ${fmt(Math.ceil(goalCost - rice))} 粒`}</span> : nextFinger ? `あと ${fmt(nextFinger.clickNeed - clicks)} 回握ると、新しい指の強化が解放` : `${skin.name} · ${skin.ability}`}
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
            <div className="shop-controls"><div className="subnav" aria-label="ショップの種類">
              <button className={shopTab === "buildings" ? "selected" : ""} aria-pressed={shopTab === "buildings"} onClick={() => setShopTab("buildings")}>施設</button>
              <button className={shopTab === "upgrades" ? "selected" : ""} aria-pressed={shopTab === "upgrades"} onClick={() => setShopTab("upgrades")}>強化 {affordableUpgrades > 0 && <span className="count-badge">{affordableUpgrades}</span>}</button>
            </div>{shopTab === "buildings" && <div className="quantity" aria-label="購入数">{Game.PURCHASE_QUANTITIES.map(n => <button key={n} aria-label={`${n}個ずつ購入`} aria-pressed={quantity === n} onClick={() => setQuantity(n)}>{n}</button>)}</div>}</div>
            {shopTab === "buildings" ? <>
              {featuredUpgrade && <button className={`featured-upgrade ${rice >= featuredUpgrade.cost ? "affordable" : ""}`} disabled={rice < featuredUpgrade.cost} onClick={() => buyUpgrade(featuredUpgrade)}>
                <span className="shop-body"><span className="shop-name"><span className="upgrade-label">強化</span> {featuredUpgrade.name}</span><span className="production">{featuredUpgrade.desc}</span></span>
                <span className="shop-cost">{fmt(featuredUpgrade.cost)} 粒</span>
              </button>}
              {visibleBuildings.map(b => {
                const n = owned[b.id] || 0, cost = Game.buildingPrice(game, b, quantity);
                const rate = b.cps * Game.buildingMultiplier(game, b.id) * Game.skinCps(activeSkin);
                const milestone = Game.nextBuildingUpgrade(game, b.id);
                return <button key={b.id} className={`shop-item building-item ${rice >= cost ? "affordable" : ""}`} disabled={rice < cost} onClick={() => buy(b)}>
                  <span className="shop-icon" aria-hidden="true">{b.icon}</span>
                  <span className="shop-body"><span className="shop-name">{b.name}</span><span className="shop-desc">{b.desc}</span><span className="production">1{b.unit}で毎秒 {fmtCps(rate)} 粒</span></span>
                  <span className="shop-meta"><span className="shop-cost">{fmt(cost)} 粒</span><span className="shop-owned">所持 {n}{b.unit}</span>{quantity > 1 && <span className="shop-desc">{quantity}{b.unit}購入</span>}</span>
                  {milestone && <span className="building-milestone"><span>{milestone.need}{b.unit}で次の強化解放</span><span className="milestone-track" aria-hidden="true"><span style={{width:`${n / milestone.need * 100}%`}} /></span></span>}
                </button>;
              })}
              {nextBuilding && <div className="next-building"><span>？ 次の施設</span><span>累計 {fmt(nextBuilding.baseCost * 0.25)} 粒で発見</span></div>}
            </> : <>
              <p className="panel-help">具材でクリック強化。施設を増やすと、その施設の強化も解放。</p>
              {nextFinger && <p className="finger-goal">あと{fmt(nextFinger.clickNeed - clicks)}回握ると「{nextFinger.name}」が解放</p>}
              {nextGoldenUpgrade && <p className="finger-goal">金のおむすび あと{nextGoldenUpgrade.goldenNeed - game.goldenClicks}回で「{nextGoldenUpgrade.name}」が解放</p>}
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
            <p className="panel-help">閉じている間も最大4時間、生産が進みます。バックアップ・別端末への引き継ぎはこちら。</p>
            <div className="craft-row"><button className="craft-btn" onClick={copySave}>{blocked.current ? "保護中コードをコピー" : "最新コードをコピー"}</button><button className="craft-btn" onClick={() => downloadSave(makeSaveCode())}>ファイルに保存</button></div>
            <button className="craft-btn file-load" disabled={readingFile} onClick={() => fileInputRef.current?.click()}>{readingFile ? "読み込み中…" : "ファイルを読み込む"}</button>
            <input ref={fileInputRef} type="file" accept=".txt,text/plain" aria-label="セーブファイル" hidden onChange={importFile} />
            <p className="save-message" role="status">{saveMessage}</p>
            <p className="panel-help">読み込みは今の進行を置き換えます。残したい進行は先に保存してください。</p>
            <details className="save-help" open={showSaveCode} onToggle={e => setShowSaveCode(e.currentTarget.open)}><summary>コードで読み込む・手動コピー</summary>
              <label htmlFor="save-code" className="section-label">セーブコード</label>
              <textarea ref={saveCodeRef} id="save-code" className="save-area" value={saveText} onChange={e => setSaveText(e.target.value)} placeholder="保存してあるコードを貼り付ける" spellCheck="false" />
              <div className="craft-row"><button className="craft-btn" onClick={() => { if (makeSaveCode()) setSaveMessage(blocked.current ? "保護中のコードを表示しました。" : "最新のコードを表示しました。"); }}>{blocked.current ? "保護中コードを表示" : "最新コードを表示"}</button><button className="craft-btn" disabled={!saveText} onClick={() => { saveCodeRef.current?.focus(); saveCodeRef.current?.select(); saveCodeRef.current?.setSelectionRange(0, saveText.length); }}>全選択</button></div>
              <button className="craft-btn file-load" disabled={!saveText.trim() || readingFile} onClick={() => importSave(saveText)}>コードを読み込む</button>
              {importBackup && <div className="import-backup"><p className="panel-help">直前に読み込む前のデータを1件保管しています。戻したいときは保存して読み込めます。</p><button className="craft-btn file-load" onClick={() => downloadSave(importBackup, "omusubi-before-import")}>読み込み前のデータを保存</button></div>}
            </details>
            <details className="save-help"><summary>遊び方・このゲームについて</summary><p>おむすびを握って米粒を集め、施設を買うと自動生産。強化でさらに増えます。金のおむすびは米粒の贈り物、30秒間の生産7倍、ときどき13秒間のクリック777倍！</p><p>神の手は発動時のクリック力が基準です。効果中に買った施設や強化は、通常のクリックや次の神の手に反映されます。「指」の生産連動分には、重なった炊飯祭りの7倍も乗ります。同じ効果を取ると残り時間が更新されます。</p><p>金をつかまえて15回続けて神の手が出なければ、次は必ず神の手。不発の回数も保存されます。金を7・27・77回つかまえると金専用の強化が解放され、保温ジャーで神の手は26秒になります。一時効果は再読み込み・セーブの復元で終了します。</p><p>旧版のコードも読み込めます。旧工房の在庫は最高売値で米粒に、契約農家は購入費用に戻します。取得した実績も残ります。自動保存はこのブラウザ・このサイト専用です。</p><p>Respect for <a href="https://orteil.dashnet.org/cookieclicker/" target="_blank" rel="noopener noreferrer">Cookie Clicker</a> — by Orteil &amp; Opti。クリック、生産、強化、金のボーナスの仕組みに影響を受けた非公式のおむすびゲームです。</p></details>
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

