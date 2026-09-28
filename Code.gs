// ===== Survei Liptint — Google Apps Script =====
const SHEET_NAME = 'Data';
const HEADERS = ['Waktu', 'Panggilan', 'Merek', 'Shade', 'Rentang Harga', 'Kepuasan', 'Ketahanan', 'Beli Lagi', 'Komentar'];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Menerima jawaban dari form
function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (!d.merek || !d.harga || !d.kepuasan) return json_({ ok: false, error: 'Data belum lengkap' });
    getSheet_().appendRow([
      new Date(), d.nama || '', String(d.merek).trim(), d.shade || '',
      d.harga, Number(d.kepuasan), d.tahan || '', d.beli || '', d.komentar || ''
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// Mengirim rekap hasil (liptint favorit, rentang harga, kepuasan)
function doGet() {
  const rows = getSheet_().getDataRange().getValues().slice(1);
  const brands = {}, prices = {}, stars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  rows.forEach(r => {
    const key = String(r[2]).trim().toLowerCase();
    if (!key) return;
    const score = Number(r[5]) || 0;
    if (!brands[key]) brands[key] = { name: titleCase_(key), count: 0, sum: 0 };
    brands[key].count++;
    brands[key].sum += score;
    prices[r[4]] = (prices[r[4]] || 0) + 1;
    if (stars[score] !== undefined) stars[score]++;
    sum += score;
  });

  const top = Object.values(brands)
    .map(b => ({ name: b.name, count: b.count, avg: +(b.sum / b.count).toFixed(1) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return json_({
    ok: true,
    total: rows.length,
    avg: rows.length ? +(sum / rows.length).toFixed(1) : 0,
    top: top,
    prices: prices,
    stars: stars
  });
}

function titleCase_(s) {
  return s.replace(/\b\w/g, c => c.toUpperCase());
}
