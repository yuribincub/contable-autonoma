/**
 * App.jsx — punto de entrada
 * Gestiona autenticación con Supabase y navegación con react-router-dom.
 *
 * Instalación previa (solo una vez):
 *   npm install react-router-dom
 */

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './config/supabase';

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import IncomeForm from './pages/IncomeForm';
import ExpenseForm from './pages/ExpenseForm';
import Movements from './pages/Movements';
import InvoiceView from './pages/InvoiceView';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Escuchar cambios de sesión (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="loading">Cargando...</div>;

  // Si no hay sesión, solo mostrar Login (sin rutas)
  if (!session) return <Login />;

  return (
    <BrowserRouter>
      <Routes>
        {/* Dashboard principal */}
        <Route path="/" element={<Dashboard session={session} />} />
        <Route path="/dashboard" element={<Dashboard session={session} />} />

        {/* Ingresos y gastos */}
        <Route path="/income" element={<IncomeForm session={session} />} />
        <Route path="/expenses" element={<ExpenseForm session={session} />} />
        <Route path="/invoice/:id" element={<InvoiceView session={session} />} />


        <Route path="/movements" element={<Movements session={session} />} />
        <Route path="/perfil" element={<Profile session={session} />} />  {/* ← añadir */}


        {/* Rutas futuras — descomenta cuando estén listas */}
        {/* <Route path="/clients"   element={<Clients   session={session} />} /> */}
        {/* <Route path="/suppliers" element={<Suppliers session={session} />} /> */}
        {/* <Route path="/taxes"     element={<Taxes     session={session} />} /> */}

        {/* Cualquier ruta desconocida → página 404 */}
        <Route path="*" element={<NotFound session={session} />} />
      </Routes>
    </BrowserRouter>
  );
}
