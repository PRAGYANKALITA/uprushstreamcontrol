// Esports 12-Row Leaderboard Engine for OBS & Broadcasts - 100% Server Driven
// Smooth FLIP Animations with Strict Sequential Ranking

const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzMFTNKHSjOmYOkXSvudjtJ2dW3rwDyClMlzaZM2bAwS7-2fNtTaGGM_k8Cg2Kq-qg/exec';
const POLL_INTERVAL_MS = 2500; // 2.5s server polling

// Get URL query params
const urlParams = new URLSearchParams(window.location.search);
const selectedGameParam = urlParams.get('game');
const customUrlParam = urlParams.get('url');

const SCRIPT_URL = customUrlParam || DEFAULT_SCRIPT_URL;

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

const DEFAULT_TEAMS = [
  { rank: "#1", name: "TEAM SOUL", kills: 0, booyah: 0, points: 0, placePts: 0 },
  { rank: "#2", name: "GODLIKE ESPORTS", kills: 0, booyah: 0, points: 0, placePts: 0 },
  { rank: "#3", name: "BLIND ESPORTS", kills: 0, booyah: 0, points: 0, placePts: 0 },
  { rank: "#4", name: "ORANGUTAN", kills: 0, booyah: 0, points: 0, placePts: 0 },
  { rank: "#5", name: "TEAM XSPARK", kills: 0, booyah: 0, points: 0, placePts: 0 },
  { rank: "#6", name: "REVENANT ESPORTS", kills: 0, booyah: 0, points: 0, placePts: 0 },
  { rank: "#7", name: "MEDAL ESPORTS", kills: 0, booyah: 0, points: 0, placePts: 0 },
  { rank: "#8", name: "GLOBAL ESPORTS", kills: 0, booyah: 0, points: 0, placePts: 0 },
  { rank: "#9", name: "GLADIATORS", kills: 0, booyah: 0, points: 0, placePts: 0 },
  { rank: "#10", name: "HYDRA OFFICIAL", kills: 0, booyah: 0, points: 0, placePts: 0 },
  { rank: "#11", name: "TEAM 8BIT", kills: 0, booyah: 0, points: 0, placePts: 0 },
  { rank: "#12", name: "INSANE ESPORTS", kills: 0, booyah: 0, points: 0, placePts: 0 }
];

const container = document.getElementById('leaderboardContainer');
const previousTeamStats = {};
let isInitialRender = true;
let lastRenderedSignature = '';
let isFetching = false;

/**
 * Robust FLIP Rendering Engine
 * Guarded with Data Signature Check to prevent jitter & unnecessary jumps
 */
function render(teams) {
  const displayList = [...teams];
  while (displayList.length < 12) {
    displayList.push({
      rank: `#${displayList.length + 1}`,
      name: `TEAM ${displayList.length + 1}`,
      kills: 0,
      booyah: 0,
      placePts: 0,
      points: 0
    });
  }

  const top12 = displayList.slice(0, 12);

  // Guard: If signature hasn't changed, return immediately without touching DOM
  const newSignature = top12.map((t, idx) => `${idx + 1}:${t.name}:${t.kills}:${t.points}:${t.placePts}`).join('|');
  if (newSignature === lastRenderedSignature && !isInitialRender) {
    return;
  }
  lastRenderedSignature = newSignature;

  // 1. FIRST: Capture existing top pixel positions of every row before reordering
  const firstTops = new Map();
  const existingRowMap = new Map();
  container.querySelectorAll('.leaderboard-row').forEach(row => {
    const name = row.getAttribute('data-team');
    if (name) {
      firstTops.set(name, row.getBoundingClientRect().top);
      existingRowMap.set(name, row);
    }
  });

  // 2. Build or update existing DOM nodes in strictly sorted order
  const currentNodes = [];
  top12.forEach((team, index) => {
    const rankNum = index + 1;
    const rankClass = rankNum <= 3 ? `rank-${rankNum}` : '';
    const formattedRank = `#${rankNum}`;

    let row = existingRowMap.get(team.name);
    if (!row) {
      row = document.createElement('div');
      row.setAttribute('data-team', team.name);
    }

    // Stat changes for animation pop
    const prev = previousTeamStats[team.name];
    const hasStatChanged = prev && (prev.points !== team.points || prev.kills !== team.kills);
    const popClass = hasStatChanged ? 'stat-pop' : '';
    previousTeamStats[team.name] = { points: team.points, kills: team.kills };

    row.className = `leaderboard-row ${rankClass}`;
    row.setAttribute('data-team', team.name);
    row.innerHTML = `
      <div class="row-left-section">
        <div class="row-rank">${formattedRank}</div>
        <div class="row-team-name">${escapeHtml(team.name)}</div>
      </div>
      <div class="row-right-section">
        <div class="row-stat-kills ${popClass}">${team.kills ?? 0}</div>
        <div class="row-stat-points ${popClass}">${team.points ?? 0}</div>
      </div>
    `;

    container.appendChild(row); // Reorders existing DOM node cleanly without destroying it
    currentNodes.push(row);
  });

  // Clean up any stale nodes
  container.querySelectorAll('.leaderboard-row').forEach(row => {
    if (!currentNodes.includes(row)) {
      row.remove();
    }
  });

  if (isInitialRender) {
    isInitialRender = false;
    return;
  }

  // 3. INVERT: Calculate deltaY for each moving row (threshold > 8px to prevent sub-pixel rounding jitter)
  const animatingRows = [];
  currentNodes.forEach(row => {
    const name = row.getAttribute('data-team');
    const firstTop = firstTops.get(name);

    if (firstTop !== undefined) {
      const lastTop = row.getBoundingClientRect().top;
      const deltaY = firstTop - lastTop;

      if (Math.abs(deltaY) > 8) {
        // INVERT: Immediately pin element to its previous position
        row.style.transition = 'none';
        row.style.transform = `translate3d(0, ${deltaY}px, 0)`;

        if (deltaY > 0) {
          // Moved UP
          row.classList.add('rank-up');
        } else {
          // Moved DOWN
          row.classList.add('rank-down');
        }
        animatingRows.push(row);
      }
    }
  });

  // 4. FORCE REFLOW & PLAY ANIMATION
  if (animatingRows.length > 0) {
    animatingRows.forEach(row => void row.offsetHeight);

    requestAnimationFrame(() => {
      animatingRows.forEach(row => {
        row.style.transition = 'transform 0.75s cubic-bezier(0.2, 0.9, 0.3, 1), filter 0.4s ease';
        row.style.transform = 'translate3d(0, 0, 0)';
      });
    });

    setTimeout(() => {
      animatingRows.forEach(row => {
        row.classList.remove('rank-up', 'rank-down');
        row.style.transition = '';
      });
    }, 1200);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * 100% Server Driven Data Fetching
 */
async function fetchData() {
  if (isFetching) return;
  isFetching = true;

  try {
    let fetchEndpoint = SCRIPT_URL;
    if (selectedGameParam && selectedGameParam !== 'overall' && selectedGameParam !== 'all') {
      fetchEndpoint += (fetchEndpoint.includes('?') ? '&' : '?') + `action=get_game&game=${selectedGameParam}&_t=${Date.now()}`;
    } else {
      fetchEndpoint += (fetchEndpoint.includes('?') ? '&' : '?') + `action=get_all&_t=${Date.now()}`;
    }

    const res = await fetch(fetchEndpoint, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    let rawTeams = [];
    if (Array.isArray(data)) {
      rawTeams = data;
    } else if (data.teams && Array.isArray(data.teams)) {
      rawTeams = data.teams;
    } else if (data.overall && Array.isArray(data.overall)) {
      rawTeams = data.overall;
    } else if (data.data && Array.isArray(data.data)) {
      rawTeams = data.data;
    }

    if (rawTeams.length === 0) {
      return;
    }

    const processed = rawTeams.map((item, idx) => {
      const name = String(item.name || item.team || item.Team || item.TeamName || `Team ${idx + 1}`).trim();
      const kills = parseInt(item.kills || item.Kills || 0, 10) || 0;
      const booyah = parseInt(item.booyah || item.Booyah || 0, 10) || 0;
      const rankNum = item.rankNum || parseInt(String(item.rank || "").replace("#", ""), 10) || (idx + 1);
      const placePts = item.placePts !== undefined ? Number(item.placePts) : getPlacePts(rankNum);

      let points = item.points !== undefined ? Number(item.points) : (placePts + kills);
      return { name, kills, booyah, points, placePts, initialIndex: idx };
    });

    // Deterministic Auto-Sort: Points DESC -> Place Pts DESC -> Kills DESC -> Booyah DESC -> Name ASC
    processed.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.placePts !== a.placePts) return b.placePts - a.placePts;
      if (b.kills !== a.kills) return b.kills - a.kills;
      if (b.booyah !== a.booyah) return b.booyah - a.booyah;
      return a.name.localeCompare(b.name);
    });

    // Strictly assign ranks 1 to 12
    processed.forEach((t, i) => {
      t.rank = `#${i + 1}`;
      t.rankNum = i + 1;
    });

    render(processed);
  } catch (e) {
    // Suppress transient network hiccups
    console.debug("Server sync update:", e.message || e);
  } finally {
    isFetching = false;
  }
}

// Initial server fetch & interval
render(DEFAULT_TEAMS);
fetchData();
setInterval(fetchData, POLL_INTERVAL_MS);
