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
echo "Environment information:"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "MONGODB_URI exists: $(if [ -n "$MONGODB_URI" ]; then echo "yes"; else echo "no"; fi)"
echo "CORS_ORIGIN: $CORS_ORIGIN"
