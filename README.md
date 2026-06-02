# Municipalidad de Yau - Dashboard de Trámites Inteligente

## Descripción
Proyecto web para evaluación y seguimiento de trámites municipales con análisis predictivo y historial local.

## Mejoras aplicadas
- Interfaz más profesional con tarjetas de resumen, estilos consistentes y mejor organización.
- Validación de formulario de trámites y mensajes de error amigables.
- Historial con búsqueda, exportación a PDF y CSV, filtros y métricas resumidas.
- Backend con validación de entrada, manejo de errores y ruta de salud (`/health`).
- Dashboard de métricas dinámicas conectado al historial.

## Estructura principal
- `frontend/index.html` - Interfaz principal con dashboard, formularios y pestañas.
- `frontend/app.js` - Lógica de interacción, validación y petición al backend.
- `frontend/modules/historial.js` - Historial local, exportación y búsqueda.
- `frontend/modules/graficos.js` - Gráficos de análisis basados en el historial.
- `backend/server.js` - API de procesamiento de trámites con integración Python.

## Cómo ejecutar
1. Abrir terminal en `backend/`.
2. Ejecutar `npm install` si no se han instalado dependencias.
3. Ejecutar `npm start`.
4. Abrir `frontend/index.html` en el navegador.

## Notas
- El backend espera un script Python en `backend/ml_models/predict.py`.
- El historial se guarda en `localStorage` del navegador.
