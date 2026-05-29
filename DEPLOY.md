# 🚀 Deployment Guide — Botta e Risposta World Cup 2026

---

## STEP 1 — Create the Firebase project

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"**
3. Name it: `botta-e-risposta` (or anything you like)
4. Disable Google Analytics (not needed) → **Create project**

### Enable Realtime Database
1. In the left sidebar: **Build → Realtime Database**
2. Click **"Create database"**
3. Choose location: **europe-west1** (Belgium) — closest to Italy
4. Start in **"test mode"** (we'll secure it after)

### Get your Firebase config
1. Click the gear icon → **Project settings**
2. Scroll to **"Your apps"** → click **"</>" (Web)**
3. Register the app name: `scorecard`
4. Copy the `firebaseConfig` object — you'll need these 7 values:
   - apiKey
   - authDomain
   - databaseURL
   - projectId
   - storageBucket
   - messagingSenderId
   - appId

### Set security rules
1. In Realtime Database → **Rules** tab
2. Paste this (allows read/write from your app):
```json
{
  "rules": {
    "session": {
      ".read": true,
      ".write": true
    }
  }
}
```
3. Click **Publish**

---

## STEP 2 — Put the code on GitHub

1. Go to **https://github.com** → click **"New repository"**
2. Name: `botta-e-risposta-scorecard`
3. Set to **Private**
4. Click **Create repository**

On your computer, open Terminal and run:
```bash
cd path/to/debate-app      # navigate to the project folder
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/botta-e-risposta-scorecard.git
git push -u origin main
```

---

## STEP 3 — Deploy to Vercel

1. Go to **https://vercel.com** → sign up / log in with GitHub
2. Click **"Add New → Project"**
3. Find and import `botta-e-risposta-scorecard`
4. Framework Preset: **Create React App** (auto-detected)

### Add Environment Variables
In the Vercel setup screen, click **"Environment Variables"** and add these one by one:

| Name | Value |
|------|-------|
| `REACT_APP_FIREBASE_API_KEY` | (from Firebase config) |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | (from Firebase config) |
| `REACT_APP_FIREBASE_DATABASE_URL` | (from Firebase config) |
| `REACT_APP_FIREBASE_PROJECT_ID` | (from Firebase config) |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | (from Firebase config) |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | (from Firebase config) |
| `REACT_APP_FIREBASE_APP_ID` | (from Firebase config) |

5. Click **Deploy**
6. Wait ~2 minutes → you get your URL like `botta-e-risposta-scorecard.vercel.app`

---

## STEP 4 — Test it

Open your Vercel URL and:
1. Click **Coordinator** → enter your name → PIN: **`2026`**
2. In Setup tab: set team names, topic, number of judges → Save
3. Open a private/incognito window → **Judge** → claim Judge slot 1
4. Back in coordinator: **Phases** tab → click **"Open Phase"** for Phase 1
5. In judge window: answer the questions → see them save in real time

---

## STEP 5 — Share with judges

Send each judge the Vercel URL. They:
1. Click Judge
2. Enter their name
3. Claim their numbered slot (taken slots are greyed out)
4. Wait for the coordinator to open each phase

---

## How to change the Coordinator PIN

Open `src/App.js`, find line 6:
```js
const COORDINATOR_PIN = '2026';
```
Change `'2026'` to any PIN you want.
Then commit and push — Vercel auto-redeploys in ~1 minute.

---

## How to reset for the next debate

1. Log in as Coordinator
2. Scroll to the bottom of any tab
3. Click **"Reset for next debate"**
4. Confirm → everything is wiped, ready for the next match

> 💡 **Tip:** Before resetting, use **Export Final Verdict** in the Results tab to save/print the results.

---

## Troubleshooting

**"Permission denied" error in console:**
→ Check your Firebase security rules are set to `.read: true, .write: true`

**Judges can't connect / data not syncing:**
→ Double-check the `REACT_APP_FIREBASE_DATABASE_URL` env variable — it must end in `.firebasedatabase.app`, not `.firebaseio.com`

**After editing code, changes don't appear:**
→ Push to GitHub → Vercel auto-rebuilds in ~1 minute

**Local development:**
```bash
cp .env.example .env.local
# Fill in your Firebase values in .env.local
npm install
npm start
```
