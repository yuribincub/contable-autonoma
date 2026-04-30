// Rutas para gestión de gastos
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /expenses — obtener todos los gastos del usuario
router.get('/', async (req, res) => {
    const { user_id, quarter, year } = req.query;

    if (!user_id) {
        return res.status(400).json({ error: 'user_id es obligatorio' });
    }

    try {
        let query = supabase
            .from('expenses')
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

// POST /expenses — crear nuevo gasto
router.post('/', async (req, res) => {
    const {
        user_id,
        date,
        provider,
        concept,
        category,
        base_amount,
        vat_rate = 21,
        deductible_percentage = 100,
        file_url = null
    } = req.body;

    // Validaciones básicas
    if (!user_id || !date || !provider || !concept || !category || !base_amount) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Categorías válidas
    const validCategories = ['software', 'internet', 'suministros', 'vivienda', 'otros'];
    if (!validCategories.includes(category)) {
        return res.status(400).json({ error: `Categoría inválida. Usa: ${validCategories.join(', ')}` });
    }

    try {
        // Calcular importes
        const vat_amount = (base_amount * vat_rate) / 100;
        const total_amount = base_amount + vat_amount;

        // Calcular importe deducible según porcentaje configurado
        const deductible_amount = (total_amount * deductible_percentage) / 100;

        const { data, error } = await supabase
            .from('expenses')
            .insert([{
                user_id,
                date,
                provider,
                concept,
                category,
                base_amount,
                vat_rate,
                vat_amount,
                total_amount,
                deductible_percentage,
                deductible_amount,
                file_url
            }])
            .select();

        if (error) throw error;

        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /expenses/:id — eliminar gasto
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Gasto eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;