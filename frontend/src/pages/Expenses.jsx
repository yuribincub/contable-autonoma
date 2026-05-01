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
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
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
        <div className="page-container">
            <div className="page-header">
                <button className="btn btn-secondary" onClick={() => window.location.href = '/'}>
                    ← Volver
                </button>
                <h1 className="page-title">Añadir gasto</h1>
            </div>

            <div className="card">
                <div className="form-group">
                    <label className="form-label">Fecha *</label>
                    <input className="form-input" type="date" name="date" value={form.date} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label className="form-label">Proveedor *</label>
                    <input className="form-input" type="text" name="provider" placeholder="Ej: Endesa, Movistar..." value={form.provider} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label className="form-label">Concepto *</label>
                    <input className="form-input" type="text" name="concept" placeholder="Ej: Factura luz enero" value={form.concept} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label className="form-label">Categoría *</label>
                    <select className="form-select" name="category" value={form.category} onChange={handleChange}>
                        {CATEGORIES.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Base imponible (€) *</label>
                    <input className="form-input" type="number" name="base_amount" placeholder="0.00" value={form.base_amount} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label className="form-label">IVA (%)</label>
                    <select className="form-select" name="vat_rate" value={form.vat_rate} onChange={handleChange}>
                        <option value={21}>21%</option>
                        <option value={10}>10%</option>
                        <option value={4}>4%</option>
                        <option value={0}>0%</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">% Deducible</label>
                    <input className="form-input" type="number" name="deductible_percentage" min="0" max="100" value={form.deductible_percentage} onChange={handleChange} />
                    <p className="form-hint">Se ajusta automáticamente según la categoría</p>
                </div>

                {/* Resumen calculado */}
                {form.base_amount && (
                    <div className="summary-card">
                        <div className="summary-row">
                            <span>Base imponible</span>
                            <span>{baseAmount.toFixed(2)} €</span>
                        </div>
                        <div className="summary-row">
                            <span>IVA ({form.vat_rate}%)</span>
                            <span>{vatAmount.toFixed(2)} €</span>
                        </div>
                        <div className="summary-row">
                            <span>Total factura</span>
                            <span>{totalAmount.toFixed(2)} €</span>
                        </div>
                        <div className="summary-row summary-row-deductible">
                            <span>Importe deducible ({form.deductible_percentage}%)</span>
                            <span>{deductibleAmount.toFixed(2)} €</span>
                        </div>
                        <div className="summary-row summary-row-nondeductible">
                            <span>No deducible</span>
                            <span>{(totalAmount - deductibleAmount).toFixed(2)} €</span>
                        </div>
                    </div>
                )}

                {error && <p className="form-error">{error}</p>}
                {success && <p className="alert alert-success">✅ Gasto guardado correctamente</p>}

                <button
                    className="btn btn-success"
                    onClick={handleSubmit}
                    disabled={loading || !form.date || !form.provider || !form.concept || !form.base_amount}
                >
                    {loading ? 'Guardando...' : 'Guardar gasto'}
                </button>
            </div>
        </div>
    );
}