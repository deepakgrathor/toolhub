# OG Image PNG Conversion Pending

og-default.svg exists in apps/web/public/og-default.svg

To convert to PNG (required for full social preview support):

Option 1 — Install sharp and run:
  npm install sharp
  node -e "
    const sharp = require('sharp');
    const fs = require('fs');
    sharp(fs.readFileSync('apps/web/public/og-default.svg'))
      .resize(1200, 630).png()
      .toFile('apps/web/public/og-default.png', console.log);
  "

Option 2 — Online converter:
  Upload og-default.svg to https://svgtopng.com (1200x630)
  Save output as apps/web/public/og-default.png

Until og-default.png exists, social previews will fall back to no image.
Twitter/X, WhatsApp, LinkedIn require a PNG/JPG — SVG is not supported.
