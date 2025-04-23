@echo off
echo Building YGO Embed v3...

REM Create dist directory if it doesn't exist
if not exist dist mkdir dist

REM Build minified version
echo Building minified version...
npx esbuild js/v3/ygo-embed-v3-modular.js --bundle --minify --sourcemap --format=iife --outfile=dist/ygo-embed-v3.min.js

REM Build non-minified version
echo Building non-minified version...
npx esbuild js/v3/ygo-embed-v3-modular.js --bundle --sourcemap --format=iife --outfile=dist/ygo-embed-v3.js

echo Build complete! Check the dist directory for the output files.
dir dist 