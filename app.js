(function(){
  'use strict';
  const STORE_KEY = 'ignite_v4';
  const QUOTES = [
    "Mulai dari yang kecil, konsisten tiap hari.",
    "Disiplin adalah jembatan antara tujuan dan pencapaian.",
    "Fokus pada proses, hasil akan mengikuti.",
    "Hari ini satu langkah, besok dua langkah.",
    "Api kecil yang dijaga lebih baik dari api besar yang padam.",
    "Kamu tidak harus sempurna, cukup hadir dan kerjakan.",
    "Konsistensi mengalahkan motivasi sesaat.",
    "Satu tugas selesai hari ini = satu kemenangan.",
    "Jangan tunggu semangat, mulailah maka semangat datang.",
    "Progress 1% tiap hari = 37x lebih baik setahun."
  ];

  const DEFAULT_AVATAR = "data:image/svg+xml;utf8," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
    "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
    "<stop offset='0' stop-color='#ff8a00'/><stop offset='1' stop-color='#ff3d00'/>" +
    "</linearGradient></defs>" +
    "<rect width='100' height='100' fill='#171922'/>" +
    "<circle cx='50' cy='38' r='16' fill='url(#g)'/>" +
    "<path d='M20 90 Q50 60 80 90 Z' fill='url(#g)' opacity='0.85'/>" +
    "</svg>");

  const DEFAULT_SUPPORT = "data:image/svg+xml;utf8," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 240'>" +
    "<defs>" +
    "<linearGradient id='b' x1='0' y1='0' x2='1' y2='1'>" +
    "<stop offset='0' stop-color='#2a1508'/><stop offset='0.5' stop-color='#3d1408'/><stop offset='1' stop-color='#1a0a06'/>" +
    "</linearGradient>" +
    "<radialGradient id='r' cx='0.2' cy='0.1' r='0.8'>" +
    "<stop offset='0' stop-color='#ff8a00' stop-opacity='0.35'/>" +
    "<stop offset='1' stop-color='#ff3d00' stop-opacity='0'/>" +
    "</radialGradient>" +
    "</defs>" +
    "<rect width='800' height='240' fill='url(#b)'/>" +
    "<rect width='800' height='240' fill='url(#r)'/>" +
    "<text x='40' y='140' font-family='Segoe UI,sans-serif' font-size='90' fill='#ff8a00' opacity='0.35'>🔥</text>" +
    "<text x='160' y='140' font-family='Segoe UI,sans-serif' font-size='90' fill='#ff3d00' opacity='0.2'>💪</text>" +
    "</svg>");

  const todayStr = () => new Date().toISOString().slice(0,10);
  const monthStr = (d) => { d = d || new Date(); return d.toISOString().slice(0,7); };

  let state = load();
  let hmCursor = new Date(); hmCursor.setDate(1);

  function defaults(){
    return {
      tasks:[], streak:0, lastDoneDate:null,
      monthKey: monthStr(), monthDone:0,
      quoteDate:null, quoteIdx:0,
      history:{},
      notif:{ enabled:false, time:'20:00', lastSent:null },
      user:{ name:'Pejuang Harian', bio:'Menuju versi terbaik dari diri sendiri, satu tugas setiap hari.', goal:3, level:1, avatar:DEFAULT_AVATAR },
      support:{ img:DEFAULT_SUPPORT, text:'Kamu tidak sendiri. Setiap langkah kecilmu berarti.' }
    };
  }
  function load(){
    try{
      const raw = JSON.parse(localStorage.getItem(STORE_KEY));
      if(raw){
        const d = defaults();
        return {
          ...d, ...raw,
          user: {...d.user, ...(raw.user||{})},
          support: {...d.support, ...(raw.support||{})},
          notif: {...d.notif, ...(raw.notif||{})},
          history: raw.history || {},
          tasks: Array.isArray(raw.tasks) ? raw.tasks : []
        };
      }
    }catch(e){}
    return defaults();
  }
  function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

  if(state.monthKey !== monthStr()){ state.monthKey = monthStr(); state.monthDone = 0; }
  if(state.quoteDate !== todayStr()){ state.quoteDate = todayStr(); state.quoteIdx = Math.floor(Math.random()*QUOTES.length); }

  const $ = (id) => document.getElementById(id);
  const list = $('taskList'), empty = $('emptyState'), input = $('taskInput');

  function renderProfile(){
    $('avatarImg').src = state.user.avatar || DEFAULT_AVATAR;
    $('userName').textContent = state.user.name || 'Pejuang Harian';
    $('userBio').textContent = state.user.bio || '-';
    $('userGoal').textContent = state.user.goal || 3;
    const lv = Math.max(1, Math.floor(state.streak/3)+1);
    state.user.level = lv;
    $('userLevel').textContent = 'LV ' + lv;
  }
  function renderSupport(){
    $('supportImg').src = state.support.img || DEFAULT_SUPPORT;
    $('supportText').textContent = state.support.text || '';
  }
  function renderQuote(){ $('quote').textContent = QUOTES[state.quoteIdx]; }

  function render(){
    list.innerHTML = '';
    empty.style.display = state.tasks.length ? 'none' : 'block';
    state.tasks.forEach(function(t){
      const li = document.createElement('li');
      li.className = 'task' + (t.done ? ' done' : '');

      const check = document.createElement('button');
      check.type = 'button';
      check.className = 'check' + (t.done ? ' checked' : '');
      check.setAttribute('aria-label','Tandai selesai');
      check.addEventListener('click', function(){ toggleTask(t.id); });

      const title = document.createElement('span');
      title.className = 'title';
      title.textContent = t.text;

      const actions = document.createElement('div');
      actions.className = 'actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'icon-btn';
      editBtn.textContent = '✏️';
      editBtn.title = 'Edit';
      editBtn.addEventListener('click', function(){ editTask(t.id); });

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'icon-btn del';
      delBtn.textContent = '🗑️';
      delBtn.title = 'Hapus';
      delBtn.addEventListener('click', function(){ deleteTask(t.id); });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      li.appendChild(check);
      li.appendChild(title);
      li.appendChild(actions);
      list.appendChild(li);
    });
    updateProgress();
    updateStreakUI();
    renderHeatmap();
    save();
  }

  function updateProgress(){
    const total = state.tasks.length;
    const done = state.tasks.filter(function(t){ return t.done; }).length;
    const pct = total ? Math.round(done/total*100) : 0;
    $('progressBar').style.width = pct + '%';
    $('progressText').textContent = done + ' / ' + total + ' tugas selesai';
    $('progressPercent').textContent = pct + '%';
  }
  function updateStreakUI(){ $('streakCount').textContent = state.streak; }

  function levelFor(n){
    if(!n) return 'l0';
    if(n >= 6) return 'l4';
    if(n >= 4) return 'l3';
    if(n >= 2) return 'l2';
    return 'l1';
  }
  function renderHeatmap(){
    const grid = $('hmGrid');
    grid.innerHTML = '';
    const y = hmCursor.getFullYear(), m = hmCursor.getMonth();
    $('hmTitle').textContent = 'Aktivitas ' + hmCursor.toLocaleString('id-ID',{month:'long', year:'numeric'});
    const days = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
    days.forEach(function(d){
      const el = document.createElement('div');
      el.className = 'hm-dow';
      el.textContent = d;
      grid.appendChild(el);
    });
    const first = new Date(y, m, 1);
    const startDay = first.getDay();
    for(let i=0;i<startDay;i++){
      const blank = document.createElement('div');
      blank.className = 'hm-cell empty';
      grid.appendChild(blank);
    }
    const last = new Date(y, m+1, 0).getDate();
    const today = todayStr();
    for(let d=1; d<=last; d++){
      const dateStr = y + '-' + String(m+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
      const n = state.history[dateStr] || 0;
      const cell = document.createElement('div');
      cell.className = 'hm-cell ' + levelFor(n) + (dateStr === today ? ' today' : '');
      cell.textContent = d;
      cell.title = dateStr + ': ' + n + ' tugas selesai';
      grid.appendChild(cell);
    }
  }
  $('hmPrev').addEventListener('click', function(){ hmCursor.setMonth(hmCursor.getMonth()-1); renderHeatmap(); });
  $('hmNext').addEventListener('click', function(){ hmCursor.setMonth(hmCursor.getMonth()+1); renderHeatmap(); });

  function addTask(text){
    state.tasks.push({ id: Date.now() + Math.random(), text: text.trim(), done:false, created: todayStr() });
    render();
  }
  function toggleTask(id){
    const t = state.tasks.find(function(x){ return x.id === id; });
    if(!t) return;
    t.done = !t.done;
    const today = todayStr();
    if(t.done){
      state.monthDone++;
      state.history[today] = (state.history[today] || 0) + 1;
      if(state.lastDoneDate !== today){
        const y = new Date(); y.setDate(y.getDate()-1);
        const yesterday = y.toISOString().slice(0,10);
        state.streak = (state.lastDoneDate === yesterday) ? state.streak + 1 : 1;
        state.lastDoneDate = today;
      }
    } else {
      state.monthDone = Math.max(0, state.monthDone - 1);
      state.history[today] = Math.max(0, (state.history[today] || 0) - 1);
    }
    renderProfile();
    render();
  }
  function editTask(id){
    const t = state.tasks.find(function(x){ return x.id === id; });
    if(!t) return;
    const val = prompt('Edit tugas:', t.text);
    if(val !== null && val.trim() !== ''){ t.text = val.trim(); render(); }
  }
  function deleteTask(id){
    state.tasks = state.tasks.filter(function(x){ return x.id !== id; });
    render();
  }

  $('addForm').addEventListener('submit', function(e){
    e.preventDefault();
    if(input.value.trim()){ addTask(input.value); input.value = ''; }
  });

  $('avatarBtn').addEventListener('click', function(){ $('avatarInput').click(); });
  $('avatarInput').addEventListener('change', function(e){
    const file = e.target.files[0]; if(!file) return;
    const r = new FileReader();
    r.onload = function(ev){ state.user.avatar = ev.target.result; renderProfile(); save(); };
    r.readAsDataURL(file);
  });
  $('supportBtn').addEventListener('click', function(){ $('supportInput').click(); });
  $('supportInput').addEventListener('change', function(e){
    const file = e.target.files[0]; if(!file) return;
    const r = new FileReader();
    r.onload = function(ev){ state.support.img = ev.target.result; renderSupport(); save(); };
    r.readAsDataURL(file);
  });

  const modal = $('profileModal');
  $('editProfileBtn').addEventListener('click', function(){
    $('inputName').value = state.user.name || '';
    $('inputBio').value = state.user.bio || '';
    $('inputGoal').value = state.user.goal || 3;
    $('inputSupportText').value = state.support.text || '';
    modal.classList.add('show');
  });
  $('cancelProfile').addEventListener('click', function(){ modal.classList.remove('show'); });
  $('saveProfile').addEventListener('click', function(){
    const name = $('inputName').value.trim();
    const bio = $('inputBio').value.trim();
    const goal = Math.max(1, Math.min(99, parseInt($('inputGoal').value,10) || 3));
    const sText = $('inputSupportText').value.trim();
    if(name) state.user.name = name;
    state.user.bio = bio;
    state.user.goal = goal;
    state.support.text = sText;
    modal.classList.remove('show');
    renderProfile(); renderSupport(); save();
  });
  modal.addEventListener('click', function(e){ if(e.target === modal) modal.classList.remove('show'); });

  function updateNotifUI(){
    $('notifTime').value = state.notif.time;
    const st = $('notifStatus'), btn = $('notifBtn');
    if(!('Notification' in window)){
      st.textContent = 'Browser tidak mendukung notifikasi';
      btn.disabled = true;
      return;
    }
    if(state.notif.enabled && Notification.permission === 'granted'){
      st.textContent = 'Aktif — pengingat jam ' + state.notif.time + ' (jika belum ada tugas selesai)';
      btn.textContent = 'Matikan';
      btn.classList.add('ghost');
    } else {
      st.textContent = 'Belum aktif';
      btn.textContent = 'Aktifkan';
      btn.classList.remove('ghost');
    }
  }
  $('notifTime').addEventListener('change', function(e){ state.notif.time = e.target.value; save(); updateNotifUI(); });
  $('notifBtn').addEventListener('click', async function(){
    if(state.notif.enabled){ state.notif.enabled = false; save(); updateNotifUI(); return; }
    if(!('Notification' in window)){ alert('Browser tidak mendukung notifikasi'); return; }
    const p = await Notification.requestPermission();
    if(p === 'granted'){
      state.notif.enabled = true;
      save();
      updateNotifUI();
      sendNotif('Pengingat aktif 🔥', 'Kamu akan diingatkan setiap hari untuk menyelesaikan tugas.');
    } else {
      alert('Izin notifikasi ditolak');
    }
  });
  $('notifTest').addEventListener('click', async function(){
    if(!('Notification' in window)){ alert('Browser tidak mendukung notifikasi'); return; }
    if(Notification.permission !== 'granted'){
      const p = await Notification.requestPermission();
      if(p !== 'granted'){ alert('Izin notifikasi ditolak'); return; }
    }
    sendNotif('Tes notifikasi 🔥', 'Ini contoh pengingat harianmu.');
  });
  function sendNotif(title, body){
    try{
      if(navigator.serviceWorker && navigator.serviceWorker.getRegistration){
        navigator.serviceWorker.getRegistration().then(function(reg){
          if(reg && reg.showNotification) reg.showNotification(title, { body: body, icon: 'icon.svg', badge: 'icon.svg' });
          else new Notification(title, { body: body, icon: 'icon.svg' });
        }).catch(function(){ new Notification(title, { body: body, icon: 'icon.svg' }); });
      } else {
        new Notification(title, { body: body, icon: 'icon.svg' });
      }
    }catch(e){}
  }
  setInterval(function(){
    if(!state.notif.enabled) return;
    if(!('Notification' in window) || Notification.permission !== 'granted') return;
    const now = new Date();
    const hhmm = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
    if(hhmm !== state.notif.time) return;
    if(state.notif.lastSent === todayStr()) return;
    const doneToday = state.history[todayStr()] || 0;
    if(doneToday > 0) return;
    state.notif.lastSent = todayStr();
    save();
    sendNotif('Belum ada tugas selesai hari ini 🔥', 'Yuk selesaikan minimal satu tugas untuk menjaga streak-mu!');
  }, 30000);

  if('serviceWorker' in navigator){
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('sw.js').catch(function(){});
    });
  }

  renderProfile();
  renderSupport();
  renderQuote();
  updateNotifUI();
  render();
})();