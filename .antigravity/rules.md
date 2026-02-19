# 專案特定細則：金融資料 CSV 轉 Excel 工具 (Financial CSV Converter)

> [!IMPORTANT]
> 本專案嚴格遵循「全域開發憲法 v1.1」。所有開發計畫 (Plan) 與任務 (Task) 必須使用繁體中文。

## 1. 核心業務邏輯 (Business Logic)
- **帳號保護**：強制將所有包含帳號的欄位識別為「字串 (String)」，嚴禁 Excel 將其轉為科學記號或移除前導零（例如 `0081...` 不可變為 `81...`）。
- **金額清理邏輯**：
  - 移除 `+` 正號。
  - 移除 `.00` 尾碼，並轉為純整數格式。
- **日期處理**：維持原始文字格式（如 `2025/01/01`），禁止 Excel 自動轉換為日期格式導致失真。
- **合併模式命名規則**：`MMDD_HHMM合併金流.xlsx`（依據目前系統時間）。

## 2. 架構轉化規範 (Constitution Alignment)
- **單檔化指令**：將原始說明的 `src/`, `dist/`, `assets/` 結構全部摺疊入單一 `index.html`。
- **外部資源清單 (CDN)**：
  - CSS: `https://cdn.tailwindcss.com`
  - JS: `https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js` (SheetJS)
  - Icons: 使用 Inline SVG 或 FontAwesome CDN。

## 3. 動態配置 UI (UI Configuration)
根據憲法第 2 條，必須在網頁右側實作「轉換參數設定面板」，包含：
- `EXCEL_CELL_TYPE`: 儲存格預設格式 (Select: 文字, 數值, 自動)。
- `STRIP_CURRENCY_SYMBOLS`: 是否移除金額符號 (Toggle: 預設開啟)。
- `SHEET_NAME_PREFIX`: 合併模式的分頁前綴 (Input: 預設為空，自動編號 01, 02...)。
- `THEME_ACCENT`: 介面重點色設定 (Color Picker: 預設金融藍 #1E3A8A)。

## 4. 防禦性與效能
- **大檔案處理**：若 CSV 超過 50MB，必須顯示「處理中...」遮罩，避免瀏覽器無回應。
- **錯誤捕捉**：解析 CSV 失敗時，必須跳出繁體中文錯誤提示（使用 Emoji ⚠️ 標示），並指出可能的錯誤行數。