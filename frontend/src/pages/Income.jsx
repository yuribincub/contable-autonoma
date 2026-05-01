// Página para añadir ingresos
import { useState } from 'react';
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
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
            setForm({ date: '', concept: '', base_amount: '', irpf_rate: 0 });
        } catch (error) {
            setError(error.response?.data?.error || 'Error al guardar el ingreso');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <button className="btn btn-secondary" onClick={() => window.location.href = '/'}>
                    ← Volver
                </button>
                <h1 className="page-title">Añadir ingreso</h1>
            </div>

            <div className="card">
                {/* Cliente fijo — siempre EEUU, sin IVA */}
                <div className="alert alert-info">
                    📌 Cliente: EEUU — IVA 0% (operación no sujeta)
                </div>

                <div className="form-group">
                    <label className="form-label">Fecha *</label>
                    <input
                        className="form-input"
                        type="date"
                        name="date"
                        value={form.date}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Concepto *</label>
                    <input
                        className="form-input"
                        type="text"
                        name="concept"
                        placeholder="Ej: Servicios contables abril"
                        value={form.concept}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Base imponible (€) *</label>
                    <input
                        className="form-input"
                        type="number"
                        name="base_amount"
                        placeholder="0.00"
                        value={form.base_amount}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Retención IRPF (%)</label>
                    <input
                        className="form-input"
                        type="number"
                        name="irpf_rate"
                        placeholder="0"
                        value={form.irpf_rate}
                        onChange={handleChange}
                    />
                    <p className="form-hint">Déjalo en 0 si el cliente no aplica retención</p>
                </div>

                {/* Resumen calculado */}
                {form.base_amount && (
                    <div className="summary-card">
                        <div className="summary-row">
                            <span>Base imponible</span>
                            <span>{Number(form.base_amount).toFixed(2)} €</span>
                        </div>
                        <div className="summary-row">
                            <span>IVA (0% — cliente EEUU)</span>
                            <span>0.00 €</span>
                        </div>
                        <div className="summary-row">
                            <span>Retención IRPF ({form.irpf_rate}%)</span>
                            <span>-{(Number(form.base_amount) * Number(form.irpf_rate) / 100).toFixed(2)} €</span>
                        </div>
                        <div className="summary-row summary-row-total">
                            <span>Total a cobrar</span>
                            <span>{(Number(form.base_amount) - (Number(form.base_amount) * Number(form.irpf_rate) / 100)).toFixed(2)} €</span>
                        </div>
                    </div>
                )}

                {error && <p className="form-error">{error}</p>}
                {success && <p className="alert alert-success">✅ Ingreso guardado correctamente</p>}

                <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={loading || !form.date || !form.concept || !form.base_amount}
                >
                    {loading ? 'Guardando...' : 'Guardar ingreso'}
                </button>
            </div>
        </div>
    );
}