# DrwnStat

Make football-style (FUT-like) stat cards for players in any game.

- **5 stats** with editable names and values from 1 to 99. Presets for Football, Shooter, MOBA, Battle royale, Racing and Fighting, or name the stats yourself
- **Custom picture**: upload any image, drag it on the card to move it, and scroll or use the slider to zoom
- **Overall rating**: the average of the stats by default, or set it yourself
- **8 card styles**: Gold, Silver, Bronze, Icon, Inferno, Ice, Toxic, Midnight
- **Download PNG**: exports at 800×1120
- **Collection**: saves cards in your browser's localStorage so you can reopen and edit them later

## Run it

It's a static site with no build step. Open `index.html`, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

To host it for free, enable **GitHub Pages** for this repo (Settings → Pages → deploy from branch, root folder).

## Files

- `index.html` — page layout and editor form
- `style.css` — site styling
- `app.js` — card rendering (canvas), editor logic, export and collection
