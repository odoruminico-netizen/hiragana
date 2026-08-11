Hiraganada ver0.2
=================

GitHub fresh upload package.

UPLOAD TO GITHUB ROOT:
- index.html
- app.js
- icon-180.png
- README.txt
- CHANGELOG.txt
- DEPLOY.txt

Cloudflare Build command:
rm -rf dist && mkdir dist && cp index.html app.js icon-180.png dist/

Cloudflare Deploy command:
npx wrangler deploy --assets ./dist --compatibility-date 2026-08-11

Root directory:
/

IMPORTANT:
GitHub repository root must contain index.html directly.
Do not rename index.html or app.js.
