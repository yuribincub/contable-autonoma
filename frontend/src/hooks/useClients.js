/**
 * src/hooks/useClients.js
 * Hook con toda la lógica de clientes.
 * Clients.jsx solo pinta — no calcula ni hace fetch.
 * Mismo patrón que useIncome.js y useExpenses.js → todo pasa por api (Express).
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../config/api';

// ─── Helpers de IVA — úsalos en useIncome, generateInvoicePDF, etc. ─────

export function getVatRate(client) {
    if (!client) return 0;       // sin cliente: sin IVA (cliente EEUU por defecto)
    return client.is_non_eu ? 0 : 21;
}

export function getVatLabel(client) {
    if (!client) return '';
    return client.is_non_eu ? 'Exento (art. 21 Ley 37/1992)' : '21% IVA';
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useClients(session) {
    const userId = session?.user?.id;
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ── Fetch todos los clientes activos ──────────────────────────────────
    const fetchClients = useCallback(async () => {
        if (!userId) {
            setClients([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get('/clients', { params: { user_id: userId } });
            setClients(data.data ?? []);
        } catch (err) {
            console.error('[useClients.fetchClients]', err.response?.data || err.message);
            setError('No se pudieron cargar los clientes.');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { fetchClients(); }, [fetchClients]);

    // ── Crear ──────────────────────────────────────────────────────────────
    async function createClient(formData) {
        const { data } = await api.post('/clients', {
            ...formData,
            user_id: userId,
        });
        setClients(prev => [data.data, ...prev]);
        return data.data;
    }

    // ── Actualizar ─────────────────────────────────────────────────────────
    async function updateClient(id, formData) {
        const { data } = await api.put(`/clients/${id}`, {
            user_id: userId,
            ...formData,
        });
        setClients(prev => prev.map(c => c.id === id ? data.data : c));
        return data.data;
    }

    // ── Soft delete ────────────────────────────────────────────────────────
    async function deleteClient(id) {
        await api.delete(`/clients/${id}`, { data: { user_id: userId } });
        setClients(prev => prev.filter(c => c.id !== id));
    }

    // ── Stats derivadas del estado (sin llamada extra) ─────────────────────
    const stats = {
        total: clients.length,
        withVat: clients.filter(c => !c.is_non_eu).length,
        exempt: clients.filter(c => c.is_non_eu).length,
    };

    return {
        clients,
        loading,
        error,
        stats,
        fetchClients,
        createClient,
        updateClient,
        deleteClient,
    };
}