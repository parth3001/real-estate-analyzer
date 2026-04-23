#!/usr/bin/env node
/**
 * Prerender blog routes to static HTML so Google's first-pass (non-JS) crawl
 * sees per-post <title>, <meta name="description">, canonical, and OG tags.
 *
 * Runs after `vite build`. For each post in src/content/blog/*.md it writes
 * dist/blog/<slug>/index.html — a copy of dist/index.html with the head
 * rewritten. React hydrates normally because the body and script tags are
 * untouched.
 *
 * Render.com serves physical files before applying rewrite rules, so these
 * prerendered files win over the /* -> /index.html catch-all.
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(__dirname, '..');
const distDir = join(frontendRoot, 'dist');
const blogContentDir = join(frontendRoot, 'src/content/blog');
const templatePath = join(distDir, 'index.html');

const SITE_URL = 'https://reanalyzr.com';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPostHead({ title, description, slug, keywords, featuredImage, date }) {
  const fullTitle = `${title} | REanalyzr`;
  const canonical = `${SITE_URL}/blog/${slug}`;
  const ogImage = featuredImage
    ? `${SITE_URL}${featuredImage}`
    : `${SITE_URL}/og-image.png`;
  const kw = Array.isArray(keywords) ? keywords.join(', ') : '';

  return [
    `<title>${escapeHtml(fullTitle)}</title>`,
    `<meta name="title" content="${escapeHtml(fullTitle)}" />`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    kw ? `<meta name="keywords" content="${escapeHtml(kw)}" />` : '',
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:title" content="${escapeHtml(fullTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:image" content="${ogImage}" />`,
    `<meta property="og:site_name" content="REAnalyzr" />`,
    `<meta property="twitter:card" content="summary_large_image" />`,
    `<meta property="twitter:url" content="${canonical}" />`,
    `<meta property="twitter:title" content="${escapeHtml(fullTitle)}" />`,
    `<meta property="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta property="twitter:image" content="${ogImage}" />`,
    date ? `<meta property="article:published_time" content="${escapeHtml(date)}" />` : '',
  ]
    .filter(Boolean)
    .join('\n    ');
}

function buildListHead() {
  const title = 'Rental Property Investing Guides & Calculators | REanalyzr';
  const description =
    'Free guides on BRRRR, cap rate, ARV, and rental property analysis. Practical math and calculators — no signup required.';
  const canonical = `${SITE_URL}/blog`;
  const ogImage = `${SITE_URL}/og-image.png`;

  return [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="title" content="${escapeHtml(title)}" />`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:image" content="${ogImage}" />`,
    `<meta property="og:site_name" content="REAnalyzr" />`,
    `<meta property="twitter:card" content="summary_large_image" />`,
    `<meta property="twitter:url" content="${canonical}" />`,
    `<meta property="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta property="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta property="twitter:image" content="${ogImage}" />`,
  ].join('\n    ');
}

/**
 * Replace the head block between the <title> and </head> tags with the
 * post-specific head. Everything before the first <title> (charset, viewport,
 * cache-control, favicon) is preserved; everything after </head> (body +
 * script tags) is preserved. GA and JSON-LD scripts from the original head
 * are preserved by appending them after the new head block.
 */
function rewriteHead(template, newHeadBlock) {
  const titleOpenIdx = template.indexOf('<title>');
  if (titleOpenIdx === -1) {
    throw new Error('Could not find <title> in dist/index.html template');
  }
  const headCloseIdx = template.indexOf('</head>', titleOpenIdx);
  if (headCloseIdx === -1) {
    throw new Error('Could not find </head> in dist/index.html template');
  }

  const originalHead = template.slice(titleOpenIdx, headCloseIdx);

  const preservedBlocks = [];
  const scriptRegex = /<script\b[\s\S]*?<\/script>/gi;
  let scriptMatch;
  while ((scriptMatch = scriptRegex.exec(originalHead)) !== null) {
    preservedBlocks.push(scriptMatch[0]);
  }
  const verifyRegex = /<meta\s+name="google-site-verification"[^>]*>/gi;
  let verifyMatch;
  while ((verifyMatch = verifyRegex.exec(originalHead)) !== null) {
    preservedBlocks.push(verifyMatch[0]);
  }
  const robotsRegex = /<meta\s+name="(?:robots|googlebot|theme-color|author)"[^>]*>/gi;
  let robotsMatch;
  while ((robotsMatch = robotsRegex.exec(originalHead)) !== null) {
    preservedBlocks.push(robotsMatch[0]);
  }

  const newHead =
    newHeadBlock +
    (preservedBlocks.length ? '\n    ' + preservedBlocks.join('\n    ') : '');

  return template.slice(0, titleOpenIdx) + newHead + template.slice(headCloseIdx);
}

function main() {
  const template = readFileSync(templatePath, 'utf8');
  const files = readdirSync(blogContentDir).filter((f) => f.endsWith('.md'));

  if (files.length === 0) {
    console.warn('[prerender-blog] No markdown files found in', blogContentDir);
    return;
  }

  for (const file of files) {
    const raw = readFileSync(join(blogContentDir, file), 'utf8');
    const { data } = matter(raw);
    const slug = data.slug || file.replace(/\.md$/, '');

    if (!data.title || !data.description) {
      console.warn(`[prerender-blog] Skipping ${file} — missing title or description`);
      continue;
    }

    const head = buildPostHead({
      title: data.title,
      description: data.description,
      slug,
      keywords: data.keywords,
      featuredImage: data.featuredImage,
      date: data.date ? String(data.date) : '',
    });

    const html = rewriteHead(template, head);
    const outDir = join(distDir, 'blog', slug);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'index.html'), html, 'utf8');
    console.log(`[prerender-blog] wrote blog/${slug}/index.html`);
  }

  const listHtml = rewriteHead(template, buildListHead());
  mkdirSync(join(distDir, 'blog'), { recursive: true });
  writeFileSync(join(distDir, 'blog', 'index.html'), listHtml, 'utf8');
  console.log('[prerender-blog] wrote blog/index.html');
}

main();
