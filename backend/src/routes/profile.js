// routes/profile.js
const express = require('express');
const supabase = require('../config/supabase.js');

const router = express.Router();

// GET /profile?user_id=xxx
router.get('/', async (req, res) => {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id requerido' });

    const { data, error } = await supabase
        .from('profiles')
        .select('full_name, cif_nif, address, postal_code, city, province, iban')
        .eq('id', user_id)
        .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data ?? {});
});

// PUT /profile
router.put('/', async (req, res) => {
    const { id, ...profileData } = req.body;
    if (!id) return res.status(400).json({ error: 'id requerido' });

    const { data, error } = await supabase
        .from('profiles')
        .upsert({ id, ...profileData })
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

module.exports = router;