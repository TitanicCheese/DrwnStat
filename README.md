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

## Put it online (public web address)

The workflow in `.github/workflows/pages.yml` publishes the site to GitHub Pages on every push. One-time setup:

1. **Make the repo public:** Settings → General → Danger Zone → *Change visibility*. Pages on a private repo needs a paid GitHub plan.
2. **Turn on Pages:** Settings → Pages → *Build and deployment* → Source: **GitHub Actions**.
3. **Deploy:** push any change, or go to Actions → *Deploy site to GitHub Pages* → *Run workflow*.

The site will be at **https://titaniccheese.github.io/DrwnStat/**. Every later push updates it automatically.

## Files

- `index.html` — page layout and editor form
- `style.css` — site styling
- `app.js` — card rendering (canvas), editor logic, export and collection
