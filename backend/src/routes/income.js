// Rutas para gestión de ingresos
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /income — obtener todos los ingresos del usuario
router.get('/', async (req, res) => {
    const { user_id, quarter, year } = req.query;
    if (!user_id) {
        return res.status(400).json({ error: 'user_id es obligatorio' });
    }
    try {
        let query = supabase
            .from('income')
            .select('*')
            .eq('user_id', user_id)
            .order('date', { ascending: false });

        if (quarter) query = query.eq('quarter', quarter);
        if (year) query = query.eq('year', year);

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /income/:id — obtener un ingreso por ID (para vista de factura)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ error: 'user_id es obligatorio' });
    }

    try {
        const { data, error } = await supabase
            .from('income')
            .select('*')
            .eq('id', id)
            .eq('user_id', user_id)   // seguridad: solo el propietario puede verlo
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Ingreso no encontrado' });

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /income — crear nuevo ingreso con número de factura automático
router.post('/', async (req, res) => {
    const {
        user_id,
        date,
        client = 'Cliente EEUU',
        concept,
        base_amount,
        irpf_rate = 0,
        file_url = null,
        invoice_status = 'issued'
    } = req.body;

    if (!user_id || !date || !concept || !base_amount) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: user_id, date, concept, base_amount' });
    }

    try {
        const year = new Date(date).getFullYear();
        const vat_rate = 0;
        const vat_amount = 0;
        const irpf_amount = (base_amount * irpf_rate) / 100;
        const total_amount = base_amount - irpf_amount;

        // Generar número de factura
        const { data: numberData, error: numberError } = await supabase
            .rpc('generate_invoice_number', { p_year: year });

        if (numberError) throw numberError;
        const invoice_number = numberData[0].invoice_number;

        // Insertar ingreso
        const { data, error } = await supabase
            .from('income')
            .insert([{
                user_id,
                date,
                client,
                concept,
                base_amount,
                vat_rate,
                vat_amount,
                irpf_rate,
                irpf_amount,
                total_amount,
                file_url,
                invoice_number,
                invoice_status
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Error creando ingreso:', error);
        res.status(500).json({ error: error.message });
    }
});

// PATCH /income/:id/status — actualizar estado de la factura
// Añadir este bloque en income.routes.js, antes del DELETE
router.patch('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { user_id, invoice_status } = req.body;

    const VALID_STATUSES = ['issued', 'paid', 'cancelled'];

    if (!user_id) {
        return res.status(400).json({ error: 'user_id es obligatorio' });
    }
    if (!VALID_STATUSES.includes(invoice_status)) {
        return res.status(400).json({ error: `Estado no válido. Usa: ${VALID_STATUSES.join(', ')}` });
    }

    try {
        const { data, error } = await supabase
            .from('income')
            .update({ invoice_status })
            .eq('id', id)
            .eq('user_id', user_id)   // seguridad: solo el propietario
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Ingreso no encontrado' });

        res.json(data);
    } catch (error) {
        console.error('Error actualizando estado:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /income/:id — eliminar ingreso
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase
            .from('income')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Ingreso eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;