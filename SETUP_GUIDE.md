# 🏆 Esports Tournament Multi-Game Leaderboard & Scorer Suite

A complete esports management system for **Free Fire, PUBG, BGMI, and Battle Royale tournaments** supporting **Game 1 to Game 6 subsheets**, **Overall Leaderboard auto-aggregation**, a **responsive Mobile Scorer Web App**, and a **Live OBS Broadcast Overlay**.

---

## 📁 What's Included

- 📱 **`scorer.html` / `scorer.js` / `scorer.css`** &rarr; **Mobile Scorer Web App (Controller)**:
  - Responsive on smartphones, tablets, and desktop.
  - Button tabs for **Game 1, Game 2, Game 3, Game 4, Game 5, Game 6**, and **🏆 Overall Standings**.
  - Quick `[+]` and `[−]` kill counters and `[🏆 BOOYAH]` toggle buttons so you never have to type manually during fast matches.
  - Real-time instant local calculation + 1-tap **Save to Google Sheet**.
  - 1-click **📋 Copy Text** button to paste match results directly into WhatsApp/Discord.
- 📜 **`GoogleAppsScript.js`** &rarr; **Multi-Game Google Sheets Backend**:
  - One-click setup: Creates `Overall`, `Game 1` .. `Game 6`, and master `Teams` subsheets with formulas and custom styling.
  - Automatically sums and aggregates stats across all 6 games.
  - Auto-sorts rankings #1 to #12 by Total Points DESC, then Kills DESC.
- 📺 **`index.html` / `app.js` / `style.css`** &rarr; **OBS Broadcast Overlay**:
  - 12-row esports leaderboard overlay for streams.
  - Supports overall standings (`index.html`) or specific games (`index.html?game=1`).

---

## 🚀 Quick Setup Guide (Under 3 Minutes)

### Step 1: Set Up Your Google Spreadsheet

1. Open [Google Sheets](https://sheets.new) and create a new blank spreadsheet.
2. In the top menu, click **Extensions** &rarr; **Apps Script**.
3. Delete any default code in `Code.gs`.
4. Open **`GoogleAppsScript.js`** in this folder, copy all code, and paste it into Apps Script.
5. In the toolbar dropdown, select **`setupTournament`** and click **Run** (Grant permissions if prompted).
   - *Result*: Your Google Sheet will instantly create:
     - `Overall` (Leaderboard with total matches, booyahs, kills, points)
     - `Game 1` to `Game 6` (Individual match subsheets with formulas)
     - `Teams` (Master team list)

---

### Step 2: Deploy Google Apps Script Web App

1. In Apps Script, click the blue **Deploy** button (top right) &rarr; **New deployment**.
2. Click the **gear icon (⚙️)** next to "Select type" &rarr; choose **Web app**.
3. Configure:
   - **Description**: `Esports Tournament API`
   - **Execute as**: `Me`
   - **Who has access**: **`Anyone`** *(Important: allows the mobile web app and overlay to sync without Google login)*
4. Click **Deploy** and copy your **Web app URL** (starts with `https://script.google.com/macros/s/.../exec`).

---

### Step 3: Open the Mobile Scorer Web App

1. Open **`scorer.html`** in your browser (or visit `/scorer` on your deployed Vercel site on your phone).
2. Click the **⚙️ (Settings)** icon at the top right:
   - Paste your **Web app URL**.
   - (Optional) Customize team names.
   - Click **Save Settings**.
3. **You are ready to score matches!**
   - Tap **Game 1**, **Game 2**, etc.
   - Tap **`+`** / **`−`** to adjust kills.
   - Tap **`🏆 BOOYAH`** to award win bonus.
   - Tap **`⚡ SAVE TO SHEET`** at the bottom to sync directly to Google Sheets!

---

## 🧮 Point Calculation & Rules

- **Kill Points**: `1 Point` per kill.
- **Booyah Points**: `10 Points` for match winner.
- **Game Points Formula**:
  $$\text{Game Points} = (\text{Kills} \times 1) + (\text{Booyah} \times 10)$$
- **Overall Tournament Points Formula**:
  $$\text{Total Points} = \sum_{g=1}^{6} \text{Points}_{\text{Game } g}$$
- **Auto-Sorting**:
  1. Primary: **Total Points** (Highest to Lowest)
  2. Secondary Tie-breaker: **Total Kills**
  3. Tertiary Tie-breaker: **Total Booyahs**

---

## 📺 OBS Broadcast Overlay Setup

1. In OBS Studio, add a **Browser Source**.
2. To show **Overall Leaderboard**:
   - URL / File: `index.html` (or `https://your-site.vercel.app/index.html`)
3. To show a **Specific Game's Scoreboard**:
   - URL: `index.html?game=1` (or `game=2`, `game=3`, etc.)
4. Set Width: `1920`, Height: `1080`.
5. Check **"Shutdown source when not visible"** if desired.
