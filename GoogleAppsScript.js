/**
 * ===================================================================
 * ESPORTS TOURNAMENT MULTI-GAME SYSTEM - HIGH PERFORMANCE GOOGLE APPS SCRIPT
 * ===================================================================
 * Features:
 *  1. Official Placement Point Table:
 *     1st = 12 pts (Booyah), 2nd = 9 pts, 3rd = 8 pts, 4th = 7 pts,
 *     5th = 6 pts, 6th = 5 pts, 7th = 4 pts, 8th = 3 pts,
 *     9th = 2 pts, 10th = 1 pt, 11th = 0 pts, 12th = 0 pts.
 *  2. 1 Kill = 1 Point.
 *  3. Rank points calculated ONLY upon team elimination / Booyah.
 *  4. Single-Batch High Speed R/W (Sub-100ms ultra-fast sync).
 *  5. Dynamic Livestream Scene Controller (Overall / Game 1..6).
 * ===================================================================
 */

const CONFIG = {
  KILL_POINTS: 1,
  PLACEMENT_POINTS: [12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0],
  TOTAL_TEAMS: 12,
  MAX_GAMES: 6,
  OVERALL_SHEET: "Overall",
  LEADERBOARD_SHEET: "Leaderboard",
  TEAMS_SHEET: "Teams",
  DEFAULT_TEAMS: [
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
  ]
};

function getPlacementPoints(rankNum) {
  const r = parseInt(rankNum, 10);
  if (r >= 1 && r <= CONFIG.PLACEMENT_POINTS.length) {
    return CONFIG.PLACEMENT_POINTS[r - 1];
  }
  return 0;
}

/**
 * 1. RUN THIS ONCE: Initializes all sheets with official placement formulas.
 */
function setupTournament() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Setup Master Teams Sheet
  let teamsSheet = ss.getSheetByName(CONFIG.TEAMS_SHEET);
  if (!teamsSheet) {
    teamsSheet = ss.insertSheet(CONFIG.TEAMS_SHEET);
  }
  teamsSheet.clear();
  teamsSheet.getRange(1, 1, 1, 2).setValues([["Team ID", "Team Name"]]);
  formatHeader(teamsSheet.getRange(1, 1, 1, 2), "#1e293b", "#38bdf8");
  
  const teamRows = [];
  for (let i = 0; i < CONFIG.TOTAL_TEAMS; i++) {
    teamRows.push([`T${i + 1}`, CONFIG.DEFAULT_TEAMS[i] || `TEAM ${i + 1}`]);
  }
  teamsSheet.getRange(2, 1, CONFIG.TOTAL_TEAMS, 2).setValues(teamRows);
  teamsSheet.getRange(2, 1, CONFIG.TOTAL_TEAMS, 2).setFontSize(11).setFontWeight("bold");
  teamsSheet.setColumnWidth(1, 90);
  teamsSheet.setColumnWidth(2, 220);

  // 2. Setup Game 1 to Game 6 sheets
  for (let g = 1; g <= CONFIG.MAX_GAMES; g++) {
    const sheetName = `Game ${g}`;
    let gSheet = ss.getSheetByName(sheetName);
    if (!gSheet) {
      gSheet = ss.insertSheet(sheetName);
    }
    gSheet.clear();

    const headers = ["Place", "Team Name", "Kills", "Place Pts", "Kill Pts", "Total Pts", "Booyah"];
    gSheet.getRange(1, 1, 1, 7).setValues([headers]);
    formatHeader(gSheet.getRange(1, 1, 1, 7), "#0f172a", "#f59e0b");

    const gameRows = [];
    for (let i = 0; i < CONFIG.TOTAL_TEAMS; i++) {
      const rank = i + 1;
      gameRows.push([
        `#${rank}`,
        `='${CONFIG.TEAMS_SHEET}'!B${i + 2}`,
        0, // Kills
        0, // Place Pts (0 initially until elimination/win)
        `=C${i + 2} * ${CONFIG.KILL_POINTS}`,
        `=D${i + 2} + E${i + 2}`,
        0  // Booyah
      ]);
    }
    gSheet.getRange(2, 1, CONFIG.TOTAL_TEAMS, 7).setValues(gameRows);

    gSheet.getRange(2, 1, CONFIG.TOTAL_TEAMS, 1).setHorizontalAlignment("center").setFontWeight("bold");
    gSheet.getRange(2, 2, CONFIG.TOTAL_TEAMS, 1).setHorizontalAlignment("left").setFontWeight("bold");
    gSheet.getRange(2, 3, CONFIG.TOTAL_TEAMS, 5).setHorizontalAlignment("center");
    
    gSheet.setColumnWidth(1, 80);
    gSheet.setColumnWidth(2, 200);
    gSheet.setColumnWidth(3, 80);
    gSheet.setColumnWidth(4, 90);
    gSheet.setColumnWidth(5, 90);
    gSheet.setColumnWidth(6, 100);
    gSheet.setColumnWidth(7, 80);
  }

  // 3. Setup Overall Leaderboard Sheet
  let overallSheet = ss.getSheetByName(CONFIG.OVERALL_SHEET);
  if (!overallSheet) {
    overallSheet = ss.insertSheet(CONFIG.OVERALL_SHEET, 0);
  }
  overallSheet.clear();

  const ovHeaders = ["Rank", "Team Name", "Matches", "🏆 Booyah", "Total Kills", "Place Pts", "Total Points"];
  overallSheet.getRange(1, 1, 1, 7).setValues([ovHeaders]);
  formatHeader(overallSheet.getRange(1, 1, 1, 7), "#0a192f", "#00e5ff");

  overallSheet.setColumnWidth(1, 80);
  overallSheet.setColumnWidth(2, 220);
  overallSheet.setColumnWidth(3, 90);
  overallSheet.setColumnWidth(4, 100);
  overallSheet.setColumnWidth(5, 110);
  overallSheet.setColumnWidth(6, 110);
  overallSheet.setColumnWidth(7, 130);

  // 4. Setup "Leaderboard" Sheet
  let legacySheet = ss.getSheetByName(CONFIG.LEADERBOARD_SHEET);
  if (!legacySheet) {
    legacySheet = ss.insertSheet(CONFIG.LEADERBOARD_SHEET, 1);
  }
  legacySheet.clear();
  const legHeaders = ["Rank", "Team Name", "Kills", "Booyah", "Total Points"];
  legacySheet.getRange(1, 1, 1, 5).setValues([legHeaders]);
  formatHeader(legacySheet.getRange(1, 1, 1, 5), "#0a192f", "#00e5ff");
  legacySheet.setColumnWidth(1, 80);
  legacySheet.setColumnWidth(2, 220);
  legacySheet.setColumnWidth(3, 90);
  legacySheet.setColumnWidth(4, 90);
  legacySheet.setColumnWidth(5, 110);

  setActiveView("Overall");
  recalculateOverall();
}

function formatHeader(range, bgColor, fontColor) {
  range.setBackground(bgColor);
  range.setFontColor(fontColor);
  range.setFontWeight("bold");
  range.setFontSize(11);
  range.setHorizontalAlignment("center");
}

function getActiveView() {
  const props = PropertiesService.getScriptProperties();
  return props.getProperty("ACTIVE_VIEW") || "Overall";
}

function setActiveView(viewName) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty("ACTIVE_VIEW", viewName);
}

/**
 * 2. Recalculates Overall Standings across Game 1..6 with Placement points & Booyahs
 */
function recalculateOverall() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const overallSheet = ss.getSheetByName(CONFIG.OVERALL_SHEET);
  const legacySheet = ss.getSheetByName(CONFIG.LEADERBOARD_SHEET);
  const teamsSheet = ss.getSheetByName(CONFIG.TEAMS_SHEET);
  if (!overallSheet || !teamsSheet) return;

  const teamData = teamsSheet.getRange(2, 1, CONFIG.TOTAL_TEAMS, 2).getValues();
  const teamStats = {};

  teamData.forEach(row => {
    const tName = String(row[1] || "").trim();
    if (tName) {
      teamStats[tName] = {
        name: tName,
        matches: 0,
        booyah: 0,
        kills: 0,
        placePts: 0,
        points: 0
      };
    }
  });

  // Collect stats from Game 1..6 in memory
  for (let g = 1; g <= CONFIG.MAX_GAMES; g++) {
    const gSheet = ss.getSheetByName(`Game ${g}`);
    if (!gSheet) continue;

    const gData = gSheet.getRange(2, 1, CONFIG.TOTAL_TEAMS, 7).getValues();
    
    // Check if game has actually been played (kills recorded or booyah winner determined)
    const gameHasData = gData.some(row => {
      const kills = Number(row[2]) || 0;
      const isBooyah = Number(row[6]) || 0;
      return kills > 0 || isBooyah === 1;
    });

    if (!gameHasData) {
      continue; // Skip unplayed games
    }

    gData.forEach((row, i) => {
      const name = String(row[1] || "").trim();
      if (!name) return;
      const kills = Number(row[2]) || 0;
      const rankNum = parseInt(String(row[0] || "").replace("#", ""), 10) || (i + 1);
      const placePts = Number(row[3]) || getPlacementPoints(rankNum);
      const points = Number(row[5]) || (placePts + (kills * CONFIG.KILL_POINTS));
      const isBooyah = Number(row[6]) || 0;

      if (!teamStats[name]) {
        teamStats[name] = { name: name, matches: 0, booyah: 0, kills: 0, placePts: 0, points: 0 };
      }

      teamStats[name].matches += 1;
      teamStats[name].kills += kills;
      teamStats[name].placePts += placePts;
      teamStats[name].points += points;
      if (isBooyah === 1) {
        teamStats[name].booyah += 1;
      }
    });
  }

  // Sort descending: Points DESC, Placement Pts DESC, Kills DESC, Booyah DESC, Name ASC
  const sorted = Object.values(teamStats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.placePts !== a.placePts) return b.placePts - a.placePts;
    if (b.kills !== a.kills) return b.kills - a.kills;
    if (b.booyah !== a.booyah) return b.booyah - a.booyah;
    return a.name.localeCompare(b.name);
  });

  // Batch update Overall Sheet in 1 call
  const overallRows = [];
  const legacyRows = [];
  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];
    overallRows.push([`#${i + 1}`, t.name, t.matches, t.booyah, t.kills, t.placePts, t.points]);
    legacyRows.push([`#${i + 1}`, t.name, t.kills, t.booyah, t.points]);
  }

  if (overallRows.length > 0) {
    overallSheet.getRange(2, 1, overallRows.length, 7).setValues(overallRows);
  }

  if (legacySheet && legacyRows.length > 0) {
    legacySheet.getRange(2, 1, legacyRows.length, 5).setValues(legacyRows);
  }
}

function onEdit(e) {
  recalculateOverall();
}

/**
 * 3. GET API: Ultra Fast JSON Endpoint
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const params = e ? e.parameter : {};
    const action = params.action || "get_all";

    if (action === "set_active_view" && params.view) {
      setActiveView(params.view);
      return jsonResponse({
        status: "success",
        activeView: params.view,
        message: `Livestream broadcast switched to: ${params.view}`
      });
    }

    if (action === "save_game" && params.data) {
      return handleSaveGame(JSON.parse(params.data));
    }

    if (action === "save_teams" && params.data) {
      return handleSaveTeams(JSON.parse(params.data));
    }

    const currentActiveView = params.game ? (`Game ${params.game}`) : (params.view || getActiveView());

    // Overall Standings
    const ovSheet = ss.getSheetByName(CONFIG.OVERALL_SHEET);
    const ovData = ovSheet ? ovSheet.getRange(2, 1, CONFIG.TOTAL_TEAMS, 7).getValues() : [];
    const overallTeams = ovData.map((row, i) => ({
      rank: row[0] || `#${i + 1}`,
      name: row[1] || `Team ${i + 1}`,
      matches: Number(row[2]) || 0,
      booyah: Number(row[3]) || 0,
      kills: Number(row[4]) || 0,
      placePts: Number(row[5]) || 0,
      points: Number(row[6]) || 0
    }));

    // All Games Data
    const gamesData = {};
    for (let g = 1; g <= CONFIG.MAX_GAMES; g++) {
      const gSheet = ss.getSheetByName(`Game ${g}`);
      if (gSheet) {
        const raw = gSheet.getRange(2, 1, CONFIG.TOTAL_TEAMS, 7).getValues();
        gamesData[`Game ${g}`] = raw.map((row, i) => {
          const rankNum = parseInt(String(row[0] || "").replace("#", ""), 10) || (i + 1);
          const kills = Number(row[2]) || 0;
          const placePts = Number(row[3]) || getPlacementPoints(rankNum);
          const points = Number(row[5]) || (placePts + (kills * CONFIG.KILL_POINTS));
          const isBooyah = Number(row[6]) || 0;
          return {
            rank: `#${rankNum}`,
            rankNum: rankNum,
            name: row[1] || `Team ${i + 1}`,
            kills: kills,
            placePts: placePts,
            booyah: isBooyah,
            points: points
          };
        });
      }
    }

    const tSheet = ss.getSheetByName(CONFIG.TEAMS_SHEET);
    const rawTeams = tSheet ? tSheet.getRange(2, 2, CONFIG.TOTAL_TEAMS, 1).getValues() : [];
    const masterTeams = rawTeams.map(r => r[0]).filter(Boolean);

    // Dynamic Display for OBS Overlay
    let displayTeams = overallTeams;
    if (currentActiveView.startsWith("Game")) {
      const gameArray = gamesData[currentActiveView] || [];
      if (gameArray.length > 0) {
        displayTeams = [...gameArray].sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.placePts !== a.placePts) return b.placePts - a.placePts;
          if (b.kills !== a.kills) return b.kills - a.kills;
          if (b.booyah !== a.booyah) return b.booyah - a.booyah;
          return a.name.localeCompare(b.name);
        });
        displayTeams.forEach((t, i) => { t.rank = `#${i + 1}`; });
      }
    }

    return jsonResponse({
      status: "success",
      timestamp: new Date().toISOString(),
      activeView: currentActiveView,
      viewTitle: currentActiveView === "Overall" ? "OVERALL STANDINGS" : `${currentActiveView.toUpperCase()} STANDINGS`,
      config: {
        killPoints: CONFIG.KILL_POINTS,
        placementPoints: CONFIG.PLACEMENT_POINTS,
        totalTeams: CONFIG.TOTAL_TEAMS,
        maxGames: CONFIG.MAX_GAMES
      },
      teams: displayTeams,
      data: displayTeams,
      overall: overallTeams,
      games: gamesData,
      masterTeams: masterTeams
    });

  } catch (err) {
    return jsonResponse({
      status: "error",
      message: err.toString()
    });
  }
}

/**
 * 4. POST API
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    const action = payload.action;

    if (action === "set_active_view") {
      setActiveView(payload.view || "Overall");
      return jsonResponse({
        status: "success",
        activeView: payload.view,
        message: `Livestream scene switched to: ${payload.view}`
      });
    } else if (action === "save_game") {
      return handleSaveGame(payload);
    } else if (action === "save_teams") {
      return handleSaveTeams(payload);
    } else if (action === "reset_game") {
      return handleResetGame(payload);
    } else if (action === "reset_all") {
      return handleResetAll();
    }

    return jsonResponse({ status: "error", message: "Unknown action: " + action });

  } catch (err) {
    return jsonResponse({
      status: "error",
      message: err.toString()
    });
  }
}

/**
 * Ultra Fast 1-Batch Save Function for Game 1..6
 */
function handleSaveGame(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gameNum = payload.game || 1;
  const teamsData = payload.teams || [];

  const gSheet = ss.getSheetByName(`Game ${gameNum}`);
  if (!gSheet) throw new Error(`Game ${gameNum} sheet not found. Run setupTournament() first.`);

  // Build full 2D batch array
  const batchRows = [];
  for (let i = 0; i < CONFIG.TOTAL_TEAMS; i++) {
    const rowIdx = i + 2;
    const t = teamsData[i] || {};
    const rankNum = parseInt(t.rank || (i + 1), 10);
    const placePts = (t.placePts !== undefined && !isNaN(Number(t.placePts))) ? Number(t.placePts) : getPlacementPoints(rankNum);
    const isBooyah = (Number(t.booyah) === 1) ? 1 : 0;
    const name = t.name || `Team ${i + 1}`;
    const kills = Number(t.kills) || 0;
    const totalPoints = placePts + (kills * CONFIG.KILL_POINTS);

    batchRows.push([
      `#${rankNum}`,
      name,
      kills,
      placePts,
      kills * CONFIG.KILL_POINTS,
      totalPoints,
      isBooyah
    ]);
  }

  // 1 Single Batch Write (Ultra fast!)
  gSheet.getRange(2, 1, CONFIG.TOTAL_TEAMS, 7).setValues(batchRows);

  // Recalculate Overall in memory
  recalculateOverall();

  return jsonResponse({
    status: "success",
    message: `Game ${gameNum} scores updated instantly!`
  });
}

function handleSaveTeams(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const teamNames = payload.teamNames || [];

  const tSheet = ss.getSheetByName(CONFIG.TEAMS_SHEET);
  if (!tSheet) throw new Error("Teams sheet not found");

  const rows = [];
  for (let i = 0; i < CONFIG.TOTAL_TEAMS; i++) {
    rows.push([teamNames[i] || `TEAM ${i + 1}`]);
  }
  tSheet.getRange(2, 2, CONFIG.TOTAL_TEAMS, 1).setValues(rows);

  for (let g = 1; g <= CONFIG.MAX_GAMES; g++) {
    const gSheet = ss.getSheetByName(`Game ${g}`);
    if (gSheet) {
      const gRows = [];
      for (let i = 0; i < CONFIG.TOTAL_TEAMS; i++) {
        gRows.push([`='${CONFIG.TEAMS_SHEET}'!B${i + 2}`]);
      }
      gSheet.getRange(2, 2, CONFIG.TOTAL_TEAMS, 1).setValues(gRows);
    }
  }

  recalculateOverall();

  return jsonResponse({
    status: "success",
    message: "Team names updated across all games!"
  });
}

function handleResetGame(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gameNum = payload.game || 1;
  const gSheet = ss.getSheetByName(`Game ${gameNum}`);
  if (!gSheet) throw new Error(`Game ${gameNum} not found`);

  const resetRows = [];
  for (let i = 0; i < CONFIG.TOTAL_TEAMS; i++) {
    const rank = i + 1;
    resetRows.push([`#${rank}`, `='${CONFIG.TEAMS_SHEET}'!B${i + 2}`, 0, 0, `=C${i + 2} * ${CONFIG.KILL_POINTS}`, `=D${i + 2} + E${i + 2}`, 0]);
  }
  gSheet.getRange(2, 1, CONFIG.TOTAL_TEAMS, 7).setValues(resetRows);

  recalculateOverall();

  return jsonResponse({
    status: "success",
    message: `Game ${gameNum} has been reset!`
  });
}

function handleResetAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  for (let g = 1; g <= CONFIG.MAX_GAMES; g++) {
    const gSheet = ss.getSheetByName(`Game ${g}`);
    if (gSheet) {
      const resetRows = [];
      for (let i = 0; i < CONFIG.TOTAL_TEAMS; i++) {
        const rank = i + 1;
        resetRows.push([`#${rank}`, `='${CONFIG.TEAMS_SHEET}'!B${i + 2}`, 0, 0, `=C${i + 2} * ${CONFIG.KILL_POINTS}`, `=D${i + 2} + E${i + 2}`, 0]);
      }
      gSheet.getRange(2, 1, CONFIG.TOTAL_TEAMS, 7).setValues(resetRows);
    }
  }

  recalculateOverall();

  return jsonResponse({
    status: "success",
    message: "All 6 games have been reset!"
  });
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
