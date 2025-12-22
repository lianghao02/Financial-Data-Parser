const app = (function () {
  // 私有變數
  let dropZone, fileInput, fileListEl, convertBtn;
  let filesToProcess = [];

  function init() {
    dropZone = document.getElementById("drop-zone");
    fileInput = document.getElementById("file-input");
    fileListEl = document.getElementById("file-list");
    convertBtn = document.getElementById("convert-btn");

    setupEventListeners();
  }

  function setupEventListeners() {
    // 拖放事件
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      // 切換為拖曳中的樣式
      dropZone.classList.add("border-accent", "bg-[#eef2ff]");
      dropZone.classList.remove("border-gray-200", "bg-[#fafafa]");
    });

    dropZone.addEventListener("dragleave", () => {
      // 還原為預設樣式
      dropZone.classList.remove("border-accent", "bg-[#eef2ff]");
      dropZone.classList.add("border-gray-200", "bg-[#fafafa]");
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      // 還原為預設樣式
      dropZone.classList.remove("border-accent", "bg-[#eef2ff]");
      dropZone.classList.add("border-gray-200", "bg-[#fafafa]");
      handleFiles(e.dataTransfer.files);
    });

    dropZone.addEventListener("click", () => {
      fileInput.click();
    });

    fileInput.addEventListener("change", (e) => {
      handleFiles(e.target.files);
      fileInput.value = ""; // 重置輸入
    });

    convertBtn.addEventListener("click", handleConvert);
  }

  function handleFiles(files) {
    for (let file of files) {
      if (file.name.toLowerCase().endsWith(".csv")) {
        // 避免重複
        if (
          !filesToProcess.some(
            (f) => f.name === file.name && f.size === file.size
          )
        ) {
          filesToProcess.push(file);
        }
      }
    }
    updateFileList();
    updateConvertBtn();
  }

  function updateFileList() {
    fileListEl.innerHTML = "";
    filesToProcess.forEach((file, index) => {
      const item = document.createElement("div");
      // 使用 Tailwind 樣式
      item.className =
        "flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-2 text-sm border border-gray-200";
      item.innerHTML = `
                <span>${file.name}</span>
                <span class="remove-btn text-danger font-bold cursor-pointer ml-2 hover:opacity-80 transition-opacity" data-index="${index}">×</span>
            `;
      // 使用事件委派或直接綁定
      item.querySelector(".remove-btn").addEventListener("click", (e) => {
        removeFile(index);
      });
      fileListEl.appendChild(item);
    });
  }

  function removeFile(index) {
    filesToProcess.splice(index, 1);
    updateFileList();
    updateConvertBtn();
  }

  function updateConvertBtn() {
    convertBtn.disabled = filesToProcess.length === 0;
    convertBtn.textContent =
      filesToProcess.length === 0
        ? "開始轉換"
        : `轉換 ${filesToProcess.length} 個檔案`;
  }

  /**
   * 將工作表中的所有儲存格強制設定為文字格式，以保留前導零
   * @param {Object} ws - SheetJS 工作表物件
   */
  function applyExcelCellFormatting(ws) {
    if (!ws["!ref"]) return;
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cell_address]) continue;
        // t: 's' 表示儲存格類型為 String
        // z: '@' 表示顯示格式為文字
        ws[cell_address].t = "s";
        ws[cell_address].z = "@";
      }
    }
  }

  async function handleConvert() {
    if (filesToProcess.length === 0) return;

    const mode = document.querySelector(
      'input[name="export-mode"]:checked'
    ).value;
    convertBtn.disabled = true;
    convertBtn.textContent = "處理中...";

    try {
      if (mode === "individual") {
        await processIndividual(filesToProcess);
      } else {
        await processMerged(filesToProcess);
      }
      alert("轉換完成！");
    } catch (error) {
      console.error(error);
      alert("轉換過程中發生錯誤：" + error.message);
    } finally {
      convertBtn.disabled = false;
      updateConvertBtn();
    }
  }

  async function readCSV(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file, "utf-8");
    });
  }

  function parseCSV(text) {
    const rows = [];
    let currentRow = [];
    let currentCell = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = "";
      } else if ((char === "\r" || char === "\n") && !inQuotes) {
        if (char === "\r" && nextChar === "\n") i++;
        if (currentCell || currentRow.length > 0) {
          currentRow.push(currentCell.trim());
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
    }
    return rows;
  }

  function cleanData(rows) {
    return rows.map((row) => {
      return row.map((cell) => {
        let val = cell;
        
        // 僅針對看起來像金額的格式進行處理 (例如 +123.00, 456.00)
        // 使用更嚴謹的正則：^(\+)?\d+(\.\d+)?$
        if (/^(\+)?\d+(\.00)?$/.test(val)) {
          return val.replace("+", "").replace(".00", "");
        }
        
        // 如果是純粹的 + 號開頭且後方是數字，也移除它 (保留帳號或電話的前導零)
        if (val.startsWith("+") && /^\+\d+$/.test(val)) {
            val = val.substring(1);
        }

        return val;
      });
    });
  }

  async function processIndividual(files) {
    for (let file of files) {
      const text = await readCSV(file);
      const rows = parseCSV(text);
      const cleanedRows = cleanData(rows);

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(cleanedRows);

      applyExcelCellFormatting(ws);

      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      XLSX.writeFile(wb, file.name.replace(".csv", ".xlsx"));
    }
  }

  async function processMerged(files) {
    const wb = XLSX.utils.book_new();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await readCSV(file);
      const rows = parseCSV(text);
      const cleanedRows = cleanData(rows);

      const ws = XLSX.utils.aoa_to_sheet(cleanedRows);

      applyExcelCellFormatting(ws);

      const sheetName = (i + 1).toString().padStart(2, "0");
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }

    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const date = now.getDate().toString().padStart(2, "0");
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const filename = `${month}${date}_${hours}${minutes}合併金流.xlsx`;

    XLSX.writeFile(wb, filename);
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", app.init);
