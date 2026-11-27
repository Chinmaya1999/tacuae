# Application

| Command | Does |
|---|---|
| `npm run dev` | API and site with demo features and a local demo database (`~/.tac-demo`) |
| `npm run dev:real` | same, using the database in `.env`, demo features off |
| `npm run demo` | built site on one port, for presentations |
| `npm run build` / `npm start` | production build / production server |
| `npm test` | unit and integration tests ([details](../docs/ARCHITECTURE.md#tests)) |

Settings are listed in [.env.example](.env.example). Demo accounts use the password `Demo@12345`.

## Content
All copy lives in `client/src/shared/data/content.ts` and comes from the original tacuae.com.

## To finish before launch
- Hero video: add a compressed `client/public/videos/hero.mp4`.
- Product specifications, course details and project descriptions from TAC.
- Higher-resolution photography.
- TAC approval of the privacy and terms text.
