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

`npm run build` produces the GitHub Pages build under `/timer/`. To reproduce the Cloudflare build,
which serves from the site root, run `BASE_PATH=/ npm run build`.

Pushes to the default branch deploy to GitHub Pages automatically.

## Pull request previews

Pull requests get a live preview deployment on [Cloudflare Pages](https://pages.cloudflare.com):
every push to a PR is built and deployed to its own `*.pages.dev` URL, and the Cloudflare Pages
bot posts the link on the PR with a deployment status check. Previews update on every push, and
each branch also gets a stable alias like `<branch>.timer.pages.dev`.

The build detects Cloudflare and serves the app from the site root instead of `/timer/`. Nothing
else differs from the GitHub Pages build. Each preview has its own origin, so its saved workouts
and history are separate from the live app.

### One-time setup

1. In the [Cloudflare dashboard](https://dash.cloudflare.com) open **Workers & Pages → Create →
   Pages → Connect to Git** and pick `zorenkonte/timer`.
2. Build settings: framework preset **Vite**, build command `npm run build`, output directory
   `dist`. Node 22 is picked up from `.node-version`. Save and deploy.
3. Cloudflare installs its GitHub app on the repo and previews every pull request from then on. A
   PR that was already open gets its first preview on its next push.
4. Optional, for a custom domain: in the Pages project open **Custom domains** and add for example
   `timer.yourdomain.com`. Since the domain is on Cloudflare the DNS record is created for you, and
   the production deployment of `main` is served there.

Preview URLs are public by default. To restrict them, enable **Access policy** under the project's
**Settings → General**.

The GitHub Pages deployment of `main` stays the live app.
