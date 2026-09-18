# Home Workout Timer

A phone-friendly timer for home workouts: push-ups, dumbbell work, planks — anything with sets, reps and rest.

- **Live app:** https://zorenkonte.github.io/timer/
- **Source:** https://github.com/zorenkonte/timer

## What it does

- Build workouts from exercises with sets, reps or timed work, optional weight, and rest between sets.
- Follow along with a guided runner: get-ready countdown, tick off rep sets, timed sets run themselves,
  rest countdown ring, pause / ±15 s / skip / end, and a preview of what's next.
- Beeps for the last three seconds and phase changes, vibration on supported phones, and the screen stays awake.
- History of finished sessions with an activity heatmap of the last few months.
- Dark and light themes with a choice of accent colors.
- Import a workout from JSON, so any AI chat can write your plan for you.
- Everything is stored in your browser. No account, no server.

## Let an AI plan your workout

The app has no server, so instead of an MCP integration it speaks plain JSON:

1. Open **Workouts → Import** and tap **Copy prompt** (or **Copy with my workouts** to give the AI your current plan).
2. Paste the prompt into ChatGPT, Claude, Gemini or any other chat AI and fill in your goal, equipment and time.
3. Paste the JSON it replies with back into the Import box. A single workout opens in the editor for review; a list is added directly.

AIs that can browse can read the format from [`llms.txt`](public/llms.txt) at
`https://zorenkonte.github.io/timer/llms.txt`, and a JSON Schema lives at
`https://zorenkonte.github.io/timer/workout.schema.json`. The short version:

```json
{
  "name": "Upper Body",
  "restBetweenExercisesSec": 90,
  "exercises": [
    { "name": "Push-ups", "mode": "reps", "sets": 3, "reps": 12, "weightKg": 0, "restSec": 60 },
    { "name": "Plank", "mode": "time", "sets": 3, "durationSec": 45, "weightKg": 0, "restSec": 45 }
  ]
}
```

Any workout can also be copied back out as JSON from its editor.

## Run locally

```bash
npm install
npm run dev
```

Pushes to the default branch deploy to GitHub Pages automatically.

## Pull request previews

Pull requests get a live preview deployment on [Vercel](https://vercel.com), the same way Netlify or
Vercel previews work on any repo: every push to a PR is built and deployed to its own URL, and the
Vercel bot posts the link on the PR with a **Visit Preview** button and a deployment status check.
Previews are updated on every push and expire when the PR is closed.

The build detects Vercel and serves the app from the site root instead of `/timer/`. Nothing else
differs from the GitHub Pages build. Each preview has its own origin, so its saved workouts and
history are separate from the live app.

### One-time setup

1. Sign in at [vercel.com](https://vercel.com) with GitHub and open **Add New… → Project**.
2. Import `zorenkonte/timer`. Vercel reads `vercel.json`, so keep the detected settings and deploy.
3. Vercel installs its GitHub app on the repo and starts previewing pull requests. A PR that was
   already open gets its first preview on its next push.
4. New Vercel projects put preview URLs behind a Vercel login. To let anyone with the link open a
   preview, go to the project's **Settings → Deployment Protection** and set **Vercel Authentication**
   to **Disabled**.

The GitHub Pages deployment of `main` stays the live app.
