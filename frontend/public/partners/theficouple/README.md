# The FI Couple Partner Assets

## Required Assets

### Hero Images

**Desktop Hero (`hero-desktop.jpg`)**
- Dimensions: 1920×1080px (landscape)
- Format: JPEG or WebP
- File Size: <200KB
- Content: Josh's photo + property/investment background

**Mobile Hero (`hero-mobile.jpg`)**
- Dimensions: 1080×1920px (portrait)
- Format: JPEG or WebP
- File Size: <150KB
- Content: Vertical crop of desktop image (Josh's face centered)

### Logo/Avatar

**Partner Logo (`logo.png`)**
- Dimensions: 512×512px
- Format: PNG with transparency
- File Size: <50KB
- Usage: Badge icon, social sharing

## Temporary Placeholders

Until Josh provides actual images, the landing page uses:
- CSS gradient background with brand color
- Fallback text-based hero section

## Adding Images

1. Get images from Josh Lupo
2. Optimize for web (use ImageOptim or TinyPNG)
3. Place in this directory with exact filenames above
4. Test on both desktop and mobile
5. Commit and deploy

## Image Optimization Tips

```bash
# Convert to WebP (better compression)
cwebp hero-desktop.jpg -q 80 -o hero-desktop.webp

# Resize for mobile
convert hero-desktop.jpg -resize 1080x1920^ -gravity center -extent 1080x1920 hero-mobile.jpg
```
