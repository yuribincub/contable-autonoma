// backend/src/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const supabase = require('./config/supabase');
const incomeRoutes = require('./routes/income');
const expensesRoutes = require('./routes/expenses');
const ocrRoutes = require('./routes/ocr');
const profileRoutes = require('./routes/profile');
const clientsRoutes = require('./routes/clients');  // ← nuevo
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rutas
app.use('/income', incomeRoutes);
app.use('/expenses', expensesRoutes);
app.use('/ocr', ocrRoutes);
app.use('/profile', profileRoutes);
app.use('/clients', clientsRoutes);  // ← nuevo
app.use('/health', healthRoutes);

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
