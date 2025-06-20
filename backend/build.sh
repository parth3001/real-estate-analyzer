#!/bin/bash
echo "Starting build process..."
npm install
echo "Dependencies installed, modifying tsconfig.json..."
cp tsconfig.json tsconfig.backup.json
sed -i.bak "s/\"types\": \[\"node\"\]/\"types\": \[\]/" tsconfig.json
echo "Building TypeScript..."
npx tsc --skipLibCheck
echo "Restoring original tsconfig.json..."
mv tsconfig.backup.json tsconfig.json
echo "Build completed!"
ls -la dist
echo "Contents of dist directory shown above."
