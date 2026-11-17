# HANDOFF

## 核心元資料 (Metadata)
- **Repository**：lianghao02/Financial-Data-Parser
- **Branch**：main
- **Commit SHA**：基準 22a778b97af178eb0b64c91bca6fa1d4afc233de；本輪修正提交 SHA 以 Git HEAD 為準
- **Skill Version**：v1.0.0
- **Task Type**：FIX
- **Local Path Hint**：08_Financial-Data-Parser

## 目前狀態
待驗證：本輪三項資料遺漏／歸戶缺陷已修正並通過自動化驗證；真瀏覽器收檔與下載驗收未完成。

## 本輪目標
修正多工作表 Excel 只讀第一頁、跨銀行同帳號錯誤歸戶、同名同大小檔案靜默漏收。

## 基準與已確認事實 (Baseline & Confirmed Facts)
- 2026-11-16 開始時 main 工作目錄乾淨；原有 17 項測試通過。
- 修正前已以合成資料重現三項缺陷；多工作表及跨銀行歸戶新增測試先確認失敗。

## 已完成 (Completed)
- 逐頁讀取來源活頁簿；個別轉檔保留多工作表及其名稱，合併分頁／合併單頁均納入每頁資料。
- 歸戶索引使用銀行與帳號；銀行取自分行欄位或既有檔名辨識。銀行不明時不跨行套用姓名；同一銀行帳號戶名衝突時不採最後一筆覆蓋。
- 一般匯入不再依檔名及大小去重；同名檔案加序號保留並提示，原始內容不變。
- 新增頁面收檔測試載入器，驗證真實 File 物件內容及不同匯出檔名。
- Worker 仍使用原有本機 XLSX 套件組合，沒有新增網路載入或相依套件。

## 異動檔案 (Changed Files)
js/app.js、tests/harness.js、tests/parser.test.js、HANDOFF.md。

## 刻意未修改 (Do Not Do / Deliberately Omitted)
未修改使用者原始資料、UI 排版、產品版本或已發布成品；本輪依 2026-11-17 使用者明確授權提交與推送。

## 尚未完成 (Remaining Work)
- **P1 (阻斷/必須)**：本輪自動化驗證未發現未修正的阻斷問題。
- **P2 (重要/當次)**：真瀏覽器以同名檔案及多工作表 XLSX 驗證三種匯出模式與實際下載。
- **P3 (改善建議/暫緩)**：既有 file:// 離線包人工驗收仍未完成。

## 驗證結果 (Validation)
### 已執行測試與結果
- 2026-11-17 提交前重新執行下列測試與 QA，結果通過。
- npm test：23/23 通過，含 Worker 套件同步檢查。
- node --check js/app.js：通過。
- Windows PowerShell scripts/qa.ps1：通過，含 23 項回歸測試、差異及敏感值檢查。
- 透過正式 Worker 組合轉檔並重新讀回 XLSX，驗證三種模式均保留第二工作表資料、跨銀行同號不混戶、未知銀行不猜測、同銀行戶名衝突不覆蓋。
- 頁面載入器以真實 File 物件驗證同名同大小不同內容均保留，個別匯出檔名不同。
### 尚未驗證項目
Windows 瀏覽器工具無法可靠辨識 Chrome 目前網址而停止；瀏覽器實際選檔、提示與下載未完成。
### 已知風險 (Known Risks)
DOM／Worker 自動化不等同真瀏覽器驗收；銀行辨識沿用分行欄位／既有檔名規則，來源不明以「未知」呈現。再次加入同一檔案也會保留，避免未經內容比對就丟棄資料。

## Git 狀態
- Commit：本輪修正與交接紀錄一併提交；實際 SHA 以 Git 記錄為準。
- Push：使用者於 2026-11-17 明確授權推送 origin/main；完成結果以遠端 main 與本機 HEAD 比對為準。
- Working Tree：本輪僅提交上述異動檔案；交付狀態以 git status 核對。
- Branch：main。

## 下一步建議動作 (Next Recommended Action)
完成本輪授權的提交與推送；後續補瀏覽器人工驗收，保留尚未驗證限制。

## 發布狀態 (Release Status)
待進一步實測；本輪僅提交與推送，未手動部署或建立 Release，線上服務更新狀態未核對。歷史發布狀態仍應查中央 docs/audit-release-20261022.md，不依舊交接重做發布。
