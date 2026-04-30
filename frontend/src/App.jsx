// frontend/src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import NewDeposit from './pages/NewDeposit';
import NewWithdrawal from './pages/NewWithdrawal';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index                    element={<Dashboard />} />
          <Route path="customers"         element={<Customers />} />
          <Route path="customers/:id"     element={<CustomerDetail />} />
          <Route path="deposits/new"      element={<NewDeposit />} />
          <Route path="withdrawals/new"   element={<NewWithdrawal />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}