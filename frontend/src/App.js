// Punto de entrada de la app — gestiona autenticación
import { useState, useEffect } from 'react';
import { supabase } from './config/supabase';
import Login from './pages/Login';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Comprobar si hay sesión activa
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Escuchar cambios de sesión (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div style={{ padding: 40 }}>Cargando...</div>;

  // Si no hay sesión mostrar login, si hay sesión mostrar app
  return session ? <div>Bienvenida 👋 (dashboard próximamente)</div> : <Login />;
}

export default App;