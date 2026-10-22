'use strict';
// 測試用載入器：取出 js/app.js 內的 Web Worker 程式碼，在 Node 的 vm 沙盒中原樣執行。
// 不修改正式程式碼；若 app.js 的 workerCode 結構改變，載入會明確失敗而不是默默通過。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

function extractWorkerCode() {
    const src = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
    const marker = 'const workerCode = `';
    const start = src.indexOf(marker);
    if (start < 0) throw new Error('找不到 workerCode，app.js 結構已改變');
    const bodyStart = start + marker.length;
    const end = src.indexOf('\n    `;', bodyStart);
    if (end < 0) throw new Error('找不到 workerCode 結尾，app.js 結構已改變');
    const body = src.slice(bodyStart, end);
    if (body.includes('${')) throw new Error('workerCode 含有樣板插值，測試載入器需更新');
    // 以與瀏覽器相同的方式處理樣板字串內的跳脫字元（例如 \d）。
    return vm.runInNewContext('`' + body + '`');
}

function createWorker() {
    const posted = [];
    const sandbox = { console, TextDecoder, TextEncoder, Uint8Array, ArrayBuffer, Date, importScripts() { throw new Error('測試禁止網路載入'); }, location: { origin: 'null' } };
    sandbox.self = sandbox;
    sandbox.window = sandbox;
    sandbox.globalThis = sandbox;
    sandbox.postMessage = (message) => posted.push(message);
    const context = vm.createContext(sandbox);
    // 與正式頁面使用同一份 Blob 組合；不可預先把 XLSX 注入 Worker。
    const page = { window: {} };
    page.globalThis = page.window;
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    if (html.includes('src="js/libs/xlsx.worker-source.js"')) {
        vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/libs/xlsx.worker-source.js'), 'utf8'), page);
    }
    const app = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
    const parts = app.match(/new Blob\((\[[^\n]+\]), \{ type: 'application\/javascript' \}\)/);
    if (!parts) throw new Error('找不到正式 Blob Worker 組合');
    const source = vm.runInNewContext(parts[1], { workerCode: extractWorkerCode(), window: page.window });
    vm.runInContext(source.join(''), context);
    if (typeof context.XLSX === 'undefined') throw new Error('Worker XLSX 未載入');
    return { context, posted, XLSX: context.XLSX };
}

// 模擬瀏覽器 File：只需要 name 與 arrayBuffer()。
function fakeFile(name, content, encoding) {
    let bytes;
    if (Buffer.isBuffer(content)) bytes = content;
    else if (encoding === 'utf16le') bytes = Buffer.concat([Buffer.from([0xFF, 0xFE]), Buffer.from(content, 'utf16le')]);
    else bytes = Buffer.from(content, 'utf8');
    const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    return { name, size: bytes.length, arrayBuffer: async () => ab };
}

async function runConvert(worker, files, mode, config) {
    worker.posted.length = 0;
    const handler = worker.context.onmessage;
    if (typeof handler !== 'function') throw new Error('worker 沒有 onmessage');
    await handler({ data: { files, mode, config } });
    return worker.posted.slice();
}

// 從 download 訊息取回活頁簿，供斷言使用。
function readDownload(worker, message) {
    return worker.XLSX.read(new Uint8Array(message.data), { type: 'array', cellNF: true });
}

module.exports = { createWorker, fakeFile, runConvert, readDownload };
