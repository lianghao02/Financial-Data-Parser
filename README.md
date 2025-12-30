# CSV 轉 Excel 金融資料轉換工具 (CSV to Excel Converter)

這是一個專為金融帳戶資料設計的網頁端轉換工具，能夠將 CSV 檔案快速轉換為格式正確的 Excel 檔案。特別針對台灣金融資料常見的格式問題（如帳號前導零、金額符號）進行了優化處理。

## ✨ 功能特色

- **直覺的操作介面**：支援拖放 (Drag & Drop) 檔案，亦可點擊選取。
- **批次處理**：支援單選或多選 CSV 檔案進行轉換。
- **兩種匯出模式**：
  - **個別儲存**：將每個 CSV 轉換為獨立的 Excel 檔案，保留原始檔名。
  - **合併儲存**：將所有 CSV 合併至同一個 Excel 檔案的不同分頁（分頁名稱自動編號為 01, 02...），檔案名稱自動產生為 `MMDD_HHMM合併金流.xlsx`。
- **智慧格式修正**：
  - **帳號保護**：保留帳號的前導零，防止 Excel 自動轉為科學記號或數值。
  - **日期/時間保持**：維持原始文字格式，不隨意補零或變更。
  - **金額清理**：自動移除金額欄位中的 `+` 號及 `.00`，僅保留整數數字，方便後續計算。

## 🚀 使用方式

## 🚀 使用方式 (開發與執行)

### 1. 安裝依賴
請確保已安裝 Node.js，然後在專案根目錄執行：
```bash
npm install
```


### 2. 開發模式 (Development)

啟動 Tailwind CSS 監聽模式，即時編譯 CSS：

```bash
npm run dev
```

### 3. 建置專案 (Build)

編譯並壓縮 CSS 以供生產環境使用：

```bash
npm run build
```

### 4. 執行

直接使用瀏覽器開啟 `index.html` 即可使用。

## 🛠️ 技術棧

- **HTML5**: 語意化標籤結構。
- **Tailwind CSS**: Utility-first CSS 框架 (本地編譯)。
- **JavaScript (Vanilla)**: 核心邏輯處理 (ES6+)。
- **SheetJS (xlsx)**: 用於 Excel 生成 (本地資源，無需連網)。
- **FontAwesome (SVG)**: 使用 Inline SVG 圖示，無外部請求。

## ⚠️ 注意事項

- 本專案已完全**在地化 (Localized)**，除了 Google Fonts 外不依賴外部 CDN，可離線使用 (需先下載字體或接受預設字體)。
- 為了確保資料正確性，所有欄位預設以「文字」格式寫入 Excel，避免 Excel 自動格式化造成的資料失真。

## 📂 專案結構

```text
/
├── assets/
│   ├── images/   # 圖片資源 (favicon)
│   └── vendor/   # 第三方套件 (xlsx)
├── src/
│   ├── input.css # Tailwind 輸入檔
│   └── script.js # 核心邏輯
├── dist/         # (可選) 輸出目錄
├── index.html    # 主要入口
├── output.css    # Tailwind 編譯輸出
└── tailwind.config.js
```

---
*Developed for efficient financial data processing.*
