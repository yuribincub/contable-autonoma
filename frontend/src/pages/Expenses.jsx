// Página para añadir gastos
import { useState } from 'react';
import api from '../config/api';

// Categorías y sus porcentajes deducibles por defecto
const CATEGORIES = [
    { value: 'software', label: 'Software', deductible: 100 },
    { value: 'internet', label: 'Internet', deductible: 100 },
    { value: 'suministros', label: 'Suministros (luz)', deductible: 30 },
    { value: 'vivienda', label: 'Vivienda', deductible: 30 },
    { value: 'otros', label: 'Otros', deductible: 100 },
];

export default function Expenses({ session }) {
    const [form, setForm] = useState({
        date: '',
        provider: '',
        concept: '',
        category: 'software',
        base_amount: '',
        vat_rate: 21,
        deductible_percentage: 100,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Al cambiar categoría, actualizar porcentaje deducible automáticamente
        if (name === 'category') {
            const cat = CATEGORIES.find(c => c.value === value);
            setForm({ ...form, category: value, deductible_percentage: cat.deductible });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await api.post('/expenses', {
                user_id: session.user.id,
                date: form.date,
                provider: form.provider,
                concept: form.concept,
                category: form.category,
                base_amount: Number(form.base_amount),
                vat_rate: Number(form.vat_rate),
                deductible_percentage: Number(form.deductible_percentage),
            });

            setSuccess(true);
            setForm({ date: '', provider: '', concept: '', category: 'software', base_amount: '', vat_rate: 21, deductible_percentage: 100 });
        } catch (error) {
            setError(error.response?.data?.error || 'Error al guardar el gasto');
        } finally {
            setLoading(false);
        }
    };

    // Cálculos en tiempo real
    const baseAmount = Number(form.base_amount) || 0;
    const vatAmount = (baseAmount * Number(form.vat_rate)) / 100;
    const totalAmount = baseAmount + vatAmount;
    const deductibleAmount = (totalAmount * Number(form.deductible_percentage)) / 100;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button style={styles.backBtn} onClick={() => window.location.href = '/'}>
                    ← Volver
                </button>
                <h1 style={styles.title}>Añadir gasto</h1>
            </div>

            <div style={styles.card}>
                <div style={styles.field}>
                    <label style={styles.label}>Fecha *</label>
                    <input style={styles.input} type="date" name="date" value={form.date} onChange={handleChange} />
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>Proveedor *</label>
                    <input style={styles.input} type="text" name="provider" placeholder="Ej: Endesa, Movistar..." value={form.provider} onChange={handleChange} />
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>Concepto *</label>
                    <input style={styles.input} type="text" name="concept" placeholder="Ej: Factura luz enero" value={form.concept} onChange={handleChange} />
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>Categoría *</label>
                    <select style={styles.input} name="category" value={form.category} onChange={handleChange}>
                        {CATEGORIES.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>Base imponible (€) *</label>
                    <input style={styles.input} type="number" name="base_amount" placeholder="0.00" value={form.base_amount} onChange={handleChange} />
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>IVA (%)</label>
                    <select style={styles.input} name="vat_rate" value={form.vat_rate} onChange={handleChange}>
                        <option value={21}>21%</option>
                        <option value={10}>10%</option>
                        <option value={4}>4%</option>
                        <option value={0}>0%</option>
                    </select>
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>% Deducible</label>
                    <input style={styles.input} type="number" name="deductible_percentage" min="0" max="100" value={form.deductible_percentage} onChange={handleChange} />
                    <p style={styles.hint}>Se ajusta automáticamente según la categoría</p>
                </div>

                {/* Resumen calculado */}
                {form.base_amount && (
                    <div style={styles.summary}>
                        <div style={styles.summaryRow}>
                            <span>Base imponible</span>
                            <span>{baseAmount.toFixed(2)} €</span>
                        </div>
                        <div style={styles.summaryRow}>
                            <span>IVA ({form.vat_rate}%)</span>
                            <span>{vatAmount.toFixed(2)} €</span>
                        </div>
                        <div style={styles.summaryRow}>
                            <span>Total factura</span>
                            <span>{totalAmount.toFixed(2)} €</span>
                        </div>
                        <div style={{ ...styles.summaryRow, fontWeight: 700, color: '#16a34a' }}>
                            <span>Importe deducible ({form.deductible_percentage}%)</span>
                            <span>{deductibleAmount.toFixed(2)} €</span>
                        </div>
                        <div style={{ ...styles.summaryRow, color: '#999' }}>
                            <span>No deducible</span>
                            <span>{(totalAmount - deductibleAmount).toFixed(2)} €</span>
                        </div>
                    </div>
                )}

                {error && <p style={styles.error}>{error}</p>}
                {success && <p style={styles.success}>✅ Gasto guardado correctamente</p>}

                <button
                    style={styles.button}
                    onClick={handleSubmit}
                    disabled={loading || !form.date || !form.provider || !form.concept || !form.base_amount}
                >
                    {loading ? 'Guardando...' : 'Guardar gasto'}
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
    field: { marginBottom: 16 },
    label: { display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 },
    input: { width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' },
    hint: { margin: '4px 0 0', fontSize: 12, color: '#999' },
    summary: { backgroundColor: '#f9fafb', padding: 16, borderRadius: 8, marginBottom: 16 },
    summaryRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 },
    error: { color: '#dc2626', fontSize: 14 },
    success: { color: '#16a34a', fontSize: 14 },
    button: { width: '100%', padding: 14, backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer', marginTop: 8 },
};