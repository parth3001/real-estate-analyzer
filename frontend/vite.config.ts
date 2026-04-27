import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Microsoft Clarity — injected at build time only when VITE_CLARITY_PROJECT_ID
// is set. Absent locally so dev sessions don't pollute production analytics.
// Set masking to Strict in the Clarity dashboard; marketing pages opt out via
// data-clarity-unmask. See /docs/CLARITY_SETUP.md.
function clarityPlugin(projectId: string | undefined): Plugin {
  return {
    name: 'reanalyzr-clarity-injector',
    transformIndexHtml(html) {
      if (!projectId) return html
      const snippet = `    <!-- Microsoft Clarity (only injected when VITE_CLARITY_PROJECT_ID is set) -->
    <script type="text/javascript">
      (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${projectId}");
    </script>`
      return html.replace('</head>', `${snippet}\n  </head>`)
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), clarityPlugin(env.VITE_CLARITY_PROJECT_ID)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Ensure SEO files are copied to dist (sitemap.xml, robots.txt)
    publicDir: 'public',
    server: {
      host: '0.0.0.0', // Allow network access for iPhone testing
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
      watch: {
        usePolling: true,
        interval: 1000,
      },
      hmr: {
        overlay: true,
      },
    },
  }
})
