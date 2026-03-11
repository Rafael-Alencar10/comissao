const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../shared/assets');
const destDir = path.resolve(__dirname, '../server/public');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.readdirSync(srcDir).forEach(file => {
  const srcFile = path.join(srcDir, file);
  const destFile = path.join(destDir, file);
  fs.copyFileSync(srcFile, destFile);
  console.log(`[copy-shared-assets] Copiado: ${srcFile} -> ${destFile}`);
});
