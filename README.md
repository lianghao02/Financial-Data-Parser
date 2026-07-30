# 💰 金融資料 CSV 轉 Excel 解析工具 (v1.6.0)

[![Version](https://img.shields.io/badge/version-v1.6.0-blue.svg)](https://github.com/lianghao02/Financial-Data-Parser)
[![OpenPyXL](https://img.shields.io/badge/Excel-OpenPyXL-green.svg)](https://openpyxl.readthedocs.io)

## 🏆 v1.6.0 里程碑：金融帳號前導零自動保護與 ZIP 批次轉檔

## 📖 重大更新摘要 (Summary)

本版本為金融資料自動化解析器之重大革命版本，全面導入字串文字型態強制保護與壓縮檔自動解包機制。

過往使用 Excel 開啟銀行 CSV 交易明細時，Excel 預設的自動型別轉換常會強制將金融帳號開頭的 `0` 抹除（如 `0123` 變成 `123`），導致後續金流比對錯誤百出，甚至造成嚴重辦案失誤。本版本透過 OpenPyXL 底層 XML 節點注入技術，確保所有金融帳號在轉檔過程中 **100% 保留前導零**，並支援 `.zip` 壓縮檔一次性批次轉檔。

## ✨ 重點更新特色

- 🛡️ **金流帳號前導零字串防護罩 (Explicit Text Formatting)**：
  - 於寫入 `.xlsx` 時自動將帳號與身分證字號欄位設定為 `@` (Text Format) 屬性。
  - 徹底杜絕 Excel 誤刪前導零問題，保證金融金流比對之 100% 精準度。

- 📦 **ZIP 壓縮檔內建智慧解包器 (Recursive Archive Handler)**：
  - 支援拖曳 `.zip` 檔案，自動於記憶體內解壓並搜尋所有子目錄中之 CSV 明細。
  - 讓原本需耗時 30 分鐘的手動解壓與轉檔流程，縮短至 **3 秒內** 全自動完成。