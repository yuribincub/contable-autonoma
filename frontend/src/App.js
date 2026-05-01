// Punto de entrada — gestiona autenticación y navegación simple
import { useState, useEffect } from 'react';
import { supabase } from './config/supabase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Expenses from './pages/Expenses';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div style={{ padding: 40 }}>Cargando...</div>;
  if (!session) return <Login />;

  // Navegación simple por URL
  const path = window.location.pathname;
  if (path === '/income') return <Income session={session} />;
  if (path === '/expenses') return <Expenses session={session} />;
  return <Dashboard session={session} />;
}

export default App;