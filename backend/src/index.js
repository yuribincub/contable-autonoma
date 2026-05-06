// Punto de entrada del servidor
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const supabase = require('./config/supabase');
const incomeRoutes = require('./routes/income');
const expensesRoutes = require('./routes/expenses');
const ocrRoutes = require('./routes/ocr');
const profileRoutes = require('./routes/profile');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Rutas
app.use('/income', incomeRoutes);
app.use('/expenses', expensesRoutes);
app.use('/ocr', ocrRoutes);
app.use('/profile', profileRoutes);

// Fallback directo para asegurar que PUT /profile funciona
app.put('/profile', async (req, res) => {
    const { id, ...profileData } = req.body;
    if (!id) return res.status(400).json({ error: 'id requerido' });

    try {
        const { data, error } = await supabase
            .from('profiles')
            .upsert({ id, ...profileData })
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Fallback directo para GET /profile
app.get('/profile', async (req, res) => {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id requerido' });

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('full_name, cif_nif, address, postal_code, city, province, iban')
            .eq('id', user_id)
            .maybeSingle();

        if (error) throw error;
        res.json(data ?? {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta de prueba general
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor contable funcionando correctamente' });
});

// Ruta de prueba de conexión a Supabase
app.get('/health/db', async (req, res) => {
    try {
        const { data, error } = await supabase.from('profiles').select('count');
        if (error) throw error;
        res.json({ status: 'ok', message: 'Conexión a Supabase correcta' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Arrancar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});