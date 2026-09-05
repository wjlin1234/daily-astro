專案用途：提供整體運勢、財運與行動建議，並說明使用者要選「上升星座」。

## 網域與連結待辦

- 等自訂網域名稱確定後，再一起更新本站網址與 `index.html` 底部的工具連結；目前保留原連結。
- 本站目前網址：https://daily-astro.wlin12.workers.dev
- 底部「免費個性分析，30 秒看懂真正的自己／馬上開始」目前連到：https://wjlin1234.github.io/astro-action/
- 新網域尚未確定，暫不替換連結。

## Cloudflare 部署紀錄

2026-09-05 已確認 Cloudflare Workers 建置與部署成功，只發布 `dist` 裡的 `index.html` 和 `fortune-today.json`。README、`generate.js` 與 GitHub Actions 工作流程不包含在這次網站發布內容中。

- Build command：`mkdir -p dist && cp index.html fortune-today.json dist/`
- Deploy command：`npx wrangler deploy --assets ./dist --name daily-astro --compatibility-date 2026-09-03`
- Version command：`npx wrangler versions upload --assets ./dist --name daily-astro --compatibility-date 2026-09-03`
- Root directory：`/`
