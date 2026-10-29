# FROG FUSION 2048 🐸

A complete, local-first frog-merging puzzle made with plain HTML, CSS, and JavaScript. No build step, account, backend, API key, or paid library is required.

## Run it in VS Code

1. Download and extract `frog-fusion-2048.zip` (or open this folder if you already have it).
2. In VS Code, choose **File → Open Folder…** and select `frog-fusion-2048`.
3. Open `index.html` in a browser. Easiest option: install the free **Live Server** extension, right-click `index.html`, and choose **Open with Live Server**. You can also double-click `index.html` to open it directly.
4. Play with **arrow keys** or **WASD**. On a phone, swipe the board or tap the directional buttons.

## Controls

- Arrow keys / WASD: move all frogs
- Swipe board / directional buttons: move
- `R`: restart (asks for confirmation)
- `?` or `H`: open the help panel
- Sound is muted by default; use the Sound button to enable optional generated sound effects.

## Files

- `index.html` — semantic page structure and accessible controls
- `styles.css` — responsive visual design, tile colors, and reduced-motion support
- `game.js` — evolution data, original inline SVG frog art, game rules, controls, generated sounds, and localStorage save/load

## Notes

- Progress and best score are stored in this browser's localStorage.
- Restart clears the current board and current score, while retaining the best score and evolution discoveries. Progress is saved in this browser.
- All frog artwork is generated inline as original SVG. Google Fonts are an optional visual enhancement; system fonts are used as fallbacks if offline.
