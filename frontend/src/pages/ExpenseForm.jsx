/**
 * ExpenseForm.jsx  (antes: Expenses.jsx)
 * Solo JSX. Lógica en useExpenses.js. OCR en OcrUploader.jsx.
 *
 * Rutas de importación esperadas:
 *   src/
 *     pages/ExpenseForm.jsx        ← este archivo
 *     hooks/useExpenses.js
 *     components/AppLayout.jsx
 *     components/OcrUploader.jsx
 */

import { useExpenses, CATEGORIES } from '../hooks/useExpenses';
import AppLayout from '../components/AppLayout';
import { OcrUploader } from '../components/OcrUploader';
import { CheckCircle2 } from 'lucide-react';

export default function ExpenseForm({ session }) {
  const {
    form, file, handleChange, handleFileChange, handleSubmit, isFormValid,
    ocrLoading, ocrStep, ocrDone, ocrWarning,
    loading, error, success,
    calc,
  } = useExpenses(session);

  const { baseAmount, vatAmount, totalAmount, deductibleAmount, nonDeductible } = calc;

  return (
    <AppLayout session={session} currentPage="gastos">

      {/* ── Cabecera ────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Añadir gasto</h2>
          <p className="page-subtitle">Sube la factura y rellenamos los datos solos</p>
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
              Factura del gasto
            </h3>
            <OcrUploader
              inputId="file-upload-expense"
              label="Subir factura (JPG, PNG, PDF)"
              hint="Extraeremos proveedor, fecha e importe automáticamente"
              file={file}
              ocrLoading={ocrLoading}
              ocrStep={ocrStep}
              ocrDone={ocrDone}
              ocrWarning={ocrWarning}
              onChange={handleFileChange}
            />
          </div>

          {/* Datos de la factura */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 'var(--space-5)' }}>
              Datos de la factura
            </h3>

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

              {/* Categoría */}
              <div className="form-group">
                <label className="form-label">Categoría *</label>
                <select
                  className="form-select"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Proveedor — ancho completo */}
              <div className="form-group col-full">
                <label className="form-label">Proveedor *</label>
                <input
                  className="form-input"
                  type="text"
                  name="provider"
                  placeholder="Ej: Endesa, Movistar, Adobe..."
                  value={form.provider}
                  onChange={handleChange}
                />
              </div>

              {/* Concepto — ancho completo */}
              <div className="form-group col-full">
                <label className="form-label">Concepto *</label>
                <input
                  className="form-input"
                  type="text"
                  name="concept"
                  placeholder="Ej: Factura luz enero 2025"
                  value={form.concept}
                  onChange={handleChange}
                />
              </div>

              {/* Base imponible */}
              <div className="form-group">
                <label className="form-label">Base imponible (€) *</label>
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

              {/* IVA */}
              <div className="form-group">
                <label className="form-label">IVA (%)</label>
                <select
                  className="form-select"
                  name="vat_rate"
                  value={form.vat_rate}
                  onChange={handleChange}
                >
                  <option value={21}>21% — General</option>
                  <option value={10}>10% — Reducido</option>
                  <option value={4}>4% — Superreducido</option>
                  <option value={0}>0% — Exento</option>
                </select>
              </div>

              {/* % Deducible — ancho completo */}
              <div className="form-group col-full">
                <label className="form-label">% Deducible</label>
                <div className="input-group">
                  <input
                    className="form-input"
                    type="number"
                    name="deductible_percentage"
                    min="0"
                    max="100"
                    value={form.deductible_percentage}
                    onChange={handleChange}
                    style={{ paddingRight: 'var(--space-8)' }}
                  />
                  <span className="input-suffix">%</span>
                </div>
                <p className="form-hint">
                  Se ajusta automáticamente según la categoría. Modifícalo si tu caso es diferente.
                </p>
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
              Gasto guardado correctamente
            </div>
          )}

          {/* Botón guardar */}
          <button
            className="btn btn-success btn-lg"
            onClick={handleSubmit}
            disabled={loading || !isFormValid}
            style={{ width: '100%' }}
          >
            {loading ? 'Guardando...' : 'Guardar gasto'}
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
                Introduce la base imponible para ver el resumen
              </p>
            ) : (
              <div className="summary-card" style={{ margin: 0 }}>
                <div className="summary-row">
                  <span>Base imponible</span>
                  <span className="mono">{baseAmount.toFixed(2)} €</span>
                </div>
                <div className="summary-row">
                  <span>IVA ({form.vat_rate}%)</span>
                  <span className="mono">{vatAmount.toFixed(2)} €</span>
                </div>
                <div className="summary-row summary-row-total">
                  <span>Total factura</span>
                  <span className="mono">{totalAmount.toFixed(2)} €</span>
                </div>
                <div className="summary-row summary-row-deductible">
                  <span>Deducible ({form.deductible_percentage}%)</span>
                  <span className="mono">{deductibleAmount.toFixed(2)} €</span>
                </div>
                {nonDeductible > 0 && (
                  <div className="summary-row summary-row-nondeductible">
                    <span>No deducible</span>
                    <span className="mono">{nonDeductible.toFixed(2)} €</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info categoría */}
          {form.category && (
            <div className="card card-sm" style={{ background: 'var(--bg-brand-subtle)', border: '1px solid var(--color-brand-100)' }}>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-brand-600)', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>
                Categoría seleccionada
              </p>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', margin: 0 }}>
                {CATEGORIES.find(c => c.value === form.category)?.icon}{' '}
                {CATEGORIES.find(c => c.value === form.category)?.label}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                Deducible al {form.deductible_percentage}% por defecto
              </p>
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
