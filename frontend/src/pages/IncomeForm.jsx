/**
 * IncomeForm.jsx  (antes: Income.jsx)
 * Solo JSX. Lógica en useIncome.js. OCR en OcrUploader.jsx.
 *
 * Rutas de importación esperadas:
 *   src/
 *     pages/IncomeForm.jsx         ← este archivo
 *     hooks/useIncome.js
 *     components/AppLayout.jsx
 *     components/OcrUploader.jsx
 */

import { useIncome } from '../hooks/useIncome';
import AppLayout from '../components/AppLayout';
import { OcrUploader } from '../components/OcrUploader';
import { CheckCircle2, Info } from 'lucide-react';

export default function IncomeForm({ session }) {
  const {
    form, file, handleChange, handleFileChange, handleSubmit, isFormValid,
    ocrLoading, ocrStep, ocrDone, ocrWarning,
    loading, error, success, successMessage,
    calc,
  } = useIncome(session);

  const { baseAmount, irpfAmount, totalCobrar } = calc;

  return (
    <AppLayout session={session} currentPage="ingresos">

      {/* ── Cabecera ────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Añadir ingreso</h2>
          <p className="page-subtitle">Sube el justificante y rellenamos los datos solos</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => window.location.href = '/'}>
            ← Volver
          </button>
        </div>
      </div>

      {/* ── Layout: formulario + resumen ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-6)', alignItems: 'start' }}>

        {/* ── Columna izquierda: formulario ──────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

          {/* OCR uploader */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
              Justificante de transferencia
            </h3>
            <OcrUploader
              inputId="file-upload-income"
              label="Subir transferencia (JPG, PNG, PDF)"
              hint="Extraeremos fecha e importe automáticamente"
              file={file}
              ocrLoading={ocrLoading}
              ocrStep={ocrStep}
              ocrDone={ocrDone}
              ocrWarning={ocrWarning}
              onChange={handleFileChange}
            />
          </div>

          {/* Datos del ingreso */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 'var(--space-5)' }}>
              Datos del ingreso
            </h3>

            {/* Aviso cliente EEUU */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--bg-brand-subtle)',
              border: '1px solid var(--color-brand-100)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 'var(--space-5)',
            }}>
              <Info size={16} style={{ color: 'var(--color-brand-500)', flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-brand-600)', margin: 0 }}>
                <strong>Cliente: EEUU</strong> — IVA 0% (operación no sujeta a IVA español)
              </p>
            </div>

            <div className="grid-form">
              {/* Fecha */}
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

              {/* Retención IRPF */}
              <div className="form-group">
                <label className="form-label">Retención IRPF (%)</label>
                <div className="input-group">
                  <input
                    className="form-input"
                    type="number"
                    name="irpf_rate"
                    placeholder="0"
                    min="0"
                    max="100"
                    value={form.irpf_rate}
                    onChange={handleChange}
                    style={{ paddingRight: 'var(--space-8)' }}
                  />
                  <span className="input-suffix">%</span>
                </div>
                <p className="form-hint">0% si el cliente no aplica retención</p>
              </div>

              {/* Concepto — ancho completo */}
              <div className="form-group col-full">
                <label className="form-label">Concepto *</label>
                <input
                  className="form-input"
                  type="text"
                  name="concept"
                  placeholder="Ej: Servicios de diseño · abril 2025"
                  value={form.concept}
                  onChange={handleChange}
                />
              </div>

              {/* Base imponible — ancho completo */}
              <div className="form-group col-full">
                <label className="form-label">Importe (€) *</label>
                <div className="input-group">
                  <span className="input-prefix">€</span>
                  <input
                    className="form-input"
                    type="number"
                    name="base_amount"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={form.base_amount}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Errores y éxito */}
          {error && (
            <div style={{
              padding: 'var(--space-4)',
              background: 'var(--bg-error)',
              border: '1px solid var(--border-error)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-error-700)',
              fontSize: 'var(--text-sm)',
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
              padding: 'var(--space-4)',
              background: 'var(--bg-success)',
              border: '1px solid var(--border-success)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-success-700)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-semibold)',
            }}>
              <CheckCircle2 size={18} />
              {successMessage}
            </div>
          )}

          {/* Botón guardar */}
          <button
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={loading || !isFormValid}
            style={{ width: '100%' }}
          >
            {loading ? 'Guardando...' : 'Guardar ingreso'}
          </button>
        </div>

        {/* ── Columna derecha: resumen ───────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', position: 'sticky', top: 'calc(var(--topbar-height) + var(--space-6))' }}>

          {/* Resumen de cálculo */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
              Resumen
            </h3>

            {!form.base_amount ? (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', textAlign: 'center', padding: 'var(--space-4) 0' }}>
                Introduce el importe para ver el resumen
              </p>
            ) : (
              <div className="summary-card" style={{ margin: 0 }}>
                <div className="summary-row">
                  <span>Importe facturado</span>
                  <span className="mono">{baseAmount.toFixed(2)} €</span>
                </div>
                <div className="summary-row">
                  <span>IVA (0% — cliente EEUU)</span>
                  <span className="mono">0,00 €</span>
                </div>
                <div className="summary-row">
                  <span>Retención IRPF ({form.irpf_rate}%)</span>
                  <span className="mono text-expense">-{irpfAmount.toFixed(2)} €</span>
                </div>
                <div className="summary-row summary-row-total">
                  <span>Total a cobrar</span>
                  <span className="mono text-income">{totalCobrar.toFixed(2)} €</span>
                </div>
              </div>
            )}
          </div>

          {/* Nota fiscal */}
          <div className="card card-sm" style={{ background: 'var(--bg-surface-alt)' }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>
              Nota fiscal
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-body)', margin: 0, lineHeight: 'var(--leading-relaxed)' }}>
              Este ingreso se incluirá en el cálculo del <strong>Modelo 130</strong> (IRPF) del trimestre correspondiente.
            </p>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
