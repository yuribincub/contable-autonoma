/**
 * src/hooks/useIncome.js
 * Hook con toda la lógica del formulario de ingresos.
 * IncomeForm.jsx solo pinta — no calcula ni hace fetch.
 *
 * Cambios respecto a la versión anterior:
 *   - Añadido estado `client` para el cliente seleccionado
 *   - vat_rate se deriva automáticamente de client.is_non_eu
 *   - Se elimina client: 'Cliente EEUU' hardcodeado
 *   - Se guarda client_id y vat_rate en el POST /income
 */

import { useState } from 'react';
import api from '../config/api';

const INITIAL_FORM = {
  date: '',
  concept: '',
  base_amount: '',
  irpf_rate: 0,
};

export function useIncome(session) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [client, setClient] = useState(null); // { client_id, client_name, vat_rate, is_non_eu }
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStep, setOcrStep] = useState('');
  const [ocrDone, setOcrDone] = useState(false);
  const [ocrWarning, setOcrWarning] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // ── Cambios en el formulario ───────────────────────────────────────────
  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── Cambio de cliente (viene de ClientSelector) ────────────────────────
  // client = { client_id, client_name, vat_rate, is_non_eu } | null
  const handleClientChange = (selectedClient) => {
    setClient(selectedClient);
  };

  // ── OCR — procesar transferencia ───────────────────────────────────────
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setOcrLoading(true);
    setOcrDone(false);
    setOcrWarning(null);
    setError(null);
    setOcrStep('Leyendo archivo...');

    try {
      await new Promise(r => setTimeout(r, 800));
      setOcrStep('Analizando documento...');

      const formData = new FormData();
      formData.append('file', selectedFile);

      const { data } = await api.post('/ocr/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await new Promise(r => setTimeout(r, 600));
      setOcrStep('Extrayendo fecha e importe...');
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
      }

    } catch (err) {
      console.error('Error OCR:', err.response?.data || err.message);
      setOcrWarning('Error leyendo el archivo. Rellena los datos manualmente.');
    } finally {
      setOcrLoading(false);
      setOcrStep('');
    }
  };

  // ── Guardar ingreso ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let uploadedFileUrl = null;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', session.user.id);

        const { data } = await api.post('/ocr/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedFileUrl = data.file_url;
      }

      // vat_rate viene del cliente seleccionado (0 si extracomunitario, 21 si UE/nacional)
      const vatRate = client ? client.vat_rate : 0;

      const response = await api.post('/income', {
        user_id: session.user.id,
        date: form.date,
        concept: form.concept,
        base_amount: Number(form.base_amount),
        irpf_rate: Number(form.irpf_rate),
        vat_rate: vatRate,
        client_id: client?.client_id ?? null,
        client_name: client?.client_name ?? null,
        file_url: uploadedFileUrl,
      });

      const invoiceNum = response.data.invoice_number;
      setSuccess(true);
      setSuccessMessage(`Factura ${invoiceNum} guardada correctamente`);
      setTimeout(() => { window.location.href = '/'; }, 2000);
      setForm(INITIAL_FORM);
      setClient(null);

    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el ingreso');
    } finally {
      setLoading(false);
    }
  };

  // ── Cálculos en tiempo real ────────────────────────────────────────────
  const baseAmount = Number(form.base_amount) || 0;
  const vatRate = client ? client.vat_rate : 0;
  const vatAmount = (baseAmount * vatRate) / 100;
  const irpfAmount = (baseAmount * Number(form.irpf_rate)) / 100;
  const totalCobrar = baseAmount + vatAmount - irpfAmount;

  const isFormValid = form.date && form.concept && form.base_amount;

  return {
    form,
    client,
    file,
    handleChange,
    handleClientChange,
    handleFileChange,
    handleSubmit,
    isFormValid,

    ocrLoading,
    ocrStep,
    ocrDone,
    ocrWarning,

    loading,
    error,
    success,
    successMessage,

    calc: { baseAmount, vatRate, vatAmount, irpfAmount, totalCobrar },
  };
}