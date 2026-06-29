const app = (function () {
    // 私有變數
    let dropZone, fileInput, fileListEl, convertBtn, loadingOverlay;
    let settingCellType, settingStripCurrency, settingSheetPrefix, settingThemeColor, themeColorLabel, settingCustomFilename;
    let clearAllBtn, fileListTitle;
    let filesToProcess = [];

    // 配置 (預設值由 HTML 結構決定，此處為狀態同步)
    const CONFIG = {
        cellType: 'text',
        stripCurrency: true,
        sheetPrefix: '',
        themeColor: '#1E3A8A',
        customFilename: ''
    };

    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast-enter flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white max-w-sm pointer-events-auto`;
        
        if (type === 'error') {
            toast.classList.add('bg-red-500');
            toast.innerHTML = `<svg class="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
        } else if (type === 'success') {
            toast.classList.add('bg-green-500');
            toast.innerHTML = `<svg class="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`;
        } else {
            toast.classList.add('bg-blue-500');
            toast.innerHTML = `<svg class="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
        }

        toast.innerHTML += `<div class="text-sm font-medium break-words">${message}</div>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('toast-enter');
            toast.classList.add('toast-leave');
            toast.addEventListener('animationend', () => toast.remove());
        }, 3000);
    }

    function init() {
        dropZone = document.getElementById("drop-zone");
        fileInput = document.getElementById("file-input");
        fileListEl = document.getElementById("file-list");
        convertBtn = document.getElementById("convert-btn");
        loadingOverlay = document.getElementById("loading-overlay");
        clearAllBtn = document.getElementById("clear-all-btn");
        fileListTitle = document.getElementById("file-list-title");

        settingCellType = document.getElementById("setting-cell-type");
        settingStripCurrency = document.getElementById("setting-strip-currency");
        settingSheetPrefix = document.getElementById("setting-sheet-prefix");
        settingThemeColor = document.getElementById("setting-theme-color");
        themeColorLabel = document.getElementById("theme-color-label");
        settingCustomFilename = document.getElementById("setting-custom-filename");

        setupEventListeners();
        setupSettingsListeners();
    }

    function setupEventListeners() {
        dropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropZone.classList.add("border-accent", "bg-[#eef2ff]");
            dropZone.classList.remove("border-gray-200", "bg-[#fafafa]");
        });

        dropZone.addEventListener("dragleave", () => {
            dropZone.classList.remove("border-accent", "bg-[#eef2ff]");
            dropZone.classList.add("border-gray-200", "bg-[#fafafa]");
        });

        dropZone.addEventListener("drop", async (e) => {
            e.preventDefault();
            dropZone.classList.remove("border-accent", "bg-[#eef2ff]");
            dropZone.classList.add("border-gray-200", "bg-[#fafafa]");
            
            if (e.dataTransfer.items) {
                try {
                    loadingOverlay.style.display = 'flex';
                    if (window.location.protocol === 'file:') {
                        await handleFiles(Array.from(e.dataTransfer.files));
                    } else {
                        const items = Array.from(e.dataTransfer.items);
                        const entries = items
                            .filter(item => item.kind === 'file')
                            .map(item => item.webkitGetAsEntry ? item.webkitGetAsEntry() : (item.getAsEntry ? item.getAsEntry() : null))
                            .filter(entry => entry !== null);

                        const files = await getAllFileEntries(entries);
                        if (files.length === 0 && e.dataTransfer.files.length > 0) {
                            await handleFiles(Array.from(e.dataTransfer.files));
                        } else {
                            await handleFiles(files);
                        }
                    }
                } catch (err) {
                    console.error("⚠️ 資料夾掃描發生意外:", err);
                    showToast("資料夾掃描發生錯誤：" + err.message, "error");
                } finally {
                    loadingOverlay.style.display = 'none';
                }
            } else {
                handleFiles(Array.from(e.dataTransfer.files));
            }
        });

        dropZone.addEventListener("click", () => fileInput.click());

        fileInput.addEventListener("change", (e) => {
            handleFiles(Array.from(e.target.files));
            fileInput.value = "";
        });

        convertBtn.addEventListener("click", handleConvert);
        
        clearAllBtn.addEventListener("click", () => {
            filesToProcess = [];
            updateFileList();
            updateConvertBtn();
        });
    }

    function setupSettingsListeners() {
        settingCellType.addEventListener("change", (e) => CONFIG.cellType = e.target.value);
        settingStripCurrency.addEventListener("change", (e) => CONFIG.stripCurrency = e.target.checked);
        settingSheetPrefix.addEventListener("input", (e) => CONFIG.sheetPrefix = e.target.value.trim());
        settingThemeColor.addEventListener("input", (e) => {
            const color = e.target.value;
            themeColorLabel.textContent = color;
            document.documentElement.style.setProperty('--color-primary', color);
            document.documentElement.style.setProperty('--color-primary-hover', color);
            CONFIG.themeColor = color;
        });
        settingCustomFilename.addEventListener("input", (e) => CONFIG.customFilename = e.target.value.trim());
    }

    async function scanFiles(entry) {
        return new Promise((resolve) => {
            if (entry.isFile) {
                entry.file((file) => resolve([file]), (err) => {
                    console.warn("⚠️ 讀取實體檔案失敗:", err);
                    resolve([]);
                });
            } else if (entry.isDirectory) {
                const dirReader = entry.createReader();
                let allEntries = [];
                function readNext() {
                    dirReader.readEntries(async (entries) => {
                        if (entries.length > 0) {
                            for (let i = 0; i < entries.length; i++) {
                                const subFiles = await scanFiles(entries[i]);
                                allEntries.push(...subFiles);
                            }
                            readNext();
                        } else {
                            resolve(allEntries);
                        }
                    }, (err) => {
                        console.warn("⚠️ 讀取資料夾失敗:", err);
                        resolve(allEntries);
                    });
                }
                readNext();
            } else {
                resolve([]);
            }
        });
    }

    async function getAllFileEntries(entries) {
        let allFiles = [];
        for (const entry of entries) {
            const files = await scanFiles(entry);
            allFiles.push(...files);
        }
        return allFiles;
    }

    async function handleFiles(files) {
        let hasZip = false;
        for (let file of files) {
            if (file.name.toLowerCase().endsWith('.zip')) {
                hasZip = true;
                break;
            }
        }

        if (hasZip) {
            loadingOverlay.style.display = 'flex';
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        for (let file of files) {
            try {
                const ext = file.name.split('.').pop().toLowerCase();
                if (['csv', 'xlsx', 'xls'].includes(ext)) {
                    if (!filesToProcess.some(f => f.name === file.name && f.size === file.size)) {
                        filesToProcess.push(file);
                    }
                } else if (ext === 'zip') {
                    await processZipFile(file);
                }
            } catch (err) {
                console.warn(`⚠️ 處理檔案 ${file.name} 時發生錯誤:`, err);
            }
        }

        if (hasZip) loadingOverlay.style.display = 'none';
        updateFileList();
        updateConvertBtn();
    }

    async function processZipFile(fileOrBlob) {
        try {
            const zip = new JSZip();
            const contents = await zip.loadAsync(fileOrBlob);
            for (const filename of Object.keys(contents.files)) {
                try {
                    const zipEntry = contents.files[filename];
                    if (zipEntry.dir) continue;
                    if (filename.includes('__MACOSX/') || filename.split('/').pop().startsWith('.')) continue;

                    const ext = filename.split('.').pop().toLowerCase();
                    if (['csv', 'xlsx', 'xls'].includes(ext)) {
                        const blob = await zipEntry.async("blob");
                        const actualName = filename.split('/').pop();
                        const extractedFile = new File([blob], actualName, { type: blob.type || "application/octet-stream" });
                        if (!filesToProcess.some(f => f.name === extractedFile.name && f.size === extractedFile.size)) {
                            filesToProcess.push(extractedFile);
                        }
                    } else if (ext === 'zip') {
                        const blob = await zipEntry.async("blob");
                        await processZipFile(blob);
                    }
                } catch (innerErr) {
                    console.warn(`⚠️ 解析 ZIP 內檔案 [${filename}] 時發生錯誤:`, innerErr);
                }
            }
        } catch (err) {
            console.error("⚠️ 讀取 ZIP 檔案本身失敗:", err);
            showToast("讀取 ZIP 檔案本身失敗", "error");
        }
    }

    function updateFileList() {
        fileListEl.innerHTML = "";
        if (filesToProcess.length > 0) {
            clearAllBtn.classList.remove("hidden");
            fileListTitle.classList.remove("hidden");
        } else {
            clearAllBtn.classList.add("hidden");
            fileListTitle.classList.add("hidden");
        }

        filesToProcess.forEach((file, index) => {
            const item = document.createElement("div");
            item.className = "file-item flex justify-between items-center p-3 mb-2 bg-gray-50 rounded-lg border border-gray-100 animate-fadeIn";
            item.innerHTML = `
                <div class="flex items-center gap-3 overflow-hidden">
                    <span class="text-xl">📄</span>
                    <div class="flex flex-col min-w-0">
                        <span class="text-sm font-semibold truncate text-gray-700">${file.name}</span>
                        <span class="text-xs text-gray-400">${formatSize(file.size)}</span>
                    </div>
                </div>
                <button class="remove-btn text-gray-400 hover:text-danger transition-colors p-1" onclick="app.removeFile(${index})" title="移除檔案">
                    <svg class="w-5 h-5 fill-current" viewBox="0 0 448 512"><path d="M135.2 17.7C135.2 12.1 139.7 7.6 145.3 7.6l157.4 0c5.6 0 10.1 4.5 10.1 10.1l0 7.5L448 25.2c13.3 0 24 10.7 24 24s-10.7 24-24 24l-31 0 0 384c0 35.3-28.7 64-64 64L95.2 512c-35.3 0-64-28.7-64-64l0-384L0 73.2c-13.3 0-24-10.7-24-24s10.7-24 24-24l112.8 0 0-7.5zM23.2 121.2L56.7 121.2 56.7 448c0 8.8 7.2 16 16 16l304 0c8.8 0 16-7.2 16-16l0-326.8 33.5 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-33.5 0 0-7.5c0-14.1-11.4-25.5-25.5-25.5L145.3 71.9c-14.1 0-25.5 11.4-25.5 25.5l0 7.5-33.5 0c-8.8 0-16 7.2-16 16s7.2 16 16 16z"/></svg>
                </button>
            `;
            fileListEl.appendChild(item);
        });
    }

    function formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function removeFile(index) {
        filesToProcess.splice(index, 1);
        updateFileList();
        updateConvertBtn();
    }

    function updateConvertBtn() {
        const count = filesToProcess.length;
        convertBtn.disabled = count === 0;
        convertBtn.textContent = count > 0 ? `立即轉檔 (${count} 個檔案)` : "立即轉檔";
    }

    // --- Web Worker Blob ---
    const workerCode = `
    importScripts('https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js');

    async function parseData(file) {
        const arrayBuffer = await file.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        
        // 判斷是否為二進位 Excel 格式 (XLSX = PK, XLS = D0 CF 11 E0)
        let isBinaryExcel = false;
        if (data.length >= 4) {
            if (data[0] === 0x50 && data[1] === 0x4B) isBinaryExcel = true; // PK (ZIP)
            if (data[0] === 0xD0 && data[1] === 0xCF && data[2] === 0x11 && data[3] === 0xE0) isBinaryExcel = true; // CFB (XLS)
        }

        let wb;
        if (!isBinaryExcel) {
            // 純文字格式 (CSV / HTML / XML)，處理 Big5 與 UTF-8 編碼
            let text = "";
            try {
                // 嚴格嘗試以 UTF-8 解碼 (若為 Big5，碰到中文字會觸發例外)
                const decoder = new TextDecoder('utf-8', { fatal: true });
                text = decoder.decode(arrayBuffer);
            } catch (e) {
                // 解析失敗代表含有非 UTF-8 字元，降級使用 Big5 解碼
                const decoder = new TextDecoder('big5');
                text = decoder.decode(arrayBuffer);
            }
            wb = XLSX.read(text, { type: 'string' });
        } else {
            // 二進位格式，直接交由 SheetJS 解析
            wb = XLSX.read(data, { type: 'array' });
        }
        
        const ws = wb.Sheets[wb.SheetNames[0]];
        return XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
    }

    function cleanData(rows, config) {
        if (!config.stripCurrency) return rows;
        return rows.map(row => {
            return row.map(cell => {
                if (typeof cell === 'string') {
                    let cleaned = cell.replace(/[$,+]/g, '');
                    cleaned = cleaned.replace(/\\.0+$/, '');
                    return cleaned;
                }
                return cell;
            });
        });
    }

    function isAccountOpenerData(rows) {
        if (!rows || rows.length === 0) return false;
        const headers = rows[0];
        if (!Array.isArray(headers)) return false;
        const targetHeaders = ['身分證統一編號', '開戶行庫分行簡稱代碼', '存款種類', '戶名', '帳號', '開戶日', '資料提供日'];
        let matchCount = 0;
        targetHeaders.forEach(target => {
            if (headers.some(h => typeof h === 'string' && h.includes(target))) matchCount++;
        });
        return matchCount >= 4;
    }

    function generateAccountOpenerDashboard(allRows) {
        if (!allRows || allRows.length < 2) return allRows;
        const headers = allRows[0];
        const data = allRows.slice(1);
        const getIdx = (key) => headers.findIndex(h => typeof h === 'string' && h.includes(key));
        const idx = {
            id: getIdx('身分證統一編號'), bank: getIdx('開戶行庫分行簡稱代碼'), type: getIdx('存款種類'),
            currency: getIdx('幣別'), name: getIdx('戶名'), homePhone: getIdx('住家電話'),
            cellPhone: getIdx('行動電話'), resAddress: getIdx('戶籍地址'), comAddress: getIdx('通訊地址'),
            account: getIdx('帳號'), balance: getIdx('帳戶餘額'), openDate: getIdx('開戶日'),
            infoDate: getIdx('資料提供日'), branchCode: getIdx('開戶行總分支機構代碼')
        };

        const grouped = {};
        data.forEach(row => {
            const id = row[idx.id] || '未知';
            if (!grouped[id]) grouped[id] = [];
            grouped[id].push(row);
        });

        let finalRows = [];
        Object.keys(grouped).forEach(id => {
            const personRows = grouped[id];
            const firstRow = personRows[0];
            const name = firstRow[idx.name] || '';

            finalRows.push([\`【開戶人：\${name}】\`]);
            finalRows.push(['查詢身分證字號', id]);
            finalRows.push(['資料類別', '欄位名稱', '資料內容']);
            finalRows.push(['基本資料', '戶名', name]);
            finalRows.push(['', '身分證統一編號', id]);
            finalRows.push(['', '住家電話', firstRow[idx.homePhone] || '']);
            finalRows.push(['', '行動電話', firstRow[idx.cellPhone] || '']);
            finalRows.push(['聯絡地址', '戶籍地址', firstRow[idx.resAddress] || '']);
            finalRows.push(['', '通訊地址', firstRow[idx.comAddress] || '']);
            finalRows.push([]);

            const branchCodeVal = firstRow[idx.branchCode] || '';
            finalRows.push(['【名下帳戶】', '開戶行總分支機構代碼', branchCodeVal]);
            finalRows.push(['銀行代碼', '帳號', '存款種類', '幣別', '帳戶餘額', '開戶日', '資料提供日']);
            
            personRows.forEach(row => {
                finalRows.push([
                    row[idx.bank] || '', row[idx.account] || '', row[idx.type] || '', row[idx.currency] || '',
                    row[idx.balance] || '', row[idx.openDate] || '', row[idx.infoDate] || ''
                ]);
            });
            finalRows.push([]);
            finalRows.push([]);
        });

        finalRows.push(['【原始資料】']);
        finalRows.push(headers);
        finalRows = finalRows.concat(data);
        return finalRows;
    }

    function applyExcelCellFormatting(ws, config) {
        if (!ws || !ws['!ref']) return;
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = { c: C, r: R };
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                const cell = ws[cell_ref];
                if (!cell) continue;
                if (config.cellType === 'text') {
                    cell.t = 's';
                } else if (config.cellType === 'number') {
                    if (typeof cell.v === 'string' && !isNaN(parseFloat(cell.v.replace(/[$,]/g, '')))) {
                        cell.t = 'n';
                        cell.v = parseFloat(cell.v.replace(/[$,]/g, ''));
                    }
                }
            }
        }
    }

    function applyGroupBorders(ws, dashboardRows) {
        if (!ws || !ws['!ref']) return;
        let groupStarts = [];
        for (let i = 0; i < dashboardRows.length; i++) {
            const firstCol = dashboardRows[i][0];
            if (typeof firstCol === 'string' && firstCol.startsWith('【開戶人：')) groupStarts.push(i);
            if (typeof firstCol === 'string' && firstCol.startsWith('【原始資料】')) groupStarts.push(i);
        }
        for (let g = 0; g < groupStarts.length - 1; g++) {
            const startRow = groupStarts[g];
            const endRow = groupStarts[g+1] - 2; 
            const maxCol = 6; 
            for (let r = startRow; r <= endRow; r++) {
                for (let c = 0; c <= maxCol; c++) {
                    const cellRef = XLSX.utils.encode_cell({ r: r, c: c });
                    if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
                    const cell = ws[cellRef];
                    if (!cell.s) cell.s = {};
                    if (!cell.s.border) cell.s.border = {};
                    const thick = { style: 'thick', color: { rgb: "000000" } };
                    if (r === startRow) cell.s.border.top = thick;
                    if (r === endRow) cell.s.border.bottom = thick;
                    if (c === 0) cell.s.border.left = thick;
                    if (c === maxCol) cell.s.border.right = thick;
                }
            }
        }
    }

    function saveMergedFile(wb, config) {
        let filename = "";
        if (config.customFilename) {
            filename = \`\${config.customFilename}.xlsx\`;
        } else {
            const now = new Date();
            const yy = (now.getFullYear() - 1911).toString().padStart(3, '0');
            const mm = (now.getMonth() + 1).toString().padStart(2, '0');
            const dd = now.getDate().toString().padStart(2, '0');
            filename = \`\${yy}\${mm}\${dd}_Merged_Report.xlsx\`;
        }
        let u8 = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        self.postMessage({ type: 'download', filename: filename, data: u8 });
    }

    async function processIndividual(files, config) {
        for (let i = 0; i < files.length; i++) {
            try {
                const file = files[i];
                const rows = await parseData(file);
                const cleanedRows = cleanData(rows, config);
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.aoa_to_sheet(cleanedRows);
                applyExcelCellFormatting(ws, config);
                XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
                let outName = file.name.replace(/\\.(csv|xlsx|xls)$/i, ".xlsx");
                if (config.customFilename) outName = \`\${config.customFilename}_\${i + 1}.xlsx\`;
                
                let u8 = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
                self.postMessage({ type: 'download', filename: outName, data: u8 });
            } catch (err) {
                self.postMessage({ type: 'error', error: \`產出檔案 \${files[i].name} 時發生錯誤: \${err.message}\` });
            }
        }
    }

    async function processMergedSheets(files, config) {
        const wb = XLSX.utils.book_new();
        let accountOpenerRows = [];
        let regularFilesCount = 0;
        const idToNameMap = {};
        const allFileData = [];

        for (let i = 0; i < files.length; i++) {
            try {
                const file = files[i];
                const rows = await parseData(file);
                const cleanedRows = cleanData(rows, config);
                allFileData.push({ cleanedRows, file });

                if (cleanedRows.length > 1) {
                    const headers = cleanedRows[0];
                    const nameIdx = headers.findIndex(h => typeof h === 'string' && (h.includes('戶名') || h.includes('姓名')));
                    const idIdx = headers.findIndex(h => typeof h === 'string' && (h.includes('身分證') || h.includes('證號')));
                    
                    if (nameIdx !== -1 && idIdx !== -1) {
                        cleanedRows.slice(1).forEach(row => {
                            const id = String(row[idIdx] || '').trim();
                            const name = String(row[nameIdx] || '').trim();
                            if (id && name && !idToNameMap[id]) {
                                idToNameMap[id] = name;
                            }
                        });
                    }
                }
            } catch (err) {
                self.postMessage({ type: 'error', error: \`預掃描檔案 \${files[i].name} 時發生錯誤: \${err.message}\` });
            }
        }

        for (let i = 0; i < allFileData.length; i++) {
            try {
                const { cleanedRows } = allFileData[i];
                if (isAccountOpenerData(cleanedRows)) {
                    if (accountOpenerRows.length === 0) {
                        accountOpenerRows = cleanedRows;
                    } else {
                        accountOpenerRows = accountOpenerRows.concat(cleanedRows.slice(1));
                    }
                    continue;
                }

                const headers = cleanedRows[0];
                const nameIdx = headers.findIndex(h => typeof h === 'string' && (h.includes('戶名') || h.includes('姓名')));
                const idIdx = headers.findIndex(h => typeof h === 'string' && (h.includes('身分證') || h.includes('證號')));
                let nameFromData = "";
                if (nameIdx !== -1 && cleanedRows.length > 1) nameFromData = String(cleanedRows[1][nameIdx]).trim();
                if (!nameFromData && idIdx !== -1 && cleanedRows.length > 1) {
                    const id = String(cleanedRows[1][idIdx]).trim();
                    if (idToNameMap[id]) nameFromData = idToNameMap[id];
                }

                let sheetName = "";
                if (nameFromData) {
                    sheetName = nameFromData;
                } else {
                    regularFilesCount++;
                    sheetName = regularFilesCount.toString().padStart(2, "0");
                }

                if (config.sheetPrefix) sheetName = config.sheetPrefix + sheetName;
                sheetName = sheetName.replace(/[:\\\\/?*\\[\\]]/g, "_");
                if (sheetName.length > 31) sheetName = sheetName.substring(0, 31);

                let finalSheetName = sheetName;
                let suffix = 1;
                while (wb.SheetNames.includes(finalSheetName)) {
                    let suffixStr = \`(\${suffix})\`;
                    finalSheetName = sheetName.substring(0, 31 - suffixStr.length) + suffixStr;
                    suffix++;
                }

                const ws = XLSX.utils.aoa_to_sheet(cleanedRows);
                applyExcelCellFormatting(ws, config);
                XLSX.utils.book_append_sheet(wb, ws, finalSheetName);
            } catch (err) {
                self.postMessage({ type: 'error', error: \`合併分頁 \${i+1} 時發生錯誤: \${err.message}\` });
            }
        }

        if (accountOpenerRows.length > 0) {
            const dashboardRows = generateAccountOpenerDashboard(accountOpenerRows);
            const ws = XLSX.utils.aoa_to_sheet(dashboardRows);
            applyExcelCellFormatting(ws, config);
            applyGroupBorders(ws, dashboardRows); 
            XLSX.utils.book_append_sheet(wb, ws, "開戶人");
            const sheetNames = wb.SheetNames;
            const lastSheet = sheetNames.pop();
            sheetNames.unshift(lastSheet);
            wb.SheetNames = sheetNames;
        }
        saveMergedFile(wb, config);
    }

    async function processMergedSingleSheet(files, config) {
        const wb = XLSX.utils.book_new();
        let combinedRows = [];
        let firstFileHeader = [];

        for (let i = 0; i < files.length; i++) {
            try {
                const file = files[i];
                const rows = await parseData(file);
                if (rows.length === 0) continue;
                let dataRows = [];
                if (i === 0) {
                    dataRows = rows;
                    firstFileHeader = rows[0]; 
                } else {
                    if (rows.length > 0) {
                        if (JSON.stringify(rows[0]) === JSON.stringify(firstFileHeader)) {
                            dataRows = rows.slice(1);
                        } else {
                            dataRows = rows; 
                        }
                    }
                }
                const cleanedRows = cleanData(dataRows, config);
                combinedRows = combinedRows.concat(cleanedRows);
            } catch (err) {
                self.postMessage({ type: 'error', error: \`合併單頁 \${i+1} 時發生錯誤: \${err.message}\` });
            }
        }

        if (combinedRows.length > 0) {
            const ws = XLSX.utils.aoa_to_sheet(combinedRows);
            applyExcelCellFormatting(ws, config);
            XLSX.utils.book_append_sheet(wb, ws, "合併彙總");
            saveMergedFile(wb, config);
        }
    }

    self.onmessage = async function(e) {
        const { files, mode, config } = e.data;
        try {
            if (mode === "individual") {
                await processIndividual(files, config);
            } else if (mode === "merged_sheets") {
                await processMergedSheets(files, config);
            } else if (mode === "merged_single_sheet") {
                await processMergedSingleSheet(files, config);
            }
            self.postMessage({ type: 'done' });
        } catch (err) {
            self.postMessage({ type: 'error', error: err.message });
        }
    };
    `;

    let workerInstance = null;
    function getWorker() {
        if (!workerInstance) {
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            workerInstance = new Worker(URL.createObjectURL(blob));
            
            workerInstance.onmessage = (e) => {
                if (e.data.type === 'download') {
                    const blob = new Blob([e.data.data], { type: 'application/octet-stream' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = e.data.filename;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                } else if (e.data.type === 'done') {
                    showToast("轉換完成！", "success");
                    finishConvert();
                } else if (e.data.type === 'error') {
                    showToast("發生錯誤：" + e.data.error, "error");
                    finishConvert();
                }
            };
            
            workerInstance.onerror = (err) => {
                showToast("背景作業發生錯誤：" + err.message, "error");
                finishConvert();
            };
        }
        return workerInstance;
    }

    function finishConvert() {
        convertBtn.disabled = false;
        updateConvertBtn();
        loadingOverlay.style.display = 'none';
    }

    async function handleConvert() {
        if (filesToProcess.length === 0) return;

        const mode = document.querySelector('input[name="export-mode"]:checked').value;
        convertBtn.disabled = true;
        loadingOverlay.style.display = 'flex';
        
        try {
            const worker = getWorker();
            worker.postMessage({
                files: filesToProcess,
                mode: mode,
                config: CONFIG
            });
        } catch (err) {
            console.error(err);
            showToast("啟動轉換引擎失敗：" + err.message, "error");
            finishConvert();
        }
    }

    return {
        init: init,
        removeFile: removeFile
    };
})();

document.addEventListener("DOMContentLoaded", app.init);
