import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase';
import AppLayout from '../components/AppLayout';
import api from '../config/api';
import { User, CheckCircle, AlertCircle } from 'lucide-react';

const FIELDS = [
    { key: 'full_name', label: 'Nombre completo', required: false, placeholder: 'Ana García López' },
    { key: 'cif_nif', label: 'NIF / CIF', required: true, placeholder: '12345678A' },
    { key: 'address', label: 'Dirección fiscal', required: true, placeholder: 'Calle, número, piso...' },
    { key: 'postal_code', label: 'Código postal', required: true, placeholder: '07300' },
    { key: 'city', label: 'Ciudad', required: false, placeholder: 'Inca' },
    { key: 'province', label: 'Provincia', required: false, placeholder: 'Islas Baleares' },
    { key: 'iban', label: 'IBAN', required: true, placeholder: 'ES00 0000 0000 0000 0000 0000' },
]

export default function Profile({ session }) {
    const [form, setForm] = useState({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [errors, setErrors] = useState([])

    useEffect(() => {
        async function load() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                const res = await api.get(`/profile?user_id=${user.id}`);
                setForm(res.data);
            } catch (error) {
                console.error('Error loading profile:', error);
            } finally {
                setLoading(false);
            }
        }
        load()
    }, [])

    const filled = FIELDS.filter(f => form[f.key]?.trim()).length
    const pct = Math.round((filled / FIELDS.length) * 100)

    async function handleSave() {
        const missing = FIELDS.filter(f => f.required && !form[f.key]?.trim()).map(f => f.label)
        if (missing.length > 0) { setErrors(missing); return }
        setErrors([])
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            await api.put('/profile', { id: user.id, ...form })
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (error) {
            console.error('Error saving profile:', error);
            setErrors(['Error al guardar el perfil']);
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <AppLayout session={session} currentPage="profile">
                <div className="loading-state">
                    <p>Cargando perfil...</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout session={session} currentPage="profile">
            {/* ── Cabecera de página ────────────────────────────────────────── */}
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <User size={24} style={{ color: 'var(--color-brand-500)' }} />
                    <div>
                        <h2 className="page-title">Mi perfil</h2>
                        <p className="page-subtitle">Datos necesarios para emitir facturas válidas</p>
                    </div>
                </div>
            </div>

            {/* ── Tarjeta principal ─────────────────────────────────────────── */}
            <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
                {/* Barra de progreso */}
                <div style={{ marginBottom: 'var(--space-6)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)' }}>
                            Perfil completado
                        </span>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
                            {pct}%
                        </span>
                    </div>
                    <div style={{
                        width: '100%',
                        height: 8,
                        background: 'var(--bg-surface-alt)',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: pct === 100 ? 'var(--color-accent-500)' : 'var(--color-brand-500)',
                            transition: 'width var(--transition-smooth)',
                            borderRadius: 'var(--radius-sm)'
                        }} />
                    </div>
                </div>

                {/* Mensaje de éxito */}
                {saved && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        padding: 'var(--space-4)',
                        background: 'var(--bg-accent)',
                        border: '1px solid var(--border-accent)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--space-6)',
                    }}>
                        <CheckCircle size={20} style={{ color: 'var(--color-accent-600)' }} />
                        <div>
                            <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-accent-700)', margin: 0 }}>
                                Perfil guardado correctamente
                            </p>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-accent-600)', margin: 0 }}>
                                Tus datos han sido actualizados.
                            </p>
                        </div>
                    </div>
                )}

                {/* Errores de validación */}
                {errors.length > 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        padding: 'var(--space-4)',
                        background: 'var(--bg-error)',
                        border: '1px solid var(--border-error)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--space-6)',
                    }}>
                        <AlertCircle size={20} style={{ color: 'var(--color-error-500)' }} />
                        <div>
                            <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-error-700)', margin: 0 }}>
                                Faltan campos obligatorios
                            </p>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-error-600)', margin: 0 }}>
                                {errors.join(', ')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Formulario */}
                <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
                    {FIELDS.map(f => (
                        <div key={f.key}>
                            <label style={{
                                display: 'block',
                                fontSize: 'var(--text-sm)',
                                fontWeight: 'var(--font-semibold)',
                                color: 'var(--text-primary)',
                                marginBottom: 'var(--space-2)'
                            }}>
                                {f.label}
                                {f.required && <span style={{ color: 'var(--color-error-500)', marginLeft: 'var(--space-1)' }}>*</span>}
                            </label>
                            <input
                                type="text"
                                value={form[f.key] || ''}
                                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                                placeholder={f.placeholder}
                                className="form-input"
                                style={{
                                    borderColor: f.required && !form[f.key]?.trim() ? 'var(--color-warning-500)' : undefined,
                                    backgroundColor: f.required && !form[f.key]?.trim() ? 'var(--bg-warning)' : undefined,
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Botón guardar */}
                <div style={{ marginTop: 'var(--space-8)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`btn btn-primary ${saving ? 'btn-disabled' : ''}`}
                        style={{ width: '100%' }}
                    >
                        {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}