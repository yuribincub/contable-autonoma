/**
 * useInvoice.js
 * Carga el ingreso por ID y el perfil fiscal del autónomo usando la API del backend.
 *
 * El backend expone /profile?user_id=xxx para cargar los datos fiscales sin hacer
 * llamadas directas desde el frontend a Supabase.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import api from '../config/api';

export function useInvoice(session, incomeId) {
  const [income, setIncome] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  useEffect(() => {
    if (!incomeId) return;
    fetchData();
  }, [incomeId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = session.user.id;

      const [incomeRes, profileRes] = await Promise.all([
        api.get(`/income/${incomeId}?user_id=${userId}`),
        api.get(`/profile?user_id=${userId}`),
      ]);

      setIncome(incomeRes.data);

      const profileData = profileRes.data || {};
      setProfile({
        full_name: profileData.full_name || session.user.email.split('@')[0],
        email: session.user.email,
        nif: profileData.cif_nif || '— Configura tu perfil —',
        address: profileData.address || '',
        city: profileData.city || '',
        postal_code: profileData.postal_code || '',
        province: profileData.province || '',
        phone: profileData.phone || '',
      });
    } catch (err) {
      console.error('Error cargando factura:', err);
      setError('No se pudo cargar la factura.');
    } finally {
      setLoading(false);
    }
  };

  // Anular factura — pide confirmación, luego hace PATCH
  const cancelInvoice = async () => {
    const confirmed = window.confirm(
      `¿Seguro que quieres anular la factura ${income.invoice_number}?\nEsta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setCancelling(true);
    setCancelError(null);
    try {
      const { data } = await api.patch(`/income/${incomeId}/status`, {
        user_id: session.user.id,
        invoice_status: 'cancelled',
      });
      // Actualizar estado local sin recargar la página
      setIncome(prev => ({ ...prev, invoice_status: data.invoice_status }));
    } catch (err) {
      console.error('Error anulando factura:', err);
      setCancelError('No se pudo anular la factura. Inténtalo de nuevo.');
    } finally {
      setCancelling(false);
    }
  };

  // Cálculos fiscales — cliente EEUU: IVA siempre 0%
  const calculos = income ? (() => {
    const base = Number(income.base_amount);
    const irpfRate = Number(income.irpf_rate) || 0;
    const irpfAmount = (base * irpfRate) / 100;
    return {
      base,
      irpfRate,
      irpfAmount,
      vatAmount: 0,
      total: base - irpfAmount,
    };
  })() : null;

  return {
    income, profile, calculos,
    loading, error,
    cancelling, cancelError, cancelInvoice,
  };
}