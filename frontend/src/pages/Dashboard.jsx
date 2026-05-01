// Panel principal — resumen trimestral de ingresos, gastos e impuestos
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import api from '../config/api';

export default function Dashboard({ session }) {
    const [income, setIncome] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Trimestre y año actual
    const currentYear = new Date().getFullYear();
    const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
    const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);
    const [selectedYear, setSelectedYear] = useState(currentYear);

    useEffect(() => {
        fetchData();
    }, [selectedQuarter, selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const userId = session.user.id;

            const [incomeRes, expensesRes] = await Promise.all([
                api.get(`/income?user_id=${userId}&quarter=${selectedQuarter}&year=${selectedYear}`),
                api.get(`/expenses?user_id=${userId}&quarter=${selectedQuarter}&year=${selectedYear}`)
            ]);

            setIncome(incomeRes.data);
            setExpenses(expensesRes.data);
        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            setLoading(false);
        }
    };

    // Cálculos fiscales del trimestre
    const totalIncome = income.reduce((sum, i) => sum + Number(i.base_amount), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.deductible_amount), 0);
    const profit = totalIncome - totalExpenses;

    // Modelo 130 — IRPF: 20% sobre beneficio
    const irpf130 = profit > 0 ? profit * 0.20 : 0;

    // Modelo 303 — IVA: solo IVA soportado en gastos (repercutido siempre 0)
    const vatSupported = expenses.reduce((sum, e) => sum + Number(e.vat_amount), 0);
    const vat303 = -vatSupported; // negativo = a compensar

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="dashboard-container">
            {/* Cabecera */}
            <div className="dashboard-header">
                <h1 className="dashboard-title">📊 Contable</h1>
                <button className="btn btn-secondary" onClick={handleLogout}>Salir</button>
            </div>

            {/* Selector de trimestre */}
            <div className="quarter-selector">
                <select
                    className="form-select"
                    value={selectedQuarter}
                    onChange={e => setSelectedQuarter(Number(e.target.value))}
                >
                    <option value={1}>T1 — Ene/Feb/Mar</option>
                    <option value={2}>T2 — Abr/May/Jun</option>
                    <option value={3}>T3 — Jul/Ago/Sep</option>
                    <option value={4}>T4 — Oct/Nov/Dic</option>
                </select>
                <select
                    className="form-select"
                    value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                >
                    {[2024, 2025, 2026].map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>

            {loading ? <p className="empty-text">Cargando...</p> : (
                <>
                    {/* Tarjetas de resumen */}
                    <div className="cards-grid">
                        <div className="card-metric">
                            <p className="card-metric-label">Ingresos</p>
                            <p className="card-metric-value">{totalIncome.toFixed(2)} €</p>
                        </div>
                        <div className="card-metric">
                            <p className="card-metric-label">Gastos deducibles</p>
                            <p className="card-metric-value">{totalExpenses.toFixed(2)} €</p>
                        </div>
                        <div className={`card-metric ${profit >= 0 ? 'card-profit-positive' : 'card-profit-negative'}`}>
                            <p className="card-metric-label">Beneficio</p>
                            <p className="card-metric-value">{profit.toFixed(2)} €</p>
                        </div>
                    </div>

                    {/* Modelos fiscales */}
                    <div className="tax-section">
                        <h2 className="section-title">Modelos fiscales T{selectedQuarter}/{selectedYear}</h2>
                        <div className="cards-grid">
                            <div className="tax-card">
                                <p className="tax-label">Modelo 130 — IRPF</p>
                                <p className="tax-value">{irpf130.toFixed(2)} €</p>
                                <p className="tax-note">20% sobre beneficio</p>
                            </div>
                            <div className="tax-card">
                                <p className="tax-label">Modelo 303 — IVA</p>
                                <p className="tax-value">{vat303.toFixed(2)} €</p>
                                <p className="tax-note">IVA soportado a compensar</p>
                            </div>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="actions">
                        <button className="btn btn-primary" onClick={() => window.location.href = '/income'}>
                            + Añadir ingreso
                        </button>
                        <button className="btn btn-success" onClick={() => window.location.href = '/expenses'}>
                            + Añadir gasto
                        </button>
                    </div>

                    {/* Últimos movimientos */}
                    <div className="section">
                        <h2 className="section-title">Últimos ingresos</h2>
                        {income.length === 0 ? <p className="empty-text">No hay ingresos en este trimestre</p> : (
                            income.slice(0, 5).map(i => (
                                <div key={i.id} className="list-row">
                                    <span>{i.date} — {i.concept}</span>
                                    <span className="mono">{Number(i.base_amount).toFixed(2)} €</span>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="section">
                        <h2 className="section-title">Últimos gastos</h2>
                        {expenses.length === 0 ? <p className="empty-text">No hay gastos en este trimestre</p> : (
                            expenses.slice(0, 5).map(e => (
                                <div key={e.id} className="list-row">
                                    <span>{e.date} — {e.concept}</span>
                                    <span className="mono">{Number(e.total_amount).toFixed(2)} €</span>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}