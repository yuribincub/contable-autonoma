// Ruta OCR — extrae datos de transferencias bancarias
// PDF: extracción directa de texto (pdf2json)
// Imagen: OCR con Tesseract.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const Tesseract = require('tesseract.js');
const PDFParser = require('pdf2json');
const supabase = require('../config/supabase');

// Configurar multer — guardar archivo en memoria temporalmente
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se aceptan imágenes (JPG, PNG) o PDF'));
        }
    }
});

// ─── EXTRACCIÓN DE TEXTO ─────────────────────────────────────────────────────

async function extractTextFromPDF(buffer) {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();
        pdfParser.on('pdfParser_dataReady', (pdfData) => {
            const text = pdfData.Pages.map(page =>
                page.Texts.map(t => {
                    try {
                        return decodeURIComponent(t.R.map(r => r.T).join(''));
                    } catch {
                        // Si falla el decode, usar el texto tal cual
                        return t.R.map(r => r.T).join('');
                    }
                }).join(' ')
            ).join('\n');
            resolve(text);
        });
        pdfParser.on('pdfParser_dataError', reject);
        pdfParser.parseBuffer(buffer);
    });
}

async function extractTextFromImage(buffer) {
    const { data: { text } } = await Tesseract.recognize(buffer, 'spa');
    return text;
}

// ─── PARSERS MODULARES ───────────────────────────────────────────────────────

// Palabras clave que marcan inicio del bloque de transacción (multiidioma)
const TRANSACTION_MARKERS = [
    'transacción', 'transaccion',
    'transaction',
    'transazione',
    'transaktion',
    'movimientos', 'movements',
    'operaciones', 'operations',
];

// Encontrar bloque de transacción e ignorar cabeceras del documento
function findTransactionBlock(lines) {
    // pdf2json a veces mete todo en una línea — dividir por marcador
    const fullText = lines.join(' ');

    for (const marker of TRANSACTION_MARKERS) {
        const idx = fullText.toLowerCase().indexOf(marker);
        if (idx !== -1) {
            console.log(`[OCR] Marcador "${marker}" encontrado en posición ${idx}`);
            // Devolver el texto desde el marcador en adelante como array de fragmentos
            const blockText = fullText.slice(idx);
            // Dividir por 2+ espacios o por patrones de separación
            return blockText.split(/\s{2,}/).map(s => s.trim()).filter(s => s.length > 0);
        }
    }

    console.log('[OCR] No se encontró marcador — usando texto completo');
    return lines;
}

// Extraer fecha de transacción — ignorar fecha del encabezado
function extractDate(lines) {
    const months = {
        'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04',
        'may': '05', 'jun': '06', 'jul': '07', 'ago': '08',
        'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12',
        'jan': '01', 'apr': '04', 'aug': '08', 'dec': '12',
    };

    const patterns = [
        { re: /(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic|jan|apr|aug|dec)\s+(\d{4})/gi, type: 'text' },
        { re: /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/g, type: 'num' },
        { re: /(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})/g, type: 'iso' },
    ];

    const text = lines.join(' ');
    const allDates = [];

    for (const { re, type } of patterns) {
        let match;
        while ((match = re.exec(text)) !== null) {
            let date;
            if (type === 'text') {
                const month = months[match[2].toLowerCase()];
                date = `${match[3]}-${month}-${match[1].padStart(2, '0')}`;
            } else if (type === 'iso') {
                date = `${match[1]}-${match[2]}-${match[3]}`;
            } else {
                date = `${match[3]}-${match[2]}-${match[1]}`;
            }
            allDates.push({ date, index: match.index });
        }
    }

    if (allDates.length === 0) {
        console.log('[OCR] Fecha no encontrada');
        return null;
    }

    // La fecha de transacción aparece DESPUÉS de las cabeceras
    // Si hay varias fechas, tomar la que aparece más tarde en el texto
    // pero antes de importes (suele ser la primera fecha después del header)
    allDates.sort((a, b) => a.index - b.index);

    // Ignorar la primera fecha si hay más de una (suele ser la del doc)
    const chosen = allDates.length > 1 ? allDates[1] : allDates[0];
    console.log(`[OCR] Fechas encontradas: ${allDates.map(d => d.date).join(', ')} → seleccionada: ${chosen.date}`);
    return chosen.date;
}

// Extraer pagador — quien envía el dinero
function extractPayer(lines) {
    const text = lines.join(' ');

    const patterns = [
        /pago\s+de\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑA-Za-záéíóúñ\s]+?)(?=€|\d|Referencia|De\s+[A-Z])/i,
        /payment\s+from\s+([A-Z][A-Za-z\s]+?)(?=€|\d)/i,
        /transferencia\s+de\s+([A-ZÁÉÍÓÚÑ][A-Za-záéíóúñ\s]+?)(?=€|\d)/i,
    ];

    for (const re of patterns) {
        const match = text.match(re);
        if (match) {
            const payer = match[1].trim();
            console.log(`[OCR] Pagador: "${payer}"`);
            return payer;
        }
    }

    console.log('[OCR] Pagador no encontrado');
    return null;
}

// Extraer concepto — referencia del banco
function extractConcept(lines) {
    const text = lines.join(' ');

    const patterns = [
        /Referencia:\s*([^\n€]+?)(?=De\s+[A-Z]|IBAN|BIC|$)/i,
        /Reference:\s*([^\n€]+?)(?=From|IBAN|BIC|$)/i,
        /Concepto:\s*([^\n€]+?)(?=IBAN|BIC|$)/i,
    ];

    for (const re of patterns) {
        const match = text.match(re);
        if (match) {
            const concept = match[1].trim();
            console.log(`[OCR] Concepto: "${concept}"`);
            return concept;
        }
    }

    console.log('[OCR] Concepto no encontrado');
    return null;
}

// Extraer importe — toma el menor porque el saldo siempre es mayor
function extractAmount(lines) {
    const amounts = [];
    const text = lines.join('\n');

    const patternAnglo = /€\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;
    const patternEU = /(\d{1,3}(?:\.\d{3})*),(\d{2})\s*€/g;

    let match;
    while ((match = patternAnglo.exec(text)) !== null) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(amount) && amount > 0) amounts.push(amount);
    }
    while ((match = patternEU.exec(text)) !== null) {
        const amount = parseFloat(match[1].replace(/\./g, '') + '.' + match[2]);
        if (!isNaN(amount) && amount > 0) amounts.push(amount);
    }

    if (amounts.length === 0) {
        console.log('[OCR] Importe no encontrado');
        return null;
    }

    amounts.sort((a, b) => a - b);
    console.log(`[OCR] Importes: ${amounts.join(', ')} → seleccionado: ${amounts[0]}`);
    return amounts[0];
}

// Orquestador principal
function parseTransferData(text) {
    console.log('\n========== INICIO EXTRACCIÓN OCR ==========');

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const transactionLines = findTransactionBlock(lines);

    console.log(`[OCR] Líneas en bloque: ${transactionLines.length}`);

    const result = {
        date: extractDate(transactionLines),
        amount: extractAmount(transactionLines),
        payer: extractPayer(transactionLines),
        concept: extractConcept(transactionLines),
    };

    console.log('\n[OCR] RESULTADO FINAL:', JSON.stringify(result, null, 2));
    console.log('========== FIN EXTRACCIÓN OCR ==========\n');

    return result;
}

// ─── RUTAS ───────────────────────────────────────────────────────────────────

router.post('/extract', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }

    try {
        let text = '';

        if (req.file.mimetype === 'application/pdf') {
            text = await extractTextFromPDF(req.file.buffer);
        } else {
            text = await extractTextFromImage(req.file.buffer);
        }

        const extracted = parseTransferData(text);

        res.json({
            success: true,
            date: extracted.date,
            amount: extracted.amount,
            payer: extracted.payer,
            concept: extracted.concept,
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
        });

    } catch (error) {
        console.error('Error en extracción:', error);
        res.status(500).json({ error: 'Error procesando el archivo: ' + error.message });
    }
});

router.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }

    const { user_id } = req.body;
    if (!user_id) {
        return res.status(400).json({ error: 'user_id es obligatorio' });
    }

    try {
        const timestamp = Date.now();
        const filename = `${user_id}/${timestamp}_${req.file.originalname}`;

        const { error } = await supabase.storage
            .from('receipts')
            .upload(filename, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('receipts')
            .getPublicUrl(filename);

        res.json({
            success: true,
            file_url: publicUrl,
            filename: filename
        });

    } catch (error) {
        console.error('Error subiendo archivo:', error);
        res.status(500).json({ error: 'Error subiendo archivo: ' + error.message });
    }
});

// ─── PARSERS PARA FACTURAS DE GASTO ─────────────────────────────────────────

// Extraer proveedor/emisor de la factura
function extractProvider(lines) {
    const text = lines.join(' ');

    const patterns = [
        /emisor[:\s]+([A-ZÁÉÍÓÚÑ][A-Za-záéíóúñ\s\.\,]+?)(?=NIF|CIF|Tel|Calle|€|\d{5})/i,
        /([A-ZÁÉÍÓÚÑ][A-Za-záéíóúñ\s]+(?:S\.?L\.?|S\.?A\.?|S\.?L\.?U\.?))/,
    ];

    for (const re of patterns) {
        const match = text.match(re);
        if (match) {
            const provider = match[1].trim();
            console.log(`[OCR-GASTO] Proveedor: "${provider}"`);
            return provider;
        }
    }

    console.log('[OCR-GASTO] Proveedor no encontrado');
    return null;
}

// Extraer fecha de la factura
function extractInvoiceDate(lines) {
    const months = {
        'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04',
        'may': '05', 'jun': '06', 'jul': '07', 'ago': '08',
        'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12',
        'jan': '01', 'apr': '04', 'aug': '08', 'dec': '12',
    };

    const text = lines.join(' ');

    const patterns = [
        { re: /fecha[:\s]+(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic|jan|apr|aug|dec)\s+(\d{4})/i, type: 'text' },
        { re: /fecha[:\s]+(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/i, type: 'num' },
        { re: /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/, type: 'num' },
        { re: /(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\s+(\d{4})/i, type: 'text' },
    ];

    for (const { re, type } of patterns) {
        const match = text.match(re);
        if (match) {
            let date;
            if (type === 'text') {
                const month = months[match[2].toLowerCase()];
                date = `${match[3]}-${month}-${match[1].padStart(2, '0')}`;
            } else {
                date = `${match[3]}-${match[2]}-${match[1]}`;
            }
            console.log(`[OCR-GASTO] Fecha: "${date}"`);
            return date;
        }
    }

    console.log('[OCR-GASTO] Fecha no encontrada');
    return null;
}

// Extraer base imponible, IVA y total
function extractInvoiceAmounts(lines) {
    const text = lines.join(' ');
    const result = { base: null, vatRate: null, vatAmount: null, total: null };

    // Base imponible
    const basePatterns = [
        /base\s+imponible[:\s]+(\d+(?:[.,]\d{2})?)\s*€/i,
        /base[:\s]+(\d+(?:[.,]\d{2})?)\s*€/i,
    ];
    for (const re of basePatterns) {
        const match = text.match(re);
        if (match) {
            result.base = parseFloat(match[1].replace(',', '.'));
            console.log(`[OCR-GASTO] Base: ${result.base}`);
            break;
        }
    }

    // IVA % e importe
    const vatPattern = /(\d+)\s*%\s*(?:IVA|iva)[:\s]*(\d+(?:[.,]\d{2})?)\s*€|IVA[:\s]+(\d+(?:[.,]\d{2})?)\s*€/i;
    const vatMatch = text.match(vatPattern);
    if (vatMatch) {
        result.vatRate = vatMatch[1] ? parseInt(vatMatch[1]) : 21;
        result.vatAmount = parseFloat((vatMatch[2] || vatMatch[3]).replace(',', '.'));
        console.log(`[OCR-GASTO] IVA: ${result.vatRate}% → ${result.vatAmount}€`);
    }

    // Si no encontramos IVA con %, buscar solo el importe
    if (!result.vatAmount) {
        const vatAmountPattern = /IVA[:\s]+(\d+(?:[.,]\d{2})?)\s*€/i;
        const match = text.match(vatAmountPattern);
        if (match) {
            result.vatAmount = parseFloat(match[1].replace(',', '.'));
            result.vatRate = 21; // default
            console.log(`[OCR-GASTO] IVA (solo importe): ${result.vatAmount}€`);
        }
    }

    // Total
    const totalPatterns = [
        /total[:\s]+(\d+(?:[.,]\d{2})?)\s*€/i,
        /total\s+factura[:\s]+(\d+(?:[.,]\d{2})?)\s*€/i,
        /importe\s+total[:\s]+(\d+(?:[.,]\d{2})?)\s*€/i,
    ];
    for (const re of totalPatterns) {
        const match = text.match(re);
        if (match) {
            result.total = parseFloat(match[1].replace(',', '.'));
            console.log(`[OCR-GASTO] Total: ${result.total}`);
            break;
        }
    }

    // Si tenemos base e IVA pero no total, calcularlo
    if (result.base && result.vatAmount && !result.total) {
        result.total = result.base + result.vatAmount;
        console.log(`[OCR-GASTO] Total calculado: ${result.total}`);
    }

    return result;
}

// Función principal para facturas de gasto
function parseInvoiceData(text) {
    console.log('\n========== INICIO EXTRACCIÓN FACTURA ==========');

    const lines = text.split(/\s{2,}|\n/).map(l => l.trim()).filter(l => l.length > 0);
    console.log(`[OCR-GASTO] Líneas extraídas: ${lines.length}`);

    const amounts = extractInvoiceAmounts(lines);

    const result = {
        date: extractInvoiceDate(lines),
        provider: extractProvider(lines),
        base: amounts.base,
        vatRate: amounts.vatRate,
        vatAmount: amounts.vatAmount,
        total: amounts.total,
    };

    console.log('\n[OCR-GASTO] RESULTADO FINAL:', JSON.stringify(result, null, 2));
    console.log('========== FIN EXTRACCIÓN FACTURA ==========\n');

    return result;
}

// POST /ocr/extract-expense — extraer datos de factura de gasto
router.post('/extract-expense', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }

    try {
        let text = '';

        if (req.file.mimetype === 'application/pdf') {
            text = await extractTextFromPDF(req.file.buffer);
        } else {
            text = await extractTextFromImage(req.file.buffer);
        }

        const extracted = parseInvoiceData(text);

        res.json({
            success: true,
            date: extracted.date,
            provider: extracted.provider,
            base_amount: extracted.base,
            vat_rate: extracted.vatRate,
            vat_amount: extracted.vatAmount,
            total_amount: extracted.total,
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
        });

    } catch (error) {
        console.error('Error extrayendo factura:', error);
        res.status(500).json({ error: 'Error procesando la factura: ' + error.message });
    }
});

module.exports = router;