/**
 * src/components/ClientModal.jsx
 * Modal de alta y edición de clientes.
 * No hace fetch — delega el guardado en onSave (manejado por Clients.jsx → useClients).
 * Auto-detecta is_non_eu al cambiar país. Toggle permite override manual.
 */

import { useState, useEffect } from 'react';
import { EU_COUNTRIES, NON_EU_COUNTRIES } from '../data/countries';

const EMPTY_FORM = {
    name: '',
    tax_id: '',
    country: '',
    country_code: '',
    email: '',
    phone: '',
    address: '',
    is_non_eu: false,
    notes: '',
};

export default function ClientModal({ isOpen, onClose, onSave, editingClient }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const isEditing = !!editingClient;

    // Rellena el formulario al abrir en modo edición
    useEffect(() => {
        if (isOpen) {
            setForm(editingClient ? {
                name: editingClient.name ?? '',
                tax_id: editingClient.tax_id ?? '',
                country: editingClient.country ?? '',
                country_code: editingClient.country_code ?? '',
                email: editingClient.email ?? '',
                phone: editingClient.phone ?? '',
                address: editingClient.address ?? '',
                is_non_eu: editingClient.is_non_eu ?? false,
                notes: editingClient.notes ?? '',
            } : EMPTY_FORM);
            setErrors({});
        }
    }, [editingClient, isOpen]);

    // ── Al cambiar país, auto-detecta is_non_eu ───────────────────────────
    function handleCountryChange(e) {
        const allCountries = [...EU_COUNTRIES, ...NON_EU_COUNTRIES];
        const selected = allCountries.find(c => c.value === e.target.value);
        if (!selected) {
            setForm(f => ({ ...f, country: '', country_code: '', is_non_eu: false }));
            return;
        }
        setForm(f => ({
            ...f,
            country: selected.value,
            country_code: selected.code,
            is_non_eu: !selected.isEU,
        }));
    }

    function handleChange(e) {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
        if (errors[name]) setErrors(err => ({ ...err, [name]: null }));
    }

    function handleToggleNonEU() {
        setForm(f => ({ ...f, is_non_eu: !f.is_non_eu }));
    }

    function validate() {
        const errs = {};
        if (!form.name.trim()) errs.name = 'El nombre es obligatorio';
        if (!form.tax_id.trim()) errs.tax_id = 'El NIF / VAT es obligatorio';
        if (!form.country) errs.country = 'Selecciona un país';
        return errs;
    }

    async function handleSubmit() {
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setSaving(true);
        try {
            await onSave(form, editingClient?.id);
            // onClose lo llama el padre en handleSave tras éxito
        } catch {
            // el error lo muestra el padre con el toast
        } finally {
            setSaving(false);
        }
    }

    if (!isOpen) return null;

    const vatLabel = form.is_non_eu
        ? 'Facturas sin IVA · Exento art. 21 Ley 37/1992'
        : 'Facturas con IVA al 21% · Se incluirá en el Modelo 303';

    return (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal">

                {/* Header */}
                <div className="modal__header">
                    <div>
                        <h2 className="modal__title">
                            {isEditing ? 'Editar cliente' : 'Nuevo cliente'}
                        </h2>
                        <p className="modal__subtitle">
                            Los datos se usarán para generar las facturas automáticamente
                        </p>
                    </div>
                    <button className="modal__close" onClick={onClose} aria-label="Cerrar">✕</button>
                </div>

                {/* Body */}
                <div className="modal__body">

                    {/* Nombre */}
                    <div className="form-group">
                        <label className="form-label">
                            Nombre o razón social <span className="form-required">*</span>
                        </label>
                        <input
                            className={`form-input ${errors.name ? 'input-error' : ''}`}
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Ej: Acme Corp S.L."
                        />
                        {errors.name && <span className="form-error">{errors.name}</span>}
                    </div>

                    {/* NIF + País */}
                    <div className="modal__row">
                        <div className="form-group">
                            <label className="form-label">
                                NIF / CIF / VAT <span className="form-required">*</span>
                            </label>
                            <input
                                className={`form-input ${errors.tax_id ? 'input-error' : ''}`}
                                type="text"
                                name="tax_id"
                                value={form.tax_id}
                                onChange={handleChange}
                                placeholder="Ej: B-12345678"
                            />
                            {errors.tax_id && <span className="form-error">{errors.tax_id}</span>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                País <span className="form-required">*</span>
                            </label>
                            <select
                                className={`form-select ${errors.country ? 'input-error' : ''}`}
                                value={form.country}
                                onChange={handleCountryChange}
                            >
                                <option value="">Seleccionar...</option>
                                <optgroup label="España">
                                    {EU_COUNTRIES.filter(c => c.code === 'ES').map(c => (
                                        <option key={c.code} value={c.value}>{c.label}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Unión Europea">
                                    {EU_COUNTRIES.filter(c => c.code !== 'ES').map(c => (
                                        <option key={c.code} value={c.value}>{c.label}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Fuera de la UE">
                                    {NON_EU_COUNTRIES.map(c => (
                                        <option key={c.code} value={c.value}>{c.label}</option>
                                    ))}
                                </optgroup>
                            </select>
                            {errors.country && <span className="form-error">{errors.country}</span>}
                        </div>
                    </div>

                    {/* Email + Teléfono */}
                    <div className="modal__row">
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                className="form-input"
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="cliente@empresa.com"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Teléfono</label>
                            <input
                                className="form-input"
                                type="tel"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="+34 600 000 000"
                            />
                        </div>
                    </div>

                    {/* Dirección */}
                    <div className="form-group">
                        <label className="form-label">Dirección</label>
                        <input
                            className="form-input"
                            type="text"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            placeholder="Calle, número, ciudad, código postal"
                        />
                    </div>

                    {/* Toggle extracomunitario */}
                    <button
                        type="button"
                        className={`vat-toggle ${form.is_non_eu ? 'vat-toggle--active' : ''}`}
                        onClick={handleToggleNonEU}
                    >
                        <span className={`vat-toggle__check ${form.is_non_eu ? 'vat-toggle__check--checked' : ''}`}>
                            {form.is_non_eu && '✓'}
                        </span>
                        <div>
                            <p className="vat-toggle__title">Cliente extracomunitario — exento de IVA</p>
                            <p className="vat-toggle__desc">
                                Actívalo si el cliente está fuera de la UE (EEUU, UK, Latinoamérica...).
                                Las facturas se emitirán sin IVA con la mención legal obligatoria.
                            </p>
                        </div>
                    </button>

                    {/* VAT preview */}
                    <div className={`vat-preview ${form.is_non_eu ? 'vat-preview--exempt' : ''}`}>
                        <span className="vat-preview__icon">{form.is_non_eu ? '🌍' : '💶'}</span>
                        <p className="vat-preview__text">{vatLabel}</p>
                    </div>

                    {/* Notas */}
                    <div className="form-group">
                        <label className="form-label">
                            Notas internas
                            <span className="form-label-optional">(opcional)</span>
                        </label>
                        <textarea
                            className="form-textarea"
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            placeholder="Condiciones especiales, contacto de referencia..."
                            rows={2}
                        />
                    </div>

                </div>

                {/* Footer */}
                <div className="modal__footer">
                    <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
                        Cancelar
                    </button>
                    <button
                        className={`btn btn-primary ${saving ? 'btn-loading' : ''}`}
                        onClick={handleSubmit}
                        disabled={saving}
                    >
                        {saving ? 'Guardando...' : isEditing ? 'Actualizar cliente' : 'Guardar cliente'}
                    </button>
                </div>

            </div>
        </div>
    );
}
