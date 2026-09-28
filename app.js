// ============================================================
// app.js — menyambungkan form survei ke Google Spreadsheet
// ⬇️ GANTI dengan URL Web App dari Apps Script (berakhiran /exec)
// ============================================================
const API_URL = 'https://script.google.com/macros/s/AKfycbxbVhEhW3w31s-iOmvQ491993S5SfoMQc5VWVNIQcmaL8YQNP2DJRLh56SgQ_lI2-ns/exec';

const $ = s => document.querySelector(s);
const state = { harga: '', tahan: '', beli: '', kepuasan: 0 };
const labels = ['Kurang 😕', 'Biasa aja 🙂', 'Lumayan 😊', 'Suka banget 😍', 'Wajib repurchase 🥰'];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); setTimeout(() => t.classList.remove('on'), 2800); }

// Tab
document.querySelectorAll('.tab').forEach((b, i) => b.onclick = () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === b));
  $('#pill').style.transform = `translateX(${i * 100}%)`;
  $('#form').classList.toggle('on', i === 0);
  $('#hasil').classList.toggle('on', i === 1);
  if (i === 1) loadResults();
});

// Chips
document.querySelectorAll('.chips').forEach(g => g.addEventListener('click', e => {
  const b = e.target.closest('.chip'); if (!b) return;
  g.querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
  b.classList.add('on'); state[g.dataset.k] = b.dataset.v;
}));

// Bintang
const stars = [...document.querySelectorAll('.star')];
const paint = n => stars.forEach((s, i) => s.classList.toggle('on', i < n));
stars.forEach((s, i) => {
  s.onclick = () => { state.kepuasan = i + 1; paint(i + 1); $('#label').textContent = labels[i]; s.classList.remove('pop'); void s.offsetWidth; s.classList.add('pop'); };
  s.onmouseenter = () => paint(i + 1);
  s.onmouseleave = () => paint(state.kepuasan);
});

// Kirim
$('#form').addEventListener('submit', async e => {
  e.preventDefault();
  const merek = $('#merek').value.trim();
  if (!merek || !state.harga || !state.kepuasan) return toast('Isi merek, harga & bintang dulu ya 🌸');
  const btn = $('#btn'); btn.classList.add('load'); btn.textContent = 'Mengirim...';
  try {
    const r = await fetch(API_URL, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ nama: $('#nama').value, merek, shade: $('#shade').value, harga: state.harga, kepuasan: state.kepuasan, tahan: state.tahan, beli: state.beli, komentar: $('#komentar').value })
    });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error);
    $('#form').reset(); Object.assign(state, { harga: '', tahan: '', beli: '', kepuasan: 0 });
    document.querySelectorAll('.chip.on').forEach(c => c.classList.remove('on')); paint(0); $('#label').textContent = '';
    $('#ov').classList.add('on');
    for (let i = 0; i < 26; i++) { const c = document.createElement('div'); c.className = 'conf'; c.textContent = ['💖', '🌸', '✨', '🎀', '⭐'][i % 5]; c.style.left = Math.random() * 100 + 'vw'; c.style.animationDelay = Math.random() * .8 + 's'; document.body.appendChild(c); setTimeout(() => c.remove(), 3500); }
  } catch (err) { toast('Gagal kirim 😢 Cek URL Web App-nya'); }
  btn.classList.remove('load'); btn.textContent = 'Kirim Jawaban 💌';
});
$('#ok').onclick = () => $('#ov').classList.remove('on');

// Hasil
function countUp(el, to, dec) {
  const t0 = performance.now();
  (function step(t) { const p = Math.min((t - t0) / 900, 1); el.textContent = (to * (1 - Math.pow(1 - p, 3))).toFixed(dec); if (p < 1) requestAnimationFrame(step); })(t0);
}
function bars(items, cls) {
  const max = Math.max(...items.map(i => i.v), 1);
  return items.map(i => `<div class="row"><div class="t"><span>${esc(i.l)}</span><span>${esc(i.r)}</span></div><div class="track"><div class="fill ${cls}" data-w="${i.v / max * 100}"></div></div></div>`).join('');
}
async function loadResults() {
  const box = $('#hasil'); box.innerHTML = '<div class="empty">Memuat... 🌷</div>';
  try {
    const d = await (await fetch(API_URL)).json();
    if (!d.total) { box.innerHTML = '<div class="empty">Belum ada jawaban. Jadi yang pertama yuk! 💗</div>'; return; }
    const prices = ['< Rp25.000', 'Rp25.000 - 50.000', 'Rp50.000 - 100.000', '> Rp100.000'].map(p => ({ l: p, v: d.prices[p] || 0, r: (d.prices[p] || 0) + ' orang' }));
    const sts = [5, 4, 3, 2, 1].map(n => ({ l: '⭐'.repeat(n), v: d.stars[n], r: d.stars[n] + '' }));
    box.innerHTML = `<div class="stats"><div class="stat"><b id="n1">0</b><span>responden</span></div><div class="stat"><b id="n2">0</b><span>rata-rata kepuasan ⭐</span></div></div>
      <h3>🏆 Liptint Favorit</h3>${bars(d.top.map(t => ({ l: t.name, v: t.count, r: t.count + ' suara · ⭐' + t.avg })), '')}
      <h3>💰 Rentang Harga</h3>${bars(prices, 'y')}
      <h3>⭐ Tingkat Kepuasan</h3>${bars(sts, '')}`;
    countUp($('#n1'), d.total, 0); countUp($('#n2'), d.avg, 1);
    setTimeout(() => box.querySelectorAll('.fill').forEach(f => f.style.width = f.dataset.w + '%'), 80);
  } catch (err) { box.innerHTML = '<div class="empty">Gagal memuat hasil 😢</div>'; }
}
