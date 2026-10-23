const { useState, useEffect, useRef, useCallback } = React;

const { BUILDINGS, UPGRADES, SKINS, ACHIEVEMENTS, REGULARS, PAIR_UPGRADES, RECIPES, OUTINGS, PLATES } = Game;

const OUTING_STORIES = {
  engawa: { color: "#e9d7aa", sky: "#b6d3c5", lines: {
    shio_musubi: "縁側に並んで、ひとくち。『塩加減、似てきたね』。おばあちゃんが、ちょっと得意そうだった。",
    omurice: "ケチャップで名前を書いたら、おばあちゃんも自分の名前を書いた。二人とも、食べる前に写真を撮った。",
    rice_burger: "『おむすびが背伸びしてる』。おばあちゃんは両手で持って、ちゃんと背伸びして食べた。",
  } },
  picnic: { color: "#a6bc78", sky: "#bddbd0", lines: {
    shio_musubi: "かかしの分もひとつ。鳥たちは今日はお客さん。誰も追い払わない昼休み。",
    omurice: "卵の黄色と稲穂の黄色。風が吹くたび、田んぼがおかわりを頼んでいる気がした。",
    rice_burger: "『地産地消です』と田んぼが言った。上も下も、本人だった。",
  } },
  night: { color: "#7a97a4", sky: "#344563", lines: {
    shio_musubi: "夜勤の店長が、やっと座った。『温かいの、久しぶり』。レジの音が少し遠くなった。",
    omurice: "まかないの卵に『おつかれ』と書いた。店長はその文字のところを、最後に食べた。",
    rice_burger: "パンの棚に置いたら、おむすびの棚から苦情が来た。店長が食べて、円満に解決した。",
  } },
  shrine: { color: "#80a399", sky: "#c8d8b0", lines: {
    shio_musubi: "神様が一礼して、いただきます。お願い事は今日は後回し。いまは全員、お昼休み。",
    omurice: "ケチャップのおみくじは『大吉』。神様は『大盛』と読み、しゃもじを持ってきた。",
    rice_burger: "神様が手を合わせたあと、両手で挟んだ。ありがたみも具も、はみ出ていた。",
  } },
  moon: { color: "#9fadc6", sky: "#273653", lines: {
    shio_musubi: "うさぎが月の石をひとつ、隣に置いた。『丸いのは私。三角はあなた』。並べて記念写真。",
    omurice: "『満月を包んで持ってきたの？』。半分こしたら、月に上弦と下弦ができた。",
    rice_burger: "無重力で中身が浮いた。うさぎが追いついた。食事が少しだけスポーツになった。",
  } },
  campus: { color: "#b6b79a", sky: "#b5d2de", lines: {
    shio_musubi: "卒論を書き終えた学生が、三角を見て泣いた。『図形に見えない。ごはんに見える』。よく頑張った。",
    omurice: "査読者2のコメントは『おいしい。卵の追加を推奨』。異論なしで採択された。",
    rice_burger: "構造解析の授業が始まった。上の米、下の米。中間発表の前に、全員食べ終わった。",
  } },
  yesterday: { color: "#bdb1a4", sky: "#8f9eb8", lines: {
    shio_musubi: "昨日、忙しくて食べそびれた自分に届けた。今日の自分が、少し元気になった気がする。",
    omurice: "ケチャップで『明日もなんとかなる』。昨日の自分から『うん』と返事が来た。",
    rice_burger: "昨日の自分がもう食べていた。『これ、明日ありがとうって言うね』。先にどういたしまして。",
  } },
  parallel: { color: "#b7a4bd", sky: "#596186", lines: {
    shio_musubi: "どの世界のおばあちゃんも同じ形に握っていた。塩加減だけ、誰も譲らなかった。",
    omurice: "片方の世界はとろとろ卵、もう片方は薄焼き卵。結論は『両方おかわり』で一致した。",
    rice_burger: "パンが主食の世界と、米が主食の世界。昼ごはんだけで、国交が結ばれた。",
  } },
  home: { color: "#bfa88a", sky: "#303751", lines: {
    shio_musubi: "宇宙をいくつも越えて、いつもの縁側。『おかえり』。今度は、こちらがおむすびを差し出した。",
    omurice: "業務用の愛情じゃなくて、ひと皿ぶんだけ。名前を書いたら、おばあちゃんが笑った。",
    rice_burger: "『こんなの作れるようになったんだね』。宇宙の外まで来て、いちばんうれしい感想をもらった。",
  } },
};
const PLATE_COLORS = { plain: ["#d5e9df", "#789c95", "#b4cdc4"], paw: ["#f2d0be", "#c28b7c", "#eab8a3"], moon: ["#405574", "#b9c9de", "#334661"], rainbow: ["#ecdbea", "#bb98b5", "#dfcadd"] };

function PostcardArt({ outing, recipeId }) {
  const colors = OUTING_STORIES[outing.id];
  const space = ["night", "moon", "parallel", "home", "yesterday"].includes(outing.id);
  return <svg className="postcard-art" viewBox="0 0 320 176" role="img" aria-label={`${outing.name}の絵はがき`}>
    <rect x="2" y="2" width="316" height="172" rx="12" fill={colors.sky} stroke="#ecdcc0" strokeWidth="4" />
    {space ? <g fill="#fff0bc">{[[25,30],[88,19],[144,38],[209,20],[270,33],[294,71]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i%2+1} />)}</g> : <><circle cx="268" cy="37" r="17" fill="#ffeba8" /><path d="M28 40h38m13-14h46" stroke="#f9f3da" strokeWidth="9" strokeLinecap="round" /></>}
    <path d="M4 119Q62 101 130 120T316 116V170H4Z" fill={colors.color} />
    {["engawa","parallel","home"].includes(outing.id) && <g stroke="#66544c" strokeWidth="3" strokeLinejoin="round">
      <path d="M42 90h96v49H42Z" fill="#e4cda4" /><path d="m28 91 62-42 63 42Z" fill="#846b66" />
      <rect x="63" y="101" width="35" height="29" fill="#f6e6af" /><path d="M80 101v29m-44 12h119m-109 0v12m94-12v12" fill="none" />
      {outing.id === "parallel" && <g transform="translate(155 12) scale(.72)"><path d="M42 90h96v49H42Z" fill="#e4cda4" /><path d="m28 91 62-42 63 42Z" fill="#9d7ca1" /><rect x="63" y="101" width="35" height="29" fill="#f6e6af" /></g>}
      {outing.id === "home" && <ellipse cx="90" cy="54" rx="76" ry="10" fill="none" stroke="#c9b8df" strokeDasharray="4 5" />}
    </g>}
    {outing.id === "picnic" && <g stroke="#648151" strokeWidth="3" strokeLinecap="round"><path d="M35 139v-32m20 32V98m20 41v-33m20 33v-36m20 36V96" /><path d="m29 112 6 7 6-10m8-6 6 8 6-11m8 12 6 7 6-9m8-2 6 7 6-10m8-3 6 7 6-11" stroke="#e9cc70" /><path d="M128 103v42m-14-25h28" stroke="#9b7252" strokeWidth="5" /><circle cx="128" cy="101" r="9" fill="#efd49d" /><path d="m113 94 15-10 15 10Z" fill="#ae8161" stroke="none" /></g>}
    {outing.id === "night" && <g stroke="#8caaa5" strokeWidth="3"><rect x="31" y="72" width="128" height="73" rx="3" fill="#e4e0bc" /><path d="M28 78h134" stroke="#86b9ac" strokeWidth="14" /><rect x="44" y="99" width="37" height="34" fill="#ffd77d" /><rect x="97" y="96" width="46" height="49" fill="#e9c88b" /><path d="M120 97v47" /><path d="M44 112h37" /></g>}
    {outing.id === "shrine" && <g stroke="#ae6452" strokeWidth="11" strokeLinecap="round"><path d="M45 70v81m95-81v81M29 65q63 15 126 0M32 91h120" /><path d="M92 73v18" strokeWidth="6" /><path d="M92 94v28" stroke="#e5cf94" strokeWidth="4" /></g>}
    {outing.id === "moon" && <g><circle cx="75" cy="56" r="24" fill="#9dccd7" /><path d="M59 43q13-9 25 8l-9 20-15-7Z" fill="#97b98d" /><ellipse cx="70" cy="139" rx="36" ry="8" fill="#788ba8" /><path d="M95 121q-18-39-7-35 12 3 14 23 2-28 11-24 8 7-2 38" fill="#fff2db" /><ellipse cx="105" cy="130" rx="19" ry="18" fill="#fff2db" /><circle cx="111" cy="125" r="2" fill="#45566a" /></g>}
    {outing.id === "campus" && <g stroke="#798389" strokeWidth="3" strokeLinejoin="round"><path d="M30 90h126v56H30Z" fill="#eee0bb" /><path d="m22 90 70-35 72 35Z" fill="#718a87" /><path d="M48 100v37m29-37v37m29-37v37m29-37v37" stroke="#baa987" strokeWidth="9" /><path d="M26 146h134" strokeWidth="7" /></g>}
    {outing.id === "yesterday" && <g stroke="#e9d9b4" strokeWidth="4"><circle cx="89" cy="96" r="48" fill="#f4e7c7" /><circle cx="89" cy="96" r="40" fill="none" stroke="#a99d86" strokeDasharray="2 17" /><path d="M89 70v26l-23 12" fill="none" stroke="#596879" strokeLinecap="round" /><path d="M148 56q27 40 0 77m0-77 17 4m-17-4-5 16" fill="none" /></g>}
    {recipeId && <svg x="175" y="82" width="134" height="86" viewBox="0 0 280 180"><MealArt id={recipeId} /></svg>}
    <rect x="274" y="14" width="28" height="32" rx="3" fill="none" stroke="#f4e5c4" strokeWidth="2" strokeDasharray="3 2" />
    <path d="m282 37 6-13 6 13Z" fill="#f4e5c4" />
  </svg>;
}

const MEAL_STEPS = {
  shio_musubi: ["米をよそう", "きゅっと握る"],
  omurice: ["ごはんを炒める", "卵で包む"],
  rice_burger: ["ごはんを焼く", "具をはさむ"],
};
const MEAL_REACTIONS = {
  shio_musubi: { grandma: "ひとつまみって言ったでしょ。いいひとつまみだね。", regular_cat: "握手はしません。おむすびに毛がつくので。", regular_cooker: "この米、私が蒸らしました。", regular_rabbit: "三角。月では見ない形ですね。", regular_future: "未来のコンビニでも、これが一番売れてます。" },
  omurice: { grandma: "名前を書いてあげようか。何兆文字？", regular_cat: "ケチャップの署名は肉球です。代筆ではありません。", regular_cooker: "卵に包まれるのも、悪くないですね。", regular_rabbit: "黄色くて丸い。だいたい故郷です。", regular_future: "未来でも、最後のひと口は卵が足りません。" },
  rice_burger: { grandma: "パンを切らしてね。米ならあるから。", regular_cat: "上も米。下も米。信頼できます。", regular_cooker: "上の米と下の米、同じ釜の仲間です。", regular_rabbit: "無重力だと中身だけ先に出勤します。", regular_future: "未来ではこれをパンに分類します。" },
};

function MealArt({ id, stage = 3, decoration = 0, plate = "plain" }) {
  const ready = stage >= 2;
  const [rim, edge, center] = PLATE_COLORS[plate] || PLATE_COLORS.plain;
  return <svg className={`meal-art meal-stage-${stage}`} viewBox="0 0 280 180" role="img" aria-label={`${RECIPES.find(r => r.id === id)?.name || "料理"}${stage < 3 ? "を調理中" : "のできあがり"}${id === "omurice" && ready ? `、ケチャップは${["ハート", "米の字", "肉球"][decoration % 3]}` : ""}`}>
    <ellipse cx="140" cy="151" rx="112" ry="18" fill="#14232e" opacity=".5" />
    <ellipse cx="140" cy="139" rx="112" ry="27" fill={rim} stroke={edge} strokeWidth="3" />
    <ellipse cx="140" cy="137" rx="91" ry="17" fill={center} />
    {plate === "paw" && <g fill="#b6786d">{[55,225].map(x=><g key={x}><ellipse cx={x} cy="142" rx="7" ry="4" /><circle cx={x-7} cy="135" r="2.5" /><circle cx={x} cy="132" r="2.5" /><circle cx={x+7} cy="135" r="2.5" /></g>)}</g>}
    {plate === "moon" && <g fill="#f5dfa1">{[[50,138],[73,149],[220,140],[203,152],[143,159]].map(([x,y],i)=><path key={i} d={`M${x} ${y-4}l2 3 4 1-4 1-2 3-1-3-4-1 4-1Z`} />)}</g>}
    {plate === "rainbow" && <g fill="none" strokeWidth="3">{["#d4888e","#e1b565","#9fc28e","#89b8c8","#b69bce"].map((c,i)=><path key={c} d={`M${39+i*4} ${144-i}Q140 ${179-i*4} ${241-i*4} ${144-i}`} stroke={c} />)}</g>}
    {stage === 0 ? <g fill="#fff4d5" stroke="#c8c8a7" strokeWidth="1.5">{[[-24,0],[-9,-8],[8,-2],[24,3],[-17,11],[0,12],[17,13]].map(([x,y],i) => <ellipse key={i} cx={140+x} cy={119+y} rx="10" ry="5" transform={`rotate(${i*37} ${140+x} ${119+y})`} />)}</g> : id === "shio_musubi" ? <g strokeLinejoin="round">
      <path d="M127 46Q140 26 153 46L200 122Q211 144 185 145H95Q69 144 80 122Z" fill="#fff7dd" stroke="#c6ceb8" strokeWidth="3" />
      {[[-18,0],[15,-10],[-29,26],[32,30],[0,-24],[-7,17]].map(([x,y],i) => <ellipse key={i} cx={140+x} cy={84+y} rx="5" ry="2.5" fill="#e6dfc5" transform={`rotate(${i*31} ${140+x} ${84+y})`} />)}
      {ready && <><path d="M120 111Q140 105 160 111V145H120Z" fill="#345347" /><path d="M130 114v25" stroke="#53735b" strokeWidth="4" strokeLinecap="round" /></>}
    </g> : id === "omurice" ? <g>
      <path d="M57 133Q65 71 140 69Q215 71 223 133Q190 153 140 151Q90 151 57 133Z" fill={ready ? "#f5c85d" : "#cf8153"} stroke={ready ? "#c69443" : "#a45d3e"} strokeWidth="3" />
      <path d="M72 126Q88 81 148 82" stroke={ready ? "#ffe9a1" : "#e6ac70"} strokeWidth="7" fill="none" strokeLinecap="round" />
      {ready && <g stroke="#c84938" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round">{decoration % 3 === 0 ? <path d="M139 128Q106 106 119 97Q132 91 140 104Q149 90 161 98Q174 109 139 128Z" /> : decoration % 3 === 1 ? <><path d="M140 94v38m-20-20h40m-35-16 6 7m24-7-6 7m-9 9-20 18m20-18 20 18" /></> : <><ellipse cx="141" cy="120" rx="12" ry="8" fill="#c84938" stroke="none" />{[[122,106],[132,98],[147,97],[159,106]].map(([x,y],i)=><ellipse key={i} cx={x} cy={y} rx="4" ry="6" fill="#c84938" stroke="none" />)}</>}</g>}
    </g> : <g strokeWidth="3" strokeLinejoin="round">
      <path d="M74 125Q140 112 206 125L204 143Q140 162 76 143Z" fill="#ead59a" stroke="#be975c" />
      {ready && <><path d="m70 120 14-10 15 6 14-9 16 9 17-9 18 10 15-9 19 8 15-3-5 15H76Z" fill="#92b675" stroke="#6d9458" /><ellipse cx="140" cy="113" rx="65" ry="14" fill="#80573e" stroke="#594636" /><path d="m95 110 75 7 23-9" stroke="#c57550" fill="none" /></>}
      <path d={ready ? "M72 99Q75 58 140 58Q205 58 208 99Q140 117 72 99Z" : "M72 108Q75 76 140 76Q205 76 208 108Q140 127 72 108Z"} fill="#f0dda6" stroke="#c5a66c" />
      {[[-33,0],[-12,-12],[14,-9],[35,4],[0,10]].map(([x,y],i)=><ellipse key={i} cx={140+x} cy={(ready?84:99)+y} rx="5" ry="2.5" fill="#caab73" transform={`rotate(${i*38} ${140+x} ${(ready?84:99)+y})`} />)}
    </g>}
    {stage === 3 && <g className="meal-steam" stroke="#e9f5e1" strokeWidth="3" opacity=".55" fill="none" strokeLinecap="round"><path d="M116 32q-8-8 0-16m24 14q-8-8 0-16m24 18q-8-8 0-16" /></g>}
  </svg>;
}

function RegularPortrait({ kind, known }) {
  return <svg viewBox="0 0 100 100" aria-hidden="true" className={`regular-portrait ${known ? "" : "unknown"}`}>
    <circle cx="50" cy="50" r="46" fill="#273f4b" stroke="#779993" strokeWidth="2" />
    {kind === "cat" && <g fill="#f5dfaa" stroke="#805b3d" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M27 42 24 19 43 31 M58 31 77 19 75 44" /><ellipse cx="50" cy="48" rx="27" ry="23" />
      <path d="M34 69 Q50 60 66 69 L70 85 H30Z" fill="#83b8a2" /><path d="M39 47h2m18 0h2M47 55q3 4 6 0" fill="none" strokeLinecap="round" />
      <path d="m72 80 7-28" stroke="#e7bd78" strokeWidth="5" /><ellipse cx="80" cy="42" rx="8" ry="13" fill="#f9eed8" />
    </g>}
    {kind === "cooker" && <g stroke="#355669" strokeWidth="2.5" strokeLinejoin="round">
      <rect x="18" y="44" width="64" height="38" rx="13" fill="#c8e5e7" /><ellipse cx="50" cy="44" rx="32" ry="9" fill="#6c8a9b" />
      <path d="M31 39Q33 22 50 22T69 39" fill="#fff7de" /><circle cx="50" cy="38" r="14" fill="#f3ca99" />
      <path d="M43 37h1m12 0h1m-10 6q4 3 8 0" strokeLinecap="round" /><path d="M37 25q13-12 26 0" fill="#fff9ef" />
      <rect x="40" y="61" width="20" height="10" rx="3" fill="#2c4554" /><circle cx="68" cy="65" r="3" fill="#ffda78" stroke="none" />
    </g>}
    {kind === "rabbit" && <g stroke="#71929f" strokeWidth="2.5">
      <path d="M35 36Q17 3 31 10Q43 16 44 36M56 36Q60 6 71 9Q81 15 65 39" fill="#f9f4e7" />
      <ellipse cx="50" cy="58" rx="31" ry="29" fill="#93bfd0" /><ellipse cx="50" cy="52" rx="24" ry="22" fill="#fff8e7" />
      <path d="M41 49v2m18-2v2m-13 8q4 4 8 0" stroke="#364c61" strokeLinecap="round" /><path d="M35 76h30" stroke="#ead49a" strokeWidth="7" />
      <circle cx="51" cy="79" r="3" fill="#2c4554" />
    </g>}
    {kind === "future" && <g stroke="#8cb9c8" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M50 22Q55 20 60 30L79 66Q85 81 69 83H31Q15 81 22 66L41 30Q46 22 50 22Z" fill="#e6f0df" />
      <rect x="38" y="61" width="25" height="23" rx="3" fill="#2b594c" stroke="none" /><path d="M35 49h3m24 0h3m-20 7q5 5 10 0" stroke="#3a5167" strokeLinecap="round" />
      <path d="m46 63 4 5 4-5-4 17Z" fill="#e69a85" stroke="none" /><ellipse cx="50" cy="18" rx="29" ry="6" fill="none" strokeDasharray="4 4" />
    </g>}
    {!known && <text x="50" y="62" textAnchor="middle" fill="#d8e7e5" fontSize="32" fontWeight="bold">?</text>}
  </svg>;
}

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

// 倍率:小数点第2位まで、大きければ万・億で
const fmtTimes = m => m < 1e4 ? m.toLocaleString("ja-JP", { maximumFractionDigits: 2 }) : fmt(m);

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
      {skin.extra === "shinmai" && <g>
        <path d="M84 18q-7-7 0-14m16 12q-7-7 0-14m16 16q-7-7 0-14" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
        {[[66, 70], [134, 66], [100, 52], [58, 112], [146, 112]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="4" ry="2" fill="#ffffff" transform={`rotate(${i * 35 - 30} ${x} ${y})`} />)}
        <path d="M100 168q-2-14 6-22m-6 22q-8-10-18-10" stroke="#7fae6a" strokeWidth="3" fill="none" strokeLinecap="round" />
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
const REBIRTH_BACKUP_KEY = `${STORAGE_KEY}-before-rebirth`;
const WIDE_QUERY = "(min-width: 760px)";
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
  const [tab, setTab] = useState("play");
  // Wide screens keep the onigiri beside the shop, so "握る" is a phone-only tab.
  const [wide, setWide] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.(WIDE_QUERY).matches);
  const [shopTab, setShopTab] = useState("buildings");
  const [collectionTab, setCollectionTab] = useState("achievements");
  const [regularLines, setRegularLines] = useState({});
  const [kitchen, setKitchen] = useState(null);
  const [outingView, setOutingView] = useState(false);
  const [selectedOuting, setSelectedOuting] = useState(null);
  const [postcard, setPostcard] = useState(null);
  const [lastGain, setLastGain] = useState(null);
  const [newsOpen, setNewsOpen] = useState(false);
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
  const [rebirthBackup, setRebirthBackup] = useState(() => {
    try { return localStorage.getItem(REBIRTH_BACKUP_KEY) || ""; } catch { return ""; }
  });
  const [rebirthConfirm, setRebirthConfirm] = useState(false);
  const [rebirthMessage, setRebirthMessage] = useState("");
  const [restoreConfirm, setRestoreConfirm] = useState(false);
  const [storageError, setStorageError] = useState(initial.error);
  const [lastSaved, setLastSaved] = useState(0);
  const gameRef = useRef(game);
  const boostRef = useRef(boosts);
  const frenzyRun = useRef(null);
  const saveCodeRef = useRef(null);
  const saveMessageRef = useRef(null);
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
  const rebirthHinted = useRef(Game.canRebirth(initial.state));

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

  const view = wide && tab === "play" ? "shop" : tab;
  const skin = SKINS.find(s => s.id === activeSkin) || SKINS[0];
  const baseCps = Game.production(game);
  const activeBoosts = Object.entries(Game.GOLDEN_EFFECTS).filter(([kind]) => boosts[kind] > clock);
  const productionBoost = Game.boostMultiplier(boosts, "production", clock);
  const cps = baseCps * productionBoost;
  const clickPower = Game.activeClickPower(game, boosts, clock);
  const chapter = Game.chapterFor(totalRice);
  const availableUpgrades = UPGRADES.filter(u => u.kind !== "regular" && Game.upgradeAvailable(game, u)).sort((a, b) => a.cost - b.cost);
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
  const activeAchievements = Game.achievementCount(game);
  const regularBonus = (Game.regularMultiplier(game) - 1) * 100;
  const regularCount = REGULARS.filter(r => upgrades[r.id]).length;
  const waitingRegulars = REGULARS.filter(r => activeAchievements >= r.need && !upgrades[r.id]);
  const nextRegular = REGULARS.find(r => activeAchievements < r.need);
  const nextPair = PAIR_UPGRADES.find(u => !upgrades[u.id] && !Game.upgradeAvailable(game, u) && Object.keys(u.requires).some(id => owned[id]));
  const recipes = game.recipes || {};
  const cookedCount = RECIPES.filter(r => recipes[r.id]).length;
  const newRecipes = RECIPES.filter(r => !recipes[r.id] && Game.recipeUnlocked(game, r.id));
  const selectedRecipe = kitchen && RECIPES.find(r => r.id === kitchen.id);
  const diners = [{ id: "grandma", name: "おばあちゃん" }, ...REGULARS.filter(r => upgrades[r.id])];
  const diner = diners[(kitchen?.diner || 0) % diners.length];
  const cardCount = Game.postcardCount(game);
  const totalCards = OUTINGS.length * RECIPES.length;
  const plate = PLATES.find(p => p.id === game.activePlate) || PLATES[0];
  const nextPlate = PLATES.find(p => p.need > cardCount);
  const outing = OUTINGS.find(o => o.id === selectedOuting);
  const postcardRecipe = postcard && RECIPES.find(r => r.id === postcard);
  const year = (game.rebirths || 0) + 1;
  const seeds = Game.seedCount(game);
  const seedGain = Game.rebirthGain(game);
  const rebirthReady = Game.canRebirth(game);
  const firstRebirthReady = rebirthReady && !game.rebirths;
  // The preview runs the real reset, so the confirmation lists what will happen.
  const rebirthPreview = rebirthReady ? Game.rebirth(game, clock).state : null;
  const allTime = Game.allTimeRice(game);
  const nextSeedRice = Game.riceForSeeds(Game.seedsFor(allTime) + 1) - allTime;

  function openOutings() {
    setOutingView(true); setSelectedOuting(null); setPostcard(null);
  }

  function deliverMeal(recipeId) {
    let delivered = false;
    const next = setGame(s => {
      const sent = Game.sendMeal(s, outing.id, recipeId);
      delivered = sent !== s;
      return sent;
    });
    if (delivered) {
      setPostcard(recipeId);
      const earnedPlate = PLATES.find(p => p.need === Game.postcardCount(next));
      pushToast(earnedPlate ? `${earnedPlate.name}をもらった！` : "絵はがきが届きました");
    }
  }

  const pushToast = useCallback(msg => {
    const id = pid.current++;
    setToasts(t => [...t.slice(-2), { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
  }, []);

  useEffect(() => {
    // Keep import/copy results reachable when a keyboard shortens the list area.
    if (saveMessage) saveMessageRef.current?.scrollIntoView({ block: "nearest" });
  }, [saveMessage]);

  useEffect(() => {
    // Follow the visible height when the mobile keyboard or browser bars move.
    const viewport = window.visualViewport;
    if (!viewport) return;
    const resize = () => document.documentElement.style.setProperty("--app-height", `${viewport.height}px`);
    resize();
    viewport.addEventListener("resize", resize);
    return () => viewport.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const query = window.matchMedia?.(WIDE_QUERY);
    if (!query) return;
    const update = () => setWide(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
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
    // Announce the very first chance once; the details stay in the collection.
    if (firstRebirthReady && !rebirthHinted.current) pushToast("今年1兆粒！ 図鑑の実績から「新米」を開けます");
    rebirthHinted.current = rebirthReady;
  }, [firstRebirthReady, rebirthReady, pushToast]);

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
    if (newsOpen) return;
    const t = setInterval(() => setNewsIndex(n => n + 1), 14000);
    return () => clearInterval(t);
  }, [newsOpen]);

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
    // Put feedback above the finger; the static result also survives reduced motion.
    const x = rect.width / 2 + (pid.current % 3 - 1) * 12;
    const y = rect.height * 0.3;
    const id = pid.current++;
    setLastGain(gain);
    setParticles(p => [...p.slice(-7), { id, x, y, text: `+${fmtCps(gain).replace(/\.0$/, "")}粒` }]);
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
  // Temporary effects and open scenes never survive an import or a rebirth.
  const clearTransient = () => {
    boostRef.current = {};
    frenzyRun.current = null;
    goldenAvailable.current = false;
    setBoosts({}); setGolden(null); clearTimeout(goldTimer.current);
    scheduleGolden.current?.();
    setParticles([]); setNotice(""); setKitchen(null); setLastGain(null);
    setOutingView(false); setSelectedOuting(null); setPostcard(null);
    setRebirthConfirm(false); setRestoreConfirm(false);
  };
  const startNewYear = () => {
    // A blocked tab may show stale or fallback progress; never reset from it.
    if (blocked.current) {
      setRebirthMessage("この端末の自動保存が停止中のため、新米にしませんでした。今の進行はそのままです。");
      return;
    }
    const snapshot = setGame(s => s);
    const { state: next, gain } = Game.rebirth(snapshot, Date.now());
    // A second tap before React renders sees the already-reset year and stops.
    if (!gain) { setRebirthConfirm(false); return; }
    const backup = Game.encodeSave(snapshot);
    try {
      localStorage.setItem(REBIRTH_BACKUP_KEY, backup);
      if (localStorage.getItem(REBIRTH_BACKUP_KEY) !== backup) throw Error("backup");
      localStorage.setItem(STORAGE_KEY, Game.encodeSave(next));
    } catch {
      // Without a stored way back the reset is not performed at all.
      setRebirthConfirm(false);
      setRebirthMessage("新米前のデータの控えをこの端末に保存できなかったため、新米にしませんでした。今の進行はそのままです。セーブ画面の「ファイルに保存」で控えを残し、端末の空き容量を確認してください。");
      return;
    }
    setRebirthBackup(backup);
    setGame(next);
    lastTick.current = Date.now();
    rebirthHinted.current = false;
    clearTransient();
    setLastSaved(next.savedAt);
    setStorageError("");
    setRebirthMessage(`${next.rebirths + 1}年目が始まりました。種もみ +${fmt(gain)}粒。新米前のデータはセーブ画面から戻せます。`);
    pushToast(`新米の季節！ 種もみ +${fmt(gain)}粒`);
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
      rebirthHinted.current = Game.canRebirth(loaded.state);
      clearTransient();
      setRebirthMessage("");
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
    <div className={`root view-${view}`} style={{ "--rice-a": skin.riceA, "--rice-b": skin.riceB }}>
      <header className="header">
        <h1 className="title"><button className="title-emoji" aria-label="ひみつのおむすび" onClick={pokeTitle}>🍙</button> おむすびくりっかー</h1>
        <div className="chapter">{game.rebirths ? `${year}年目 · ` : ""}{chapter.name}</div>
      </header>
      <main className="main">
        <section className="play-side" aria-label="おむすびを握る場所">
          <div className="stats">
            <div className="rice-count">{fmt(rice)} <span>米粒</span></div>
            <div className="cps"><span>毎秒 <b>{fmtCps(cps)}</b> 粒</span><span>1タップ <b>+{fmtCps(clickPower).replace(/\.0$/, "")}</b> 粒</span></div>
            <div className="click-result" aria-label={lastGain === null ? undefined : `直前の獲得 ${fmtCps(lastGain)}粒`}>{lastGain !== null && <>+{fmtCps(lastGain).replace(/\.0$/, "")} <small>粒</small></>}</div>
          </div>
          <div className={`left ${activeBoosts.length ? "boosting" : ""} ${activeBoosts.length === 2 ? "combo" : ""}`}>
            <div className="rice-orbit" aria-hidden="true" />
            <button className={`onigiri-btn ${squish ? "squish" : ""}`} onClick={handleClick} aria-label="おむすびを握る"><OnigiriSVG skin={skin} /></button>
            {particles.map(p => <span key={p.id} className="particle" style={{ left: p.x, top: p.y }}>{p.text}</span>)}
            {golden && <button className="golden" style={{ left: `min(${golden.x}%, calc(100% - 76px))`, top: `min(${golden.y}%, calc(100% - 76px))` }} onClick={clickGolden} aria-label="金のおむすびをつかまえる">🍙<span>金！</span></button>}
          </div>
          <div className="play-caption">
            {activeBoosts.length > 0 ? <span className="boost-label">{activeBoosts.map(([kind, effect]) => <span key={kind}>{kind === "production" ? "生産" : "クリック"} ×{effect.multiplier} · {Math.ceil((boosts[kind] - clock) / 1000)}秒</span>)}</span> : firstUnowned ? <span className={rice >= goalCost ? "goal-ready" : ""}>{firstUnowned.name}{quantity > 1 ? ` ${quantity}${firstUnowned.unit}` : ""} {rice >= goalCost ? "を迎えられます！" : `まで、あと ${fmt(Math.ceil(goalCost - rice))} 粒`}</span> : nextFinger ? `あと ${fmt(nextFinger.clickNeed - clicks)} 回握ると、新しい指の強化が解放` : `${skin.name} · ${skin.ability}`}
          </div>
          <div className="news-box"><button className="news" aria-label="米ニュースを読む" aria-expanded={newsOpen} onClick={() => setNewsOpen(v => !v)}>
            <span className="news-label">米ニュース <span aria-hidden="true">↻</span></span>
            <span className="news-text">{chapter.news[newsIndex % chapter.news.length]}</span>
          </button>
          {newsOpen && <div className="news-popover" role="region" aria-label="米ニュース全文"><p>{chapter.news[newsIndex % chapter.news.length]}</p><div><button onClick={() => { setNewsIndex(n => n + 1); setGame(s => ({ ...s, newsClicks: s.newsClicks + 1 })); }}>次のニュース</button><button onClick={() => setNewsOpen(false)}>閉じる</button></div></div>}</div>
          {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="おかえりのお知らせを閉じる">×</button></div>}
          {storageError && <div className="storage-warning" role="alert">{storageError}</div>}
        </section>
        <section className="right" aria-label="おむすび帝国">
          <nav className="tabbar" aria-label="ゲームメニュー">
            {[['play','握る'],['shop','ショップ'],['collection','図鑑'],['save','セーブ']].filter(([id]) => !wide || id !== "play").map(([id,label]) =>
              <button key={id} className={`tabbtn ${view === id ? "active" : ""}`} aria-current={view === id ? "page" : undefined} onClick={() => { setTab(id); setNewsOpen(false); }}>{label}{id === "shop" && view !== "shop" && affordableUpgrades > 0 && <span className="new-dot" aria-label="買える強化があります" />}{id === "collection" && (waitingRegulars.length > 0 || newRecipes.length > 0 || firstRebirthReady) && <span className="new-dot" aria-label="図鑑に新しい発見があります" />}</button>)}
          </nav>
          {view !== "play" && <div className="panel-content" key={`${view}-${shopTab}-${collectionTab}-${outingView}-${selectedOuting}-${postcard}`}>
          {view === "shop" && <>
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
                const rate = Game.buildingRate(game, b);
                const milestone = Game.nextBuildingUpgrade(game, b.id);
                return <button key={b.id} className={`shop-item building-item ${rice >= cost ? "affordable" : ""}`} disabled={rice < cost} onClick={() => buy(b)}>
                  <span className="shop-icon" aria-hidden="true">{b.icon}</span>
                  <span className="shop-body"><span className="shop-name">{b.name}</span><span className="production">1{b.unit}で毎秒 {fmtCps(rate)} 粒</span></span>
                  <span className="shop-meta"><span className="shop-cost">{fmt(cost)} 粒</span><span className="shop-owned">所持 {n}{b.unit}</span></span>
                  {milestone && <span className="building-milestone"><span aria-label={`次の強化まで ${n}/${milestone.need}${b.unit}`}>{n}/{milestone.need}{b.unit}</span><span className="milestone-track" aria-hidden="true"><span style={{width:`${n / milestone.need * 100}%`}} /></span></span>}
                </button>;
              })}
              {nextBuilding && <div className="next-building"><span>？ 次の施設</span><span>累計 {fmt(nextBuilding.baseCost * 0.25)} 粒で発見</span></div>}
            </> : <>
              {nextFinger && <p className="finger-goal">あと{fmt(nextFinger.clickNeed - clicks)}回握ると「{nextFinger.name}」が解放</p>}
              {nextGoldenUpgrade && <p className="finger-goal">金のおむすび あと{nextGoldenUpgrade.goldenNeed - game.goldenClicks}回で「{nextGoldenUpgrade.name}」が解放</p>}
              {nextPair && <details className="pair-goal"><summary>次の連携：{nextPair.name}</summary><p className="production">{nextPair.desc}</p><div className="pair-requirements">{Object.entries(nextPair.requires).map(([id, need]) => <span key={id}>{BUILDINGS.find(b => b.id === id).name} {Math.min(owned[id] || 0, need)}/{need}</span>)}</div></details>}
              {availableUpgrades.length === 0 && <div className="empty-state">まずは米粒を集めよう。累計20粒で最初の強化が見つかるよ。</div>}
              {availableUpgrades.map(u => <button key={u.id} className={`shop-item upgrade-item ${rice >= u.cost ? "affordable" : ""}`} disabled={rice < u.cost} onClick={() => buyUpgrade(u)}>
                <span className="shop-icon" aria-hidden="true">{u.icon}</span><span className="shop-body"><span className="shop-name">{u.name}</span><span className="production">{u.desc}</span></span><span className="shop-cost">{fmt(u.cost)} 粒</span>
              </button>)}
              {collectedUpgrades.length > 0 && <details className="owned-upgrades"><summary>購入済みの強化 {collectedUpgrades.length} / {UPGRADES.length}</summary>{collectedUpgrades.map(u => <div key={u.id}><b>{u.name}</b><span>{u.desc}</span><small>{u.flavor}</small></div>)}</details>}
            </>}
          </>}
          {view === "collection" && <>
            <div className="subnav collection-nav" aria-label="図鑑の種類">{[["achievements", "実績", `${achCount}/${achievements.length}`], ["recipes", "料理", `${cookedCount}/${RECIPES.length}`], ["buildings", "施設"], ["regulars", "常連", `${regularCount}/${REGULARS.length}`], ["skins", "きせかえ"]].map(([id, label, count]) =>
              <button key={id} aria-pressed={collectionTab === id} className={collectionTab === id ? "selected" : ""} onClick={() => setCollectionTab(id)}>{label}{count && <span className="sub-count">{` ${count}`}</span>}</button>)}</div>
            {collectionTab === "achievements" ? <>
              <div className="collection-stats"><span>{chapter.name}</span><span>{game.rebirths ? `今年 ${fmt(totalRice)} 粒 · 通算 ${fmt(allTime)} 粒` : `累計 ${fmt(totalRice)} 粒`} · {fmt(clicks)} タップ</span></div>
              <button className="regular-summary" onClick={() => setCollectionTab("regulars")}><span>常連の応援 <b>全生産 +{Number(regularBonus.toFixed(2))}%</b></span><span>{waitingRegulars.length ? `${waitingRegulars.length}人が来ています ›` : nextRegular ? `実績あと${nextRegular.need - activeAchievements}個で次の常連 ›` : "常連を見る ›"}</span></button>
              <button className="regular-summary rebirth-summary" aria-label="新米（転生）を開く" onClick={() => { setCollectionTab("shinmai"); setRebirthMessage(""); }}><span>新米 <b>{year}年目 · 種もみ {fmt(seeds)}粒</b></span><span>{rebirthReady ? `+${fmt(seedGain)}粒まけます ›` : "詳しく ›"}{firstRebirthReady && <span className="new-dot" aria-label="新米にできます" />}</span></button>
              <div className="ach-progress"><span style={{width:`${achCount / achievements.length * 100}%`}} /></div>
              <div className="filters" aria-label="実績の絞り込み">{[['all','すべて'],['todo','未達成'],['done','達成済み']].map(([id,label]) => <button key={id} aria-pressed={achFilter === id} onClick={() => setAchFilter(id)}>{label}</button>)}</div>
              {shownAchievements.length === 0 && <p className="empty-state">これから最初のひとつを。</p>}
              {shownAchievements.map(a => <div key={a.id} className={`ach-item ${unlocked[a.id] ? "done" : "locked"}`}><AchIcon id={a.id} done={!!unlocked[a.id]} /><div><div className="ach-name">{a.secret && !unlocked[a.id] ? "ひみつの実績" : a.name}</div><div className="ach-desc">{a.secret && !unlocked[a.id] ? "いつもと違うところに、何かある。" : a.desc}{a.legacy ? " · 旧工房の記念" : ""}{a.building && !unlocked[a.id] && ` · 所持 ${owned[a.building] || 0}/${a.need}`}</div></div>{unlocked[a.id] && <span className="ach-check" aria-label="達成">✓</span>}</div>)}
            </> : collectionTab === "recipes" ? <>
              {outingView ? <div className="outings">
                <div className="outing-heading"><button onClick={() => {
                  if (postcard) setPostcard(null);
                  else if (outing) setSelectedOuting(null);
                  else { setOutingView(false); setKitchen(null); }
                }}>{postcard ? "‹ 届け先に戻る" : outing ? "‹ 届け先一覧" : "‹ レシピ"}</button><span>絵はがき {cardCount}/{totalCards}</span></div>
                {postcardRecipe && outing ? <article className="postcard">
                  <PostcardArt outing={outing} recipeId={postcardRecipe.id} />
                  <div className="postcard-letter"><h2>{outing.name}より</h2><span>{postcardRecipe.name}</span><p>{OUTING_STORIES[outing.id].lines[postcardRecipe.id]}</p></div>
                  {PLATES.filter(p => p.need > 0 && p.need <= cardCount).slice(-1).filter(p => p.id !== plate.id).map(p => <button className="plate-use" key={p.id} onClick={() => { setGame(s => Game.selectPlate(s, p.id)); pushToast(`${p.name}に替えました`); }}>{p.name}を使う</button>)}
                </article> : outing ? <>
                  <h2 className="outing-title">{outing.name}</h2>
                  <PostcardArt outing={outing} />
                  {RECIPES.map(r => {
                    const sent = game.souvenirs?.[`${outing.id}:${r.id}`] === true;
                    const ready = (owned[outing.building] || 0) >= outing.need;
                    return <div className="delivery-row" key={r.id}><MealArt id={r.id} plate={plate.id} /><div><h3>{r.name}</h3>
                      {sent ? <button aria-label={`${r.name}の絵はがきを読む`} onClick={() => setPostcard(r.id)}>絵はがきを読む</button> : recipes[r.id] ? <>
                        <button aria-label={`${r.name}を届ける`} disabled={!ready || rice < outing.cost} onClick={() => deliverMeal(r.id)}>届ける · {fmt(outing.cost)} 粒</button>
                        {!ready ? <p className="recipe-cost">{BUILDINGS.find(b => b.id === outing.building).name} {outing.need}必要</p> : rice < outing.cost && <p className="recipe-cost">あと {fmt(Math.ceil(outing.cost - rice))} 粒</p>}
                      </> : <button aria-label={`${r.name}のレシピへ`} disabled={!Game.recipeUnlocked(game, r.id)} onClick={() => { setOutingView(false); setKitchen({ id: r.id, step: 0, diner: 0, decoration: 0 }); }}>まず料理を作る</button>}
                    </div></div>;
                  })}
                </> : <>
                  {nextPlate ? <p className="collection-reward">あと {nextPlate.need - cardCount}枚で「{nextPlate.name}」</p> : <p className="collection-reward">27枚そろった！ どこへでも、また読みに行ける。</p>}
                  {OUTINGS.map(o => {
                    const known = Game.outingUnlocked(game, o.id);
                    const count = RECIPES.filter(r => game.souvenirs?.[`${o.id}:${r.id}`] === true).length;
                    const building = BUILDINGS.find(b => b.id === o.building);
                    return <button className={`outing-card ${count === RECIPES.length ? "complete" : ""}`} key={o.id} aria-label={`${o.name}へ`} disabled={!known} onClick={() => setSelectedOuting(o.id)}>
                      <PostcardArt outing={o} /><span><b>{o.name}</b><small>{known ? `絵はがき ${count}/${RECIPES.length}` : `${building.name} ${owned[o.building] || 0}/${o.need}`}</small></span><span aria-hidden="true">{count === RECIPES.length ? "✓" : known ? "›" : "—"}</span>
                    </button>;
                  })}
                </>}
              </div> : <>
              {!selectedRecipe && <>
                <button className="outing-summary" aria-label="おすそわけを開く" onClick={openOutings}><b>おすそわけ</b><span>絵はがき {cardCount}/{totalCards} ›</span></button>
                <details className="plate-picker"><summary>お皿：{plate.name}</summary><div>{PLATES.map(p => <button key={p.id} aria-pressed={p.id === plate.id} disabled={cardCount < p.need} onClick={() => setGame(s => Game.selectPlate(s, p.id))}><span className={`plate-swatch ${p.id}`} style={{ background: PLATE_COLORS[p.id][0], borderColor: PLATE_COLORS[p.id][1] }} aria-hidden="true" /><span>{p.name}<small>{cardCount < p.need ? `絵はがき ${p.need}枚` : p.id === plate.id ? "✓" : ""}</small></span></button>)}</div></details>
              </>}
              {selectedRecipe ? <div className="kitchen">
                <div className="kitchen-heading"><button onClick={() => setKitchen(null)}>‹ 料理一覧</button><h2>{selectedRecipe.name}</h2><span>{kitchen.step === 3 ? "完成" : `${kitchen.step + 1}/3`}</span></div>
                <MealArt id={selectedRecipe.id} stage={kitchen.step} decoration={kitchen.decoration} plate={plate.id} />
                {kitchen.step < 3 ? <>
                  {kitchen.step < 2 ? <button className="cook-action" onClick={() => setKitchen(k => ({ ...k, step: Math.min(kitchen.step + 1, 2) }))}>{MEAL_STEPS[selectedRecipe.id][kitchen.step]}</button> : <button className="cook-action" disabled={rice < selectedRecipe.cost} onClick={() => {
                    let cooked = false;
                    setGame(s => {
                      const next = Game.cookRecipe(s, selectedRecipe.id);
                      cooked = next !== s;
                      return next;
                    });
                    if (cooked) {
                      setKitchen(k => ({ ...k, step: 3 }));
                      pushToast(`${selectedRecipe.name}、できあがり！`);
                    }
                  }}>完成させる · {fmt(selectedRecipe.cost)} 粒</button>}
                  {kitchen.step === 2 && rice < selectedRecipe.cost && <p className="recipe-cost">あと {fmt(Math.ceil(selectedRecipe.cost - rice))} 粒</p>}
                </> : <>
                  <div className="recipe-complete">✓ 図鑑に記録済み</div>
                  <div className="meal-reaction"><b>{diner.name}</b><p>「{MEAL_REACTIONS[selectedRecipe.id][diner.id]}」</p></div>
                  <div className="meal-actions">{diners.length > 1 && <button onClick={() => setKitchen(k => ({ ...k, diner: k.diner + 1 }))}>感想を聞く</button>}{selectedRecipe.id === "omurice" && <button onClick={() => setKitchen(k => ({ ...k, decoration: k.decoration + 1 }))}>ケチャップで描く</button>}</div>
                  <button className="outing-summary" onClick={openOutings}><b>おすそわけへ</b><span>{cardCount}/{totalCards} ›</span></button>
                </>}
              </div> : RECIPES.map(r => {
                const known = Game.recipeUnlocked(game, r.id), done = recipes[r.id];
                return <div className={`recipe-card ${done ? "cooked" : ""}`} key={r.id}>
                  <MealArt id={r.id} stage={3} plate={plate.id} />
                  <div><h2>{r.name}</h2><p className="recipe-cost">{done ? "✓ 図鑑に記録済み" : known ? `${fmt(r.cost)} 粒` : r.hint}</p>
                  <button aria-label={`${r.name}${done ? "を見る" : "を作る"}`} disabled={!known} onClick={() => setKitchen({ id: r.id, step: done ? 3 : 0, diner: 0, decoration: 0 })}>{done ? "料理を見る" : known ? "作ってみる" : "未解放"}</button></div>
                </div>;
              })}
              </>}
            </> : collectionTab === "shinmai" ? <div className="rebirth-panel">
              <div className="outing-heading"><button onClick={() => { setCollectionTab("achievements"); setRebirthConfirm(false); }}>‹ 実績</button><span>{year}年目</span></div>
              <h2 className="outing-title">新米の季節</h2>
              <div className="regular-total"><span>種もみ {fmt(seeds)}粒</span><b>全生産 ×{fmtTimes(Game.seedMultiplier(game))}</b></div>
              {rebirthReady ? <p className="collection-reward">今なら種もみ +{fmt(seedGain)}粒 → 全生産 ×{fmtTimes(Game.seedMultiplier(rebirthPreview))}</p>
                : totalRice < Game.REBIRTH_YEAR_RICE ? <p className="recipe-cost">今年の累計1兆粒で新米にできます（あと {fmt(Math.ceil(Game.REBIRTH_YEAR_RICE - totalRice))} 粒）</p>
                : <p className="recipe-cost">次の種もみまで 通算あと {fmt(Math.ceil(nextSeedRice))} 粒</p>}
              {rebirthReady && <p className="recipe-cost">もう1粒増えるまで あと {fmt(Math.ceil(nextSeedRice))} 粒</p>}
              <ul className="heirlooms" aria-label="種もみで受け継ぐもの">{Game.HEIRLOOMS.map(h => <li key={h.id} className={seeds >= h.seeds ? "done" : ""}><b>{h.name}</b><span>{h.desc}</span><small>{seeds >= h.seeds ? "✓ 受け継ぎ中" : `種もみ ${fmt(h.seeds)}粒で`}</small></li>)}</ul>
              {rebirthMessage && <p className="save-message" role="status">{rebirthMessage}</p>}
              {rebirthConfirm && rebirthPreview ? <div className="rebirth-confirm" role="group" aria-label="新米の確認">
                <h3>新米にしますか？</h3>
                <dl>
                  <dt>もらえる</dt><dd>種もみ +{fmt(seedGain)}粒（合計 {fmt(Game.seedCount(rebirthPreview))}粒・全生産 ×{fmtTimes(Game.seedMultiplier(game))} → ×{fmtTimes(Game.seedMultiplier(rebirthPreview))}）{Game.HEIRLOOMS.filter(h => seeds < h.seeds && Game.seedCount(rebirthPreview) >= h.seeds).map(h => `・${h.name}`).join("")}</dd>
                  <dt>最初に戻る</dt><dd>米粒 {fmt(rice)}粒・施設 {fmt(Object.values(owned).reduce((a, n) => a + n, 0))}個・ショップの強化 {collectedUpgrades.length - Object.keys(rebirthPreview.upgrades).length}個・今年の累計と章</dd>
                  <dt>残る</dt><dd>実績・料理・絵はがき・お皿・きせかえ・常連・握った回数・金のおむすびの記録{UPGRADES.some(u => u.kind !== "regular" && rebirthPreview.upgrades[u.id]) && `・持ち越す強化 ${UPGRADES.filter(u => u.kind !== "regular" && rebirthPreview.upgrades[u.id]).length}個`}</dd>
                </dl>
                {activeBoosts.length > 0 && <p className="recipe-cost">発動中の金のおむすびの効果は終わります。</p>}
                <p className="panel-help">実行前のデータをこの端末に1件控え、セーブ画面から保存・復元できます。控えを保存できない場合は新米にしません。</p>
                <div className="craft-row"><button className="craft-btn" onClick={() => setRebirthConfirm(false)}>やめる</button><button className="craft-btn rebirth-go" onClick={startNewYear}>新米にする · 種もみ +{fmt(seedGain)}</button></div>
              </div> : <button className="craft-btn file-load" disabled={!rebirthReady} onClick={() => { setRebirthConfirm(true); setRebirthMessage(""); }}>新米にする…</button>}
            </div> : collectionTab === "regulars" ? <>
              <div className="regular-total"><span>実績 {activeAchievements}個</span><b>全生産 +{Number(regularBonus.toFixed(2))}%</b></div>
              {REGULARS.map(r => {
                const welcomed = !!upgrades[r.id], known = welcomed || activeAchievements >= r.need;
                return <div key={r.id} className={`regular-card ${welcomed ? "welcomed" : ""}`}>
                  <RegularPortrait kind={r.portrait} known={known} />
                  <div className="regular-body"><h2>{known ? r.name : "まだ見ぬ常連"}</h2>
                    {known ? <><p className="shop-desc">{r.flavor}</p><p className="production">実績1個につき全生産 +{r.support * 100}%{welcomed && `（今は +${Number((activeAchievements * r.support * 100).toFixed(2))}%）`}</p></> : <p className="shop-desc">実績 {activeAchievements}/{r.need}個で出会える</p>}
                  </div>
                  {welcomed ? <div className="regular-conversation"><p>「{r.lines[(regularLines[r.id] || 0) % r.lines.length]}」</p><button onClick={() => setRegularLines(lines => ({ ...lines, [r.id]: (lines[r.id] || 0) + 1 }))} aria-label={`${r.name}と話す`}>話す</button></div> : known && <button className="regular-welcome" disabled={rice < r.cost} onClick={() => buyUpgrade(UPGRADES.find(u => u.id === r.id))}>{r.name}を迎える · {fmt(r.cost)} 粒</button>}
                </div>;
              })}
            </> : collectionTab === "skins" ? <>
              <div className="skin-grid">{SKINS.map(s => <button key={s.id} className={`skin-card ${activeSkin === s.id ? "active" : ""}`} aria-pressed={activeSkin === s.id} disabled={!skinsOwned[s.id] && (rice < s.cost || seeds < (s.seeds || 0))} onClick={() => buySkin(s)}>
                <div className="skin-preview" aria-hidden="true"><OnigiriSVG skin={s} /></div><div className="skin-name">{s.name}</div><div className="skin-ab">{s.ability}</div><div className="skin-price">{activeSkin === s.id ? "着用中" : skinsOwned[s.id] ? "着替える" : s.seeds ? (seeds < s.seeds ? `種もみ ${fmt(s.seeds)}粒で` : "着てみる") : `${fmt(s.cost)} 粒`}</div>
              </button>)}</div>
            </> : <>
              {BUILDINGS.every(b => !owned[b.id]) && <p className="empty-state">ショップで最初のおばあちゃんを迎えよう。</p>}
              {BUILDINGS.filter(b => owned[b.id]).map(b => <div key={b.id} className="building-row"><div className="building-head"><b>{b.name}</b><span>×{owned[b.id]}</span></div><p className="shop-desc">{b.desc}</p><div className="building-icons" aria-hidden="true">{b.icon.repeat(Math.min(owned[b.id], 16))}{owned[b.id] > 16 && ` +${owned[b.id]-16}`}</div><div className="production">合計 毎秒 {fmtCps(Game.buildingRate(game, b) * owned[b.id])} 粒</div></div>)}
            </>}
          </>}
          {view === "save" && <>
            <div className="save-status"><b>{storageError ? "自動保存を確認してください" : "この端末に自動保存"}</b><span>{lastSaved ? `最終保存 ${new Date(lastSaved).toLocaleTimeString('ja-JP')}` : ""}</span></div>
            <div className="craft-row"><button className="craft-btn" onClick={copySave}>{blocked.current ? "保護中コードをコピー" : "最新コードをコピー"}</button><button className="craft-btn" onClick={() => downloadSave(makeSaveCode())}>ファイルに保存</button></div>
            <button className="craft-btn file-load" disabled={readingFile} onClick={() => fileInputRef.current?.click()}>{readingFile ? "読み込み中…" : "ファイルを読み込む"}</button>
            <input ref={fileInputRef} type="file" accept=".txt,text/plain" aria-label="セーブファイル" hidden onChange={importFile} />
            <p ref={saveMessageRef} className="save-message" role="status">{saveMessage}</p>
            <p className="panel-help">読み込みは今の進行を置き換えます。残したい進行は先に保存してください。</p>
            <details className="save-help" open={showSaveCode} onToggle={e => setShowSaveCode(e.currentTarget.open)}><summary>コードで読み込む・手動コピー</summary>
              <label htmlFor="save-code" className="section-label">セーブコード</label>
              <textarea ref={saveCodeRef} id="save-code" className="save-area" value={saveText} onChange={e => setSaveText(e.target.value)} placeholder="保存してあるコードを貼り付ける" spellCheck="false" />
              <div className="craft-row"><button className="craft-btn" onClick={() => { if (makeSaveCode()) setSaveMessage(blocked.current ? "保護中のコードを表示しました。" : "最新のコードを表示しました。"); }}>{blocked.current ? "保護中コードを表示" : "最新コードを表示"}</button><button className="craft-btn" disabled={!saveText} onClick={() => { saveCodeRef.current?.focus(); saveCodeRef.current?.select(); saveCodeRef.current?.setSelectionRange(0, saveText.length); }}>全選択</button></div>
              <button className="craft-btn file-load" disabled={!saveText.trim() || readingFile} onClick={() => importSave(saveText)}>コードを読み込む</button>
              {importBackup && <div className="import-backup"><button className="craft-btn file-load" onClick={() => downloadSave(importBackup, "omusubi-before-import")}>読み込み前のデータを保存</button></div>}
            </details>
            {rebirthBackup && <div className="import-backup rebirth-backup"><p className="panel-help">戻すと今の進行は「読み込み前のデータ」に控えます。</p>
              <button className="craft-btn file-load" onClick={() => downloadSave(rebirthBackup, "omusubi-before-rebirth")}>新米前のデータを保存</button>
              {restoreConfirm ? <div className="craft-row"><button className="craft-btn" onClick={() => setRestoreConfirm(false)}>やめる</button><button className="craft-btn" onClick={() => { setRestoreConfirm(false); importSave(rebirthBackup); }}>新米前に戻す</button></div>
                : <button className="craft-btn file-load" onClick={() => setRestoreConfirm(true)}>新米前に戻す…</button>}
            </div>}
            <details className="save-help"><summary>遊び方・このゲームについて</summary><p>おむすびを握って米粒を集め、施設を買うと自動生産。強化でさらに増えます。閉じている間も最大4時間、生産が進みます。きせかえは能力も変わり、購入済みなら何度でも着替えられます。金のおむすびは米粒の贈り物、30秒間の生産7倍、ときどき13秒間のクリック777倍！</p><p>具材は基本のクリックを強くし、焼き鮭からは毎秒生産に応じた米粒も1クリックへ追加します。施設を組み合わせてそろえると、両方を強くする連携がショップに解放されます。</p><p>図鑑の「料理」では集めた米粒でレシピを試作できます。盛り付けを進めて「完成させる」を押した時だけ、初回の米粒を使います。完成品を見たり、常連の感想を聞いたりするのは無料。料理は売らずに図鑑へ残ります。必要な粒数はゲーム内の値で、実際の料理の分量とは異なります。</p><p>料理の「おすそわけ」は、施設を育てると届け先が増えます。作った料理を米粒で届けると、場所と料理ごとに1枚、全27枚の絵はがきが届きます。3・12・27枚でお皿を獲得。お皿は見た目だけが変わり、読み返しや付け替えは無料です。期限はありません。</p><p>実績を8・20・35・50個集めると、図鑑の「常連」にお客さんが登場します。一度迎えると、実績の数に応じて全生産をずっと応援。常連同士の応援は足し算で、旧工房の記念実績は対象外です。</p><p>神の手は発動時のクリック力が基準です。効果中に買った施設や強化は、通常のクリックや次の神の手に反映されます。具材と「指」の生産連動分には、重なった炊飯祭りの7倍も乗ります。同じ効果を取ると残り時間が更新されます。</p><p>金をつかまえて15回続けて神の手が出なければ、次は必ず神の手。不発の回数も保存されます。金を7・27・77回つかまえると金専用の強化が解放され、保温ジャーで神の手は26秒になります。一時効果は再読み込み・セーブの復元で終了します。</p><p>図鑑の実績にある「新米」では、今年の累計が1兆粒をこえると来年をはじめられます。通算でとれた米粒に応じて種もみがたまり（通算の立方根、10億粒で1粒）、全生産をずっと強くします。種もみが10倍になると効果は約2.5倍。米粒・施設・ショップの強化と今年の累計は最初に戻り、実績・料理・絵はがき・お皿・きせかえ・常連・握った回数・金のおむすびの記録は残ります。種もみ10・1,000・10万粒で金・具材・指と連携の強化を持ち越し、100万粒で「新米むすび」を着られます。種もみは使ったり売ったりしません。すぐ新米にしても種もみは少しだけなので、伸びがゆるやかになってからが目安です。実行前のデータは1件控え、セーブ画面から戻せます。</p><p>旧版のコードも読み込めます。旧工房の在庫は最高売値で米粒に、契約農家は購入費用に戻します。取得した実績も残ります。自動保存はこのブラウザ・このサイト専用です。</p><p>Respect for <a href="https://orteil.dashnet.org/cookieclicker/" target="_blank" rel="noopener noreferrer">Cookie Clicker</a> — by Orteil &amp; Opti。クリック、生産、強化、金のボーナスの仕組みに影響を受けた非公式のおむすびゲームです。</p></details>
          </>}
          </div>}
        </section>
      </main>
      <footer className="footer-stats">{game.rebirths ? `${year}年目 · 今年 ${fmt(totalRice)} 粒` : `累計 ${fmt(totalRice)} 粒`} <span>·</span> {clicks.toLocaleString('ja-JP')} 回握った <span>·</span> 実績 {achCount}/{achievements.length}</footer>
      <div className="toast-area" role="status" aria-live="polite">{toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<OnigiriClicker />);

