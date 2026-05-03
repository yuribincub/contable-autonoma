/**
 * InvoiceView.jsx
 * Vista de factura en pantalla + botones PDF / imprimir / anular.
 * Lógica en useInvoice.js · PDF en generateInvoicePDF.js
 */

import { useInvoice } from '../hooks/useInvoice';
import { generateInvoicePDF } from '../utils/generateInvoicePDF';
import AppLayout from '../components/AppLayout';
import { Printer, Download, ArrowLeft, AlertCircle, XCircle, Ban } from 'lucide-react';

function getInvoiceId() {
  const parts = window.location.pathname.split('/');
  return parts[parts.indexOf('invoice') + 1] || null;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function eur(amount) {
  return Number(amount).toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €';
}

// Badge de estado de factura
function StatusBadge({ status }) {
  const map = {
    issued: { label: 'Emitida', clase: 'badge-info' },
    paid: { label: 'Cobrada', clase: 'badge-success' },
    cancelled: { label: 'Anulada', clase: 'badge-error' },
  };
  const { label, clase } = map[status] ?? { label: status, clase: 'badge-neutral' };
  return <span className={`badge ${clase}`}>{label}</span>;
}

export default function InvoiceView({ session }) {
  const incomeId = getInvoiceId();
  const {
    income, profile, calculos,
    loading, error,
    cancelling, cancelError, cancelInvoice,
  } = useInvoice(session, incomeId);

  const isCancelled = income?.invoice_status === 'cancelled';

  const handlePDF = () => generateInvoicePDF({ income, profile, calculos });
  const handlePrint = () => window.print();

  if (loading) {
    return (
      <AppLayout session={session} currentPage="ingresos">
        <div className="loading">Cargando factura...</div>
      </AppLayout>
    );
  }

  if (error || !income) {
    return (
      <AppLayout session={session} currentPage="ingresos">
        <div className="card" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center', padding: 'var(--space-10)' }}>
          <AlertCircle size={40} style={{ color: 'var(--color-error-500)', margin: '0 auto var(--space-4)' }} />
          <h3 style={{ marginBottom: 'var(--space-2)' }}>Factura no encontrada</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{error}</p>
          <button className="btn btn-secondary" style={{ marginTop: 'var(--space-6)' }}
            onClick={() => window.location.href = '/'}>
            Volver a ingresos
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout session={session} currentPage="ingresos">

      {/* ── Cabecera de página ────────────────────────────────────────── */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <button className="btn btn-ghost btn-sm"
            onClick={() => window.location.href = '/'}>
            <ArrowLeft size={16} /> Volver
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <h2 className="page-title">{income.invoice_number}</h2>
              <StatusBadge status={income.invoice_status} />
            </div>
            <p className="page-subtitle">Emitida el {formatDate(income.date)}</p>
          </div>
        </div>

        <div className="page-actions">
          {/* Botón anular — solo si no está ya anulada */}
          {!isCancelled && (
            <button
              className="btn btn-danger"
              onClick={cancelInvoice}
              disabled={cancelling}
              title="Anular esta factura"
            >
              <Ban size={16} />
              {cancelling ? 'Anulando...' : 'Anular factura'}
            </button>
          )}
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={16} /> Imprimir
          </button>
          <button className="btn btn-primary" onClick={handlePDF} disabled={isCancelled}>
            <Download size={16} /> Descargar PDF
          </button>
        </div>
      </div>

      {/* ── Banner de factura anulada ─────────────────────────────────── */}
      {isCancelled && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-4) var(--space-5)',
          background: 'var(--bg-error)',
          border: '1px solid var(--border-error)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-6)',
          maxWidth: 800,
          margin: '0 auto var(--space-6)',
        }}>
          <XCircle size={20} style={{ color: 'var(--color-error-500)', flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-error-700)', margin: 0 }}>
              Factura anulada
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-error-700)', margin: 0, opacity: 0.8 }}>
              Esta factura ha sido anulada y no tiene validez fiscal. No se puede descargar el PDF.
            </p>
          </div>
        </div>
      )}

      {/* Error al anular */}
      {cancelError && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--bg-error)',
          border: '1px solid var(--border-error)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--color-error-700)',
          fontSize: 'var(--text-sm)',
          marginBottom: 'var(--space-4)',
          maxWidth: 800,
          margin: '0 auto var(--space-4)',
        }}>
          {cancelError}
        </div>
      )}

      {/* ── Documento de factura ──────────────────────────────────────── */}
      <div id="invoice-print-area" style={{
        background: 'white',
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${isCancelled ? 'var(--border-error)' : 'var(--border-subtle)'}`,
        boxShadow: 'var(--shadow-md)',
        maxWidth: 800,
        margin: '0 auto',
        overflow: 'hidden',
        // Marca de agua visual si está anulada
        position: 'relative',
        opacity: isCancelled ? 0.7 : 1,
      }}>

        {/* Sello ANULADA superpuesto */}
        {isCancelled && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-30deg)',
            fontSize: 80,
            fontWeight: 900,
            color: 'rgba(239, 68, 68, 0.15)',
            letterSpacing: 8,
            pointerEvents: 'none',
            zIndex: 10,
            userSelect: 'none',
          }}>
            ANULADA
          </div>
        )}

        {/* Cabecera azul */}
        <div style={{
          background: isCancelled ? 'var(--color-gray-500)' : 'var(--color-brand-500)',
          padding: 'var(--space-8)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'white', letterSpacing: -1, marginBottom: 4 }}>
              CUADRA
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
              Haz que todo cuadre
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              {isCancelled ? 'FACTURA ANULADA' : 'Factura'}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'white', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
              {income.invoice_number}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
              Fecha de emisión: <strong>{formatDate(income.date)}</strong>
            </div>
          </div>
        </div>

        <div style={{ padding: 'var(--space-8)' }}>

          {/* Emisor / Receptor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            <div style={{ background: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>Emisor</p>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15, marginBottom: 'var(--space-2)' }}>{profile.full_name || '—'}</p>
              <div style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.8 }}>
                <div>NIF: <strong>{profile.nif || '—'}</strong></div>
                {profile.address && <div>{profile.address}</div>}
                {(profile.postal_code || profile.city) && (
                  <div>{[profile.postal_code, profile.city, profile.province].filter(Boolean).join(', ')}</div>
                )}
                {profile.phone && <div>Tel: {profile.phone}</div>}
                {profile.email && <div>{profile.email}</div>}
              </div>
            </div>
            <div style={{ background: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>Cliente</p>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15, marginBottom: 'var(--space-2)' }}>{income.client || 'Cliente EEUU'}</p>
              <div style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.8 }}>
                <div>País: <strong>Estados Unidos</strong></div>
                <div>NIF/VAT: N/A</div>
              </div>
            </div>
          </div>

          {/* Aviso legal exportación */}
          <div style={{
            background: 'var(--bg-brand-subtle)', border: '1px solid var(--color-brand-100)',
            borderRadius: 'var(--radius-sm)', padding: 'var(--space-3) var(--space-4)',
            marginBottom: 'var(--space-6)', fontSize: 13, color: 'var(--color-brand-600)', fontStyle: 'italic',
          }}>
            Operación exenta de IVA — Exportación fuera de la UE (Art. 21 Ley 37/1992 del IVA)
          </div>

          {/* Tabla de conceptos */}
          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)', marginBottom: 'var(--space-6)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-gray-950)' }}>
                  {['Concepto', 'Cantidad', 'Precio unitario', 'Importe'].map((h, i) => (
                    <th key={h} style={{
                      padding: 'var(--space-3) var(--space-4)', fontSize: 11, fontWeight: 700,
                      color: 'white', letterSpacing: '0.06em', textTransform: 'uppercase',
                      textAlign: i === 0 ? 'left' : 'right',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: 'white' }}>
                  <td style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{income.concept}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Período: {formatDate(income.date)}</div>
                  </td>
                  <td style={{ padding: 'var(--space-4)', textAlign: 'right', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--border-subtle)' }}>1</td>
                  <td style={{ padding: 'var(--space-4)', textAlign: 'right', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--border-subtle)' }}>{eur(calculos.base)}</td>
                  <td style={{ padding: 'var(--space-4)', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, borderBottom: '1px solid var(--border-subtle)' }}>{eur(calculos.base)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 300 }}>
              <TotalRow label="Base imponible" value={eur(calculos.base)} />
              <TotalRow label="IVA (0% — exportación)" value={eur(0)} muted />
              {calculos.irpfRate > 0 && (
                <TotalRow label={`Retención IRPF (${calculos.irpfRate}%)`} value={`- ${eur(calculos.irpfAmount)}`} muted />
              )}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--space-4)',
                background: isCancelled ? 'var(--color-gray-500)' : 'var(--color-brand-500)',
                borderRadius: 'var(--radius-md)', marginTop: 'var(--space-2)',
              }}>
                <span style={{ fontWeight: 700, color: 'white', fontSize: 15 }}>Total a cobrar</span>
                <span style={{ fontWeight: 700, color: 'white', fontSize: 18, fontFamily: 'var(--font-mono)' }}>{eur(calculos.total)}</span>
              </div>
            </div>
          </div>

          {/* Notas legales */}
          <div style={{ marginTop: 'var(--space-8)', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <p style={{ fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--text-body)' }}>Notas legales</p>
            <p>· Factura emitida conforme al Reglamento de Facturación (RD 1619/2012).</p>
            <p>· Operación exenta de IVA por tratarse de una exportación de servicios fuera de la UE (Art. 21 Ley 37/1992).</p>
            <p>· Conservar durante un mínimo de 4 años (Art. 70 Ley General Tributaria).</p>
            {isCancelled && (
              <p style={{ color: 'var(--color-error-700)', fontWeight: 600, marginTop: 'var(--space-2)' }}>
                · FACTURA ANULADA — Este documento no tiene validez fiscal.
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .sidebar, .topbar, .page-header, .page-actions { display: none !important; }
          .main-content { margin-left: 0 !important; }
          .page-content { padding: 0 !important; }
          #invoice-print-area { box-shadow: none !important; border: none !important; max-width: 100% !important; opacity: 1 !important; }
        }
      `}</style>

    </AppLayout>
  );
}

function TotalRow({ label, value, muted = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-4)', borderBottom: '1px solid var(--border-subtle)' }}>
      <span style={{ fontSize: 13, color: muted ? 'var(--text-secondary)' : 'var(--text-body)' }}>{label}</span>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: muted ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}