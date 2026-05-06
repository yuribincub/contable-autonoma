/**
 * ProfileAlert.jsx
 * Alerta en el dashboard cuando faltan datos de perfil para facturación.
 */
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const REQUIRED_FIELDS = [
    { key: 'cif_nif', label: 'NIF/CIF' },
    { key: 'address', label: 'Dirección' },
    { key: 'postal_code', label: 'Código postal' },
    { key: 'iban', label: 'IBAN' },
];

export function ProfileAlert({ profile }) {
    const navigate = useNavigate();

    if (!profile) return null;

    const missing = REQUIRED_FIELDS.filter(f => !profile[f.key]?.trim());
    if (missing.length === 0) return null;

    return (
        <div className="profile-alert">
            <AlertTriangle size={16} className="profile-alert__icon" />
            <div className="profile-alert__body">
                <p className="profile-alert__title">
                    Faltan datos para emitir facturas correctamente
                </p>
                <p className="profile-alert__sub">
                    Sin estos datos tus facturas pueden no ser válidas fiscalmente.
                </p>
                <div className="profile-alert__tags">
                    {missing.map(f => (
                        <span key={f.key} className="profile-alert__tag">{f.label}</span>
                    ))}
                </div>
            </div>
            <button
                className="profile-alert__cta"
                onClick={() => navigate('/perfil')}
            >
                Completar ahora →
            </button>
        </div>
    );
}