# Home Workout Timer

A phone-friendly timer for home workouts: push-ups, dumbbell work, planks — anything with sets, reps and rest.
Built with React 19, Tailwind CSS v4 and the [Cladd](https://cladd.io) UI kit.

**Live:** https://zorenkonte.github.io/timer/

## Features

- Workout builder: exercises with sets, reps *or* timed work, optional weight, and per-exercise rest.
- Guided runner: get-ready countdown, rep sets you tick off with **Set done**, timed sets that run themselves,
  rest countdown ring, pause / ±15 s / skip / end controls, "next up" preview.
- Beeps for the last 3 seconds and phase changes, vibration on supported phones, screen stays awake while running.
- History of finished (or ended-early) sessions, dark/light theme, 11 accent colors.
- Everything is stored in the browser (`localStorage`); no account, no backend.

## Development

```bash
npm install
npm run dev        # http://localhost:5173/timer/
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/ locally
```

## Deployment

Pushes to the default branch run `.github/workflows/deploy.yml`, which builds the app and publishes `dist/`
to GitHub Pages. Vite's `base` is `/timer/` to match the project-pages URL.
