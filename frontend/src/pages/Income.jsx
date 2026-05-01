// Página para añadir ingresos
import { useState } from 'react';
import { supabase } from '../config/supabase';
import api from '../config/api';

export default function Income({ session }) {
    const [form, setForm] = useState({
        date: '',
        concept: '',
        base_amount: '',
        irpf_rate: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await api.post('/income', {
                user_id: session.user.id,
                date: form.date,
                concept: form.concept,
                base_amount: Number(form.base_amount),
                irpf_rate: Number(form.irpf_rate),
                client: 'Cliente EEUU',
            });

            setSuccess(true);
            setForm({ date: '', concept: '', base_amount: '', irpf_rate: 0 });
        } catch (error) {
            setError(error.response?.data?.error || 'Error al guardar el ingreso');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button style={styles.backBtn} onClick={() => window.location.href = '/'}>
                    ← Volver
                </button>
                <h1 style={styles.title}>Añadir ingreso</h1>
            </div>

            <div style={styles.card}>
                {/* Cliente fijo — siempre EEUU, sin IVA */}
                <div style={styles.infoBox}>
                    📌 Cliente: EEUU — IVA 0% (operación no sujeta)
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>Fecha *</label>
                    <input
                        style={styles.input}
                        type="date"
                        name="date"
                        value={form.date}
                        onChange={handleChange}
                    />
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>Concepto *</label>
                    <input
                        style={styles.input}
                        type="text"
                        name="concept"
                        placeholder="Ej: Servicios contables abril"
                        value={form.concept}
                        onChange={handleChange}
                    />
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>Base imponible (€) *</label>
                    <input
                        style={styles.input}
                        type="number"
                        name="base_amount"
                        placeholder="0.00"
                        value={form.base_amount}
                        onChange={handleChange}
                    />
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>Retención IRPF (%)</label>
                    <input
                        style={styles.input}
                        type="number"
                        name="irpf_rate"
                        placeholder="0"
                        value={form.irpf_rate}
                        onChange={handleChange}
                    />
                    <p style={styles.hint}>Déjalo en 0 si el cliente no aplica retención</p>
                </div>

                {/* Resumen calculado */}
                {form.base_amount && (
                    <div style={styles.summary}>
                        <div style={styles.summaryRow}>
                            <span>Base imponible</span>
                            <span>{Number(form.base_amount).toFixed(2)} €</span>
                        </div>
                        <div style={styles.summaryRow}>
                            <span>IVA (0% — cliente EEUU)</span>
                            <span>0.00 €</span>
                        </div>
                        <div style={styles.summaryRow}>
                            <span>Retención IRPF ({form.irpf_rate}%)</span>
                            <span>-{(Number(form.base_amount) * Number(form.irpf_rate) / 100).toFixed(2)} €</span>
                        </div>
                        <div style={{ ...styles.summaryRow, fontWeight: 700 }}>
                            <span>Total a cobrar</span>
                            <span>{(Number(form.base_amount) - (Number(form.base_amount) * Number(form.irpf_rate) / 100)).toFixed(2)} €</span>
                        </div>
                    </div>
                )}

                {error && <p style={styles.error}>{error}</p>}
                {success && <p style={styles.success}>✅ Ingreso guardado correctamente</p>}

                <button
                    style={styles.button}
                    onClick={handleSubmit}
                    disabled={loading || !form.date || !form.concept || !form.base_amount}
                >
                    {loading ? 'Guardando...' : 'Guardar ingreso'}
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: { maxWidth: 500, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' },
    header: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 },
    backBtn: { background: 'none', border: '1px solid #ddd', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' },
    title: { margin: 0, fontSize: 22 },
    card: { backgroundColor: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    infoBox: { backgroundColor: '#eff6ff', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 14, color: '#1d4ed8' },
    field: { marginBottom: 16 },
    label: { display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 },
    input: { width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' },
    hint: { margin: '4px 0 0', fontSize: 12, color: '#999' },
    summary: { backgroundColor: '#f9fafb', padding: 16, borderRadius: 8, marginBottom: 16 },
    summaryRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 },
    error: { color: '#dc2626', fontSize: 14 },
    success: { color: '#16a34a', fontSize: 14 },
    button: { width: '100%', padding: 14, backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer', marginTop: 8 },
};