/* ==========================================
   DELVINO - MASTER LOGIC FINAL (ALL-IN-ONE)
   ========================================== */

const DB_NAME = 'finora_db'; // Tetap pakai ini agar data lama tidak hilang
const DB_VERSION = 2;
let db;

// --- UTILS ---
const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
const todayStr = () => new Date().toISOString().split('T')[0];

const showToast = (msg, type = 'success') => {
  const container = document.getElementById('toast-container');
  if(!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = (type === 'success' ? '✅ ' : '❌ ') + msg;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('hide'); setTimeout(() => toast.remove(), 300); }, 3000);
};

const formatInputRupiah = (input) => {
  let val = input.value.replace(/[^0-9]/g, '');
  if (val) input.value = new Intl.NumberFormat('id-ID').format(val);
};

// --- DATA QUOTES & AYAT ---
const QUOTES = [
  "Disiplin kecil setiap hari mengalahkan rencana besar yang tak pernah dimulai.",
  "Uang adalah alat yang baik jika kamu yang mengendalikannya.",
  "Masa depanmu dibangun oleh apa yang kamu lakukan hari ini.",
  "Jangan menabung dari sisa belanja, tapi belanjalah dari sisa tabungan.",
  "Setiap rupiah yang kamu catat adalah langkah menuju kebebasan finansial.",
  "Investasi terbaik adalah pada dirimu sendiri."
];

const AYAHS = [
  { text: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ", translation: "Dan barangsiapa bertakwa kepada Allah, niscaya Dia akan mengadakan jalan keluar baginya. Dan memberinya rezeki dari arah yang tidak disangka-sangkanya.", source: "QS. At-Talaq: 2-3" },
  { text: "وَمَا مِن دَابَّةٍ فِي الْأَرْضِ إِلَّا عَلَى اللَّهِ رِزْقُهَا", translation: "Dan tidak ada satupun makhluk bergerak (bernyawa) di bumi melainkan semuanya dijamin Allah rezekinya.", source: "QS. Hud: 6" },
  { text: "إِنَّ اللَّهَ هُوَ الرَّزَّاقُ ذُو الْقُوَّةِ الْمَتِينُ", translation: "Sungguh, Allah Dialah Yang Maha Pemberi rezeki, Yang mempunyai kekuatan, Yang sangat kokoh.", source: "QS. Az-Zariyat: 58" },
  { text: "وَاللَّهُ يَرْزُقُ مَن يَشَاءُ بِغَيْرِ حِسَابٍ", translation: "Dan Allah memberi rezeki kepada siapa yang Dia kehendaki tanpa perhitungan.", source: "QS. Al-Baqarah: 212" },
  { text: "فَابْتَغُوا عِندَ اللَّهِ الرِّزْقَ وَاعْبُدُوهُ وَاشْكُرُوا لَهُ", translation: "Maka carilah rezeki di sisi Allah, dan sembahlah Dia, dan bersyukurlah kepada-Nya.", source: "QS. Al-Ankabut: 17" }
];

// --- KATEGORI ---
const INCOME_CATS = ['Uang saku', 'Gaji', 'Hadiah', 'Hasil usaha', 'Freelance', 'Pemasukan lainnya'];
const EXPENSE_CATS = ['Makanan pribadi', 'Transportasi', 'Pendidikan', 'Kesehatan', 'Perawatan diri', 'Belanja keluarga', 'Tagihan', 'Hiburan', 'Nongkrong', 'Hobi', 'Keinginan lainnya'];

// --- INIT DB ---
const initDB = () => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      db = e.target.result;
      if (!db.objectStoreNames.contains('transactions')) db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains('goals')) db.createObjectStore('goals', { keyPath: 'slot' });
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('docs')) db.createObjectStore('docs', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = (e) => { db = e.target.result; resolve(); };
    req.onerror = (e) => reject(e);
  });
};

const dbGetAll = (store) => new Promise((res) => { const r = db.transaction(store, 'readonly').objectStore(store).getAll(); r.onsuccess = () => res(r.result); });
const dbPut = (store, data) => new Promise((res) => { const r = db.transaction(store, 'readwrite').objectStore(store).put(data); r.onsuccess = () => res(r.result); });
const dbAdd = (store, data) => new Promise((res) => { const r = db.transaction(store, 'readwrite').objectStore(store).add(data); r.onsuccess = () => res(r.result); });
const dbDelete = (store, id) => new Promise((res) => { const r = db.transaction(store, 'readwrite').objectStore(store).delete(id); r.onsuccess = () => res(); });
const dbClear = (store) => new Promise((res) => { const r = db.transaction(store, 'readwrite').objectStore(store).clear(); r.onsuccess = () => res(); });

// --- UI NAVIGASI ---
const nav = (view) => {
  document.querySelectorAll('.view').forEach(v => { v.classList.remove('active'); v.style.display = 'none'; });
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  
  const targetView = document.getElementById('view-' + view);
  if(targetView) { targetView.classList.add('active'); targetView.style.display = 'block'; }
  
  const targetBtn = document.querySelector(`.nav-btn[data-view="${view}"]`);
  if(targetBtn) targetBtn.classList.add('active');
  
  if(window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
};

const toggleMenu = () => document.getElementById('sidebar').classList.toggle('open');
const toggleTheme = () => { document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; };
const openModal = (id) => document.getElementById('modal-' + id).classList.add('open');
const closeModal = (id) => document.getElementById('modal-' + id).classList.remove('open');

// --- FUNGSI PEMUAT QUOTES & AYAT ---
const loadDailyQuote = () => {
  const dayIndex = Math.floor(Date.now() / 86400000) % QUOTES.length;
  const quoteEl = document.getElementById('daily-quote');
  if (quoteEl) quoteEl.textContent = `"${QUOTES[dayIndex]}"`;
};

const loadAyatAman = () => {
  try {
    const elText = document.getElementById('daily-ayat');
    if (!elText) return; 
    
    const dayIndex = Math.floor(Date.now() / 86400000) % AYAHS.length;
    const ayatData = AYAHS[dayIndex];
    
    elText.textContent = ayatData.text;
    document.getElementById('daily-ayat-translation').textContent = `"${ayatData.translation}"`;
    document.getElementById('daily-ayat-source').textContent = `- ${ayatData.source}`;
  } catch (error) {
    console.warn("Ayat tidak tampil:", error);
  }
};

// --- LOGIKA RENDER UTAMA ---
const renderAll = async () => {
  const txs = await dbGetAll('transactions');
  const goals = await dbGetAll('goals');
  const settings = await dbGetAll('settings');
  const docs = await dbGetAll('docs');

  let inc = 0, exp = 0;
  txs.forEach(t => t.type === 'income' ? inc += t.amount : exp += t.amount);
  const balance = inc - exp;
  const savingsRate = inc > 0 ? ((balance / inc) * 100).toFixed(1) : 0;

  document.getElementById('d-bal').textContent = fmt(balance);
  document.getElementById('d-inc').textContent = fmt(inc);
  document.getElementById('d-exp').textContent = fmt(exp);
  document.getElementById('d-rate').textContent = `${savingsRate}%`;

  const sup = settings.find(s => s.key === 'support')?.value || {};
  document.getElementById('dash-support').innerHTML = sup.img ? `
    <img src="${sup.img}" class="avatar">
    <div>
      <h4 style="margin:0;font-family:var(--font-heading)">${sup.name || 'Support System'}</h4>
      <p style="font-size:12px;color:var(--text-muted);margin-top:4px">"${sup.msg || 'Terus bertumbuh!'}"</p>
    </div>
  ` : '<p style="color:var(--text-muted)">Belum ada foto support system.</p>';

  txs.sort((a,b) => new Date(b.date) - new Date(a.date));
  document.getElementById('tx-list').innerHTML = txs.length === 0 ? '<tr><td colspan="5" style="text-align:center">Belum ada data.</td></tr>' : 
    txs.map(t => `
      <tr>
        <td>${t.date}</td>
        <td><strong>${t.name}</strong></td>
        <td>${t.category}</td>
        <td style="color:${t.type==='income'?'var(--success)':'var(--danger)'};font-weight:700">${t.type==='income'?'+':'-'}${fmt(t.amount)}</td>
        <td style="text-align:right">
          <button class="btn btn-ghost" onclick="editTx(${t.id})" style="padding:6px 12px;font-size:12px">Edit</button>
          <button class="btn btn-danger" onclick="hapusTx(${t.id})" style="padding:6px 12px;font-size:12px">Hapus</button>
        </td>
      </tr>
    `).join('');

  let goalHtml = '', dashGoalHtml = 'Belum ada goal.';
  for(let i=1; i<=4; i++) {
    const g = goals.find(x => x.slot === i);
    if(g) {
      const pct = Math.min((g.current / g.target) * 100, 100);
      goalHtml += `
      <div class="card">
        <h3 style="font-family:var(--font-heading)">${g.title}</h3>
        <p style="font-size:12px;color:var(--text-muted);margin-top:4px">Target: ${fmt(g.target)}</p>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:12px;font-weight:600">
          <span>Terkumpul: ${fmt(g.current)}</span><strong style="color:var(--emerald)">${pct.toFixed(0)}%</strong>
        </div>
        <div style="display:flex;gap:8px;margin-top:16px">
          <button class="btn btn-primary" style="flex:1" onclick="tambahDana(${i})">+ Dana</button>
          <button class="btn btn-ghost" onclick="editGoal(${i})">Edit</button>
        </div>
      </div>`;
      if(i===1) dashGoalHtml = `<strong style="font-family:var(--font-heading)">${g.title}</strong><br><span style="font-size:12px">${pct.toFixed(0)}% tercapai</span><div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>`;
    } else {
      goalHtml += `<div class="card" style="text-align:center;padding:40px 20px"><p style="color:var(--text-muted)">Slot ${i} Kosong</p><button class="btn btn-primary" style="margin-top:12px" onclick="editGoal(${i})">Buat Goal</button></div>`;
    }
  }
  document.getElementById('goals-container').innerHTML = goalHtml;
  document.getElementById('dash-goal').innerHTML = dashGoalHtml;

  document.getElementById('doc-gallery').innerHTML = docs.length === 0 ? '<p style="color:var(--text-muted)">Belum ada foto dokumentasi.</p>' :
    docs.map(d => `<div><img src="${d.img}"><p style="font-size:12px;text-align:center;margin-top:8px;font-weight:600">${d.title}</p></div>`).join('');

  const prof = settings.find(s => s.key === 'profile')?.value || {};
  document.getElementById('prof-name').value = prof.name || '';
  document.getElementById('prof-bio').value = prof.bio || '';
  if(prof.img) document.getElementById('prof-avatar').innerHTML = `<img src="${prof.img}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;
  document.getElementById('sup-name').value = sup.name || '';
  document.getElementById('sup-msg').value = sup.msg || '';
  if(sup.img) document.getElementById('sup-avatar').innerHTML = `<img src="${sup.img}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;

  renderChart(txs);
  renderAnalisis(txs);
};

// --- FITUR QUICK ADD DANA GOAL ---
const tambahDana = async (slot) => {
  const nominal = prompt('Masukkan nominal dana yang ingin ditambahkan (Contoh: 500000):');
  if(!nominal || isNaN(nominal.replace(/\./g,''))) return;
  
  const goals = await dbGetAll('goals');
  const g = goals.find(x => x.slot === slot);
  if(g) {
    g.current += parseInt(nominal.replace(/\./g,''));
    await dbPut('goals', g);
    showToast('Dana target berhasil ditambahkan!');
    renderAll();
  }
};

// --- GRAFIK VISUAL CANVAS ---
const renderChart = (txs) => {
  const canvas = document.getElementById('myChart');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const catMap = {};
  txs.filter(t => t.type === 'expense').forEach(t => catMap[t.category] = (catMap[t.category] || 0) + t.amount);
  
  const entries = Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0, 4);
  const maxVal = Math.max(...entries.map(e => e[1]), 1);

  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = 250;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if(entries.length === 0) {
    ctx.fillStyle = '#888'; ctx.font = '14px Plus Jakarta Sans'; ctx.textAlign = 'center';
    ctx.fillText('Belum ada data pengeluaran', canvas.width/2, canvas.height/2);
    return;
  }

  const barWidth = 40;
  const gap = (canvas.width - (entries.length * barWidth)) / (entries.length + 1);
  const isDark = document.documentElement.dataset.theme === 'dark';

  entries.forEach(([cat, val], index) => {
    const x = gap + index * (barWidth + gap);
    const barHeight = (val / maxVal) * 150;
    const y = 200 - barHeight;

    const gradient = ctx.createLinearGradient(0, y, 0, 200);
    gradient.addColorStop(0, '#3B82F6'); // Biru Primary
    gradient.addColorStop(1, '#60A5FA');
    ctx.fillStyle = gradient;
    
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, [8, 8, 0, 0]);
    ctx.fill();

    ctx.fillStyle = isDark ? '#A6B0A8' : '#5A6660';
    ctx.font = '11px Plus Jakarta Sans';
    ctx.textAlign = 'center';
    ctx.fillText(cat.length > 10 ? cat.substring(0,8)+'...' : cat, x + barWidth/2, 220);

    ctx.fillStyle = isDark ? '#EDF1EC' : '#1F2421';
    ctx.font = 'bold 11px Plus Jakarta Sans';
    ctx.fillText(val >= 1000000 ? (val/1000000).toFixed(1)+'Jt' : (val/1000).toFixed(0)+'Rb', x + barWidth/2, y - 10);
  });
};

// --- ANALISIS ---
let currentPeriod = 'month';
const setPeriod = (p) => {
  currentPeriod = p;
  document.querySelectorAll('.filter-stat').forEach(btn => btn.classList.remove('active'));
  
  const btnWeek = document.querySelector("button[onclick=\"setPeriod('week')\"]");
  const btnMonth = document.querySelector("button[onclick=\"setPeriod('month')\"]");
  const btnYear = document.querySelector("button[onclick=\"setPeriod('year')\"]");
  
  if (p === 'week' && btnWeek) btnWeek.classList.add('active');
  if (p === 'month' && btnMonth) btnMonth.classList.add('active');
  if (p === 'year' && btnYear) btnYear.classList.add('active');

  dbGetAll('transactions').then(renderAnalisis);
};

const renderAnalisis = (txs) => {
  const now = new Date();
  let startCurrent, startLast, label = "";
  let thisInc=0, thisExp=0, lastInc=0, lastExp=0;

  if (currentPeriod === 'week') {
    const day = now.getDay() || 7; 
    startCurrent = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
    startLast = new Date(startCurrent); startLast.setDate(startLast.getDate() - 7);
    label = "Minggu Ini vs Minggu Lalu";
  } else if (currentPeriod === 'month') {
    startCurrent = new Date(now.getFullYear(), now.getMonth(), 1);
    startLast = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    label = "Bulan Ini vs Bulan Lalu";
  } else {
    startCurrent = new Date(now.getFullYear(), 0, 1);
    startLast = new Date(now.getFullYear() - 1, 0, 1);
    label = "Tahun Ini vs Tahun Lalu";
  }

  const formatDateStr = (d) => d.toISOString().split('T')[0];
  const strCur = formatDateStr(startCurrent), strLast = formatDateStr(startLast), strNow = formatDateStr(now);

  txs.forEach(t => {
    if (t.date >= strCur && t.date <= strNow) { if(t.type==='income') thisInc+=t.amount; else thisExp+=t.amount; }
    else if (t.date >= strLast && t.date < strCur) { if(t.type==='income') lastInc+=t.amount; else lastExp+=t.amount; }
  });

  let html = '';
  if(lastInc === 0 && lastExp === 0) {
    html = `<p style="color:var(--text-muted)">Belum cukup data pada periode sebelumnya untuk membuat perbandingan.</p>`;
  } else {
    const incChange = lastInc === 0 ? 100 : ((thisInc - lastInc) / lastInc) * 100;
    const expChange = lastExp === 0 ? 100 : ((thisExp - lastExp) / lastExp) * 100;
    
    let status = "Stabil", color = "var(--info)";
    if (incChange > expChange && incChange > 0) { status = "Membaik (Positif)"; color = "var(--success)"; }
    else if (expChange > incChange && expChange > 0) { status = "Memburuk (Waspada)"; color = "var(--danger)"; }

    html = `
      <div style="background:var(--surface-2);padding:20px;border-radius:var(--r-md);margin-bottom:20px;border-left:4px solid ${color}">
        <h4 style="color:${color};margin-bottom:8px;font-family:var(--font-heading)">Status: ${status}</h4>
        <p style="font-size:13px;line-height:1.6">Bandingkan dengan periode sebelumnya, pemasukanmu <strong>${incChange > 0 ? 'naik' : 'turun'} ${Math.abs(incChange).toFixed(1)}%</strong>, sementara pengeluaran <strong>${expChange > 0 ? 'naik' : 'turun'} ${Math.abs(expChange).toFixed(1)}%</strong>.</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div style="font-size:13px"><span style="color:var(--text-muted)">Pemasukan (Periode Ini):</span><br><strong style="color:var(--success);font-size:16px">${fmt(thisInc)}</strong></div>
        <div style="font-size:13px"><span style="color:var(--text-muted)">Pengeluaran (Periode Ini):</span><br><strong style="color:var(--danger);font-size:16px">${fmt(thisExp)}</strong></div>
      </div>
    `;
  }
  document.getElementById('stat-conclusion').innerHTML = `<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;font-weight:600">${label}</div>` + html;
};

// --- CRUD TRANSAKSI ---
const updateCat = () => {
  const type = document.getElementById('tx-type').value;
  document.getElementById('tx-cat').innerHTML = (type === 'income' ? INCOME_CATS : EXPENSE_CATS).map(c => `<option value="${c}">${c}</option>`).join('');
};

const saveTx = async (e) => {
  e.preventDefault();
  const amountStr = document.getElementById('tx-amount').value.replace(/\./g, '');
  const idVal = document.getElementById('tx-id').value;
  
  const data = {
    type: document.getElementById('tx-type').value,
    amount: parseInt(amountStr),
    name: document.getElementById('tx-name').value,
    category: document.getElementById('tx-cat').value,
    date: document.getElementById('tx-date').value
  };
  
  if (idVal) {
    data.id = parseInt(idVal);
    await dbPut('transactions', data);
    showToast('Transaksi diperbarui!');
  } else {
    await dbAdd('transactions', data);
    showToast('Transaksi ditambahkan!');
  }
  
  closeModal('tx'); e.target.reset(); document.getElementById('tx-id').value = ''; document.getElementById('tx-date').value = todayStr();
  renderAll();
};

const editTx = async (id) => {
  const txs = await dbGetAll('transactions');
  const t = txs.find(x => x.id === id);
  if(!t) return;
  document.getElementById('tx-id').value = t.id;
  document.getElementById('tx-type').value = t.type;
  updateCat();
  document.getElementById('tx-cat').value = t.category;
  document.getElementById('tx-amount').value = new Intl.NumberFormat('id-ID').format(t.amount);
  document.getElementById('tx-name').value = t.name;
  document.getElementById('tx-date').value = t.date;
  openModal('tx');
};

const hapusTx = async (id) => { 
  if(confirm('Hapus transaksi ini?')) { 
    await dbDelete('transactions', id); showToast('Transaksi dihapus.', 'danger'); renderAll(); 
  } 
};

// --- CRUD GOALS ---
const editGoal = async (slot) => {
  const goals = await dbGetAll('goals');
  const g = goals.find(x => x.slot === slot);
  document.getElementById('g-slot').value = slot;
  document.getElementById('g-title').value = g ? g.title : '';
  document.getElementById('g-target').value = g ? new Intl.NumberFormat('id-ID').format(g.target) : '';
  document.getElementById('g-current').value = g ? new Intl.NumberFormat('id-ID').format(g.current) : '0';
  openModal('goal');
};

const saveGoal = async (e) => {
  e.preventDefault();
  await dbPut('goals', {
    slot: parseInt(document.getElementById('g-slot').value),
    title: document.getElementById('g-title').value,
    target: parseInt(document.getElementById('g-target').value.replace(/\./g, '')),
    current: parseInt(document.getElementById('g-current').value.replace(/\./g, ''))
  });
  closeModal('goal'); showToast('Target disimpan!'); renderAll();
};

// --- GAMBAR & PROFIL ---
const uploadImage = (type, input) => {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 400;
      let w = img.width, h = img.height;
      if (w > h) { if (w > MAX) { h *= MAX/w; w = MAX; } } else { if (h > MAX) { w *= MAX/h; h = MAX; } }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      dbPut('settings', { key: type, value: { ...getSettings(type), img: base64 } }).then(() => {
        showToast('Foto diupload!'); renderAll();
      });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(input.files[0]);
};

let cachedSettings = {};
const getSettings = (key) => cachedSettings[key] || {};

const saveBiodata = async () => {
  await dbPut('settings', { key: 'profile', value: { name: document.getElementById('prof-name').value, bio: document.getElementById('prof-bio').value, img: getSettings('profile').img } });
  await dbPut('settings', { key: 'support', value: { name: document.getElementById('sup-name').value, msg: document.getElementById('sup-msg').value, img: getSettings('support').img } });
  const settings = await dbGetAll('settings');
  settings.forEach(s => cachedSettings[s.key] = s.value);
  showToast('Biodata tersimpan.'); renderAll();
};

const saveDoc = (e) => {
  e.preventDefault();
  const file = document.getElementById('doc-file').files[0];
  const title = document.getElementById('doc-title').value;
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const MAX = 600;
      let w = img.width, h = img.height;
      if (w > h) { if (w > MAX) { h *= MAX/w; w = MAX; } } else { if (h > MAX) { w *= MAX/h; h = MAX; } }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      await dbAdd('docs', { title: title, img: canvas.toDataURL('image/jpeg', 0.8), date: todayStr() });
      closeModal('doc'); e.target.reset(); showToast('Dokumentasi diunggah!'); renderAll();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
};

// --- BACKUP & RESTORE ---
const exportData = async () => {
  const data = {
    transactions: await dbGetAll('transactions'),
    goals: await dbGetAll('goals'),
    settings: await dbGetAll('settings'),
    docs: await dbGetAll('docs')
  };
  const str = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
  const a = document.createElement('a'); a.href = str; a.download = "delvino_backup.json"; a.click();
  showToast('Backup berhasil diunduh!');
};

const importData = (input) => {
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if(!data.transactions) throw new Error("Format file tidak valid");
      
      if(!confirm("PERINGATAN: Ini akan menghapus semua data kamu saat ini dan menggantinya dengan data dari file backup. Lanjutkan?")) return;
      
      await dbClear('transactions');
      await dbClear('goals');
      await dbClear('settings');
      await dbClear('docs');
      
      for(let t of data.transactions) await dbPut('transactions', t);
      for(let g of data.goals) await dbPut('goals', g);
      for(let s of data.settings) await dbPut('settings', s);
      for(let d of data.docs) await dbPut('docs', d);
      
      showToast('Data berhasil dipulihkan!');
      setTimeout(() => location.reload(), 1500);
    } catch (err) {
      showToast('Gagal memulihkan: File tidak valid.', 'danger');
    }
  };
  reader.readAsText(file);
  input.value = ''; 
};

// --- BOOTSTRAPPING ---
document.addEventListener('DOMContentLoaded', async () => {
  await initDB();
  
  const settings = await dbGetAll('settings');
  settings.forEach(s => cachedSettings[s.key] = s.value);
  
  document.getElementById('tx-date').value = todayStr();
  updateCat();
  
  loadDailyQuote();
  loadAyatAman();
  
  await renderAll();

  const loadingEl = document.getElementById('loading');
  if(loadingEl) loadingEl.style.display = 'none';
  
  const appContent = document.getElementById('app-content');
  if(appContent) appContent.style.display = 'block';

  window.addEventListener('resize', () => dbGetAll('transactions').then(renderChart));
});