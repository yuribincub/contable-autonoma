/**
 * src/pages/Clients.jsx
 * Página de gestión de clientes.
 * Conecta useClients + ClientModal + tabla con filtros y búsqueda.
 */

import { useState, useMemo } from 'react';
import { Users, Plus, Search } from 'lucide-react';
import { useClients } from '../hooks/useClients';
import ClientModal from '../components/ClientModal';
import AppLayout from '../components/AppLayout';

// ─── Helpers de tabla ─────────────────────────────────────────────────────

function getInitials(name = '') {
    return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function TypeBadge({ client }) {
    if (client.is_non_eu) return <span className="badge badge-warning">🌍 Extracomunitario</span>;
    if (client.country_code === 'ES') return <span className="badge badge-success">🇪🇸 Nacional</span>;
    return <span className="badge badge-brand">🇪🇺 Intracomunitario</span>;
}

function VatBadge({ client }) {
    return client.is_non_eu
        ? <span className="tag tag--exempt">Exento (art. 21)</span>
        : <span className="tag tag--vat">21% IVA</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function Clients({ session }) {
    const {
        clients,
        loading,
        error,
        stats,
        createClient,
        updateClient,
        deleteClient,
    } = useClients(session);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // 'all' | 'vat' | 'exempt'
    const [toast, setToast] = useState(null);

    // ── Filtrado + búsqueda ────────────────────────────────────────────────
    const visibleClients = useMemo(() => {
        let list = clients;
        if (filter === 'vat') list = list.filter(c => !c.is_non_eu);
        if (filter === 'exempt') list = list.filter(c => c.is_non_eu);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.tax_id.toLowerCase().includes(q) ||
                (c.email ?? '').toLowerCase().includes(q)
            );
        }
        return list;
    }, [clients, filter, search]);

    // ── Toast ──────────────────────────────────────────────────────────────
    function showToast(msg, type = 'success') {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    }

    // ── Handlers ───────────────────────────────────────────────────────────
    function handleNew() {
        setEditingClient(null);
        setModalOpen(true);
    }

    function handleEdit(client) {
        setEditingClient(client);
        setModalOpen(true);
    }

    async function handleSave(formData, id) {
        try {
            if (id) {
                await updateClient(id, formData);
                showToast('Cliente actualizado correctamente');
            } else {
                await createClient(formData);
                showToast('Cliente guardado correctamente');
            }
            setModalOpen(false);
        } catch (err) {
            showToast(err.response?.data?.error || 'Error al guardar el cliente', 'error');
        }
    }

    async function handleDelete(e, client) {
        e.stopPropagation();
        if (!window.confirm(`¿Eliminar a "${client.name}"? No se puede deshacer.`)) return;
        try {
            await deleteClient(client.id);
            showToast('Cliente eliminado');
        } catch {
            showToast('No se pudo eliminar el cliente', 'error');
        }
    }

    const FILTERS = [
        { key: 'all', label: 'Todos' },
        { key: 'vat', label: 'Con IVA' },
        { key: 'exempt', label: 'Exentos' },
    ];

    // ─── Render ────────────────────────────────────────────────────────────
    return (
        <AppLayout session={session} currentPage="clientes">
            {/* Cabecera */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Clientes</h1>
                    <p className="page-subtitle">Gestiona tus clientes y su configuración de IVA</p>
                </div>
                <button className="btn btn-primary" onClick={handleNew}>
                    <Plus size={16} />
                    Nuevo cliente
                </button>
            </div>

            {/* Estadísticas */}
            <div className="clients-stats">
                <div className="card card-sm">
                    <p className="summary-card-label">Total clientes</p>
                    <p className="summary-card-value" style={{ color: 'var(--color-brand-500)' }}>
                        {stats.total}
                    </p>
                </div>
                <div className="card card-sm">
                    <p className="summary-card-label">Con IVA (21%)</p>
                    <p className="summary-card-value income">{stats.withVat}</p>
                </div>
                <div className="card card-sm">
                    <p className="summary-card-label">Exentos de IVA</p>
                    <p className="summary-card-value" style={{ color: 'var(--color-warning-700)' }}>
                        {stats.exempt}
                    </p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="clients-toolbar">
                <div className="clients-search">
                    <Search className="clients-search__icon" size={16} />
                    <input
                        className="form-input clients-search__input"
                        type="text"
                        placeholder="Buscar por nombre, NIF o email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="clients-filter-group">
                    {FILTERS.map(f => (
                        <button
                            key={f.key}
                            className={`clients-filter-btn ${filter === f.key ? 'clients-filter-btn--active' : ''}`}
                            onClick={() => setFilter(f.key)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {/* Tabla */}
            <div className="table-wrapper">
                {loading ? (
                    <p className="loading-state">Cargando clientes...</p>
                ) : visibleClients.length === 0 ? (
                    <div className="empty-state">
                        <Users size={32} className="empty-state-icon" />
                        <p className="empty-state-desc">
                            {search || filter !== 'all'
                                ? 'No hay clientes que coincidan con tu búsqueda.'
                                : 'Todavía no tienes clientes. ¡Añade el primero!'}
                        </p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>NIF / VAT</th>
                                <th>País</th>
                                <th>Tipo</th>
                                <th>IVA en factura</th>
                                <th>Email</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleClients.map(client => (
                                <tr key={client.id} onClick={() => handleEdit(client)} style={{ cursor: 'pointer' }}>
                                    <td>
                                        <div className="client-name-cell">
                                            <div className="avatar avatar-sm">{getInitials(client.name)}</div>
                                            <span className="client-name-cell__text">{client.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
                                        {client.tax_id}
                                    </td>
                                    <td style={{ fontSize: 'var(--text-sm)' }}>{client.country}</td>
                                    <td><TypeBadge client={client} /></td>
                                    <td><VatBadge client={client} /></td>
                                    <td style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                        {client.email || '—'}
                                    </td>
                                    <td>
                                        <div className="row-actions">
                                            <button
                                                className="row-action-btn"
                                                onClick={e => { e.stopPropagation(); handleEdit(client); }}
                                                title="Editar"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="row-action-btn row-action-btn--danger"
                                                onClick={e => handleDelete(e, client)}
                                                title="Eliminar"
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>


            {/* Modal */}
            <ClientModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
                editingClient={editingClient}
            />

            {/* Toast */}
            {toast && (
                <div className={`toast ${toast.type === 'error' ? 'toast--error' : ''}`}>
                    {toast.type === 'error' ? '⚠' : '✓'} {toast.msg}
                </div>
            )}

        </AppLayout>
    );
}
