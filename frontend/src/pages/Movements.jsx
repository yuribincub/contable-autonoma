import AppLayout from '../components/AppLayout';
import { useDashboard } from '../hooks/useDashboard';
import { MovementsGrid, QuarterSelector } from '../components/DashboardComponents';
import { useState } from 'react';

export default function Movements({ session }) {
    const { income, expenses, loading, selectedQuarter, selectedYear, setSelectedQuarter, setSelectedYear } = useDashboard(session);
    const [filters, setFilters] = useState({
        type: 'all',
        status: 'all',
    });

    if (loading) {
        return (
            <AppLayout session={session} currentPage="movements">
                <div className="page-header">
                    <h2 className="page-title">Todos los movimientos</h2>
                </div>
                <div className="loading-state">
                    <p>Loading movements...</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout session={session} currentPage="movements">
            <div className="page-header">
                <h2 className="page-title">Todos los movimientos</h2>
            </div>

            <div className="filters-section">
                <QuarterSelector
                    quarter={selectedQuarter}
                    year={selectedYear}
                    onQuarterChange={setSelectedQuarter}
                    onYearChange={setSelectedYear}
                />
                <div className="filters-grid">
                    <select
                        className="form-select"
                        value={filters.type}
                        onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    >
                        <option value="all">All Types</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                    </select>
                    <select
                        className="form-select"
                        value={filters.status}
                        onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                        <option value="all">All Status</option>
                        <option value="issued">Cobrado</option>
                        <option value="pagado">Pagado</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="borrador">Borrador</option>
                    </select>
                </div>
            </div>

            <MovementsGrid
                income={income}
                expenses={expenses}
                maxRows={Infinity}
                filters={filters}
                title="Todos los movimientos"
                showViewAllButton={false}
            />
        </AppLayout>
    );
}

