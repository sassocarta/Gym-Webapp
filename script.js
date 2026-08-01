// DATA STORE LOCALE
let logs = JSON.parse(localStorage.getItem('gymLogs')) || [];

const form = document.getElementById('workout-form');
const historyContainer = document.getElementById('history-container');
const prList = document.getElementById('pr-list');

// SISTEMA NOTIFICHE (TOAST)
function showToast(message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  
  // Rimuove il toast dal DOM dopo 3 secondi (dopo l'animazione)
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

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
        showToast('Tempo di recupero terminato!');
      }
    }, 1000);
  }
}

// TOGGLE ESERCIZIO PERSONALIZZATO
function toggleCustomExercise() {
  const select = document.getElementById('exercise');
  const customInput = document.getElementById('custom-exercise-input');
  
  if (select.value === 'custom') {
    customInput.style.display = 'block';
    customInput.required = true;
  } else {
    customInput.style.display = 'none';
    customInput.required = false;
  }
}

// SALVATAGGIO E AGGIORNAMENTO
function updateApp() {
  localStorage.setItem('gymLogs', JSON.stringify(logs));
  renderStats();
  renderHistory();
  renderPRs();
}

function deleteLog(id) {
  logs = logs.filter(item => item.id !== id);
  updateApp();
  showToast('Serie eliminata');
}

function calculate1RM(weight, reps) {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

// ESPORTAZIONE JSON
function exportData() {
  if (logs.length === 0) {
    showToast("Nessun dato da esportare.");
    return;
  }
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", "gym_backup.json");
  document.body.appendChild(dlAnchorElem);
  dlAnchorElem.click();
  document.body.removeChild(dlAnchorElem);
  showToast("Backup esportato con successo");
}

// IMPORTAZIONE JSON
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      if (Array.isArray(importedData)) {
        logs = importedData;
        updateApp();
        showToast("Dati ripristinati con successo!");
      } else {
        showToast("Il file non è valido.");
      }
    } catch (error) {
      showToast("Errore durante la lettura del file.");
    }
  };
  reader.readAsText(file);
  // Resetta l'input per permettere di ricaricare lo stesso file
  event.target.value = '';
}

// GESTIONE INVIO FORM
form.addEventListener('submit', (e) => {
  e.preventDefault();

  let exercise = document.getElementById('exercise').value;
  if (exercise === 'custom') {
    exercise = document.getElementById('custom-exercise-input').value.trim();
  }
  
  const weight = parseFloat(document.getElementById('weight').value);
  const reps = parseInt(document.getElementById('reps').value);
  
  const now = new Date();
  const dateStr = now.toLocaleDateString('it-IT');
  const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  const newLog = { 
    id: Date.now(), 
    exercise: exercise, 
    weight: weight, 
    reps: reps, 
    date: dateStr,
    time: timeStr // Salvato separatamente per comodità nel raggruppamento
  };

  logs.unshift(newLog);
  updateApp();
  showToast('Serie registrata!');

  document.getElementById('weight').value = '';
  document.getElementById('reps').value = '';
});

// RENDERING STATISTICHE GLOBALI
function renderStats() {
  document.getElementById('stat-sets').textContent = logs.length;
  let totalVolume = 0;
  logs.forEach(item => { totalVolume += (item.weight * item.reps); });
  document.getElementById('stat-volume').textContent = totalVolume + ' kg';
}

// RENDERING STORICO RAGGRUPPATO PER DATA
function renderHistory() {
  if (logs.length === 0) {
    historyContainer.innerHTML = '<p class="empty-msg">Nessuna serie salvata.</p>';
    return;
  }

  // Raggruppa i log per data
  const groupedLogs = {};
  logs.forEach(item => {
    // Gestione compatibilità vecchi dati (che avevano data e ora in una stringa)
    const logDate = item.date.includes(' alle ') ? item.date.split(' alle ')[0] : item.date;
    const logTime = item.time || (item.date.includes(' alle ') ? item.date.split(' alle ')[1] : '');

    if (!groupedLogs[logDate]) {
      groupedLogs[logDate] = [];
    }
    // Creiamo una copia dell'oggetto aggiungendo un time pulito per il render
    groupedLogs[logDate].push({ ...item, cleanTime: logTime });
  });

  let html = '';
  for (const date in groupedLogs) {
    html += `<div class="history-date-header">${date}</div>`;
    html += '<ul>';
    groupedLogs[date].forEach(item => {
      html += `
        <li>
          <div>
            <strong>${item.exercise}</strong><br>
            <small style="color:#aaa">${item.cleanTime}</small>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span><strong>${item.weight} kg</strong> × ${item.reps}</span>
            <button class="delete-btn" onclick="deleteLog(${item.id})">Elimina</button>
          </div>
        </li>
      `;
    });
    html += '</ul>';
  }
  
  historyContainer.innerHTML = html;
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