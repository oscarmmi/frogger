Build a Frogger homage in THIS folder: C:\xampp\htdocs\frogger

A recruiter-ready browser crossing game. Playable, polished, no backend.

## Game
- Grid. Frog starts at the bottom. Cross road (cars) then river (logs). Five home slots at the top.
- Keyboard: Arrow keys / WASD hop one tile. R restart. Esc pause.
- Touch: D-pad so a 390px phone is playable.
- Hit by a car or water (not on a log) costs a life (3 lives). Riding a log moves with it. Filling all 5 homes wins the round.
- Local best in localStorage. Call it "Hop Home". Original art, no licensed names.

## UI
- Night city: asphalt road, teal river, lime frog, warm headlights. Not a default Vite page. No Vue logo.
- 390px phone and 1280px desktop.

## Tests
- Vitest (pure logic): hopping onto a car tile costs a life; standing on a log moves with the log; reaching an empty home slot scores and occupies it.
- `npm test` and `npm run build` must pass.

## GitHub
- Repo: https://github.com/oscarmmi/frogger
- Pages: https://oscarmmi.github.io/frogger/
- vite base `/frogger/`
- Commit: feat: add frogger
- gh repo edit --description "Frogger homage in Vue 3 + TypeScript, playable on GitHub Pages." --add-topic vue --add-topic typescript --add-topic game --add-topic frogger --add-topic canvas
- Stop. Print the repo URL and Pages URL.
