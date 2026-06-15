import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// No StrictMode: it double-invokes effects in dev, which would mount/destroy the
// Phaser game twice. The prototype ran a single game instance; we match that.
createRoot(document.getElementById('root')!).render(<App />)
