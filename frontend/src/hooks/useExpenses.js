/**
 * useExpenses.js
 * Hook con toda la lógica del formulario de gastos.
 * ExpenseForm.jsx solo pinta — no calcula ni hace fetch.
 */

import { useState } from 'react';
import api from '../config/api';

// Categorías con % deducible por defecto
// Fuente: reglas fiscales España autónoma
export const CATEGORIES = [
  { value: 'software',     label: 'Software y herramientas', deductible: 100, icon: '💻' },
  { value: 'internet',     label: 'Internet',                deductible: 100, icon: '🌐' },
  { value: 'suministros',  label: 'Suministros (luz)',        deductible: 30,  icon: '💡' },
  { value: 'vivienda',     label: 'Vivienda / alquiler',      deductible: 30,  icon: '🏠' },
  { value: 'material',     label: 'Material de oficina',      deductible: 100, icon: '📦' },
  { value: 'formacion',    label: 'Formación',                deductible: 100, icon: '📚' },
  { value: 'transporte',   label: 'Transporte',               deductible: 100, icon: '🚗' },
  { value: 'otros',        label: 'Otros',                    deductible: 100, icon: '📋' },
];

const INITIAL_FORM = {
  date:                   '',
  provider:               '',
  concept:                '',
  category:               'software',
  base_amount:            '',
  vat_rate:               21,
  deductible_percentage:  100,
};

export function useExpenses(session) {
  const [form,        setForm]        = useState(INITIAL_FORM);
  const [file,        setFile]        = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [ocrLoading,  setOcrLoading]  = useState(false);
  const [ocrStep,     setOcrStep]     = useState('');
  const [ocrDone,     setOcrDone]     = useState(false);
  const [ocrWarning,  setOcrWarning]  = useState(null);
  const [error,       setError]       = useState(null);
  const [success,     setSuccess]     = useState(false);

  // ── Cambios en el formulario ───────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Al cambiar categoría, ajustar % deducible automáticamente
    if (name === 'category') {
      const cat = CATEGORIES.find(c => c.value === value);
      setForm(prev => ({ ...prev, category: value, deductible_percentage: cat?.deductible ?? 100 }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // ── OCR — procesar factura ─────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setOcrLoading(true);
    setOcrDone(false);
    setOcrWarning(null);
    setError(null);
    setOcrStep('Leyendo factura...');

    try {
      await new Promise(r => setTimeout(r, 800));
      setOcrStep('Analizando documento...');

      const formData = new FormData();
      formData.append('file', selectedFile);

      const { data } = await api.post('/ocr/extract-expense', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await new Promise(r => setTimeout(r, 600));
      setOcrStep('Extrayendo datos de la factura...');
      await new Promise(r => setTimeout(r, 600));

      // Rellenar con datos extraídos, mantener los existentes si no hay datos
      setForm(prev => ({
        ...prev,
        date:        data.date        || prev.date,
        provider:    data.provider    || prev.provider,
        base_amount: data.base_amount || prev.base_amount,
        vat_rate:    data.vat_rate    || prev.vat_rate,
      }));

      // Avisar de campos que no se pudieron extraer
      const missing = [];
      if (!data.date)        missing.push('fecha');
      if (!data.provider)    missing.push('proveedor');
      if (!data.base_amount) missing.push('base imponible');

      if (missing.length > 0) {
        setOcrWarning(`No se pudo extraer: ${missing.join(', ')}. Completa manualmente.`);
      } else {
        setOcrDone(true);
      }

    } catch (err) {
      console.error('Error OCR:', err.response?.data || err.message);
      setOcrWarning('Error leyendo la factura. Rellena los datos manualmente.');
    } finally {
      setOcrLoading(false);
      setOcrStep('');
    }
  };

  // ── Guardar gasto ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let uploadedFileUrl = null;

      // Subir archivo a Supabase Storage si existe
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', session.user.id);

        const { data } = await api.post('/ocr/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedFileUrl = data.file_url;
      }

      await api.post('/expenses', {
        user_id:               session.user.id,
        date:                  form.date,
        provider:              form.provider,
        concept:               form.concept,
        category:              form.category,
        base_amount:           Number(form.base_amount),
        vat_rate:              Number(form.vat_rate),
        deductible_percentage: Number(form.deductible_percentage),
        file_url:              uploadedFileUrl,
      });

      setSuccess(true);
      setTimeout(() => { window.location.href = '/'; }, 1500);
      setForm(INITIAL_FORM);

    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el gasto');
    } finally {
      setLoading(false);
    }
  };

  // ── Cálculos en tiempo real ────────────────────────────────────────────
  const baseAmount       = Number(form.base_amount) || 0;
  const vatAmount        = (baseAmount * Number(form.vat_rate)) / 100;
  const totalAmount      = baseAmount + vatAmount;
  const deductibleAmount = (totalAmount * Number(form.deductible_percentage)) / 100;
  const nonDeductible    = totalAmount - deductibleAmount;

  const isFormValid = form.date && form.provider && form.concept && form.base_amount;

  return {
    // Estado del formulario
    form,
    file,
    handleChange,
    handleFileChange,
    handleSubmit,
    isFormValid,

    // Estado OCR
    ocrLoading,
    ocrStep,
    ocrDone,
    ocrWarning,

    // Estado UI
    loading,
    error,
    success,

    // Cálculos
    calc: { baseAmount, vatAmount, totalAmount, deductibleAmount, nonDeductible },
  };
}
