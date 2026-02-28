import { CopilotKit } from '@copilotkit/react-core'
import '@copilotkit/react-ui/styles.css'
import './index.css'
import Dashboard from './components/Dashboard'

const COPILOT_KEY = import.meta.env.VITE_COPILOT_PUBLIC_API_KEY

export default function App() {
  return (
    <CopilotKit publicApiKey={COPILOT_KEY}>
      <Dashboard />
    </CopilotKit>
  )
}
