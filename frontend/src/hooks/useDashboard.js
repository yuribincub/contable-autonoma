/**
 * useDashboard.js
 * Toda la lógica del dashboard: fetch, cálculos fiscales y alertas.
 */

import { useState, useEffect } from 'react';
//import { supabase } from '../config/supabase';
import api from '../config/api';

export function useDashboard(session) {
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
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
        api.get(`/expenses?user_id=${userId}&quarter=${selectedQuarter}&year=${selectedYear}`),
      ]);
      setIncome(incomeRes.data);
      setExpenses(expensesRes.data);
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Cálculos fiscales ────────────────────────────────────────────────────

  const totalIncome = income.reduce((sum, i) => sum + Number(i.base_amount), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.deductible_amount), 0);
  const profit = totalIncome - totalExpenses;

  // Modelo 130 — IRPF: 20% sobre beneficio trimestral
  const irpf130 = profit > 0 ? profit * 0.20 : 0;

  // Modelo 303 — IVA soportado en gastos (repercutido = 0, cliente EEUU)
  const vatSupported = expenses.reduce((sum, e) => sum + Number(e.vat_amount), 0);
  const vat303 = -vatSupported; // negativo = a compensar

  // ── Alertas fiscales dinámicas ──────────────────────────────────────────
  // Fechas de vencimiento por trimestre (siempre el 20 del mes siguiente al cierre)
  const VENCIMIENTOS = {
    1: { mes: 4, dia: 20, label: '20 abr' },
    2: { mes: 7, dia: 20, label: '20 jul' },
    3: { mes: 10, dia: 20, label: '20 oct' },
    4: { mes: 1, dia: 30, label: '30 ene' }, // Q4 vence en enero del año siguiente
  };

  const calcularDias = (quarter, year) => {
    const v = VENCIMIENTOS[quarter];
    const anioVencimiento = quarter === 4 ? year + 1 : year;
    const fechaVencimiento = new Date(anioVencimiento, v.mes - 1, v.dia);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const diff = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const diasRestantes = calcularDias(selectedQuarter, selectedYear);
  const labelVencimiento = VENCIMIENTOS[selectedQuarter].label;

  // Solo mostrar alertas si el trimestre seleccionado es el actual o anterior
  // y quedan menos de 30 días (o ya venció)
  const mostrarAlertas = selectedQuarter === currentQuarter && diasRestantes <= 30;

  const fiscalAlerts = mostrarAlertas ? [
    {
      id: 'modelo-130',
      modelo: 'Modelo 130',
      descripcion: `IRPF T${selectedQuarter} — ${formatEUR(irpf130)}`,
      vencimiento: labelVencimiento,
      dias: diasRestantes,
      urgente: diasRestantes <= 7,
    },
    {
      id: 'modelo-303',
      modelo: 'Modelo 303',
      descripcion: `IVA T${selectedQuarter} — ${formatEUR(Math.abs(vat303))} a compensar`,
      vencimiento: labelVencimiento,
      dias: diasRestantes,
      urgente: diasRestantes <= 7,
    },
  ] : [];

  return {
    loading,
    income,
    expenses,
    selectedQuarter,
    selectedYear,
    setSelectedQuarter,
    setSelectedYear,
    totals: { income: totalIncome, expenses: totalExpenses, profit },
    taxes: { irpf130, vat303 },
    fiscalAlerts,
  };
}

// Utilidad compartida (misma que en DashboardComponents)
function formatEUR(amount) {
  return Number(amount).toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €';
}
