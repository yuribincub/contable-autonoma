// Punto de entrada del servidor
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Ruta de prueba — sirve para confirmar que el servidor funciona
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Servidor contable funcionando correctamente'
    });
});

// Arrancar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});