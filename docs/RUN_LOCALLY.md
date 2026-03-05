# Running the project locally

## Why did I have 3 instances (ports 3002, 3003, 3004)?

- Each time the dev server was started **without stopping the previous one**, a new process was launched.
- When port **3002** was already in use, the next start used **3003** (`dev:localhost`). When 3003 was in use, **3004** was used. So we ended up with **three separate processes** on three ports.

## Why did 3003 and 3004 show an older version of the app?

- Each process **compiled the code that was on disk when that process started**. The one on 3002 was often the first (or the one you had been using), so it kept recompiling as you edited and showed the **latest** version.
- 3003 and 3004 were started **later**, as fallbacks when 3002 (and then 3003) were in use. Those processes were effectively **snapshots** from when they started—they didn't necessarily have your most recent changes, so they could look **older** or wrong.
- So you weren't imagining it: 3003 and 3004 really could be serving an **older** version of the app. That's another good reason to never have more than one dev server running.

## Rule: one instance only

- **Only one** dev server should run at a time.
- Use **only one** of these: `npm run dev` (port 3002) **or** `npm run dev:localhost` (port 3003). Do not run both, and do not run the same command in multiple terminals.

## How to run (and avoid multiple instances)

### Option A – Normal start (you are sure nothing is running)

```bash
npm run dev
```

Then open: **http://localhost:3002**

### Option B – Safe start (stops any existing dev server, then starts one)

Use this if you're not sure whether something is already running, or you want to avoid "port in use" and extra instances:

```bash
npm run dev:safe
```

This will free ports 3002, 3003 and 3004, then start a **single** dev server on **http://localhost:3002**.

### If you get "port already in use"

1. **Option 1:** Run `npm run dev:safe` (recommended).
2. **Option 2:** Stop the process using the port, then run `npm run dev` again:
   - Windows (PowerShell):  
     `Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`
   - Or close the terminal window where the dev server is running.

## Summary

- **What happened:** Several dev servers were started in a row without stopping the previous ones, so 3 instances ran on 3002, 3003, 3004.
- **Why 3003/3004 looked old:** Each process serves the code it compiled when it started; the later-started processes didn't have your latest changes.
- **How to prevent it:** Use only one dev command at a time; when in doubt, use `npm run dev:safe` so only one instance runs.
