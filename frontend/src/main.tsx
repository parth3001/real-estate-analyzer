import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/appleGlobal.css'
import { setupProductionLogger } from './utils/logger'

// Silence console.log in production (errors and warnings still work)
setupProductionLogger()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)
