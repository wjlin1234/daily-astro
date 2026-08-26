const fs = require('fs');

// --- 1. 天文演算法（從原排盤程式移植） ---
const ZODIAC_SIGNS = [
  { key: 'aries', name: '牡羊座', symbol: '♈' },
  { key: 'taurus', name: '金牛座', symbol: '♉' },
  { key: 'gemini', name: '雙子座', symbol: '♊' },
  { key: 'cancer', name: '巨蟹座', symbol: '♋' },
  { key: 'leo', name: '獅子座', symbol: '♌' },
  { key: 'virgo', name: '處女座', symbol: '♍' },
  { key: 'libra', name: '天秤座', symbol: '♎' },
  { key: 'scorpio', name: '天蠍座', symbol: '♏' },
  { key: 'sagittarius', name: '射手座', symbol: '♐' },
  { key: 'capricorn', name: '摩羯座', symbol: '♑' },
  { key: 'aquarius', name: '水瓶座', symbol: '♒' },
  { key: 'pisces', name: '雙魚座', symbol: '♓' }
];

function degToZodiac(deg) {
  const normalized = ((deg % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  const degInSign = Math.floor(normalized % 30);
  const minInSign = Math.floor(((normalized % 30) - degInSign) * 60);
  const sign = ZODIAC_SIGNS[signIndex];
  return { signIndex, signName: sign.name, signSymbol: sign.symbol, degText: `${degInSign}°${String(minInSign).padStart(2, '0')}'` };
}

function getJulianDay(dateUT) {
  let year = dateUT.getUTCFullYear();
  let month = dateUT.getUTCMonth() + 1;
  const day = dateUT.getUTCDate() + dateUT.getUTCHours() / 24 + dateUT.getUTCMinutes() / 1440;
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

function solveKepler(M, e) {
  let E = M;
  for (let i = 0; i < 15; i++) {
    const deltaE = (M - (E - e * Math.sin(E))) / (1 - e * Math.cos(E));
    E += deltaE;
    if (Math.abs(deltaE) < 1e-7) break;
  }
  return E;
}

function getHeliocentricPos(elem, T) {
  const a = elem.a[0] + elem.a[1] * T;
  const e = elem.e[0] + elem.e[1] * T;
  const I = (elem.I[0] + elem.I[1] * T) * (Math.PI / 180);
  const L = (elem.L[0] + elem.L[1] * T) * (Math.PI / 180);
  const wBar = (elem.wBar[0] + elem.wBar[1] * T) * (Math.PI / 180);
  const node = (elem.node[0] + elem.node[1] * T) * (Math.PI / 180);
  const w = wBar - node;
  let M = L - wBar;
  M = ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const E = solveKepler(M, e);
  const xOrb = a * (Math.cos(E) - e);
  const yOrb = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const Px = Math.cos(w) * Math.cos(node) - Math.sin(w) * Math.sin(node) * Math.cos(I);
  const Py = Math.cos(w) * Math.sin(node) + Math.sin(w) * Math.cos(node) * Math.cos(I);
  const Qx = -Math.sin(w) * Math.cos(node) - Math.cos(w) * Math.sin(node) * Math.cos(I);
  const Qy = -Math.sin(w) * Math.sin(node) + Math.cos(w) * Math.cos(node) * Math.cos(I);
  return { x: xOrb * Px + yOrb * Qx, y: xOrb * Py + yOrb * Qy };
}

function getGeocentricPositions(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  const elements = {
    Earth: { a: [1.00000261, 0.00000562], e: [0.01671123, -0.00004392], I: [-0.00001531, -0.01294668], L: [100.46457166, 35999.37244981], wBar: [102.93768193, 0.32327364], node: [0.0, 0.0] },
    Mercury: { a: [0.38709893, 0.0], e: [0.20563069, 0.00002527], I: [7.00487, 0.001831], L: [252.25084, 149472.67411], wBar: [77.45645, 0.160476], node: [48.33167, -0.125340] },
    Venus: { a: [0.72333199, 0.0], e: [0.00677323, -0.00004938], I: [3.39471, -0.000857], L: [181.97973, 58517.81538], wBar: [131.56370, 0.002683], node: [76.68069, -0.277693] },
    Mars: { a: [1.52366231, 0.0], e: [0.09341233, 0.00011902], I: [1.85061, -0.002547], L: [355.45332, 19140.30268], wBar: [336.04084, 0.444410], node: [49.57854, -0.294985] },
    Jupiter: { a: [5.20336301, 0.0], e: [0.04839266, -0.00012800], I: [1.30530, -0.004157], L: [34.40438, 3034.74612], wBar: [14.72847, 0.212526], node: [100.55615, 0.201720] },
    Saturn: { a: [9.53707032, 0.0], e: [0.05415060, -0.00036762], I: [2.48446, 0.006110], L: [49.94432, 1222.49389], wBar: [92.43194, 0.541794], node: [113.71504, -0.288677] }
  };
  const posEarth = getHeliocentricPos(elements.Earth, T);
  const sunLon = (Math.atan2(-posEarth.y, -posEarth.x) * (180 / Math.PI) + 360) % 360;

  const L_moon = 218.3164477 + 481267.88123421 * T;
  const M_moon = 134.9633964 + 477198.8675055 * T;
  const D_moon = 297.8501921 + 445267.1114034 * T;
  const moonLon = L_moon + 6.2886 * Math.sin(M_moon * Math.PI / 180) + 1.2740 * Math.sin((2 * D_moon - M_moon) * Math.PI / 180);

  const getPlanetLon = (key) => {
    const pos = getHeliocentricPos(elements[key], T);
    return (Math.atan2(pos.y - posEarth.y, pos.x - posEarth.x) * (180 / Math.PI) + 360) % 360;
  };

  return [
    { name: '太陽', lon: sunLon },
    { name: '月亮', lon: ((moonLon % 360) + 360) % 360 },
    { name: '水星', lon: getPlanetLon('Mercury') },
    { name: '金星', lon: getPlanetLon('Venus') },
    { name: '火星', lon: getPlanetLon('Mars') },
    { name: '木星', lon: getPlanetLon('Jupiter') },
    { name: '土星', lon: getPlanetLon('Saturn') }
  ];
}

// 計算目標日期的 12 上升星座宮位配置文字
function generateTransitPrompt(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const jd = getJulianDay(new Date(Date.UTC(y, m - 1, d, 4, 0))); // 台灣中午 12:00
  const planets = getGeocentricPositions(jd);

  let text = `【日期基準】：${dateStr} (台灣時間)\n\n`;
  ZODIAC_SIGNS.forEach((asc, ascIndex) => {
    text += `### 上升 ${asc.name} (${asc.key})\n`;
    planets.forEach(p => {
      const z = degToZodiac(p.lon);
      const house = ((z.signIndex - ascIndex + 12) % 12) + 1;
      text += `- ${p.name}: ${z.signName} (${z.degText}) 落入 第 ${house} 宮\n`;
    });
    text += `\n`;
  });
  return text;
}

// --- 2. 呼叫 Gemini API ---
async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("錯誤：找不到 GEMINI_API_KEY 環境變數！");
    process.exit(1);
  }

  // 設定目標日期（台灣時間明天）
  const targetDate = new Date();
  targetDate.setHours(targetDate.getHours() + 8 + 24); // 取得明天日期
  const dateStr = targetDate.toISOString().split('T')[0];

  console.log(`正在計算 ${dateStr} 的 12 上升星盤配置...`);
  const astroDataPrompt = generateTransitPrompt(dateStr);

  const prompt = `你是一位精通現代西洋占星與心理行為引導的占星大師。以下是 ${dateStr} 當天 12 個上升星座的精確行星與宮位配置資料：

${astroDataPrompt}

請根據上述各上升星座的行星落入宮位配置，為 12 個上升星座撰寫精闢的每日運勢與財運分析。
語氣風格請保持：專業客觀、沉穩、具心理建設性，著重在個人行動指引與資源配置。

請嚴格輸出為以下 JSON 格式（不要包含 markdown 標籤外的任何閒聊字眼）：
{
  "date": "${dateStr}",
  "fortune": {
    "aries": {
      "overview": "整體氣場與運勢解析 (約 80-120 字)",
      "wealth": "財運、投資與資源配置分析 (約 80-120 字)",
      "action_tip": "一句話行動錦囊 (約 30 字內)"
    },
    "taurus": { ... },
    "gemini": { ... },
    "cancer": { ... },
    "leo": { ... },
    "virgo": { ... },
    "libra": { ... },
    "scorpio": { ... },
    "sagittarius": { ... },
    "capricorn": { ... },
    "aquarius": { ... },
    "pisces": { ... }
  }
}`;

  console.log("正在呼叫 Gemini API 生成運勢 JSON...");
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API 呼叫失敗: ${response.status} - ${errorText}`);
  }

  const resJson = await response.json();
  const content = resJson.candidates[0].content.parts[0].text;
  
  fs.writeFileSync('fortune-today.json', content, 'utf-8');
  console.log("成功生成 fortune-today.json！");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
