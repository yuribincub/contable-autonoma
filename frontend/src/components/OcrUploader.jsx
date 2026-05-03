/**
 * OcrUploader.jsx
 * Componente compartido de subida de archivo con feedback OCR.
 * Usado tanto en IncomeForm como en ExpenseForm.
 *
 * Props:
 *   inputId     — id único del input file (para el label)
 *   label       — texto del botón/label
 *   hint        — texto de ayuda debajo del botón
 *   file        — archivo seleccionado (o null)
 *   ocrLoading  — boolean: está procesando
 *   ocrStep     — string: mensaje del paso actual
 *   ocrDone     — boolean: extracción exitosa
 *   ocrWarning  — string | null: aviso si faltan datos
 *   onChange    — función que recibe el evento change del input
 */

import { Upload, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export function OcrUploader({
  inputId,
  label = 'Subir documento (JPG, PNG, PDF)',
  hint  = 'El sistema intentará extraer los datos automáticamente',
  file,
  ocrLoading,
  ocrStep,
  ocrDone,
  ocrWarning,
  onChange,
}) {
  return (
    <div className="form-group">
      {/* Input file oculto */}
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/jpg,application/pdf"
        onChange={onChange}
        style={{ display: 'none' }}
      />

      {/* Zona de subida */}
      <label
        htmlFor={inputId}
        style={{
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            'var(--space-2)',
          padding:        'var(--space-8) var(--space-6)',
          border:         `2px dashed ${ocrDone ? 'var(--border-success)' : 'var(--border-default)'}`,
          borderRadius:   'var(--radius-md)',
          background:     ocrDone ? 'var(--bg-success)' : 'var(--bg-surface-alt)',
          cursor:         ocrLoading ? 'wait' : 'pointer',
          transition:     'all var(--transition-fast)',
          textAlign:      'center',
        }}
      >
        {ocrLoading ? (
          /* Spinner mientras procesa */
          <>
            <Loader2
              size={24}
              style={{ color: 'var(--color-brand-500)', animation: 'spin 1s linear infinite' }}
            />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {ocrStep}
            </span>
          </>
        ) : ocrDone ? (
          /* Éxito */
          <>
            <CheckCircle2 size={24} style={{ color: 'var(--color-success-500)' }} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-success-700)' }}>
              Datos extraídos correctamente
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Revisa y confirma antes de guardar
            </span>
          </>
        ) : (
          /* Estado inicial */
          <>
            <Upload size={24} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
              {label}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              {hint}
            </span>
          </>
        )}
      </label>

      {/* Nombre del archivo seleccionado */}
      {file && !ocrLoading && (
        <p className="form-hint" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          <span>📄</span> {file.name}
        </p>
      )}

      {/* Aviso si faltan datos */}
      {ocrWarning && (
        <div style={{
          display:      'flex',
          alignItems:   'flex-start',
          gap:          'var(--space-2)',
          padding:      'var(--space-3)',
          background:   'var(--bg-warning)',
          borderRadius: 'var(--radius-sm)',
          border:       '1px solid var(--border-warning)',
          marginTop:    'var(--space-2)',
        }}>
          <AlertTriangle size={15} style={{ color: 'var(--color-warning-500)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-warning-700)', margin: 0 }}>
            {ocrWarning}
          </p>
        </div>
      )}
    </div>
  );
}
