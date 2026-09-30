/**
 * ===================================================================
 * ESPORTS SCORER & LIVESTREAM CONTROLLER - JAVASCRIPT ENGINE
 * Pure Black & White, Inline SVG Icons, Android App Enforcement & Fast Auto-Sync
 * ===================================================================
 */

// Default Configuration
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzMFTNKHSjOmYOkXSvudjtJ2dW3rwDyClMlzaZM2bAwS7-2fNtTaGGM_k8Cg2Kq-qg/exec';
const STORAGE_KEY_CONFIG = 'esports_scorer_config';
const STORAGE_KEY_DATA = 'esports_scorer_data';
const STORAGE_KEY_TEAMS = 'esports_scorer_teams';
const STORAGE_KEY_SCENE = 'esports_broadcast_scene';

const DEFAULT_TEAMS = [
  "TEAM SOUL",
  "GODLIKE ESPORTS",
  "BLIND ESPORTS",
  "ORANGUTAN",
  "TEAM XSPARK",
  "REVENANT ESPORTS",
  "MEDAL ESPORTS",
  "GLOBAL ESPORTS",
  "GLADIATORS",
  "HYDRA OFFICIAL",
  "TEAM 8BIT",
  "INSANE ESPORTS"
];

const KILL_POINTS = 1;
// Official Placement Points (1st to 12th)
const PLACEMENT_POINTS_MAP = {
  1: 12,
  2: 9,
  3: 8,
  4: 7,
  5: 6,
  6: 5,
  7: 4,
  8: 3,
  9: 2,
  10: 1,
  11: 0,
  12: 0
};

function getPlacePts(rankNum) {
  const r = parseInt(rankNum, 10);
  return PLACEMENT_POINTS_MAP[r] !== undefined ? PLACEMENT_POINTS_MAP[r] : 0;
}

const TOTAL_GAMES = 6;
const TOTAL_TEAMS = 12;

// SVG Icon Constants
const SVG_ICONS = {
  trophy: `<svg class="svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H7v2h10v-2h-2c-.55 0-1-.45-1-1v-2.34"></path><path d="M6 4h12v6a6 6 0 0 1-12 0V4Z"></path></svg>`,
  skull: `<svg class="svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/><path d="M8 20v2h8v-2M10 17v3M14 17v3M4 10a8 8 0 1 1 16 0c0 4.5-3.5 7-3.5 7H7.5S4 14.5 4 10z"/></svg>`,
  alive: `<svg class="svg-icon" viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><circle cx="12" cy="12" r="5"/></svg>`,
  grip: `<svg class="svg-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>`
};

// App State (Instant 0ms Cache Load)
const state = {
  scriptUrl: localStorage.getItem(STORAGE_KEY_CONFIG) || DEFAULT_SCRIPT_URL,
  activeTab: 'game1',
  broadcastScene: localStorage.getItem(STORAGE_KEY_SCENE) || 'Overall',
  teams: JSON.parse(localStorage.getItem(STORAGE_KEY_TEAMS)) || [...DEFAULT_TEAMS],
  games: initGamesData(),
  isSyncing: false,
  hasUnsavedChanges: false
};

function initGamesData() {
  const cached = localStorage.getItem(STORAGE_KEY_DATA);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') {
        for (let g = 1; g <= TOTAL_GAMES; g++) {
          const gameList = parsed[`game${g}`];
          if (Array.isArray(gameList)) {
            const hasActivity = gameList.some(t => (t.kills > 0) || t.isBooyah);
            if (!hasActivity) {
              gameList.forEach(t => {
                t.isEliminated = false;
                t.isBooyah = false;
              });
            }
          }
        }
        return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse cached game data", e);
    }
  }

  const initial = {};
  for (let g = 1; g <= TOTAL_GAMES; g++) {
    initial[`game${g}`] = DEFAULT_TEAMS.map((name, index) => ({
      slot: index + 1,
      rank: index + 1,
      name: name,
      kills: 0,
      isEliminated: false,
      isBooyah: false
    }));
  }
  return initial;
}

// DOM Elements
const tabsContainer = document.getElementById('tabsContainer');
const gameScoringSection = document.getElementById('gameScoringSection');
const overallSection = document.getElementById('overallSection');
const activeGameTitle = document.getElementById('activeGameTitle');
const teamCardsList = document.getElementById('teamCardsList');
const overallTableBody = document.getElementById('overallTableBody');
const statusDot = document.getElementById('statusDot');
const statusLabel = document.getElementById('statusLabel');
const statGameTotalKills = document.getElementById('statGameTotalKills');
const statGameBooyah = document.getElementById('statGameBooyah');
const saveStateText = document.getElementById('saveStateText');
const saveTimeText = document.getElementById('saveTimeText');
const liveCurrentScene = document.getElementById('liveCurrentScene');
const livestreamSceneButtons = document.getElementById('livestreamSceneButtons');

// Modals & Buttons
const btnRefresh = document.getElementById('btnRefresh');
const btnSettings = document.getElementById('btnSettings');
const btnCloseSettings = document.getElementById('btnCloseSettings');
const settingsModal = document.getElementById('settingsModal');
const scriptUrlInput = document.getElementById('scriptUrlInput');
const btnSaveConfig = document.getElementById('btnSaveConfig');
const btnResetCurrentGame = document.getElementById('btnResetCurrentGame');
const btnResetAllGames = document.getElementById('btnResetAllGames');
const btnCopyStandings = document.getElementById('btnCopyStandings');
const toastNotification = document.getElementById('toastNotification');

// Teams Modal Elements
const btnOpenTeamsModal = document.getElementById('btnOpenTeamsModal');
const teamsModal = document.getElementById('teamsModal');
const btnCloseTeamsModal = document.getElementById('btnCloseTeamsModal');
const bulkTeamsInput = document.getElementById('bulkTeamsInput');
const btnParseBulkTeams = document.getElementById('btnParseBulkTeams');
const teamNamesEditor = document.getElementById('teamNamesEditor');
const btnSaveTeamNamesModal = document.getElementById('btnSaveTeamNamesModal');

// PWA & Android Black Screen Elements
const btnInstallPWA = document.getElementById('btnInstallPWA');
const forceInstallGate = document.getElementById('forceInstallGate');
const btnGateInstall = document.getElementById('btnGateInstall');
const gateInstalledNote = document.getElementById('gateInstalledNote');

let deferredInstallPrompt = null;

// ==========================================
// RENDER & UI CONTROLS
// ==========================================

function renderUI() {
  if (state.activeTab === 'overall') {
    gameScoringSection.classList.add('hidden-section');
    overallSection.classList.remove('hidden-section');
    renderOverallStandings();
  } else {
    overallSection.classList.add('hidden-section');
    gameScoringSection.classList.remove('hidden-section');
    renderGameScoring();
  }
  updateStatusBar();
  updateBroadcastSceneUI();
}

function renderGameScoring() {
  const gameKey = state.activeTab;
  const gameNumber = gameKey.replace('game', '');
  activeGameTitle.textContent = `GAME ${gameNumber}`;

  const currentTeams = state.games[gameKey] || [];
  let totalKills = 0;

  const elimCount = currentTeams.filter(t => t.isEliminated).length;
  let booyahWinnerIndex = currentTeams.findIndex(t => t.isBooyah);

  if (booyahWinnerIndex === -1 && elimCount === 11) {
    booyahWinnerIndex = currentTeams.findIndex(t => !t.isEliminated);
  }

  const booyahWinnerTeam = booyahWinnerIndex !== -1 ? currentTeams[booyahWinnerIndex] : null;

  teamCardsList.innerHTML = currentTeams.map((t, index) => {
    const rankNum = index + 1;
    t.rank = rankNum;
    const placePts = getPlacePts(rankNum);
    const kills = t.kills || 0;
    const points = placePts + (kills * KILL_POINTS);

    totalKills += kills;

    const rankClass = rankNum <= 3 ? `top-${rankNum}` : '';
    const isElim = !!t.isEliminated;
    const isElimClass = isElim ? 'is-eliminated' : '';
    const isWinner = booyahWinnerIndex === index;
    const hasBooyahClass = isWinner ? 'has-booyah' : '';
    const booyahBtnClass = isWinner ? 'booyah-btn active' : 'booyah-btn';

    return `
      <div class="team-card ${hasBooyahClass} ${isElimClass}" 
           data-index="${index}" 
           draggable="true">
        <!-- Top Info -->
        <div class="team-card-top">
          <div class="card-top-left">
            <span class="drag-handle" title="Drag to reorder rank">${SVG_ICONS.grip}</span>
            <span class="team-rank-badge ${rankClass}">#${rankNum}</span>
            <span class="team-name-label">${escapeHtml(t.name)}</span>
          </div>
          <div class="card-top-right">
            <span class="place-pts-badge">${placePts} Place Pts</span>
            <span class="team-points-badge">${points} PTS</span>
          </div>
        </div>

        <!-- Controls Row -->
        <div class="team-card-controls">
          <!-- Kills Stepper -->
          <div class="kill-control-group">
            <button class="kill-btn kill-minus" onclick="updateKill(${index}, -1)" aria-label="Decrease kills">−</button>
            <div class="kill-count-box">
              <span class="kill-val">${kills}</span>
              <span class="kill-label">Kills</span>
            </div>
            <button class="kill-btn kill-plus" onclick="updateKill(${index}, 1)" aria-label="Increase kills">+</button>
          </div>

          <!-- Elimination Toggle Button -->
          <button class="eliminate-btn ${isElim ? 'eliminated' : 'alive'}" onclick="toggleElimination(${index})">
            ${isElim ? SVG_ICONS.skull : SVG_ICONS.alive}
            <span>${isElim ? 'Eliminated' : 'Alive'}</span>
          </button>

          <!-- Booyah Manual Button -->
          <button class="${booyahBtnClass}" onclick="toggleBooyah(${index})">
            ${SVG_ICONS.trophy}
            <span>${isWinner ? 'BOOYAH!' : 'Booyah'}</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  statGameTotalKills.textContent = `Total Kills: ${totalKills}`;
  if (booyahWinnerTeam) {
    statGameBooyah.textContent = `Booyah: ${booyahWinnerTeam.name}`;
  } else {
    statGameBooyah.textContent = `Booyah: Pending (${12 - elimCount} Alive)`;
  }

  attachDragEvents();
}

function renderOverallStandings() {
  const overall = calculateOverallStandings();

  overallTableBody.innerHTML = overall.map((team, index) => {
    const rankNum = index + 1;
    const topClass = rankNum <= 3 ? `top-${rankNum}` : '';

    return `
      <div class="overall-row ${topClass}">
        <span class="col-rank">#${rankNum}</span>
        <span class="col-team">${escapeHtml(team.name)}</span>
        <span class="col-m">${team.matches}</span>
        <span class="col-w">${team.booyah}</span>
        <span class="col-k">${team.kills}</span>
        <span class="col-pts">${team.points}</span>
      </div>
    `;
  }).join('');
}

function calculateOverallStandings() {
  const statsMap = {};

  state.teams.forEach(name => {
    statsMap[name] = {
      name: name,
      matches: 0,
      booyah: 0,
      kills: 0,
      placePts: 0,
      points: 0
    };
  });

  for (let g = 1; g <= TOTAL_GAMES; g++) {
    const gameList = state.games[`game${g}`] || [];
    
    const gamePlayed = gameList.some(t => (t.kills > 0) || t.isEliminated || t.isBooyah);
    if (!gamePlayed) continue;

    const elimCount = gameList.filter(t => t.isEliminated).length;
    let winnerIndex = gameList.findIndex(t => t.isBooyah);
    if (winnerIndex === -1 && elimCount === 11) {
      winnerIndex = gameList.findIndex(t => !t.isEliminated);
    }

    gameList.forEach((t, index) => {
      const rankNum = index + 1;
      const placePts = getPlacePts(rankNum);
      const kills = t.kills || 0;
      const points = placePts + (kills * KILL_POINTS);
      const isWinner = (winnerIndex === index) || !!t.isBooyah;

      if (!statsMap[t.name]) {
        statsMap[t.name] = { name: t.name, matches: 0, booyah: 0, kills: 0, placePts: 0, points: 0 };
      }

      statsMap[t.name].matches += 1;
      statsMap[t.name].kills += kills;
      statsMap[t.name].placePts += placePts;
      statsMap[t.name].points += points;

      if (isWinner) {
        statsMap[t.name].booyah += 1;
      }
    });
  }

  return Object.values(statsMap).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.placePts !== a.placePts) return b.placePts - a.placePts;
    if (b.kills !== a.kills) return b.kills - a.kills;
    if (b.booyah !== a.booyah) return b.booyah - a.booyah;
    return a.name.localeCompare(b.name);
  });
}

// ==========================================
// DRAG AND DROP REORDERING (MOBILE & DESKTOP)
// ==========================================

let draggedItemIndex = null;

function attachDragEvents() {
  const cards = teamCardsList.querySelectorAll('.team-card');

  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedItemIndex = parseInt(card.dataset.index, 10);
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      cards.forEach(c => c.classList.remove('drag-over'));
      draggedItemIndex = null;
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      card.classList.add('drag-over');
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('drag-over');
      const targetIndex = parseInt(card.dataset.index, 10);
      if (draggedItemIndex !== null && draggedItemIndex !== targetIndex) {
        reorderTeams(draggedItemIndex, targetIndex);
      }
    });

    // Touch Support for Mobile
    const handle = card.querySelector('.drag-handle');
    if (handle) {
      handle.addEventListener('touchstart', () => {
        draggedItemIndex = parseInt(card.dataset.index, 10);
        card.classList.add('dragging');
      }, { passive: true });

      handle.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
        const targetCard = targetElement ? targetElement.closest('.team-card') : null;
        
        cards.forEach(c => c.classList.remove('drag-over'));
        if (targetCard && targetCard !== card) {
          targetCard.classList.add('drag-over');
        }
      }, { passive: true });

      handle.addEventListener('touchend', (e) => {
        card.classList.remove('dragging');
        const touch = e.changedTouches[0];
        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
        const targetCard = targetElement ? targetElement.closest('.team-card') : null;
        cards.forEach(c => c.classList.remove('drag-over'));

        if (targetCard && targetCard !== card) {
          const targetIndex = parseInt(targetCard.dataset.index, 10);
          if (draggedItemIndex !== null && draggedItemIndex !== targetIndex) {
            reorderTeams(draggedItemIndex, targetIndex);
          }
        }
        draggedItemIndex = null;
      });
    }
  });
}

function reorderTeams(fromIndex, toIndex) {
  triggerHaptic();
  const gameKey = state.activeTab;
  const list = state.games[gameKey];
  if (!list) return;

  const [movedItem] = list.splice(fromIndex, 1);
  list.splice(toIndex, 0, movedItem);

  markUnsaved();
  renderGameScoring();
  showToast(`Rank #${toIndex + 1}: ${movedItem.name}`);
}

// ==========================================
// ELIMINATION & BOOYAH TOGGLES
// ==========================================

window.toggleBooyah = function(teamIndex) {
  triggerHaptic();
  const gameKey = state.activeTab;
  const list = state.games[gameKey];
  if (!list || !list[teamIndex]) return;

  const item = list[teamIndex];
  const isCurrentlyBooyah = !!item.isBooyah;

  if (isCurrentlyBooyah) {
    item.isBooyah = false;
    showToast(`Booyah removed from ${item.name}`);
  } else {
    // Award Booyah to this team, mark all others eliminated
    list.forEach((t, i) => {
      t.isBooyah = false;
      if (i !== teamIndex) {
        t.isEliminated = true;
      }
    });
    item.isBooyah = true;
    item.isEliminated = false;

    // Move Booyah team to #1 position
    if (teamIndex !== 0) {
      const [winner] = list.splice(teamIndex, 1);
      list.unshift(winner);
    }

    showToast(`BOOYAH! ${item.name} takes Rank #1 (12 Pts)`);
  }

  markUnsaved();
  renderGameScoring();
};

window.toggleElimination = function(teamIndex) {
  triggerHaptic();
  const gameKey = state.activeTab;
  const list = state.games[gameKey];
  if (!list || !list[teamIndex]) return;

  const item = list[teamIndex];
  item.isEliminated = !item.isEliminated;

  if (item.isEliminated && item.isBooyah) {
    item.isBooyah = false;
  }

  if (item.isEliminated) {
    showToast(`${item.name} marked Eliminated`);
  } else {
    showToast(`${item.name} marked Alive`);
  }

  const elimCount = list.filter(t => t.isEliminated).length;
  if (elimCount === 11) {
    const survivorIndex = list.findIndex(t => !t.isEliminated);
    if (survivorIndex !== -1) {
      const survivor = list[survivorIndex];
      survivor.isBooyah = true;
      survivor.isEliminated = false;
      
      if (survivorIndex !== 0) {
        const [movedSurvivor] = list.splice(survivorIndex, 1);
        list.unshift(movedSurvivor);
      }
      showToast(`BOOYAH! ${survivor.name} is the last survivor (Rank #1)`);
    }
  }

  markUnsaved();
  renderGameScoring();
};

// ==========================================
// LIVESTREAM BROADCAST SCENE SWITCHER
// ==========================================

function setBroadcastScene(sceneName) {
  state.broadcastScene = sceneName;
  localStorage.setItem(STORAGE_KEY_SCENE, sceneName);
  updateBroadcastSceneUI();

  showToast(`OBS Scoreboard: ${sceneName.toUpperCase()}`);

  if (state.scriptUrl) {
    const payload = { action: "set_active_view", view: sceneName };
    fetch(state.scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }
}

function updateBroadcastSceneUI() {
  if (liveCurrentScene) {
    liveCurrentScene.textContent = state.broadcastScene.toUpperCase();
  }

  document.querySelectorAll('.scene-btn').forEach(btn => {
    if (btn.dataset.scene === state.broadcastScene) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// ==========================================
// USER ACTIONS (KILL CONTROLLER)
// ==========================================

window.updateKill = function(teamIndex, delta) {
  triggerHaptic();
  const gameKey = state.activeTab;
  if (!state.games[gameKey] || !state.games[gameKey][teamIndex]) return;

  const current = state.games[gameKey][teamIndex].kills || 0;
  const nextVal = Math.max(0, current + delta);
  if (current === nextVal) return;

  state.games[gameKey][teamIndex].kills = nextVal;
  markUnsaved();
  renderGameScoring();
};

function triggerHaptic() {
  if (navigator.vibrate) {
    try { navigator.vibrate(12); } catch (e) {}
  }
}

const STORAGE_KEY_EDIT_TIME = 'esports_scorer_last_edit_time';
let autoSaveTimer = null;

function triggerAutoSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  state.hasUnsavedChanges = true;
  updateStatusBar();
  
  // High-Speed Instant Debounce (150ms)
  autoSaveTimer = setTimeout(() => {
    saveCurrentGameToSheet(true);
  }, 150);
}

function markUnsaved() {
  saveToLocalStorage();
  triggerAutoSave();
}

function saveToLocalStorage() {
  localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(state.games));
  localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(state.teams));
  localStorage.setItem(STORAGE_KEY_EDIT_TIME, Date.now().toString());
}

function updateStatusBar() {
  if (state.isSyncing) {
    statusDot.className = 'status-dot syncing';
    statusLabel.textContent = 'Auto-saving...';
    saveStateText.textContent = 'Syncing with Google Sheet...';
  } else if (state.hasUnsavedChanges) {
    statusDot.className = 'status-dot unsaved';
    statusLabel.textContent = 'Unsaved Changes';
    saveStateText.textContent = 'Unsaved edits present';
  } else {
    statusDot.className = 'status-dot synced';
    statusLabel.textContent = 'Auto-Saved';
    saveStateText.textContent = 'Instant Auto-Save Active';
    saveTimeText.textContent = 'Google Sheets Connected';
  }
}

// ==========================================
// GOOGLE SHEETS ULTRA-FAST SYNC
// ==========================================

async function saveCurrentGameToSheet(isAutoSave = true) {
  if (!state.scriptUrl) return;

  state.isSyncing = true;
  updateStatusBar();

  const gameKey = state.activeTab;
  const gameNum = gameKey === 'overall' ? 1 : parseInt(gameKey.replace('game', ''), 10);
  const list = state.games[gameKey] || state.games['game1'];
  
  const elimCount = list.filter(t => t.isEliminated).length;
  let winnerIndex = list.findIndex(t => t.isBooyah);
  if (winnerIndex === -1 && elimCount === 11) {
    winnerIndex = list.findIndex(t => !t.isEliminated);
  }

  const teamsPayload = list.map((t, idx) => {
    const isWinner = (winnerIndex === idx) || !!t.isBooyah;
    return {
      rank: idx + 1,
      name: t.name,
      kills: t.kills || 0,
      placePts: getPlacePts(idx + 1),
      booyah: isWinner ? 1 : 0
    };
  });

  const payload = {
    action: "save_game",
    game: gameNum,
    teams: teamsPayload
  };

  try {
    const res = await fetch(state.scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      state.hasUnsavedChanges = false;
    }
  } catch (err) {
    // Suppress network logs
  } finally {
    state.isSyncing = false;
    updateStatusBar();
  }
}

async function fetchFromSheet() {
  if (!state.scriptUrl) return;

  state.isSyncing = true;
  updateStatusBar();

  try {
    const res = await fetch(`${state.scriptUrl}?action=get_all&_t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.masterTeams && Array.isArray(data.masterTeams) && data.masterTeams.length > 0) {
      state.teams = data.masterTeams;
    }

    if (data.activeView) {
      state.broadcastScene = data.activeView;
      localStorage.setItem(STORAGE_KEY_SCENE, data.activeView);
    }

    if (data.games) {
      for (let g = 1; g <= TOTAL_GAMES; g++) {
        const sheetGame = data.games[`Game ${g}`];
        if (sheetGame && Array.isArray(sheetGame)) {
          const hasBooyah = sheetGame.some(r => Number(r.booyah) === 1);
          state.games[`game${g}`] = sheetGame.map((row, idx) => {
            const isWinner = Number(row.booyah) === 1;
            return {
              slot: idx + 1,
              rank: row.rankNum || (idx + 1),
              name: row.name || state.teams[idx] || `Team ${idx + 1}`,
              kills: Number(row.kills) || 0,
              isEliminated: hasBooyah ? !isWinner : false,
              isBooyah: isWinner
            };
          });
        }
      }
    }

    state.hasUnsavedChanges = false;
    state.isSyncing = false;
    saveToLocalStorage();
    renderUI();
  } catch (err) {
    state.isSyncing = false;
    updateStatusBar();
  }
}

// ==========================================
// 12 TEAMS SETUP MODAL & BULK PASTE
// ==========================================

function openTeamsModal() {
  bulkTeamsInput.value = state.teams.join('\n');
  renderTeamInputs();
  teamsModal.classList.add('active');
}

function closeTeamsModal() {
  teamsModal.classList.remove('active');
}

function renderTeamInputs() {
  teamNamesEditor.innerHTML = state.teams.map((name, idx) => `
    <div class="team-name-input-group">
      <span>#${idx + 1}</span>
      <input type="text" id="teamModalInput_${idx}" value="${escapeHtml(name)}" placeholder="Team ${idx + 1}">
    </div>
  `).join('');
}

function parseBulkTeams() {
  const text = bulkTeamsInput.value.trim();
  if (!text) {
    showToast("Please paste team names into the box first.");
    return;
  }

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  for (let i = 0; i < TOTAL_TEAMS; i++) {
    const input = document.getElementById(`teamModalInput_${i}`);
    if (input) {
      input.value = lines[i] || `TEAM ${i + 1}`;
    }
  }
  showToast(`Auto-filled ${Math.min(lines.length, TOTAL_TEAMS)} team names!`);
}

async function saveTeamsFromModal() {
  const newNames = [];
  for (let i = 0; i < TOTAL_TEAMS; i++) {
    const input = document.getElementById(`teamModalInput_${i}`);
    const val = input ? input.value.trim() : "";
    newNames.push(val || `TEAM ${i + 1}`);
  }

  state.teams = newNames;

  for (let g = 1; g <= TOTAL_GAMES; g++) {
    state.games[`game${g}`].forEach((t, i) => {
      if (newNames[i]) t.name = newNames[i];
    });
  }

  saveToLocalStorage();
  closeTeamsModal();
  renderUI();
  showToast("12 Teams updated across all 6 games!");

  if (state.scriptUrl) {
    const payload = { action: "save_teams", teamNames: newNames };
    fetch(state.scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }
}

// ==========================================
// SETTINGS MODAL & RESET
// ==========================================

function openSettings() {
  scriptUrlInput.value = state.scriptUrl;
  settingsModal.classList.add('active');
}

function closeSettings() {
  settingsModal.classList.remove('active');
}

function resetCurrentGame() {
  const gameKey = state.activeTab;
  const gameNum = gameKey.replace('game', '');
  if (!confirm(`Reset all kills & ranks for GAME ${gameNum} to default?`)) return;

  if (state.games[gameKey]) {
    state.games[gameKey].forEach((t, idx) => {
      t.kills = 0;
      t.rank = idx + 1;
      t.isEliminated = false;
      t.isBooyah = false;
    });
  }

  markUnsaved();
  renderUI();
  showToast(`Game ${gameNum} reset to default`);
}

function resetAllGames() {
  if (!confirm("Reset ALL 6 games to 0? This cannot be undone.")) return;

  for (let g = 1; g <= TOTAL_GAMES; g++) {
    state.games[`game${g}`].forEach((t, idx) => {
      t.kills = 0;
      t.rank = idx + 1;
      t.isEliminated = false;
      t.isBooyah = false;
    });
  }

  markUnsaved();
  closeSettings();
  renderUI();
  showToast("All 6 games have been reset!");
}

function copyStandingsToClipboard() {
  const overall = calculateOverallStandings();
  let text = `*ESPORTS TOURNAMENT OVERALL STANDINGS*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Rank | Team | Matches | Won | Kills | PTS\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;

  overall.forEach((t, idx) => {
    text += `#${idx + 1} | ${t.name} | ${t.matches}M | ${t.booyah}W | ${t.kills}K | *${t.points} PTS*\n`;
  });

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Generated live from Esports Scorer App`;

  navigator.clipboard.writeText(text).then(() => {
    showToast("Standings copied to clipboard!");
  }).catch(() => {
    showToast("Failed to copy automatically.");
  });
}

// ==========================================
// PWA ENGINE & ANDROID BLACK SCREEN
// ==========================================

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('Service Worker Registered:', reg.scope);
      })
      .catch((err) => {
        console.log('Service Worker registration failed:', err);
      });
  });
}

// Check if running in Standalone App Mode (Launched from App icon)
function isStandalone() {
  const urlParams = new URLSearchParams(window.location.search);
  const isModeParam = urlParams.get('mode') === 'standalone';
  const isMatchMedia = window.matchMedia('(display-mode: standalone)').matches;
  const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
  const isMinimal = window.matchMedia('(display-mode: minimal-ui)').matches;
  const isNavStandalone = window.navigator.standalone === true;
  return isModeParam || isMatchMedia || isFullscreen || isMinimal || isNavStandalone;
}

// Detect Android Browser (Only when NOT running in standalone installed app mode)
function isAndroidBrowser() {
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  return isAndroid && !isStandalone();
}

// Enforce Pure Black Screen for Android Browser
function checkAndEnforceAppGate() {
  if (!forceInstallGate) return;

  if (isStandalone()) {
    // Running as installed app! Full access granted
    forceInstallGate.classList.add('hidden-gate');
    document.body.style.overflow = '';
    if (btnInstallPWA) btnInstallPWA.style.display = 'none';
    return;
  }

  // In Android browser tab: Keep black screen locked
  if (isAndroidBrowser()) {
    forceInstallGate.classList.remove('hidden-gate');
    document.body.style.overflow = 'hidden';
  } else {
    // Non-Android / Desktop -> hide black screen
    forceInstallGate.classList.add('hidden-gate');
    document.body.style.overflow = '';
  }
}

// Capture Android beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  if (btnInstallPWA) {
    btnInstallPWA.style.display = 'flex';
  }
  checkAndEnforceAppGate();
});

// App successfully installed - DO NOT proceed in browser tab!
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  if (btnInstallPWA) {
    btnInstallPWA.style.display = 'none';
  }
  // Keep black screen active in browser tab and display launch reminder
  if (gateInstalledNote) {
    gateInstalledNote.classList.remove('hidden-section');
  }
  if (btnGateInstall) {
    btnGateInstall.style.display = 'none';
  }
  showToast('App installed! Please open from your Home Screen.');
});

function triggerInstallPrompt() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        if (gateInstalledNote) {
          gateInstalledNote.classList.remove('hidden-section');
        }
        if (btnGateInstall) {
          btnGateInstall.style.display = 'none';
        }
        showToast('Installing... Launch from Home Screen.');
      }
      deferredInstallPrompt = null;
    });
  } else {
    showToast("Tap Chrome menu (⋮) -> 'Install App'");
  }
}

// Mobile Non-Zoomable & Touch-Action Guards
function initNonZoomableGuards() {
  document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });

  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });

  let lastTouchEndTime = 0;
  document.addEventListener('touchend', (e) => {
    const currentTime = Date.now();
    if (currentTime - lastTouchEndTime <= 300) {
      const tag = e.target.tagName ? e.target.tagName.toLowerCase() : '';
      if (tag !== 'input' && tag !== 'textarea') {
        e.preventDefault();
      }
    }
    lastTouchEndTime = currentTime;
  }, { passive: false });
}

initNonZoomableGuards();

// ==========================================
// UTILITY & INITIALIZATION
// ==========================================

function showToast(msg) {
  toastNotification.textContent = msg;
  toastNotification.classList.add('show');
  setTimeout(() => {
    toastNotification.classList.remove('show');
  }, 2500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Event Listeners
tabsContainer.addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;

  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  state.activeTab = btn.dataset.tab;
  renderUI();
});

livestreamSceneButtons.addEventListener('click', (e) => {
  const btn = e.target.closest('.scene-btn');
  if (!btn) return;
  setBroadcastScene(btn.dataset.scene);
});

if (btnInstallPWA) {
  btnInstallPWA.addEventListener('click', triggerInstallPrompt);
}

if (btnGateInstall) {
  btnGateInstall.addEventListener('click', triggerInstallPrompt);
}

btnOpenTeamsModal.addEventListener('click', openTeamsModal);
btnCloseTeamsModal.addEventListener('click', closeTeamsModal);
btnParseBulkTeams.addEventListener('click', parseBulkTeams);
btnSaveTeamNamesModal.addEventListener('click', saveTeamsFromModal);

btnRefresh.addEventListener('click', fetchFromSheet);
btnSettings.addEventListener('click', openSettings);
btnCloseSettings.addEventListener('click', closeSettings);
btnResetCurrentGame.addEventListener('click', resetCurrentGame);
btnResetAllGames.addEventListener('click', resetAllGames);
btnCopyStandings.addEventListener('click', copyStandingsToClipboard);

btnSaveConfig.addEventListener('click', () => {
  const url = scriptUrlInput.value.trim();
  state.scriptUrl = url;
  localStorage.setItem(STORAGE_KEY_CONFIG, url);
  closeSettings();
  showToast("Settings saved!");
  fetchFromSheet();
});

// Close modals on click outside
[teamsModal, settingsModal].forEach(modal => {
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }
});

// Check & Enforce Android Black Screen
checkAndEnforceAppGate();
window.addEventListener('resize', checkAndEnforceAppGate);

// Instant 0ms Initial Render
renderUI();
if (state.scriptUrl) {
  fetchFromSheet();
}
