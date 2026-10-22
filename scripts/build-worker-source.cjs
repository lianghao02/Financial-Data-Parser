// 將原始 XLSX 套件包成字串，讓 file:// 的 Blob Worker 也能離線使用。
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/libs/xlsx.bundle.js'), 'utf8').replace(/\r\n?/g, '\n');
const output = '// 由 scripts/build-worker-source.cjs 產生，保留套件原有授權於字串內。\n'
    + 'window.XLSX_WORKER_SOURCE = ' + JSON.stringify(source) + ';\n';
const target = path.join(root, 'js/libs/xlsx.worker-source.js');
if (process.argv.includes('--check')) {
    if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8').replace(/\r\n?/g, '\n') !== output) {
        throw new Error('XLSX Worker 資源不同步，請執行 npm run build:worker。');
    }
} else {
    fs.writeFileSync(target, output, 'utf8');
}
