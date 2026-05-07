/**
 * src/components/ClientSelector.jsx
 * Dropdown de búsqueda de clientes para usar en IncomeForm.
 * Carga clientes desde el Express (GET /clients), no Supabase directo.
 *
 * Props:
 *   value    — { client_id, client_name, vat_rate, is_non_eu } | null
 *   onChange — (value | null) => void
 */

import { useState, useEffect, useRef } from 'react';
import api from '../config/api';

export default function ClientSelector({ value, onChange }) {
    const [clients, setClients] = useState([]);
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const wrapRef = useRef(null);

    // Carga clientes una sola vez al montar
    useEffect(() => {
        async function load() {
            try {
                const { data } = await api.get('/clients');
                setClients(data.data ?? []);
            } catch (err) {
                console.error('[ClientSelector]', err.response?.data || err.message);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // Cierra el dropdown al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setOpen(false);
                setQuery('');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.tax_id.toLowerCase().includes(query.toLowerCase())
    );

    function handleSelect(client) {
        onChange({
            client_id: client.id,
            client_name: client.name,
            vat_rate: client.vat_rate,   // 0 ó 21 — columna computed en DB
            is_non_eu: client.is_non_eu,
        });
        setOpen(false);
        setQuery('');
    }

    // ── Cliente ya seleccionado → chip ───────────────────────────────────
    if (value) {
        return (
            <div className="form-group">
                <label className="form-label">Cliente</label>
                <div className="client-chip">
                    <div className="client-chip__info">
                        <span className="client-chip__name">{value.client_name}</span>
                        <span className={`client-chip__vat ${value.is_non_eu ? 'client-chip__vat--exempt' : ''}`}>
                            {value.is_non_eu ? 'Sin IVA · Exento art. 21' : 'IVA 21% aplicado'}
                        </span>
                    </div>
                    <button
                        type="button"
                        className="client-chip__clear"
                        onClick={() => onChange(null)}
                        aria-label="Quitar cliente"
                    >
                        ✕
                    </button>
                </div>
            </div>
        );
    }

    // ── Sin cliente → buscador con dropdown ─────────────────────────────
    return (
        <div className="form-group client-selector" ref={wrapRef}>
            <label className="form-label">Cliente</label>
            <input
                className="form-input"
                type="text"
                placeholder={loading ? 'Cargando clientes...' : 'Buscar cliente por nombre o NIF...'}
                value={query}
                onFocus={() => setOpen(true)}
                onChange={e => { setQuery(e.target.value); setOpen(true); }}
                disabled={loading}
                autoComplete="off"
            />

            {open && filtered.length > 0 && (
                <ul className="client-dropdown">
                    {filtered.map(client => (
                        <li
                            key={client.id}
                            className="client-dropdown__item"
                            onMouseDown={() => handleSelect(client)}
                        >
                            <div>
                                <span className="client-dropdown__name">{client.name}</span>
                                <span className="client-dropdown__taxid">{client.tax_id}</span>
                            </div>
                            <span className={`tag ${client.is_non_eu ? 'tag--exempt' : 'tag--vat'}`}>
                                {client.is_non_eu ? 'Sin IVA' : '21% IVA'}
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            {open && query && filtered.length === 0 && (
                <div className="client-dropdown client-dropdown--empty">
                    No encontrado. <a href="/clients">Crear cliente →</a>
                </div>
            )}
        </div>
    );
}
