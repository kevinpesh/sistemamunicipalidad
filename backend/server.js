// backend/server.js
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

app.post('/api/tramites/procesar', (req, res) => {
    const { 
        modelo, 
        tipo_tramite, 
        canal_ingreso, 
        requisitos_totales, 
        requisitos_presentados, 
        dias_en_proceso 
    } = req.body;

    if (!modelo || !tipo_tramite || !canal_ingreso || requisitos_totales === undefined || requisitos_presentados === undefined || dias_en_proceso === undefined) {
        return res.status(400).json({ success: false, error: 'Faltan parámetros requeridos para procesar el trámite.' });
    }

    const totales = parseInt(requisitos_totales, 10);
    const presentados = parseInt(requisitos_presentados, 10);
    const dias = parseInt(dias_en_proceso, 10);

    if (isNaN(totales) || totales < 1 || isNaN(presentados) || presentados < 0 || isNaN(dias) || dias < 0) {
        return res.status(400).json({ success: false, error: 'Los valores numéricos enviados son inválidos.' });
    }

    if (presentados > totales) {
        return res.status(400).json({ success: false, error: 'Los requisitos presentados no pueden ser mayores que los totales.' });
    }

    // Regla de negocio inmediata para activar alertas automáticas
    const enviarAlertaFaltantes = presentados < totales;

    // Ruta absoluta hacia el archivo script predict.py
    const scriptPath = path.join(__dirname, 'ml_models', 'predict.py');

    // Se inyecta 'modelo' como el primer argumento para que predict.py sepa cuál cargar
    const pythonProcess = spawn('python', [
        scriptPath, 
        modelo,               
        tipo_tramite, 
        canal_ingreso, 
        requisitos_totales, 
        requisitos_presentados, 
        dias_en_proceso
    ]);

    let dataString = '';

    // 1. Acumulamos la salida estándar del script de Python
    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    // 2. Registramos las advertencias o errores en la consola de Node sin romper la petición
    pythonProcess.stderr.on('data', (data) => {
        console.warn(`[Python Warning/Error]: ${data.toString().trim()}`);
    });

    pythonProcess.on('error', (error) => {
        console.error('Error al iniciar el proceso de Python:', error);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, error: 'No se pudo iniciar el servicio de predicción.' });
        }
    });

    // 3. Cuando el proceso de Python cierra formalmente, enviamos la respuesta única
    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`El proceso de Python terminó con código de error: ${code}`);
            if (!res.headersSent) {
                return res.status(500).json({ success: false, error: "Error en el predictor de Python" });
            }
            return;
        }

        try {
            // Evaluamos el número devuelto por Python limpio de espacios
            const esCritico = parseInt(dataString.trim());

            if (isNaN(esCritico)) {
                throw new Error("La salida de Python no es un número válido.");
            }

            if (!res.headersSent) {
                res.json({
                    success: true,
                    data: {
                        es_critico: esCritico,
                        prioridad: esCritico === 1 ? "ALTA (Priorizar en bandeja)" : "NORMAL",
                        notificar_ciudadano: enviarAlertaFaltantes,
                        alerta_mensaje: enviarAlertaFaltantes 
                            ? "Alerta enviada: Su trámite presenta requisitos incompletos." 
                            : "Notificación enviada: Trámite recibido correctamente."
                    }
                });
            }
        } catch (error) {
            console.error("Error al procesar la salida del modelo:", error, "Salida recibida:", dataString);
            if (!res.headersSent) {
                res.status(500).json({ success: false, error: "Error al parsear el resultado de Machine Learning" });
            }
        }
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Servidor de la Municipalidad de Yau corriendo en http://localhost:${PORT}`);
});