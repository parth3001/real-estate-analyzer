/**
 * Blog Utilities
 * Uses Vite's import.meta.glob to statically load all markdown blog posts at build time.
 * No filesystem access at runtime — works correctly in React SPA / Vite environment.
 *
 * Frontmatter is parsed with a small browser-safe parser (no gray-matter / Buffer dependency).
 *
 * To add a new blog post: drop a .md file in /src/content/blog/ with frontmatter.
 * It will automatically appear in the blog list on next build.
 */

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  description: string;
  keywords: string[];
  readingTime: string;
  featuredImage?: string;
  content: string;
}

// Vite statically imports all markdown files at build time
const postFiles = import.meta.glob('../content/blog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/**
 * Parse YAML frontmatter from a markdown string.
 * Handles strings, dates (as strings), and bracket arrays.
 * Browser-safe — no Buffer or Node.js dependencies.
 */
function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!fmMatch) {
    return { data: {}, content: raw };
  }

  const yamlBlock = fmMatch[1];
  const content = fmMatch[2];
  const data: Record<string, unknown> = {};

  for (const line of yamlBlock.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    const rawValue = line.slice(colonIdx + 1).trim();

    if (!key) continue;

    // Array: ["item1", "item2"] or [item1, item2]
    if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      const inner = rawValue.slice(1, -1);
      data[key] = inner
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''));
    } else {
      // Strip surrounding quotes if present
      data[key] = rawValue.replace(/^["']|["']$/g, '');
    }
  }

  return { data, content };
}

function parsePost(raw: string, filename: string): BlogPost {
  const { data, content } = parseFrontmatter(raw);

  // Derive slug from filename if not in frontmatter
  const slug =
    (data.slug as string) || filename.replace(/^.*\//, '').replace(/\.md$/, '');

  return {
    slug,
    title: (data.title as string) || 'Untitled',
    date: data.date ? String(data.date) : '',
    description: (data.description as string) || '',
    keywords: (data.keywords as string[]) || [],
    readingTime: (data.readingTime as string) || '',
    featuredImage: (data.featuredImage as string) || '',
    content,
  };
}

/**
 * Returns all blog posts sorted by date descending (newest first).
 */
export function getAllPosts(): BlogPost[] {
  const posts = Object.entries(postFiles).map(([filename, raw]) =>
    parsePost(raw as string, filename)
  );

  return posts.sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

/**
 * Returns a single blog post by slug, or undefined if not found.
 */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return getAllPosts().find((post) => post.slug === slug);
}
