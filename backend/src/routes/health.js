const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

router.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor contable funcionando correctamente' });
});

router.get('/db', async (req, res) => {
    try {
        const { data, error } = await supabase.from('profiles').select('count');
        if (error) throw error;
        res.json({ status: 'ok', message: 'Conexión a Supabase correcta' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
