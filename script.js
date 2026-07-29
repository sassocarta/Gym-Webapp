// DATA STORE LOCALE
let logs = JSON.parse(localStorage.getItem('gymLogs')) || [];

const form = document.getElementById('workout-form');
const historyList = document.getElementById('history-list');
const prList = document.getElementById('pr-list');

// LOGICA TIMER
let timerInterval = null;
let timerSeconds = 90;
let isTimerRunning = false;

function formatTime(sec) {
  const mins = Math.floor(sec / 60);
  const remainderSecs = sec % 60;
  return `${mins.toString().padStart(2, '0')}:${remainderSecs.toString().padStart(2, '0')}`;
}

function setTimer(sec) {
  clearInterval(timerInterval);
  isTimerRunning = false;
  timerSeconds = sec;
  document.getElementById('timer-display').textContent = formatTime(timerSeconds);
  document.getElementById('start-timer-btn').textContent = 'Avvia';
  document.getElementById('start-timer-btn').style.backgroundColor = '#2e7d32';
}

function toggleTimer() {
  const btn = document.getElementById('start-timer-btn');
  if (isTimerRunning) {
    clearInterval(timerInterval);
    isTimerRunning = false;
    btn.textContent = 'Riprendi';
    btn.style.backgroundColor = '#2e7d32';
  } else {
    isTimerRunning = true;
    btn.textContent = 'Pausa';
    btn.style.backgroundColor = '#d32f2f';
    
    timerInterval = setInterval(() => {
      timerSeconds--;
      document.getElementById('timer-display').textContent = formatTime(timerSeconds);
      
      if (timerSeconds <= 0) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        btn.textContent = 'Avvia';
        btn.style.backgroundColor = '#2e7d32';
        alert('Tempo di recupero terminato!');
      }
    }, 1000);
  }
}

// SALVATAGGIO E AGGIORNAMENTO
function updateApp() {
  localStorage.setItem('gymLogs', JSON.stringify(logs));
  renderStats();
  renderHistory();
  renderPRs();
}

// RIMOZIONE DI UN SINGOLO RECORD
function deleteLog(id) {
  logs = logs.filter(item => item.id !== id);
  updateApp();
}

// CALCOLO 1RM TEORICO
function calculate1RM(weight, reps) {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

// ESPORTAZIONE JSON
function exportData() {
  if (logs.length === 0) {
    alert("Nessun dato da esportare.");
    return;
  }
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", "gym_backup.json");
  document.body.appendChild(dlAnchorElem); // Necessario per Firefox
  dlAnchorElem.click();
  document.body.removeChild(dlAnchorElem);
}

// GESTIONE INVIO FORM
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const exercise = document.getElementById('exercise').value;
  const weight = parseFloat(document.getElementById('weight').value);
  const reps = parseInt(document.getElementById('reps').value);
  
  // Aggiunto l'orario oltre alla data
  const now = new Date();
  const dateStr = now.toLocaleDateString('it-IT');
  const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  const dateTime = `${dateStr} alle ${timeStr}`;

  const newLog = { id: Date.now(), exercise, weight, reps, date: dateTime };

  logs.unshift(newLog);
  updateApp();

  document.getElementById('weight').value = '';
  document.getElementById('reps').value = '';
});

// RENDERING STATISTICHE GLOBALI
function renderStats() {
  document.getElementById('stat-sets').textContent = logs.length;
  
  let totalVolume = 0;
  logs.forEach(item => {
    totalVolume += (item.weight * item.reps);
  });
  
  document.getElementById('stat-volume').textContent = totalVolume + ' kg';
}

// RENDERING STORICO
function renderHistory() {
  if (logs.length === 0) {
    historyList.innerHTML = '<p class="empty-msg">Nessuna serie salvata.</p>';
    return;
  }

  historyList.innerHTML = logs.map(item => `
    <li>
      <div>
        <strong>${item.exercise}</strong><br>
        <small style="color:#aaa">${item.date}</small>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span><strong>${item.weight} kg</strong> × ${item.reps}</span>
        <button class="delete-btn" onclick="deleteLog(${item.id})">Elimina</button>
      </div>
    </li>
  `).join('');
}

// RENDERING PR E 1RM
function renderPRs() {
  if (logs.length === 0) {
    prList.innerHTML = '<p class="empty-msg">Nessun record registrato finora.</p>';
    return;
  }

  const prs = {};

  logs.forEach(item => {
    if (!prs[item.exercise] || item.weight > prs[item.exercise].weight) {
      prs[item.exercise] = item;
    }
  });

  prList.innerHTML = Object.values(prs).map(pr => {
    const estimated1RM = calculate1RM(pr.weight, pr.reps);
    return `
      <li>
        <div>
          <strong>${pr.exercise}</strong>
        </div>
        <div class="pr-details">
          <div>
            <span class="pr-badge">PR</span> 
            <strong>${pr.weight} kg</strong> (${pr.reps} reps)
          </div>
          <span class="estimated-1rm">1RM stimato: ~${estimated1RM} kg</span>
        </div>
      </li>
    `;
  }).join('');
}

// Primo caricamento all'apertura
updateApp();