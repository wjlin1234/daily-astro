# daily-astro

每日上升星座運勢靜態頁。專案會用 `generate.js` 計算當天的星象資料，呼叫 Gemini API 生成 `fortune-today.json`，前端再讀取這份 JSON 顯示 12 上升星座的整體狀態、財務節奏與行動建議。

## 專案內容

- `index.html`：單檔靜態前端，透過 CDN 載入 React、Tailwind CSS 與 Babel。
- `generate.js`：每日資料生成腳本，會先驗證 Gemini 回應格式，確認完整後才覆蓋 `fortune-today.json`。
- `fortune-today.json`：前端讀取的每日運勢資料。
- `.github/workflows/daily-astro.yml`：每日自動更新排程。

## 本機預覽

建議用本機伺服器預覽，讓瀏覽器可以正常讀取 `fortune-today.json`。

```bash
python3 -m http.server 8000
```

然後開啟：

```text
http://localhost:8000
```

## 手動生成資料

先設定 Gemini API key：

```bash
export GEMINI_API_KEY="你的 API key"
```

再執行：

```bash
node generate.js
```

腳本會生成台灣時間「今天」的資料。若 Gemini 暫時忙碌或限流，腳本會自動等待並重試。若 Gemini 回應不是有效 JSON、缺少星座欄位、缺少必要文字欄位，或輸出含有前台不應出現的占星術語，腳本會停止並保留原本的 `fortune-today.json`。

## GitHub Actions 設定

Repository 需要設定 secret：

```text
GEMINI_API_KEY
```

排程目前是每天 `UTC 16:15` 執行，也就是台灣時間隔日 `00:15`。更新成功後，workflow 會提交新的 `fortune-today.json` 到 repository。

## 部署

這是純靜態網站，可以直接部署到 GitHub Pages 或任何靜態網站服務。部署時只需要包含：

- `index.html`
- `fortune-today.json`

如果使用 GitHub Pages，確認 Pages 指向 repository 的主分支與根目錄即可。
