import { BrowserRouter as Router } from 'react-router-dom'
import BookingWizard from './components/BookingWizard'
import Layout from './components/Layout'

function App() {
  return (
    <Router>
      <Layout>
        <BookingWizard />
      </Layout>
    </Router>
  )
}

export default App
