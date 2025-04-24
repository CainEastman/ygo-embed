const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

console.log('Starting build process for v3.13...');

// Read the CSS file
const cssContent = fs.readFileSync(path.join(__dirname, 'js/v3/modules/styles.css'), 'utf8');

// Create a temporary JS file that exports the CSS
const tempJsContent = `
// Generated CSS module
export const styles = \`${cssContent}\`;
`;

const tempJsPath = path.join(__dirname, 'js/v3/modules/styles-generated.js');
fs.writeFileSync(tempJsPath, tempJsContent);

// Common build options
const commonOptions = {
  entryPoints: [path.join(__dirname, 'js/v3/ygo-embed-v3-modular.js')],
  bundle: true,
  sourcemap: true,
  target: ['es2018'], // Ensure broader browser compatibility
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  metafile: true, // Generate metadata for bundle analysis
};

// Build ESM version (for module imports)
esbuild.build({
  ...commonOptions,
  format: 'esm',
  minify: true,
  outfile: path.join(__dirname, 'dist/ygo-embed-v3.13.esm.min.js'),
}).then((result) => {
  console.log('✅ ESM minified build completed successfully!');
  return esbuild.build({
    ...commonOptions,
    format: 'esm',
    minify: false,
    outfile: path.join(__dirname, 'dist/ygo-embed-v3.13.esm.js'),
  });
}).then(() => {
  console.log('✅ ESM non-minified build completed successfully!');
  
  // Build IIFE version (for direct script tags)
  return esbuild.build({
    ...commonOptions,
    format: 'iife',
    minify: true,
    globalName: 'YGOEmbed', // Make YGOEmbed available globally
    outfile: path.join(__dirname, 'dist/ygo-embed-v3.13.min.js'),
  });
}).then(() => {
  console.log('✅ IIFE minified build completed successfully!');
  
  return esbuild.build({
    ...commonOptions,
    format: 'iife',
    minify: false,
    globalName: 'YGOEmbed',
    outfile: path.join(__dirname, 'dist/ygo-embed-v3.13.js'),
  });
}).then(() => {
  console.log('✅ IIFE non-minified build completed successfully!');
  
  try {
    // Get file sizes
    const esmMinSize = fs.statSync(path.join(__dirname, 'dist/ygo-embed-v3.13.esm.min.js')).size;
    const esmFullSize = fs.statSync(path.join(__dirname, 'dist/ygo-embed-v3.13.esm.js')).size;
    const iifeMinSize = fs.statSync(path.join(__dirname, 'dist/ygo-embed-v3.13.min.js')).size;
    const iifeFullSize = fs.statSync(path.join(__dirname, 'dist/ygo-embed-v3.13.js')).size;
    
    console.log(`📊 File sizes:
    - ESM Minified: ${(esmMinSize / 1024).toFixed(2)} KB
    - ESM Non-minified: ${(esmFullSize / 1024).toFixed(2)} KB
    - IIFE Minified: ${(iifeMinSize / 1024).toFixed(2)} KB
    - IIFE Non-minified: ${(iifeFullSize / 1024).toFixed(2)} KB`);

    // Clean up temporary file
    fs.unlinkSync(tempJsPath);
    
    console.log(`\n📦 Generated files:
    - dist/ygo-embed-v3.13.esm.min.js
    - dist/ygo-embed-v3.13.esm.js
    - dist/ygo-embed-v3.13.min.js
    - dist/ygo-embed-v3.13.js`);
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