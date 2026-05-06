/**
 * useDashboard.js
 * Toda la lógica del dashboard: fetch, cálculos fiscales y alertas.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import api from '../config/api';

export function useDashboard(session) {
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [session?.user?.id]);

  useEffect(() => {
    fetchData();
  }, [selectedQuarter, selectedYear, session?.user?.id]);

  const fetchProfile = async () => {
    try {
      const userId = session.user.id;
      const res = await api.get(`/profile?user_id=${userId}`);
      setProfile(res.data);
    } catch (error) {
      console.error('Error cargando perfil:', error);
    }
  };

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
  const DUE_DATES = {
    1: { month: 4, day: 20, label: '20 abr' },
    2: { month: 7, day: 20, label: '20 jul' },
    3: { month: 10, day: 20, label: '20 oct' },
    4: { month: 1, day: 30, label: '30 ene' }, // Q4 due in January of the next year
  };

  const calculateDays = (quarter, year) => {
    const due = DUE_DATES[quarter];
    const dueYear = quarter === 4 ? year + 1 : year;
    const dueDate = new Date(dueYear, due.month - 1, due.day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const remainingDays = calculateDays(selectedQuarter, selectedYear);
  const dueDateLabel = DUE_DATES[selectedQuarter].label;

  // Only show alerts for the current quarter when there are 30 days or fewer left
  const showAlerts = selectedQuarter === currentQuarter && remainingDays <= 30;

  const fiscalAlerts = showAlerts ? [
    {
      id: 'modelo-130',
      model: 'Modelo 130',
      description: `IRPF T${selectedQuarter} — ${formatEUR(irpf130)}`,
      dueDate: dueDateLabel,
      days: remainingDays,
      urgent: remainingDays <= 7,
    },
    {
      id: 'modelo-303',
      model: 'Modelo 303',
      description: `IVA T${selectedQuarter} — ${formatEUR(Math.abs(vat303))} a compensar`,
      dueDate: dueDateLabel,
      days: remainingDays,
      urgent: remainingDays <= 7,
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
    profile,
  };
}

// Utilidad compartida (misma que en DashboardComponents)
function formatEUR(amount) {
  return Number(amount).toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €';
}
