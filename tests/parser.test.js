'use strict';
// 金融資料轉換回歸測試。全部使用虛構的合成資料，不含任何真實帳號、姓名或證號。
// 目的：鎖住「長數字不失真、前導零保留、金額符號清除、合併正確」等已確認行為，防止日後修改時默默改壞。
const test = require('node:test');
const assert = require('node:assert/strict');
const { createWorker, fakeFile, runConvert, readDownload } = require('./harness');

const TEXT_CFG = { cellType: 'text', stripCurrency: true, sheetPrefix: '', themeColor: '#1E3A8A', customFilename: '' };
// 沙盒（vm）內建立的陣列與測試檔的陣列屬於不同執行環境，嚴格比較前先轉成純 JSON。
const plain = (v) => JSON.parse(JSON.stringify(v));
const eq = (a, b, m) => assert.deepEqual(plain(a), plain(b), m);
const NUMBER_CFG = { ...TEXT_CFG, cellType: 'number' };

function cell(wb, ref, sheet) {
    const ws = wb.Sheets[sheet || wb.SheetNames[0]];
    return ws[ref];
}

// ---------- 純函式 ----------
test('金額欄位標題判斷', () => {
    const { context } = createWorker();
    for (const h of ['支出金額', '存入金額', '餘額', '帳戶結餘', '交易額', '匯款額', '付款額', '收款額']) {
        assert.equal(context.isCurrencyHeader(h), true, h);
    }
    for (const h of ['帳號', '戶名', '身分證統一編號', '', null, 123, undefined]) {
        assert.equal(context.isCurrencyHeader(h), false, String(h));
    }
});

test('只清除金額欄位的 $ 與千分位，不動其他欄位', () => {
    const { context } = createWorker();
    const rows = [
        ['戶名', '備註', '支出金額', '餘額'],
        ['甲', '$1,000 備註', '$1,234.00', '-5,000.50'],
        ['乙', '1,2,3', '0', '1,000,000'],
    ];
    const out = context.cleanData(rows, { stripCurrency: true });
    eq(out[0], rows[0], '標題列不變');
    eq(out[1], ['甲', '$1,000 備註', '1234', '-5000.50']);
    eq(out[2], ['乙', '1,2,3', '0', '1000000']);
});

test('關閉清除金額時原樣保留', () => {
    const { context } = createWorker();
    const rows = [['金額'], ['$1,234.00']];
    eq(context.cleanData(rows, { stripCurrency: false }), rows);
});

test('空資料與非陣列資料不會丟例外', () => {
    const { context } = createWorker();
    eq(context.cleanData([], { stripCurrency: true }), []);
    eq(context.cleanData(null, { stripCurrency: true }), []);
});

test('分頁類型判斷', () => {
    const { context } = createWorker();
    assert.equal(context.getHeaderFingerprint(['登入時間', 'IP位置']), 'IP紀錄');
    assert.equal(context.getHeaderFingerprint(['交易摘要', '餘額']), '交易明細');
    assert.equal(context.getHeaderFingerprint(['戶名', '戶籍地址']), '基本資料');
    assert.equal(context.getHeaderFingerprint(['卡號', '授權碼']), '信用卡明細');
    assert.equal(context.getHeaderFingerprint(['甲', '乙']), '資料表');
    assert.equal(context.getHeaderFingerprint(null), '資料明細');
});

test('銀行簡稱由檔名判斷', () => {
    const { context } = createWorker();
    assert.equal(context.getShortBankName('reply_822_trn.csv'), '中信');
    assert.equal(context.getShortBankName('PSACT_001.csv'), '郵局');
    assert.equal(context.getShortBankName('國泰明細.csv'), '國泰');
    assert.equal(context.getShortBankName('其他.csv'), '');
});

test('開戶資料需符合至少 4 個關鍵標題才視為開戶人資料', () => {
    const { context } = createWorker();
    assert.equal(context.isAccountOpenerData([['身分證統一編號', '戶名', '帳號', '開戶日']]), true);
    assert.equal(context.isAccountOpenerData([['身分證統一編號', '戶名', '帳號']]), false);
    assert.equal(context.isAccountOpenerData([]), false);
});

// ---------- 讀檔與編碼 ----------
test('UTF-8、UTF-16LE（含 BOM）、Big5 的 CSV 都能讀出中文標題', async () => {
    const w = createWorker();
    const text = '戶名,帳號\n王小明,0012345678\n';
    const utf8 = await w.context.parseData(fakeFile('a.csv', text));
    const utf16 = await w.context.parseData(fakeFile('b.csv', text, 'utf16le'));
    // 由 Python 以 big5 編碼產生的位元組：「戶名,帳號,支出金額 / 王小明,0012345678,"1,234"」
    const big5Hex = 'a4e1a6572cb162b8b92ca4e4a558aaf7c3420aa4fda470a9fa2c303031323334353637382c22312c323334220a';
    const big5 = await w.context.parseData(fakeFile('c.csv', Buffer.from(big5Hex, 'hex')));
    eq(utf8[0], ['戶名', '帳號']);
    eq(utf16[0], ['戶名', '帳號']);
    eq(big5[0], ['戶名', '帳號', '支出金額']);
    assert.equal(big5[1][0], '王小明');
});

// ---------- 個別轉檔 ----------
test('文字模式：前導零與 19 位數長數字完整保留，且儲存格為文字格式', async () => {
    const w = createWorker();
    const csv = '戶名,帳號,支出金額\n王小明,0012345678901234,"1,234.00"\n李小華,1234567890123456789,$500\n';
    const out = await runConvert(w, [fakeFile('明細.csv', csv)], 'individual', TEXT_CFG);
    const wb = readDownload(w, out.find(m => m.type === 'download'));
    assert.equal(cell(wb, 'B2').v, '0012345678901234');
    assert.equal(cell(wb, 'B3').v, '1234567890123456789');
    assert.equal(cell(wb, 'B2').t, 's');
    assert.equal(cell(wb, 'B2').z, '@');
    assert.equal(cell(wb, 'C2').v, '1234');
    assert.equal(cell(wb, 'C3').v, '500');
    assert.equal(out.at(-1).type, 'done');
    eq(out.at(-1).errors, []);
});

test('數字模式：只有金額欄位變成數字，帳號仍是文字', async () => {
    const w = createWorker();
    const csv = '戶名,帳號,支出金額,餘額\n王小明,0012345678901234,"1,234.50","-5,000"\n';
    const out = await runConvert(w, [fakeFile('明細.csv', csv)], 'individual', NUMBER_CFG);
    const wb = readDownload(w, out.find(m => m.type === 'download'));
    assert.equal(cell(wb, 'C2').t, 'n');
    assert.equal(cell(wb, 'C2').v, 1234.5);
    assert.equal(cell(wb, 'D2').v, -5000);
    assert.equal(cell(wb, 'B2').v, '0012345678901234', '帳號不可被轉成數字');
});

test('輸出檔名與分頁名稱規則', async () => {
    const w = createWorker();
    const csv = '戶名,支出金額\n王[小]明:甲/乙,100\n';
    let out = await runConvert(w, [fakeFile('原始明細.csv', csv)], 'individual', TEXT_CFG);
    const dl = out.find(m => m.type === 'download');
    assert.equal(dl.filename, '原始明細.xlsx');
    const wb = readDownload(w, dl);
    assert.match(wb.SheetNames[0], /^王_小_明_甲_乙_/, '不合法字元要換成底線');
    assert.ok(wb.SheetNames[0].length <= 31);

    out = await runConvert(w, [fakeFile('a.csv', csv), fakeFile('b.csv', csv)], 'individual', { ...TEXT_CFG, customFilename: '案件' });
    eq(out.filter(m => m.type === 'download').map(m => m.filename), ['案件_1.xlsx', '案件_2.xlsx']);
});

test('單一壞檔不影響其他檔案，錯誤會回報', async () => {
    const w = createWorker();
    const good = fakeFile('好.csv', '戶名,餘額\n甲,100\n');
    const bad = { name: '壞.csv', arrayBuffer: async () => { throw new Error('讀取失敗'); } };
    const out = await runConvert(w, [bad, good], 'individual', TEXT_CFG);
    assert.equal(out.filter(m => m.type === 'download').length, 1);
    const done = out.at(-1);
    assert.equal(done.type, 'done');
    assert.equal(done.errors.length, 1);
    assert.match(done.errors[0], /壞\.csv/);
});

test('不支援的模式會回報錯誤而不是默默成功', async () => {
    const w = createWorker();
    const out = await runConvert(w, [fakeFile('a.csv', '甲\n1\n')], 'unknown', TEXT_CFG);
    assert.equal(out.at(-1).type, 'error');
});

// ---------- 合併 ----------
test('合併分頁：同名分頁自動加序號，且不超過 31 字', async () => {
    const w = createWorker();
    const csv = '戶名,帳號,餘額\n王小明,00123456,"1,000"\n';
    const out = await runConvert(w, [fakeFile('a.csv', csv), fakeFile('b.csv', csv), fakeFile('c.csv', csv)], 'merged_sheets', TEXT_CFG);
    const wb = readDownload(w, out.find(m => m.type === 'download'));
    assert.equal(wb.SheetNames.length, 3);
    assert.equal(new Set(wb.SheetNames).size, 3, '分頁名稱不可重複');
    assert.ok(wb.SheetNames.every(n => n.length <= 31));
    assert.equal(cell(wb, 'B2', wb.SheetNames[0]).v, '00123456');
});

test('合併單頁：相同標題只保留一列，金額在每個檔案都被清除', async () => {
    const w = createWorker();
    const a = '戶名,帳號,支出金額\n甲,001,"1,000"\n';
    const b = '戶名,帳號,支出金額\n乙,002,"$2,500.00"\n丙,003,"3,000"\n';
    const out = await runConvert(w, [fakeFile('a.csv', a), fakeFile('b.csv', b)], 'merged_single_sheet', TEXT_CFG);
    const wb = readDownload(w, out.find(m => m.type === 'download'));
    const ws = wb.Sheets['合併彙總'];
    const rows = w.XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
    assert.equal(rows.length, 4, '1 列標題加 3 列資料');
    eq(rows.map(r => r[1]), ['帳號', '001', '002', '003']);
    eq(rows.map(r => r[2]), ['支出金額', '1000', '2500', '3000'], '第二個檔案之後的金額也必須清除符號');
});

test('合併單頁：標題不同的檔案保留各自標題列', async () => {
    const w = createWorker();
    const a = '戶名,餘額\n甲,100\n';
    const b = '卡號,消費\n0001,200\n';
    const out = await runConvert(w, [fakeFile('a.csv', a), fakeFile('b.csv', b)], 'merged_single_sheet', TEXT_CFG);
    const wb = readDownload(w, out.find(m => m.type === 'download'));
    const rows = w.XLSX.utils.sheet_to_json(wb.Sheets['合併彙總'], { header: 1, raw: false, defval: '' });
    assert.equal(rows.length, 4);
    eq(rows[2], ['卡號', '消費']);
});

test('開戶人資料合併後會產生「開戶人」儀表板並排在第一個分頁', async () => {
    const w = createWorker();
    const csv = '身分證統一編號,開戶行庫分行簡稱代碼,存款種類,戶名,帳號,開戶日,資料提供日\nA123456789,0120001,活存,王小明,00112233,1100101,1150101\n';
    const out = await runConvert(w, [fakeFile('reply_012_basic.csv', csv)], 'merged_sheets', TEXT_CFG);
    const wb = readDownload(w, out.find(m => m.type === 'download'));
    assert.equal(wb.SheetNames[0], '開戶人');
});
