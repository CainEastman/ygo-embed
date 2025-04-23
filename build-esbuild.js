const esbuild = require('esbuild');
const path = require('path');

// Create dist directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

console.log('Starting build process...');

// Build minified version
esbuild.build({
  entryPoints: [path.join(__dirname, 'js/v3/ygo-embed-v3-modular.js')],
  bundle: true,
  minify: true,
  sourcemap: true,
  format: 'iife', // Immediately Invoked Function Expression for browser compatibility
  outfile: path.join(__dirname, 'dist/ygo-embed-v3-bundled.min.js'),
  loader: {
    '.js': 'jsx' // Handle any JSX if needed
  }
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
    loader: {
      '.js': 'jsx'
    }
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
  } catch (error) {
    console.error('Error getting file sizes:', error);
  }
  
}).catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
}); 