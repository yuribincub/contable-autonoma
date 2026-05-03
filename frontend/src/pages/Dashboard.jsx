/**
 * Dashboard.jsx — página principal
 * Solo estructura JSX. Lógica en useDashboard, visual en DashboardComponents.
 */

import { useDashboard } from '../hooks/useDashboard';
import AppLayout from '../components/AppLayout';
import {
    QuarterSelector,
    SummaryCards,
    TaxCards,
    MovementsGrid,
    FiscalAlerts,
} from '../components/DashboardComponents';

export default function Dashboard({ session }) {
    const {
        loading,
        income,
        expenses,
        selectedQuarter,
        selectedYear,
        setSelectedQuarter,
        setSelectedYear,
        totals,
        taxes,
        fiscalAlerts,
    } = useDashboard(session);

    return (
        <AppLayout session={session} currentPage="resumen">

            {/* Cabecera de página */}
            <div className="page-header">
                <div>
                    <h2 className="page-title">Hola 👋</h2>
                    <p className="page-subtitle">
                        Resumen del T{selectedQuarter} {selectedYear}
                    </p>
                </div>
                <QuarterSelector
                    quarter={selectedQuarter}
                    year={selectedYear}
                    onQuarterChange={setSelectedQuarter}
                    onYearChange={setSelectedYear}
                />
            </div>

            {/* Alertas fiscales — solo si hay */}
            {fiscalAlerts.length > 0 && <FiscalAlerts alerts={fiscalAlerts} />}

            {/* Skeleton mientras carga */}
            {loading ? (
                <div className="grid-metrics">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="card">
                            <div className="skeleton skeleton-text" style={{ width: '40%', marginBottom: 12 }} />
                            <div className="skeleton skeleton-amount" />
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <SummaryCards totals={totals} />
                    <TaxCards taxes={taxes} quarter={selectedQuarter} year={selectedYear} />
                    <MovementsGrid income={income} expenses={expenses} />
                </>
            )}

        </AppLayout>
    );
}
