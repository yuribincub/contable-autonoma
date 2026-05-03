// Página para añadir gastos con OCR de facturas
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
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrStep, setOcrStep] = useState('');
    const [ocrDone, setOcrDone] = useState(false);
    const [ocrWarning, setOcrWarning] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'category') {
            const cat = CATEGORIES.find(c => c.value === value);
            setForm({ ...form, category: value, deductible_percentage: cat.deductible });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    // Procesar factura con OCR
    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setOcrLoading(true);
        setOcrDone(false);
        setOcrWarning(null);
        setOcrStep('📂 Leyendo factura...');
        setError(null);

        try {
            await new Promise(r => setTimeout(r, 800));
            setOcrStep('🔍 Analizando documento...');

            const formData = new FormData();
            formData.append('file', selectedFile);

            const { data } = await api.post('/ocr/extract-expense', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            await new Promise(r => setTimeout(r, 600));
            setOcrStep('📋 Extrayendo datos de la factura...');
            await new Promise(r => setTimeout(r, 600));

            // Rellenar formulario con datos extraídos
            setForm(prev => ({
                ...prev,
                date: data.date || prev.date,
                provider: data.provider || prev.provider,
                base_amount: data.base_amount || prev.base_amount,
                vat_rate: data.vat_rate || prev.vat_rate,
            }));

            const missing = [];
            if (!data.date) missing.push('fecha');
            if (!data.provider) missing.push('proveedor');
            if (!data.base_amount) missing.push('base imponible');

            if (missing.length > 0) {
                setOcrWarning(`No se pudo extraer: ${missing.join(', ')}. Completa manualmente.`);
            } else {
                setOcrDone(true);
            }

        } catch (error) {
            console.error('Error OCR:', error.response?.data || error.message);
            setOcrWarning('Error leyendo la factura. Rellena los datos manualmente.');
        } finally {
            setOcrLoading(false);
            setOcrStep('');
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            let uploadedFileUrl = null;

            // Si hay archivo, subirlo a Supabase Storage
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('user_id', session.user.id);

                const { data } = await api.post('/ocr/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                uploadedFileUrl = data.file_url;
            }

            await api.post('/expenses', {
                user_id: session.user.id,
                date: form.date,
                provider: form.provider,
                concept: form.concept,
                category: form.category,
                base_amount: Number(form.base_amount),
                vat_rate: Number(form.vat_rate),
                deductible_percentage: Number(form.deductible_percentage),
                file_url: uploadedFileUrl,
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

                {/* Subida de factura con OCR */}
                <div className="form-group">
                    <label className="form-label">Factura del gasto</label>
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,application/pdf"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        id="file-upload-expense"
                    />
                    <label htmlFor="file-upload-expense" className="btn btn-secondary btn-upload">
                        📎 Subir factura (JPG, PNG, PDF)
                    </label>

                    {/* Estado del proceso OCR */}
                    {ocrLoading && (
                        <div className="ocr-status">
                            <span className="ocr-spinner">⏳</span>
                            <span>{ocrStep}</span>
                        </div>
                    )}

                    {/* Éxito extracción */}
                    {ocrDone && !ocrLoading && (
                        <div className="ocr-success">
                            ✅ Datos extraídos correctamente — revisa y confirma antes de guardar
                        </div>
                    )}

                    {/* Nombre archivo */}
                    {file && !ocrLoading && (
                        <p className="form-hint">📄 {file.name}</p>
                    )}

                    {/* Aviso si faltan datos */}
                    {ocrWarning && (
                        <p className="form-hint form-hint-warning">⚠️ {ocrWarning}</p>
                    )}

                    <p className="form-hint">El sistema intentará extraer los datos automáticamente</p>
                </div>

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