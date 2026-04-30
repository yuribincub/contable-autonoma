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
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>📊 Contable</h1>
                <p style={styles.subtitle}>Gestión fiscal para autónomos</p>

                <div style={styles.form}>
                    <input
                        style={styles.input}
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                    <input
                        style={styles.input}
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />

                    {error && <p style={styles.error}>{error}</p>}

                    <button
                        style={styles.button}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Cargando...' : isRegister ? 'Registrarse' : 'Entrar'}
                    </button>

                    <button
                        style={styles.linkButton}
                        onClick={() => setIsRegister(!isRegister)}
                    >
                        {isRegister ? '¿Ya tienes cuenta? Entra aquí' : '¿No tienes cuenta? Regístrate'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
    },
    card: {
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '380px',
    },
    title: {
        margin: 0,
        fontSize: '28px',
        textAlign: 'center',
        color: '#1a1a1a',
    },
    subtitle: {
        textAlign: 'center',
        color: '#666',
        marginBottom: '32px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    input: {
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        fontSize: '16px',
        outline: 'none',
    },
    button: {
        padding: '12px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: '#2563eb',
        color: 'white',
        fontSize: '16px',
        cursor: 'pointer',
        marginTop: '8px',
    },
    linkButton: {
        background: 'none',
        border: 'none',
        color: '#2563eb',
        cursor: 'pointer',
        fontSize: '14px',
        textAlign: 'center',
    },
    error: {
        color: '#dc2626',
        fontSize: '14px',
        textAlign: 'center',
    }
};