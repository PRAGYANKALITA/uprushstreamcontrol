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

## 🧮 Sidetables & Point Calculation Modes

### Mode 1: Standard Leaderboard (Points + Rank Points)
- **Displayed Stats**: Kills & Total Points
- **Kill Points**: `1 Point` per kill.
- **Rank / Placement Points**:
  - 1st = 12 pts, 2nd = 9 pts, 3rd = 8 pts, 4th = 7 pts, 5th = 6 pts, 6th = 5 pts, 7th = 4 pts, 8th = 3 pts, 9th = 2 pts, 10th = 1 pt, 11th = 0 pts, 12th = 0 pts.
- **Formula**: `Total Points = Placement Points + Kills`
- **Auto-Sorting**: Total Points &rarr; Place Pts &rarr; Kills &rarr; Booyah.

### Mode 2: Kills & Booyah Leaderboard (NO Rank Points)
- **Displayed Stats**: Kills & Booyah only (Rank points completely excluded).
- **Auto-Sorting**:
  - **Default (Booyah First)**: Booyah &rarr; Kills &rarr; Team Name.
  - **Kill Race (`?sort=kills`)**: Kills &rarr; Booyah &rarr; Team Name.
  - **Formula (`?sort=pts`)**: `(Booyah × 10) + Kills`.

---

## 📺 OBS Broadcast Overlay Setup (Two Endpoints)

You have **two distinct endpoints** for both sidetables:

### 1. Existing Sidetable (Rank Points + Kills)
- **Vercel / Web URL**: `https://your-site.vercel.app/` or `https://your-site.vercel.app/points`
- **Local File**: `index.html`
- **Specific Game URL**: `https://your-site.vercel.app/?game=1` (or `game=2` .. `game=6`)

### 2. New Sidetable (Only Kills & Booyah — No Rank Points)
- **Vercel / Web URL**: `https://your-site.vercel.app/kills` (or `/booyah`, `/kills-booyah`)
- **Local File**: `kills.html`
- **Specific Game URL**: `https://your-site.vercel.app/kills?game=1`
- **Kill Race Sorting**: `https://your-site.vercel.app/kills?sort=kills`

### OBS Studio Setup:
1. In OBS Studio, add a **Browser Source**.
2. Paste the desired endpoint URL above into **URL**.
3. Set **Width**: `1920`, **Height**: `1080` (or `480` x `800` for side-only crop).
4. Check **"Shutdown source when not visible"** if desired.

---

## 🔌 Google Apps Script API Endpoints

- **Existing Leaderboard API**:
  `https://script.google.com/macros/s/.../exec?action=get_all`
- **Kills & Booyah API**:
  `https://script.google.com/macros/s/.../exec?action=get_kills_booyah`
  *(or add `&mode=kills` to any query)*

---

## 💀 Defeated / Non-Alive Teams (Darkened Row)

When a team is defeated (eliminated/non-alive):
- Their leaderboard row turns **quite dark** (dimmed brightness, grayscale filter, dark overlay, and muted gray typography).
- This is automatically synced when toggled in the Scorer app or Google Sheets (`Eliminated` column).
- **Manual Testing in OBS**: You can preview defeated styling on any overlay URL by adding `?defeated=1,4,7` (by rank) or `?defeated=Team Soul,Godlike` (by name).


