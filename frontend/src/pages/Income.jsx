// Página para añadir ingresos con OCR de transferencias bancarias
import { useState } from 'react';
import api from '../config/api';

export default function Income({ session }) {
    const [form, setForm] = useState({
        date: '',
        concept: '',
        base_amount: '',
        irpf_rate: 0,
    });
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrStep, setOcrStep] = useState(''); // mensaje del paso actual
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [ocrWarning, setOcrWarning] = useState(null);
    const [ocrDone, setOcrDone] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Procesar archivo con OCR
    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setOcrLoading(true);
        setOcrDone(false);
        setOcrWarning(null);
        setOcrStep('📂 Leyendo archivo...');
        setError(null);

        try {
            // Mínimo 800ms en cada paso para que se vea
            await new Promise(r => setTimeout(r, 800));
            setOcrStep('🔍 Analizando documento...');

            const formData = new FormData();
            formData.append('file', selectedFile);
            const { data } = await api.post('/ocr/extract', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            await new Promise(r => setTimeout(r, 600));
            setOcrStep('📅 Extrayendo fecha e importe...');
            await new Promise(r => setTimeout(r, 600));

            setForm(prev => ({
                ...prev,
                date: data.date || prev.date,
                base_amount: data.amount || prev.base_amount,
                concept: data.concept || prev.concept,
            }));

            if (!data.date || !data.amount) {
                setOcrWarning('No se pudieron extraer todos los datos. Revisa y completa el formulario.');
            } else {
                setOcrDone(true);
                setOcrStep('');
            }

        } catch (error) {
            console.error('Error OCR:', error.response?.data || error.message);
            setOcrWarning('Error leyendo el archivo. Rellena los datos manualmente.');
            setOcrStep('');
        } finally {
            setOcrLoading(false);
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

            const response = await api.post('/income', {
                user_id: session.user.id,
                date: form.date,
                concept: form.concept,
                base_amount: Number(form.base_amount),
                irpf_rate: Number(form.irpf_rate),
                client: 'Cliente EEUU',
                file_url: uploadedFileUrl,
            });

            const invoiceNum = response.data.invoice_number;
            setSuccess(true);
            setSuccessMessage(`✅ Factura ${invoiceNum} guardada correctamente`);
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
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

                {/* Subida de transferencia con OCR */}
                {/* Subida de transferencia con OCR */}
                <div className="form-group">
                    <label className="form-label">Justificante de transferencia</label>
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,application/pdf"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        id="file-upload"
                    />
                    <label htmlFor="file-upload" className="btn btn-secondary btn-upload">
                        📎 Subir transferencia (JPG, PNG, PDF)
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

                    {/* Aviso si no se extrajeron todos */}
                    {ocrWarning && (
                        <p className="form-hint form-hint-warning">⚠️ {ocrWarning}</p>
                    )}

                    <p className="form-hint">El sistema intentará extraer fecha e importe automáticamente</p>
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
                {success && <p className="alert alert-success">{successMessage}</p>}

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
