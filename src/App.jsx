import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Stock from './pages/Stock';
import Users from './pages/Users';
import Statistics from './pages/Statistics';
import DailySales from './pages/DailySales';
import RVentas from './pages/RVentas';
import Gestion from './pages/Gestion';
import Budgets from './pages/Budgets';
import Catalogo from './pages/Catalogo';
import Promociones from './pages/Promociones';
import Asistente from './pages/Asistente';
import Calendario from './pages/Calendario';
import Afiliados from './pages/Afiliados';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155'
              }
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/catalogo" element={<Catalogo />} />

            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="pos" element={<POS />} />
              <Route path="products" element={<Products />} />
              <Route path="categories" element={<Categories />} />
              <Route path="sales" element={<Sales />} />
              <Route path="reports" element={<Reports />} />
              <Route path="stock" element={<Stock />} />
              <Route path="statistics" element={<Statistics />} />
              <Route path="statistics/day/:date" element={<DailySales />} />
              <Route path="rventas" element={<RVentas />} />
              <Route path="gestion" element={<Gestion />} />
              <Route path="presupuestos" element={<Budgets />} />
              <Route path="promociones" element={<Promociones />} />
              <Route path="asistente" element={<Asistente />} />
              <Route path="calendario" element={<Calendario />} />
              <Route path="afiliados" element={<Afiliados />} />
              
              <Route path="users" element={
                <ProtectedRoute requireAdmin={true}>
                  <Users />
                </ProtectedRoute>
              } />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
