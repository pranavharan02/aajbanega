const sharp = require('sharp');
const path = require('path');

const sizes = [192, 512];

function makeSvg(size) {
  const fontSize = Math.round(size * 0.48);
  const y = Math.round(size * 0.58);
  const rx = Math.round(size * 0.22);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" rx="${rx}" fill="#2D2A26"/>
    <text x="50%" y="${y}" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="${fontSize}" fill="#F5F0EA">आज</text>
  </svg>`;
}

async function generate() {
  const outDir = path.join(__dirname, '..', 'public', 'icons');
  for (const size of sizes) {
    const svg = makeSvg(size);
    await sharp(Buffer.from(svg)).png().toFile(path.join(outDir, `icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }
  const favSvg = makeSvg(32);
  await sharp(Buffer.from(favSvg)).png().toFile(path.join(__dirname, '..', 'public', 'favicon.ico'));
  console.log('Generated favicon.ico');
}

generate().catch(e => console.error(e));
