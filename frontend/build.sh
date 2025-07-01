#!/bin/bash
echo "Starting frontend build process..."
npm install
echo "Dependencies installed, building frontend..."
npm run build
echo "Build completed!"
ls -la dist

# Create a build directory symlink to dist for compatibility
echo "Creating build directory symlink to dist for compatibility..."
ln -sf dist build
ls -la

echo "Frontend build process completed!"
