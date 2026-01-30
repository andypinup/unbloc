import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import Engineers from './pages/Engineers'
import Diary from './pages/Diary'
import Wallet from './pages/Wallet'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/engineers" element={<Engineers />} />
        <Route path="/diary" element={<Diary />} />
        <Route path="/wallet" element={<Wallet />} />
      </Routes>
    </Layout>
  )
}

export default App
