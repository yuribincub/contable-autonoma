// Página de login con Supabase Auth
import { useState } from 'react';
import { supabase } from '../config/supabase';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isRegister, setIsRegister] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            if (isRegister) {
                // Registro de nuevo usuario
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                alert('Revisa tu email para confirmar el registro');
            } else {
                // Login de usuario existente
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">📊 Contable</h1>
                <p className="login-subtitle">Gestión fiscal para autónomos</p>

                <div className="login-form">
                    <input
                        className="form-input"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                    <input
                        className="form-input"
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />

                    {error && <p className="form-error">{error}</p>}

                    <button
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Cargando...' : isRegister ? 'Registrarse' : 'Entrar'}
                    </button>

                    <button
                        className="btn btn-ghost"
                        onClick={() => setIsRegister(!isRegister)}
                    >
                        {isRegister ? '¿Ya tienes cuenta? Entra aquí' : '¿No tienes cuenta? Regístrate'}
                    </button>
                </div>
            </div>
        </div>
    );
}