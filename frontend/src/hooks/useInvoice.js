/**
 * useInvoice.js
 * Carga el ingreso por ID y el perfil fiscal del autónomo desde Supabase.
 *
 * Tabla Supabase necesaria: user_profile
 * SQL para crearla (ejecutar en Supabase → SQL Editor):
 * ─────────────────────────────────────────────────────
 * create table user_profile (
 *   id                   uuid primary key default gen_random_uuid(),
 *   user_id              uuid references auth.users(id) unique not null,
 *   full_name            text,
 *   nif                  text,
 *   address              text,
 *   city                 text,
 *   postal_code          text,
 *   province             text,
 *   phone                text,
 *   email                text,
 *   activity_description text,
 *   created_at           timestamptz default now()
 * );
 * alter table user_profile enable row level security;
 * create policy "Usuario ve su propio perfil"
 *   on user_profile for all using (auth.uid() = user_id);
 * ─────────────────────────────────────────────────────
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
        supabase.from('user_profile').select('*').eq('user_id', userId).single(),
      ]);

      setIncome(incomeRes.data);

      if (profileRes.error) {
        setProfile({
          full_name: session.user.email.split('@')[0],
          email: session.user.email,
          nif: '— Configura tu perfil —',
          address: '',
          city: '',
          postal_code: '',
          province: '',
          phone: '',
        });
      } else {
        setProfile(profileRes.data);
      }
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