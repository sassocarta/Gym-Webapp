// DATA STORE LOCALE (Inizializzazione da localStorage)
let logs = JSON.parse(localStorage.getItem('gymLogs')) || [];

const form = document.getElementById('workout-form');
const historyList = document.getElementById('history-list');
const prList = document.getElementById('pr-list');

// Funzione per salvare nel localStorage e aggiornare l'interfaccia
function updateApp() {
  localStorage.setItem('gymLogs', JSON.stringify(logs));
  renderHistory();
  renderPRs();
}

// GESTIONE INVIO FORM
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const exercise = document.getElementById('exercise').value;
  const weight = parseFloat(document.getElementById('weight').value);
  const reps = parseInt(document.getElementById('reps').value);
  const date = new Date().toLocaleDateString('it-IT');

  const newLog = { id: Date.now(), exercise, weight, reps, date };

  logs.unshift(newLog); // Aggiunge in testa alla lista
  updateApp();

  // Reset dei campi di input
  document.getElementById('weight').value = '';
  document.getElementById('reps').value = '';
});

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
      <div>
        <strong>${item.weight} kg</strong> × ${item.reps} reps
      </div>
    </li>
  `).join('');
}

// RENDERING I MIEI PR (Calcola il kg massimo per ciascun esercizio)
function renderPRs() {
  if (logs.length === 0) {
    prList.innerHTML = '<p class="empty-msg">Nessun record registrato finora.</p>';
    return;
  }

  // Mappa per memorizzare il peso massimo per ogni esercizio
  const prs = {};

  logs.forEach(item => {
    if (!prs[item.exercise] || item.weight > prs[item.exercise].weight) {
      prs[item.exercise] = item;
    }
  });

  prList.innerHTML = Object.values(prs).map(pr => `
    <li>
      <div>
        <strong>${pr.exercise}</strong>
      </div>
      <div>
        <span class="pr-badge">PR</span> 
        <strong>${pr.weight} kg</strong> (${pr.reps} reps)
      </div>
    </li>
  `).join('');
}

// Primo caricamento all'apertura
updateApp();
