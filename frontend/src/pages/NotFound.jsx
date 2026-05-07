import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { AlertTriangle, Home } from 'lucide-react';

export default function NotFound({ session }) {
    const navigate = useNavigate();

    return (
        <AppLayout session={session} currentPage="notfound">
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'calc(100vh - var(--topbar-height) - var(--space-8))',
                padding: 'var(--space-8)',
                textAlign: 'center',
            }}>
                {/* Icono grande */}
                <div style={{
                    marginBottom: 'var(--space-6)',
                    animation: 'pulse 2s infinite',
                }}>
                    <AlertTriangle
                        size={80}
                        style={{ color: 'var(--color-error-500)' }}
                        strokeWidth={1.5}
                    />
                </div>

                {/* Código 404 */}
                <div style={{
                    fontSize: '120px',
                    fontWeight: 'var(--font-bold)',
                    color: 'var(--color-brand-500)',
                    lineHeight: 1,
                    marginBottom: 'var(--space-4)',
                }}>
                    404
                </div>

                {/* Títulos */}
                <h1 style={{
                    fontSize: '32px',
                    fontWeight: 'var(--font-bold)',
                    color: 'var(--text-primary)',
                    margin: 0,
                    marginBottom: 'var(--space-2)',
                }}>
                    Página no encontrada
                </h1>

                <p style={{
                    fontSize: 'var(--text-lg)',
                    color: 'var(--text-secondary)',
                    margin: 0,
                    marginBottom: 'var(--space-6)',
                    maxWidth: 500,
                }}>
                    La página que buscas no existe o ha sido movida. Comprueba la URL e intenta de nuevo.
                </p>

                {/* Descripción */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-6)',
                    marginBottom: 'var(--space-8)',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    maxWidth: 600,
                }}>
                    <div style={{
                        padding: 'var(--space-4)',
                        background: 'var(--bg-surface-alt)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                    }}>
                        <p style={{
                            fontSize: 'var(--text-sm)',
                            color: 'var(--text-secondary)',
                            margin: 0,
                        }}>
                            <strong>Error:</strong> Ruta inválida
                        </p>
                    </div>
                    <div style={{
                        padding: 'var(--space-4)',
                        background: 'var(--bg-surface-alt)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                    }}>
                        <p style={{
                            fontSize: 'var(--text-sm)',
                            color: 'var(--text-secondary)',
                            margin: 0,
                        }}>
                            <strong>Código:</strong> HTTP 404
                        </p>
                    </div>
                </div>

                {/* Botones de acción */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-4)',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                            padding: 'var(--space-3) var(--space-6)',
                            background: 'var(--bg-brand)',
                            color: 'var(--text-on-brand)',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--text-base)',
                            fontWeight: 'var(--font-semibold)',
                            cursor: 'pointer',
                            transition: 'all var(--transition-smooth)',
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'var(--color-brand-600)';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'var(--bg-brand)';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        <Home size={18} />
                        Volver al Dashboard
                    </button>

                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            padding: 'var(--space-3) var(--space-6)',
                            background: 'transparent',
                            color: 'var(--color-brand-500)',
                            border: '2px solid var(--color-brand-500)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--text-base)',
                            fontWeight: 'var(--font-semibold)',
                            cursor: 'pointer',
                            transition: 'all var(--transition-smooth)',
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'var(--color-brand-50)';
                            e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        ← Atrás
                    </button>
                </div>

                {/* Elemento decorativo */}
                <div style={{
                    marginTop: 'var(--space-8)',
                    opacity: 0.5,
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-secondary)',
                }}>
                    <p>Si crees que esto es un error, contacta con soporte.</p>
                </div>
            </div>

            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
        </AppLayout>
    );
}
