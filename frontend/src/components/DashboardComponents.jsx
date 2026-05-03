/**
 * DashboardComponents.jsx
 * Subcomponentes visuales del dashboard.
 * Usa las clases del sistema CSS de CUADRA: card-metric, grid-metrics,
 * table, badge-*, .card, .btn — sin clases inventadas.
 */

import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  AlertTriangle,
  FileText,
  Clock,
} from 'lucide-react';

// ── Utilidad de formato EUR ────────────────────────────────────────────────
function formatEUR(amount) {
  return Number(amount).toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €';
}

// ── Selector de trimestre y año ───────────────────────────────────────────
export function QuarterSelector({ quarter, year, onQuarterChange, onYearChange }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
      <select
        className="form-select"
        style={{ width: 'auto' }}
        value={quarter}
        onChange={e => onQuarterChange(Number(e.target.value))}
      >
        <option value={1}>T1 — Ene/Feb/Mar</option>
        <option value={2}>T2 — Abr/May/Jun</option>
        <option value={3}>T3 — Jul/Ago/Sep</option>
        <option value={4}>T4 — Oct/Nov/Dic</option>
      </select>
      <select
        className="form-select"
        style={{ width: 'auto' }}
        value={year}
        onChange={e => onYearChange(Number(e.target.value))}
      >
        {[2024, 2025, 2026].map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}

// ── Alertas fiscales ──────────────────────────────────────────────────────
export function FiscalAlerts({ alerts }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
      {alerts.map(alert => (
        <div
          key={alert.id}
          className="card card-sm"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)',
            borderLeft: `3px solid ${alert.urgent ? 'var(--color-error-500)' : 'var(--color-warning-500)'}`,
            background: alert.urgent ? 'var(--bg-error)' : 'var(--bg-warning)',
            border: `1px solid ${alert.urgent ? 'var(--border-error)' : 'var(--border-warning)'}`,
            borderLeftWidth: 3,
          }}
        >
          {/* Icon */}
          <AlertTriangle
            size={18}
            style={{ color: alert.urgent ? 'var(--color-error-500)' : 'var(--color-warning-500)', flexShrink: 0 }}
          />
          {/* Text */}
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
              {alert.model}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginLeft: 'var(--space-2)' }}>
              {alert.description}
            </span>
          </div>

          {/* Badge días */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flexShrink: 0 }}>
            <Clock size={13} style={{ color: 'var(--text-secondary)' }} />
            <span
              className={`badge ${alert.urgent ? 'badge-error' : 'badge-warning'}`}
            >
              {alert.days > 0 ? `${alert.days} días` : 'Vencido'}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              · Vence {alert.dueDate}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tarjetas KPI ─────────────────────────────────────────────────────────
// Usa .card-metric de components.css (línea 397)
export function SummaryCards({ totals }) {
  const { income, expenses, profit } = totals;
  const profitPositive = profit >= 0;

  const cards = [
    {
      label: 'Ingresos',
      value: formatEUR(income),
      icon: <ArrowUpRight size={18} />,
      iconBg: 'var(--color-accent-50)',
      iconColor: 'var(--color-accent-600)',
      valueColor: 'var(--color-accent-600)',
      badge: null,
    },
    {
      label: 'Gastos deducibles',
      value: formatEUR(expenses),
      icon: <ArrowDownRight size={18} />,
      iconBg: 'var(--color-error-50)',
      iconColor: 'var(--color-error-500)',
      valueColor: 'var(--color-error-700)',
      badge: null,
    },
    {
      label: 'Beneficio neto',
      value: formatEUR(profit),
      icon: <TrendingUp size={18} />,
      iconBg: profitPositive ? 'var(--color-accent-50)' : 'var(--color-error-50)',
      iconColor: profitPositive ? 'var(--color-accent-600)' : 'var(--color-error-500)',
      valueColor: profitPositive ? 'var(--color-accent-600)' : 'var(--color-error-700)',
      badge: profitPositive
        ? <span className="badge badge-success">↑ Positivo</span>
        : <span className="badge badge-error">↓ Negativo</span>,
    },
  ];

  return (
    <div className="grid-metrics" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 'var(--space-6)' }}>
      {cards.map(card => (
        <div key={card.label} className="card">
          {/* Cabecera tarjeta */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)' }}>
              {card.label}
            </span>
            <div style={{
              width: 32, height: 32, borderRadius: 'var(--radius-sm)',
              background: card.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: card.iconColor,
            }}>
              {card.icon}
            </div>
          </div>
          {/* Valor */}
          <p className="mono" style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-bold)',
            color: card.valueColor,
            margin: '0 0 var(--space-2) 0',
            lineHeight: 1,
          }}>
            {card.value}
          </p>
          {/* Badge opcional */}
          {card.badge}
        </div>
      ))}
    </div>
  );
}

// ── Tarjetas modelos fiscales ──────────────────────────────────────────────
export function TaxCards({ taxes, quarter, year }) {
  const { irpf130, vat303 } = taxes;

  return (
    <div style={{ marginBottom: 'var(--space-8)' }}>
      {/* Cabecera sección */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', margin: 0 }}>
          Modelos fiscales
        </h3>
        <span className="badge badge-neutral">T{quarter} / {year}</span>
      </div>

      <div className="grid-metrics" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {/* Modelo 130 */}
        <div className="card" style={{ borderTop: '3px solid var(--color-brand-500)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <FileText size={16} style={{ color: 'var(--color-brand-500)' }} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)' }}>
              Modelo 130 — IRPF
            </span>
          </div>
          <p className="mono" style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--color-brand-500)',
            margin: '0 0 var(--space-1) 0',
          }}>
            {formatEUR(irpf130)}
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
            20% sobre beneficio neto
          </p>
        </div>

        {/* Modelo 303 */}
        <div className="card" style={{ borderTop: '3px solid var(--color-info-500)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <FileText size={16} style={{ color: 'var(--color-info-500)' }} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)' }}>
              Modelo 303 — IVA
            </span>
          </div>
          <p className="mono" style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-bold)',
            color: vat303 < 0 ? 'var(--color-accent-600)' : 'var(--color-error-700)',
            margin: '0 0 var(--space-1) 0',
          }}>
            {formatEUR(vat303)}
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
            {vat303 <= 0 ? 'IVA soportado a compensar' : 'IVA a ingresar'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Tablas de últimos movimientos ──────────────────────────────────────────
// Usa .table, .table th, .table td de components.css
export function MovementsGrid({ income, expenses }) {
  const movements = [
    ...income.map(i => ({
      ...i,
      type: 'income',
      amount: i.base_amount,
    })),
    ...expenses.map(e => ({
      ...e,
      type: 'expense',
      amount: e.total_amount,
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10); // latest movements

  return (
    <MovementsTable
      title="Últimos movimientos"
      rows={movements}
    />
  );
}

function MovementsTable({ title, rows }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--space-4) var(--space-5)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', margin: 0 }}>
          {title}
        </h3>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
          <p className="empty-state-desc">
            No hay movimientos en este trimestre
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Factura</th>
                <th>Concepto</th>
                <th>Tipo</th>
                <th style={{ textAlign: 'right' }}>Estado</th>
                <th style={{ textAlign: 'right' }}>Importe</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const isIncome = row.type === 'income';

                return (
                  <tr key={row.id}>
                    <td>
                      {isIncome ? (row.invoice_number || '—') : '—'}
                    </td>
                    <td>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                        {row.concept}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        {row.date}
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${isIncome ? 'badge-success' : 'badge-error'}`}>
                        {isIncome ? 'Ingreso' : 'Gasto'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <StatusBadge status={row.status} isIncome={isIncome} />
                    </td>
                    <td className={`amount ${isIncome ? 'amount-income' : 'amount-expense'}`}>
                      {isIncome ? '+' : '-'}{formatEUR(row.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Badge de estado según el valor de la BD
function StatusBadge({ status, isIncome }) {
  // Map database status values to badge classes
  const statusMap = {
    cobrado: { badgeClass: 'badge-success', label: 'Cobrado' },
    pagado: { badgeClass: 'badge-success', label: 'Pagado' },
    pendiente: { badgeClass: 'badge-warning', label: 'Pendiente' },
    borrador: { badgeClass: 'badge-neutral', label: 'Borrador' },
  };

  const fallback = isIncome
    ? { badgeClass: 'badge-success', label: 'Cobrado' }
    : { badgeClass: 'badge-success', label: 'Pagado' };

  const { badgeClass, label } = statusMap[status] ?? fallback;

  return <span className={`badge ${badgeClass}`}>{label}</span>;
}
