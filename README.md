# 📊 金融資料 CSV 轉 Excel 解析工具 (Financial Data Parser)

[![Version](https://img.shields.io/badge/version-v1.7.0-blue.svg?style=flat-square)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen.svg?style=flat-square&logo=github)](https://lianghao02.github.io/Financial-Data-Parser/)
[![Offline Ready](https://img.shields.io/badge/Offline-Ready-orange.svg?style=flat-square)](https://github.com/lianghao02/Financial-Data-Parser/releases)

一套專為**司法偵查、金融鑑識與公務作業**設計的免安裝 CSV / ZIP 轉 Excel 工具。
支援多種編碼自動辨識、帳號身分證字號前導零保護、ZIP 批次解壓及智慧歸戶分頁匯出。

> 🛡️ **資安保證**：核心轉檔與資料解析 **100% 於本機瀏覽器記憶體中執行**，零伺服器後端、零資料上傳外洩風險，無網路環境亦可安心使用。

---

## 🚀 快速開始（選擇您的使用方式）

本工具提供「線上直接使用」與「免安裝離線可攜包」兩種方式：

### 🌐 方式一：線上即開即用（推薦・最快速）
不需下載任何檔案，直接透過瀏覽器開啟即可開始使用：
👉 **[點此直接開啟線上版工具](https://lianghao02.github.io/Financial-Data-Parser/)**

---

### 📦 方式二：下載免安裝離線包（公務／隔離內網專用）
若您的電腦位於無網際網路連線之公務內網或機密環境，請下載離線包：

1. 前往 **[Releases 發布頁面](https://github.com/lianghao02/Financial-Data-Parser/releases)**。
2. 下載最新的 **`Financial-Data-Parser-v1.7.0.zip`**。
3. 下載後解壓縮該 ZIP 壓縮檔至任意資料夾。
4. 雙擊開啟資料夾內的 **`index.html`**（支援 Chrome、Edge、Firefox 等任一現代瀏覽器），即可完全離線使用！

---

## ✨ 核心特色與功能

- 🛡️ **前導零完整保留**：輸出時自動鎖定文字格式，防止 Excel 自動吃掉銀行帳號、身分證字號或分行代碼開頭的 `0`。
- 🔍 **多編碼自動辨識**：精準相容判斷 `UTF-8`、`Big5`、`UTF-16 LE/BE` 編碼，解決公務系統匯出常見的亂碼困擾。
- 🗜️ **ZIP 批次解壓縮**：直接拖曳多個 ZIP 壓縮檔，內建防護機制自動遞迴解壓並批次轉換 CSV。
- 📑 **三大匯出模式**：
  1. **個別轉檔**：保留原始檔名，一對一產出獨立的 `.xlsx`。
  2. **智慧歸戶**：彙整產生單一 Excel，首頁開戶人總覽 + 明細分頁。
  3. **資料整合**：將所有 CSV 資料相接合併至單一工作表，便於後續樞紐分析。
- 🧹 **貨幣符號智慧清洗**：自動過濾 `$`, `,`, `+` 與 `.00` 尾碼，保留乾淨純數字。
- 📦 **零相依與無外部 CDN 依賴**：核心函式庫（SheetJS、JSZip）全數本機內附，完全離線亦可正常運作。

---

## 📖 操作步驟教學

```text
  [ 步驟 1 ]              [ 步驟 2 ]             [ 步驟 3 ]           [ 步驟 4 ]
 拖曳或選取檔案  ───>   選擇匯出模式   ───>   調整右側設定   ───>   立即轉檔並下載
 (.csv / .zip)        (個別/歸戶/整合)       (格式/前綴/檔名)         (.xlsx)
```

1. **上傳檔案**：將一或多個 `.csv`、`.zip` 檔案拖曳至畫面虛線框內，或點擊框框選取檔案。
2. **選擇匯出模式**：
   - 若要維持獨立檔案請選「個別轉檔」。
   - 若要整理同一對象多個帳戶請選「智慧歸戶」。
   - 若要彙整大表請選「資料整合」。
3. **功能設定（右側面板）**：
   - **資料格式**：預設「純文字（保留首位 0）」，亦可切換為數值或自動辨識。
   - **清除貨幣符號**：勾選後將自動清除金額欄位的符號。
   - **分頁名稱前綴／匯出檔名**：可依業務需求自訂產出檔名。
4. **立即轉檔**：點擊「立即轉檔」按鈕，轉換完成後系統將自動下載 Excel 檔案。

---

## 💻 開發與自訂建置

本專案為純 HTML5 / Vanilla JavaScript 靜態架構，無須安裝 Node.js 或建置工具即可修改與執行。

### 本機檢視與開發
```powershell
# 複製專案
git clone https://github.com/lianghao02/Financial-Data-Parser.git
cd Financial-Data-Parser

# 直接使用瀏覽器開啟 index.html
start index.html
```

### 語法與品質檢核
```powershell
# 檢查 JavaScript 語法
node --check js/app.js

# 執行品質檢核與敏感資訊掃描
powershell -ExecutionPolicy Bypass -File scripts/qa.ps1
```

### 打包離線發布 ZIP
```powershell
# 執行打包腳本（產出於 dist/ 目錄）
powershell -ExecutionPolicy Bypass -File scripts/package-release.ps1 -Version "v1.7.0"
```

---

## 📋 版本歷程

詳細變更紀錄請參閱 [CHANGELOG.md](CHANGELOG.md)。

---

## 📄 授權條款

本專案採用 [MIT License](LICENSE) 授權。
內附之第三方函式庫（SheetJS、JSZip）遵循其各自之開源授權協議。
