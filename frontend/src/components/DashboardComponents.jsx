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
    <div className="quarter-selector">
      <select
        className="form-select quarter-selector-select"
        value={quarter}
        onChange={e => onQuarterChange(Number(e.target.value))}
      >
        <option value={1}>T1 — Ene/Feb/Mar</option>
        <option value={2}>T2 — Abr/May/Jun</option>
        <option value={3}>T3 — Jul/Ago/Sep</option>
        <option value={4}>T4 — Oct/Nov/Dic</option>
      </select>
      <select
        className="form-select quarter-selector-select"
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
    <div className="fiscal-alerts-list">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`alert-card ${alert.urgent ? 'urgent' : 'warning'}`}
        >
          <AlertTriangle
            size={18}
            className={`alert-icon ${alert.urgent ? 'urgent' : 'warning'}`}
          />
          <div className="alert-text-section">
            <p className="alert-model">{alert.model}</p>
            <p className="alert-description">{alert.description}</p>
          </div>
          <div className="alert-badge-section">
            <Clock size={13} style={{ color: 'var(--text-secondary)' }} />
            <span className={`badge ${alert.urgent ? 'badge-error' : 'badge-warning'}`}>
              {alert.days > 0 ? `${alert.days} días` : 'Vencido'}
            </span>
            <span className="alert-days-badge">· Vence {alert.dueDate}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tarjetas KPI ─────────────────────────────────────────────────────────
export function SummaryCards({ totals }) {
  const { income, expenses, profit } = totals;
  const profitPositive = profit >= 0;

  const cards = [
    {
      label: 'Ingresos',
      type: 'income',
      value: formatEUR(income),
      icon: <ArrowUpRight size={18} />,
      badge: null,
    },
    {
      label: 'Gastos deducibles',
      type: 'expense',
      value: formatEUR(expenses),
      icon: <ArrowDownRight size={18} />,
      badge: null,
    },
    {
      label: 'Beneficio neto',
      type: 'profit',
      value: formatEUR(profit),
      icon: <TrendingUp size={18} />,
      badge: profitPositive
        ? <span className="badge badge-success">↑ Positivo</span>
        : <span className="badge badge-error">↓ Negativo</span>,
    },
  ];

  return (
    <div className="summary-cards-grid">
      {cards.map(card => (
        <div key={card.label} className="summary-card">
          <div className="summary-card-header">
            <span className="summary-card-label">{card.label}</span>
            <div className={`summary-card-icon-box ${card.type}`}>
              {card.icon}
            </div>
          </div>
          <p className={`summary-card-value ${card.type}`}>
            {card.value}
          </p>
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
    <div className="tax-cards-container">
      <div className="tax-cards-header">
        <h3 className="tax-cards-title">Modelos fiscales</h3>
        <span className="badge badge-neutral">T{quarter} / {year}</span>
      </div>
      <div className="tax-cards-grid">
        {/* Modelo 130 */}
        <div className="tax-card-item brand">
          <div className="tax-card-header">
            <FileText size={16} className="tax-card-icon brand" />
            <span className="tax-card-icon-label">Modelo 130 — IRPF</span>
          </div>
          <p className="tax-card-value brand">{formatEUR(irpf130)}</p>
          <p className="tax-card-note">20% sobre beneficio neto</p>
        </div>

        {/* Modelo 303 */}
        <div className="tax-card-item info">
          <div className="tax-card-header">
            <FileText size={16} className="tax-card-icon info" />
            <span className="tax-card-icon-label">Modelo 303 — IVA</span>
          </div>
          <p className={`tax-card-value ${vat303 < 0 ? 'info' : ''}`} style={vat303 >= 0 ? { color: 'var(--color-error-700)' } : {}}>
            {formatEUR(vat303)}
          </p>
          <p className="tax-card-note">{vat303 <= 0 ? 'IVA soportado a compensar' : 'IVA a ingresar'}</p>
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
      id: `income-${i.id}`,
      originalId: i.id,
      type: 'income',
      amount: i.base_amount,
    })),
    ...expenses.map(e => ({
      ...e,
      id: `expense-${e.id}`,
      originalId: e.id,
      type: 'expense',
      amount: e.total_amount,
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20); // latest movements

  return (
    <MovementsTable
      title="Últimos movimientos"
      rows={movements}
    />
  );
}

function MovementsTable({ title, rows }) {
  return (
    <div className="movements-table-wrapper">
      <div className="movements-table-header">
        <h3 className="movements-table-title">{title}</h3>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => window.location.href = '/movements'}
        >
          Ver todo →
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="movements-empty-state">
          <p className="movements-empty-state-desc">No hay movimientos en este trimestre</p>
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
            <tbody className="movements-tbody">
              {rows.map(row => {
                const isIncome = row.type === 'income';

                return (
                  <tr
                    key={row.id}
                    onClick={() => {
                      if (row.type === 'income') {
                        window.location.href = `/invoices/${row.originalId}`;
                      } else {
                        window.location.href = `/expenses/${row.originalId}`;
                      }
                    }}
                  >
                    <td>{isIncome ? (row.invoice_number || '—') : '—'}</td>
                    <td>
                      <div className="movements-cell-concept">{row.concept}</div>
                      <div className="movements-cell-date">{row.date}</div>
                    </td>
                    <td>
                      <span className={`badge ${isIncome ? 'badge-success' : 'badge-error'}`}>
                        {isIncome ? 'Ingreso' : 'Gasto'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <StatusBadge status={row.status} isIncome={isIncome} />
                    </td>
                    <td className={`movements-cell-amount ${isIncome ? 'income' : 'expense'}`}>
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
