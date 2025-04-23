const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

console.log('Starting build process...');

// Read the CSS file
const cssContent = fs.readFileSync(path.join(__dirname, 'js/v3/modules/styles.css'), 'utf8');

// Create a temporary JS file that exports the CSS
const tempJsContent = `
// Generated CSS module
const styles = \`${cssContent}\`;
export default styles;
`;

const tempJsPath = path.join(__dirname, 'js/v3/modules/styles-generated.js');
fs.writeFileSync(tempJsPath, tempJsContent);

// Build minified version
esbuild.build({
  entryPoints: [path.join(__dirname, 'js/v3/ygo-embed-v3-modular.js')],
  bundle: true,
  minify: true,
  sourcemap: true,
  format: 'iife',
  outfile: path.join(__dirname, 'dist/ygo-embed-v3-bundled.min.js'),
}).then(() => {
  console.log('✅ Minified build completed successfully!');
  
  // Build non-minified version
  return esbuild.build({
    entryPoints: [path.join(__dirname, 'js/v3/ygo-embed-v3-modular.js')],
    bundle: true,
    minify: false,
    sourcemap: true,
    format: 'iife',
    outfile: path.join(__dirname, 'dist/ygo-embed-v3-bundled.js'),
  });
}).then(() => {
  console.log('✅ Non-minified build completed successfully!');
  
  try {
    // Get file sizes
    const minSize = fs.statSync(path.join(__dirname, 'dist/ygo-embed-v3-bundled.min.js')).size;
    const fullSize = fs.statSync(path.join(__dirname, 'dist/ygo-embed-v3-bundled.js')).size;
    
    console.log(`📊 File sizes:
    - Minified: ${(minSize / 1024).toFixed(2)} KB
    - Non-minified: ${(fullSize / 1024).toFixed(2)} KB`);

    // Clean up temporary file
    fs.unlinkSync(tempJsPath);
  } catch (error) {
    console.error('Error getting file sizes:', error);
  }
  
}).catch((err) => {
  console.error('❌ Build failed:', err);
  // Clean up temporary file even if build fails
  if (fs.existsSync(tempJsPath)) {
    fs.unlinkSync(tempJsPath);
  }
  process.exit(1);
}); 