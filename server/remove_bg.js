const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function cleanCutout() {
  const inputPath = '/Users/5sensesimac/.gemini/antigravity/brain/91a1a4a5-7903-4e2b-a39a-68300b2ece18/.user_uploaded/media_1788103118217.jpg';
  const outPublic = path.resolve(__dirname, '../client/public/zeno_inverter.png');
  const outAssets = path.resolve(__dirname, '../client/src/assets/zeno_inverter.png');
  const outServerPublic = path.resolve(__dirname, './public/zeno_inverter.png');

  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const { width, height } = metadata;

  // Let's create an exact SVG mask for the Inverter chassis & connectors
  // Inverter top-left corner is at (212, 212), width = 536, height = 500, radius = 32
  // Bottom gland connectors at y=712, height=60, width=440, x=260
  
  const svgMask = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <filter id="soft" x="-5%" y="-5%" width="110%" height="110%">
        <feGaussianBlur stdDeviation="0.8" />
      </filter>
    </defs>
    <!-- Inverter Rounded Rectangle Chassis -->
    <rect x="212" y="212" width="536" height="500" rx="36" ry="36" fill="white" filter="url(#soft)" />
    
    <!-- Connector 1 -->
    <rect x="278" y="708" width="36" height="36" rx="6" fill="white" />
    <!-- Connector 2 -->
    <rect x="330" y="708" width="34" height="34" rx="6" fill="white" />
    <!-- Center Antenna/Switch -->
    <rect x="382" y="708" width="30" height="60" rx="6" fill="white" />
    <!-- Connector 3 -->
    <rect x="428" y="708" width="34" height="36" rx="6" fill="white" />
    <!-- Connector 4 -->
    <rect x="480" y="708" width="38" height="40" rx="6" fill="white" />
    <!-- Connector 5 -->
    <rect x="532" y="708" width="34" height="38" rx="6" fill="white" />
    <!-- Connector 6 -->
    <rect x="584" y="708" width="40" height="38" rx="6" fill="white" />
    <!-- Connector 7 -->
    <rect x="654" y="708" width="40" height="38" rx="6" fill="white" />
  </svg>
  `;

  // Apply mask to input image
  const maskBuffer = Buffer.from(svgMask);

  await image
    .ensureAlpha()
    .composite([
      {
        input: maskBuffer,
        blend: 'dest-in'
      }
    ])
    .extract({
      left: 200,
      top: 200,
      width: 560,
      height: 575
    })
    .png()
    .toFile(outPublic);

  fs.copyFileSync(outPublic, outAssets);
  fs.copyFileSync(outPublic, outServerPublic);

  console.log(`✅ Perfect Inverter Cutout Generated at:`);
  console.log(` • ${outPublic}`);
}

cleanCutout().catch(console.error);
