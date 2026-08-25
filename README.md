# 金融資料 CSV 轉 Excel 解析工具 v1.7.0

## 技術架構現況（2026-08-24）

本專案主力為 **HTML5／Vanilla JavaScript**，搭配專案內附 SheetJS、JSZip 與編碼函式庫於瀏覽器本機處理資料。現階段維持免安裝靜態網站；若需改善大型檔案互動，優先導入 Web Worker，不進行語言遷移。

[![Version](https://img.shields.io/badge/version-v1.7.0-blue.svg)](CHANGELOG.md)
[![Runtime](https://img.shields.io/badge/runtime-browser-orange.svg)](index.html)

這是一套在瀏覽器本機執行的 CSV／ZIP 轉 Excel 工具，適合整理銀行交易明細及需要保留帳號前導零的表格資料。轉檔核心使用專案內附的 JavaScript 函式庫，不會主動將檔案上傳到外部服務。

## 下載、依賴與部署

- **安裝**：不需 Python、Node.js 或 Excel；下載 ZIP、解壓後開啟 `index.html` 即可使用。
- **本機依賴**：SheetJS、JSZip 與編碼處理函式庫已放在 `js/libs/`，核心 CSV／ZIP 轉檔不依賴第三方伺服器。
- **網路邊界**：畫面樣式使用 Tailwind CDN；離線時核心轉檔仍可運作，但外觀可能與連線時不同。
- **功能**：辨識 UTF-8、Big5、UTF-16 CSV，批次解壓 ZIP、保留前導零並輸出 Excel。
- **打包／部署**：本專案是靜態網站，不需建置；部署時必須連同 `js/` 與 `js/libs/` 一起上傳。
- **容量限制**：處理全部在瀏覽器記憶體中進行，超大型檔案應拆分並抽查輸出筆數與金額。

## v1.7.0 更新重點

- 改用專案內附的 SheetJS、JSZip 與編碼函式庫，降低外部 CDN 失效風險。
- 支援 UTF-8、Big5 與 UTF-16 CSV 的編碼判斷。
- 修正 ZIP 內同名檔案可能互相覆蓋及空白輸入處理問題。
- 轉出檔名會保留必要的來源路徑資訊並處理重名。

## 使用方式

1. 以瀏覽器開啟 `index.html`。
2. 拖曳或選取 CSV／ZIP 檔案。
3. 確認預覽內容、欄位與編碼。
4. 下載產生的 Excel 檔案。

## 資料處理說明

- 帳號、身分證字號等欄位會以文字格式輸出，以降低 Excel 自動移除前導零的風險。
- CSV 欄位名稱與來源格式差異很大，正式使用前仍應抽查輸出筆數、金額、日期及帳號。
- 加密、損毀或非標準 ZIP／CSV 可能無法解析。
- 瀏覽器可用記憶體有限，極大型檔案建議分批處理。

## 驗證

JavaScript 語法可用以下指令檢查：

```powershell
node --check js/app.js
```

詳細異動請參閱 [CHANGELOG.md](CHANGELOG.md)。
