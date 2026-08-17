# The Bank

An interview question bank that refuses duplicates, maps your blind spots by angle,
and drills you out loud on a spacing schedule.

**Live:** https://chaithugowda.github.io/question-bank/

## What it does

- **No duplicate questions.** A live collision gauge scores every keystroke against
  the whole bank (blended trigram + token similarity, with interview filler stripped),
  so "What is the event loop?" and "Explain how the event loop works" collide.
  Over 82% is blocked; you can keep it as a linked variant instead.
- **No duplicate concepts.** Typing "Javascript" when "JavaScript" exists prompts a
  merge, and stores your spelling as an alias so it resolves silently next time.
- **Six angles per concept.** Definition, Trade-offs, Failure mode, Hands-on story,
  Debugging, Scale. Coverage renders a concept x angle grid, weakest first.
- **Spoken spaced repetition.** Six boxes at 0/1/3/8/21/55 days. You answer out loud
  on a 90-second timer before the answer notes appear.

## Stack

One file. React 18 + Babel from CDN, no build step, no dependencies to install.
Data lives in `localStorage` under the key `qbank:v1` — per browser, per device,
never sent anywhere.

## Run locally

Open `index.html` in a browser, or:

    python3 -m http.server 8000

## Deploy

Any static host. For GitHub Pages, see the steps in the chat, or:
Settings -> Pages -> Source: `main` branch, `/ (root)`.
