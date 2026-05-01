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
        <div style={styles.container}>
            {/* Cabecera */}
            <div style={styles.header}>
                <h1 style={styles.title}>📊 Contable</h1>
                <button style={styles.logoutBtn} onClick={handleLogout}>Salir</button>
            </div>

            {/* Selector de trimestre */}
            <div style={styles.quarterSelector}>
                <select
                    style={styles.select}
                    value={selectedQuarter}
                    onChange={e => setSelectedQuarter(Number(e.target.value))}
                >
                    <option value={1}>T1 — Ene/Feb/Mar</option>
                    <option value={2}>T2 — Abr/May/Jun</option>
                    <option value={3}>T3 — Jul/Ago/Sep</option>
                    <option value={4}>T4 — Oct/Nov/Dic</option>
                </select>
                <select
                    style={styles.select}
                    value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                >
                    {[2024, 2025, 2026].map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>

            {loading ? <p style={{ padding: 20 }}>Cargando...</p> : (
                <>
                    {/* Tarjetas de resumen */}
                    <div style={styles.cards}>
                        <div style={styles.card}>
                            <p style={styles.cardLabel}>Ingresos</p>
                            <p style={styles.cardValue}>{totalIncome.toFixed(2)} €</p>
                        </div>
                        <div style={styles.card}>
                            <p style={styles.cardLabel}>Gastos deducibles</p>
                            <p style={styles.cardValue}>{totalExpenses.toFixed(2)} €</p>
                        </div>
                        <div style={{ ...styles.card, backgroundColor: profit >= 0 ? '#f0fdf4' : '#fef2f2' }}>
                            <p style={styles.cardLabel}>Beneficio</p>
                            <p style={styles.cardValue}>{profit.toFixed(2)} €</p>
                        </div>
                    </div>

                    {/* Modelos fiscales */}
                    <div style={styles.taxSection}>
                        <h2 style={styles.sectionTitle}>Modelos fiscales T{selectedQuarter}/{selectedYear}</h2>
                        <div style={styles.cards}>
                            <div style={styles.taxCard}>
                                <p style={styles.taxLabel}>Modelo 130 — IRPF</p>
                                <p style={styles.taxValue}>{irpf130.toFixed(2)} €</p>
                                <p style={styles.taxNote}>20% sobre beneficio</p>
                            </div>
                            <div style={styles.taxCard}>
                                <p style={styles.taxLabel}>Modelo 303 — IVA</p>
                                <p style={styles.taxValue}>{vat303.toFixed(2)} €</p>
                                <p style={styles.taxNote}>IVA soportado a compensar</p>
                            </div>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div style={styles.actions}>
                        <button style={styles.addBtn} onClick={() => window.location.href = '/income'}>
                            + Añadir ingreso
                        </button>
                        <button style={{ ...styles.addBtn, backgroundColor: '#16a34a' }} onClick={() => window.location.href = '/expenses'}>
                            + Añadir gasto
                        </button>
                    </div>

                    {/* Últimos movimientos */}
                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Últimos ingresos</h2>
                        {income.length === 0 ? <p style={styles.empty}>No hay ingresos en este trimestre</p> : (
                            income.slice(0, 5).map(i => (
                                <div key={i.id} style={styles.row}>
                                    <span>{i.date} — {i.concept}</span>
                                    <span style={{ fontWeight: 600 }}>{Number(i.base_amount).toFixed(2)} €</span>
                                </div>
                            ))
                        )}
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Últimos gastos</h2>
                        {expenses.length === 0 ? <p style={styles.empty}>No hay gastos en este trimestre</p> : (
                            expenses.slice(0, 5).map(e => (
                                <div key={e.id} style={styles.row}>
                                    <span>{e.date} — {e.concept}</span>
                                    <span style={{ fontWeight: 600 }}>{Number(e.total_amount).toFixed(2)} €</span>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

const styles = {
    container: { maxWidth: 700, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    title: { margin: 0, fontSize: 24 },
    logoutBtn: { background: 'none', border: '1px solid #ddd', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' },
    quarterSelector: { display: 'flex', gap: 12, marginBottom: 24 },
    select: { padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 },
    cards: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 },
    card: { backgroundColor: '#f9fafb', padding: 20, borderRadius: 12, textAlign: 'center' },
    cardLabel: { margin: '0 0 8px', color: '#666', fontSize: 14 },
    cardValue: { margin: 0, fontSize: 24, fontWeight: 700 },
    taxSection: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: 600, marginBottom: 12 },
    taxCard: { backgroundColor: '#eff6ff', padding: 20, borderRadius: 12, textAlign: 'center' },
    taxLabel: { margin: '0 0 8px', color: '#1d4ed8', fontSize: 14, fontWeight: 600 },
    taxValue: { margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: '#1d4ed8' },
    taxNote: { margin: 0, fontSize: 12, color: '#666' },
    actions: { display: 'flex', gap: 12, marginBottom: 32 },
    addBtn: { flex: 1, padding: 14, backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer' },
    section: { marginBottom: 24 },
    row: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f0f0' },
    empty: { color: '#999', fontSize: 14 },
};