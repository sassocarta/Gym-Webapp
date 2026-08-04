// ─────────────────────────────────────
//  DATA STORE
// ─────────────────────────────────────
let logs = [];

try {
  logs = JSON.parse(localStorage.getItem('gymLogs')) || [];
} catch(_) { logs = []; }

// ─────────────────────────────────────
//  TABS
// ─────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');

  if (name === 'charts') {
    populateChartSelector();
    renderChart();
    renderVolumeChart();
  }
}

// ─────────────────────────────────────
//  TOAST
// ─────────────────────────────────────
function showToast(msg, emoji = '✓') {
  const wrap = document.getElementById('toast-wrap');
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span>${emoji}</span> ${msg}`;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 2900);
}

// ─────────────────────────────────────
//  TIMER
// ─────────────────────────────────────
let timerSec = 90, timerRunning = false, timerRef = null;

function formatTime(s) {
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

function setTimer(s) {
  clearInterval(timerRef);
  timerRunning = false;
  timerSec = s;
  const display = document.getElementById('timer-display');
  display.textContent = formatTime(s);
  display.classList.remove('warn');
  document.getElementById('timer-btn').textContent = '▶ Avvia';
  document.getElementById('timer-btn').className = 'btn btn-primary';
}

function toggleTimer() {
  const btn = document.getElementById('timer-btn');
  const display = document.getElementById('timer-display');

  if (timerRunning) {
    clearInterval(timerRef);
    timerRunning = false;
    btn.textContent = '▶ Riprendi';
    btn.className = 'btn btn-primary';
  } else {
    timerRunning = true;
    btn.textContent = '⏸ Pausa';
    btn.className = 'btn btn-danger-active';
    btn.style.cssText = 'width:100%;background:#dc2626;color:#fff;border-radius:6px;padding:12px;font-weight:700;cursor:pointer;border:none';

    timerRef = setInterval(() => {
      timerSec--;
      display.textContent = formatTime(timerSec);
      display.classList.toggle('warn', timerSec <= 10);

      if (timerSec <= 0) {
        clearInterval(timerRef);
        timerRunning = false;
        display.textContent = '00:00';
        btn.textContent = '▶ Avvia';
        btn.style.cssText = '';
        btn.className = 'btn btn-primary';
        showToast('Recupero terminato!', '🔔');
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }
    }, 1000);
  }
}

// ─────────────────────────────────────
//  CUSTOM EXERCISE TOGGLE
// ─────────────────────────────────────
function toggleCustomExercise() {
  const sel = document.getElementById('exercise');
  const inp = document.getElementById('custom-exercise-input');
  const show = sel.value === 'custom';
  inp.style.display = show ? 'block' : 'none';
  inp.required = show;
  if (show) inp.focus();
}

// ─────────────────────────────────────
//  SAVE
// ─────────────────────────────────────
document.getElementById('workout-form').addEventListener('submit', e => {
  e.preventDefault();

  let exercise = document.getElementById('exercise').value;
  if (exercise === 'custom') {
    exercise = document.getElementById('custom-exercise-input').value.trim();
    if (!exercise) return showToast('Inserisci il nome dell\'esercizio', '⚠️');
  }

  const weight = parseFloat(document.getElementById('weight').value);
  const reps   = parseInt(document.getElementById('reps').value);
  const notes  = document.getElementById('notes').value.trim();

  const now = new Date();

  logs.unshift({
    id: Date.now(),
    exercise,
    weight,
    reps,
    notes,
    date: now.toLocaleDateString('it-IT'),
    time: now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    ts:   now.getTime()
  });

  persist();
  renderAll();
  showToast('Serie registrata!', '💪');

  document.getElementById('weight').value = '';
  document.getElementById('reps').value   = '';
  document.getElementById('notes').value  = '';

  // Auto-start timer
  setTimer(timerSec);
  toggleTimer();
});

// ─────────────────────────────────────
//  PERSIST & RENDER
// ─────────────────────────────────────
function persist() {
  localStorage.setItem('gymLogs', JSON.stringify(logs));
}

function renderAll() {
  renderStats();
  renderHistory();
  renderPRs();
}

function deleteLog(id) {
  logs = logs.filter(l => l.id !== id);
  persist();
  renderAll();
  showToast('Serie eliminata', '🗑');
}

// ─────────────────────────────────────
//  STATS
// ─────────────────────────────────────
function renderStats() {
  const todayStr = new Date().toLocaleDateString('it-IT');
  const todayLogs = logs.filter(l => l.date === todayStr);
  const totalVol  = logs.reduce((s, l) => s + l.weight * l.reps, 0);
  const exercises = new Set(logs.map(l => l.exercise)).size;

  document.getElementById('stat-sets').textContent      = logs.length;
  document.getElementById('stat-volume').textContent    = totalVol >= 1000
    ? (totalVol/1000).toFixed(1) + 'k' : totalVol;
  document.getElementById('stat-today').textContent     = todayLogs.length;
  document.getElementById('stat-exercises').textContent = exercises;
}

// ─────────────────────────────────────
//  HISTORY
// ─────────────────────────────────────
function renderHistory() {
  const container = document.getElementById('history-container');
  if (logs.length === 0) {
    container.innerHTML = '<div class="empty">Nessuna serie registrata ancora.</div>';
    return;
  }

  const grouped = {};
  logs.forEach(item => {
    const d = item.date.includes(' alle ') ? item.date.split(' alle ')[0] : item.date;
    (grouped[d] = grouped[d] || []).push(item);
  });

  container.innerHTML = Object.entries(grouped).map(([date, items]) => `
    <div class="day-header">📅 ${date}</div>
    ${items.map(item => `
      <div class="log-item">
        <div>
          <div class="ex-name">${item.exercise}</div>
          <div class="ex-time">${item.time || ''}${item.notes ? ' · ' + item.notes : ''}</div>
        </div>
        <div class="ex-detail">
          <div class="ex-weight">${item.weight} kg × ${item.reps}</div>
          <button class="btn-danger" onclick="deleteLog(${item.id})">Elimina</button>
        </div>
      </div>
    `).join('')}
  `).join('');
}

// ─────────────────────────────────────
//  PR
// ─────────────────────────────────────
function calc1RM(w, r) {
  return r === 1 ? w : Math.round(w * (1 + r / 30));
}

function renderPRs() {
  const container = document.getElementById('pr-container');
  if (logs.length === 0) {
    container.innerHTML = '<div class="empty">Nessun record ancora.</div>';
    return;
  }

  const prs = {};
  logs.forEach(item => {
    const est = calc1RM(item.weight, item.reps);
    if (!prs[item.exercise] || est > calc1RM(prs[item.exercise].weight, prs[item.exercise].reps)) {
      prs[item.exercise] = item;
    }
  });

  container.innerHTML = Object.values(prs)
    .sort((a, b) => b.weight - a.weight)
    .map(pr => {
      const rm = calc1RM(pr.weight, pr.reps);
      return `
        <div class="pr-item">
          <div class="ex-name">${pr.exercise}</div>
          <div>
            <div><span class="pr-badge">PR</span><span class="pr-val">${pr.weight} kg × ${pr.reps}</span></div>
            <div class="pr-1rm">1RM stimato: ~${rm} kg</div>
          </div>
        </div>
      `;
    }).join('');
}

// ─────────────────────────────────────
//  CHARTS
// ─────────────────────────────────────
let progressChart = null, volumeChart = null;

function populateChartSelector() {
  const sel = document.getElementById('chart-exercise-select');
  const exercises = [...new Set(logs.map(l => l.exercise))].sort();
  const current = sel.value;

  sel.innerHTML = '<option value="" disabled>Seleziona esercizio…</option>' +
    exercises.map(ex => `<option value="${ex}" ${ex === current ? 'selected' : ''}>${ex}</option>`).join('');

  if (!current && exercises.length > 0) sel.value = exercises[0];
}

function renderChart() {
  const ex = document.getElementById('chart-exercise-select').value;
  const canvas = document.getElementById('progress-chart');
  const empty  = document.getElementById('chart-empty');

  if (progressChart) { progressChart.destroy(); progressChart = null; }

  if (!ex) return;

  const data = logs
    .filter(l => l.exercise === ex)
    .sort((a, b) => (a.ts || 0) - (b.ts || 0));

  if (data.length === 0) {
    canvas.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  canvas.style.display = 'block';
  empty.style.display = 'none';

  const labels   = data.map(l => l.date);
  const weights  = data.map(l => l.weight);
  const orm      = data.map(l => calc1RM(l.weight, l.reps));

  progressChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Peso (kg)',
          data: weights,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.12)',
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#ef4444'
        },
        {
          label: '1RM stimato',
          data: orm,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.08)',
          tension: 0.35,
          fill: false,
          borderDash: [4,3],
          pointRadius: 3,
          pointBackgroundColor: '#f59e0b'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#a3a3a3', font: { size: 11 } } },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        x: { ticks: { color: '#737373', maxTicksLimit: 6, font: { size: 10 } }, grid: { color: '#1f1f1f' } },
        y: { ticks: { color: '#737373', font: { size: 10 } }, grid: { color: '#1f1f1f' } }
      }
    }
  });
}

function renderVolumeChart() {
  const canvas = document.getElementById('volume-chart');
  if (volumeChart) { volumeChart.destroy(); volumeChart = null; }

  // Build last 8 weeks
  const weeks = {};
  logs.forEach(l => {
    const ts = l.ts || (l.date ? new Date(l.date.split('/').reverse().join('-')).getTime() : null);
    if (!ts) return;
    const d = new Date(ts);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay() + 1); // Monday
    const key = weekStart.toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit' });
    weeks[key] = (weeks[key] || 0) + l.weight * l.reps;
  });

  const sorted = Object.entries(weeks)
    .sort((a, b) => {
      const parse = s => { const [d,m] = s.split('/'); return +m*100 + +d; };
      return parse(a[0]) - parse(b[0]);
    })
    .slice(-8);

  if (sorted.length === 0) {
    canvas.style.display = 'none';
    return;
  }

  volumeChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: sorted.map(([k]) => 'Sett. ' + k),
      datasets: [{
        label: 'Volume (kg)',
        data: sorted.map(([, v]) => Math.round(v)),
        backgroundColor: 'rgba(239,68,68,0.7)',
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y.toLocaleString('it-IT')} kg` } }
      },
      scales: {
        x: { ticks: { color: '#737373', font: { size: 10 } }, grid: { color: '#1f1f1f' } },
        y: { ticks: { color: '#737373', font: { size: 10 } }, grid: { color: '#1f1f1f' } }
      }
    }
  });
}

// ─────────────────────────────────────
//  EXPORT / IMPORT
// ─────────────────────────────────────
function exportData() {
  if (!logs.length) return showToast('Nessun dato da esportare', '⚠️');
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: 'gym_backup.json' });
  a.click();
  URL.revokeObjectURL(url);
  showToast('Backup esportato!', '📤');
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (Array.isArray(data)) {
        logs = data;
        persist();
        renderAll();
        showToast('Dati ripristinati!', '📥');
      } else {
        showToast('File non valido', '❌');
      }
    } catch {
      showToast('Errore lettura file', '❌');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// ─────────────────────────────────────
//  MODAL CONFIRM
// ─────────────────────────────────────
let pendingAction = null;

function openModal(title, desc, action) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-desc').textContent  = desc;
  document.getElementById('modal-confirm-btn').onclick = () => { action(); closeModal(); };
  document.getElementById('confirm-modal').classList.add('open');
}

function closeModal() {
  document.getElementById('confirm-modal').classList.remove('open');
}

function confirmClearAll() {
  openModal(
    'Cancellare tutto?',
    'Tutti i log e i record verranno eliminati. Fai prima un export!',
    () => {
      logs = [];
      persist();
      renderAll();
      showToast('Tutti i dati eliminati', '🗑');
    }
  );
}

document.getElementById('confirm-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

// ─────────────────────────────────────
//  INIT
// ─────────────────────────────────────
renderAll();