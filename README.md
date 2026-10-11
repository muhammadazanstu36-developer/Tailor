# Job Application Tailor

Copyright 2026 Muhammad Azan

An app that tailors your resume and cover letter to a job post, shows an honest match score,
runs a mock interview, and has a career coach chat.

## If the buttons do nothing

The most common cause is opening `index.html` from inside the zip without unzipping it, so its other files
(app.js and style.css) are missing. Either right-click the zip and choose Extract All, then open `index.html`
from the extracted folder, or just open **job-tailor-standalone.html**, which is the whole app in one file and needs
nothing else.

## What is in this folder

| File | What it does |
| --- | --- |
| job-tailor-standalone.html | The whole app in a single file. Double-click it and it works, no other files needed |
| index.html, style.css, app.js | The app: page, design, logic, 3D wallpaper, menu, chat, sign-up, job search links |
| config.js | Where the app finds your AI server (`AI_ENDPOINT`) |
| ai-shim.js | Lets the app run outside claude.ai by sending AI requests to your server |
| manifest.webmanifest, sw.js, icons/ | Make it installable and let it open offline (PWA) |
| server/server.js | A small server that hosts the app and talks to the Anthropic API |
| capacitor.config.json | Settings for wrapping the app as an Android app |

## Important: the AI needs a key or a server

On claude.ai the AI is built in. Anywhere else the app needs either a server that holds your Anthropic API key,
or each user's own key (see below). Never put your key inside the app files. `server/server.js` is a ready-made one. It is untested against the live
API, so try it before you rely on it.

## Quickest way: just open index.html

Double-click `index.html`. The first time you press **Tailor my application** or use the coach chat, the app asks for
your own Anthropic API key. Get one at console.anthropic.com. The key is saved only in your browser and sent only to
Anthropic, and the AI use is billed to your Anthropic account. No server or Node.js is needed.
This is for your own use. Do not share a copy of the app with your key typed into it, and do not use this mode to
serve other people, because each visitor would need their own key. For visitors, run the server below instead.

## Run it on your computer with the server

1. Install Node.js 18 or newer.
2. In this folder run:  `cd server`  then  `ANTHROPIC_API_KEY=your_key node server.js`
   (on Windows PowerShell: `$env:ANTHROPIC_API_KEY="your_key"; node server.js`)
3. Open http://localhost:3000

## Put it online as an installable app (PWA)

1. Deploy the whole folder, including `server/`, to any host that runs Node.js with HTTPS. Set the
   `ANTHROPIC_API_KEY` environment variable on the host.
2. Open the site on your phone. In Chrome choose "Install app" or "Add to Home screen". On iPhone use
   Safari, Share, then "Add to Home Screen".

If you host the app files on a static host and the server somewhere else, set `AI_ENDPOINT` in `config.js`
to the full server URL, for example `https://your-server.example.com/api/ai`. You will then need to allow
that origin in the server (add CORS headers).

## Make an Android app (APK)

You need Android Studio. In this folder:

```
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
npx cap sync
npx cap open android
```

Then build the APK in Android Studio. Set `AI_ENDPOINT` in `config.js` to the full URL of your hosted server,
because the app on the phone cannot reach `/api/ai` on its own.

## Job search

The "Find jobs and apply" section opens ready-made searches on LinkedIn, Indeed, Google Jobs, Glassdoor, Rozee.pk and
We Work Remotely. **Show listings here** loads real listings inside the app from the open feeds of Remotive and
Arbeitnow, each with an Apply link. This only works in the downloaded app, not inside claude.ai, and those feeds are
mostly remote and Europe-based jobs. LinkedIn and Indeed do not share their listings, so they cannot be shown inside
the app. These feeds were not reachable from where I built this, so test the button once on your own computer.

## What changes outside claude.ai

- AI features (tailor, score, mock interview, coach): work through your server.
- Sign-up: the saved list is a claude.ai feature, so here it uses the email step only.
- "Download all as text" and the CSV download: hidden.
- Sign-up emails go to the address in `app.js` (search for `TO=`). Change it to yours.
