# 金融資料 CSV 轉 Excel 解析工具 v1.6.1

[![Version](https://img.shields.io/badge/version-v1.6.1-blue.svg)](CHANGELOG.md)
[![Runtime](https://img.shields.io/badge/runtime-browser-orange.svg)](index.html)

這是一套在瀏覽器本機執行的 CSV／ZIP 轉 Excel 工具，適合整理銀行交易明細及需要保留帳號前導零的表格資料。轉檔核心使用專案內附的 JavaScript 函式庫，不會主動將檔案上傳到外部服務。

## v1.6.1 更新重點

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
