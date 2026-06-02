// frontend/app.js

const TRAMITES_POR_MODELO = {
    'rf': ["Licencia de Funcionamiento", "Permiso de Construcción", "Quejas y Reclamos", "Visación de Planos"],
    'lr': ["Licencia de Funcionamiento", "Permiso de Construcción", "Quejas y Reclamos", "Visación de Planos"],
    'gb': ["Licencia de Funcionamiento", "Permiso de Construcción", "Quejas y Reclamos", "Visación de Planos"]
};

function actualizarTramites() {
    const selectModelo = document.getElementById('select_modelo');
    const selectTramite = document.getElementById('tipo_tramite');
    const btnEvaluar = document.getElementById('btnEvaluar');
    const infoModelo = document.getElementById('info_modelo');

    if (!selectModelo || !selectTramite) return;

    const modeloSeleccionado = selectModelo.value;
    const tramites = TRAMITES_POR_MODELO[modeloSeleccionado] || [];

    const valorActual = selectTramite.value;

    selectTramite.innerHTML = '';
    tramites.forEach(tramite => {
        const option = document.createElement('option');
        option.value = tramite;
        option.textContent = tramite;
        selectTramite.appendChild(option);
    });

    if (tramites.includes(valorActual)) {
        selectTramite.value = valorActual;
    }

    if (btnEvaluar && infoModelo) {
        if (modeloSeleccionado === 'rf') {
            btnEvaluar.innerHTML = '<i class="fas fa-microchip"></i> Registrar y Evaluar Trámite';
            infoModelo.innerHTML = "<strong>Métrica: Accuracy 88.75%</strong> | Clasificador basado en árboles de decisión aleatorios.";
        } else if (modeloSeleccionado === 'lr') {
            btnEvaluar.innerHTML = '<i class="fas fa-microchip"></i> Registrar y Evaluar Trámite';
            infoModelo.innerHTML = "<strong>Métrica: Accuracy 87.08%</strong> | Modelo estadístico ideal para auditoría de variables lineales.";
        } else if (modeloSeleccionado === 'gb') {
            btnEvaluar.innerHTML = '<i class="fas fa-microchip"></i> Registrar y Evaluar Trámite';
            infoModelo.innerHTML = "<strong>Métrica: Accuracy 88.75%</strong> | Ensamble secuencial de alta precisión predictiva.";
        }
    }
}

function setFormError(message) {
    const errorBox = document.getElementById('formError');
    if (!errorBox) return;
    if (!message) {
        errorBox.classList.add('d-none');
        errorBox.innerText = '';
        return;
    }
    errorBox.classList.remove('d-none');
    errorBox.innerText = message;
}

function validarFormulario() {
    const reqTotales = parseInt(document.getElementById('requisitos_totales').value, 10);
    const reqPresentados = parseInt(document.getElementById('requisitos_presentados').value, 10);
    const diasProceso = parseInt(document.getElementById('dias_en_proceso').value, 10);

    if (isNaN(reqTotales) || reqTotales < 1) {
        setFormError('Ingrese un número válido de requisitos totales mayor a 0.');
        return false;
    }
    if (isNaN(reqPresentados) || reqPresentados < 0) {
        setFormError('Ingrese un número válido de requisitos presentados.');
        return false;
    }
    if (reqPresentados > reqTotales) {
        setFormError('Los requisitos presentados no pueden ser mayores que los totales.');
        return false;
    }
    if (isNaN(diasProceso) || diasProceso < 0) {
        setFormError('Ingrese un número válido de días transcurridos.');
        return false;
    }
    setFormError('');
    return true;
}

function actualizarResumenDashboard() {
    const resumenTotal = document.getElementById('resumenTotalConsultas');
    const resumenEficiencia = document.getElementById('resumenEficienciaPromedio');
    const resumenPrioridad = document.getElementById('resumenUltimaPrioridad');

    if (typeof HistorialModulo === 'undefined' || !resumenTotal || !resumenEficiencia || !resumenPrioridad) return;

    const registros = HistorialModulo.obtenerTodos();
    resumenTotal.innerText = registros.length;

    if (registros.length === 0) {
        resumenEficiencia.innerText = '0%';
        resumenPrioridad.innerText = 'N/A';
        return;
    }

    const totalEficiencia = registros.reduce((sum, item) => sum + Number(item.eficiencia || 0), 0);
    const promedio = Math.round(totalEficiencia / registros.length);
    resumenEficiencia.innerText = `${promedio}%`;

    const ultima = registros[0];
    resumenPrioridad.innerText = ultima.es_critico === 1 ? 'CRÍTICO' : 'CONTROLADO';
}

document.addEventListener('DOMContentLoaded', () => {
    const selectModelo = document.getElementById('select_modelo');
    if (selectModelo) selectModelo.addEventListener('change', actualizarTramites);
    actualizarTramites();
    actualizarResumenDashboard();
});

// =========================================================================
// INTERCEPTOR Y PROCESADO DEL TRÁMITE
// =========================================================================
document.getElementById('tramiteForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnEvaluar = document.getElementById('btnEvaluar');
    const resultadoPanel = document.getElementById('resultadoPanel');
    const alertaCritico = document.getElementById('alertaCritico');
    const alertaNotificacion = document.getElementById('alertaNotificacion');
    const bloqueRecomendacion = document.getElementById('bloqueRecomendacion');
    const barraEficiencia = document.getElementById('barraEficiencia');
    const textoPorcentaje = document.getElementById('textoPorcentaje');

    const textoOriginalBoton = btnEvaluar.innerHTML;
    btnEvaluar.disabled = true;
    btnEvaluar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando por Red...';

    if (!validarFormulario()) {
        btnEvaluar.disabled = false;
        btnEvaluar.innerHTML = textoOriginalBoton;
        return;
    }

    const canalIngreso = document.getElementById('canal_ingreso').value;
    const reqTotales = parseInt(document.getElementById('requisitos_totales').value);
    const reqPresentados = parseInt(document.getElementById('requisitos_presentados').value);
    const diasProceso = parseInt(document.getElementById('dias_en_proceso').value);
    const tipoTramite = document.getElementById('tipo_tramite').value;

    const payload = {
        modelo: document.getElementById('select_modelo').value,
        tipo_tramite: tipoTramite,
        canal_ingreso: canalIngreso,
        requisitos_totales: reqTotales,
        requisitos_presentados: reqPresentados,
        dias_en_proceso: diasProceso
    };

    try {
        const response = await fetch('http://localhost:5000/api/tramites/procesar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const resData = await response.json();

        if (resData.success) {
            const data = resData.data;

            // 📊 1. Calcular Score de Eficiencia en caliente
            let scoreDocs = (reqPresentados / reqTotales) * 40;
            let scoreCanal = (canalIngreso === 'Digital' || canalIngreso === 'Digital') ? 30 : 10;
            let scoreTiempo = 30 - (diasProceso * 2);
            if (scoreTiempo < 0) scoreTiempo = 0;

            let scoreTotal = Math.round(scoreDocs + scoreCanal + scoreTiempo);
            if (scoreTotal > 100) scoreTotal = 100;

            // Pintar Barra de progreso
            if (barraEficiencia && textoPorcentaje) {
                barraEficiencia.style.width = `${scoreTotal}%`;
                textoPorcentaje.innerText = `${scoreTotal}%`;

                if (scoreTotal >= 80) {
                    barraEficiencia.className = "progress-bar progress-bar-striped progress-bar-animated bg-success";
                    textoPorcentaje.className = "fw-bold h5 mb-0 text-success";
                } else if (scoreTotal >= 50) {
                    barraEficiencia.className = "progress-bar progress-bar-striped progress-bar-animated bg-warning text-dark";
                    textoPorcentaje.className = "fw-bold h5 mb-0 text-warning";
                } else {
                    barraEficiencia.className = "progress-bar progress-bar-striped progress-bar-animated bg-danger";
                    textoPorcentaje.className = "fw-bold h5 mb-0 text-danger";
                }
            }

            // ⭐ 2. Renderizar alertas estilizadas con bordes de color dinámicos
            const estiloComun = "alert d-flex align-items-center gap-2 shadow-sm p-3 m-0";
            const radioBorde = "12px";

            if (alertaCritico) {
                alertaCritico.className = estiloComun;
                alertaCritico.style.borderRadius = radioBorde;
                alertaCritico.style.border = "none";

                if (data.es_critico === 1 || data.prioridad === 'CRÍTICO') {
                    alertaCritico.style.backgroundColor = "#fee2e2"; 
                    alertaCritico.style.color = "#991b1b";
                    alertaCritico.style.borderLeft = "6px solid #ef4444";
                    alertaCritico.innerHTML = `<i class="fas fa-exclamation-triangle fs-5 me-1 text-danger"></i> <div>Clasificación del Sistema: <strong style="font-weight: 800;">CRÍTICO</strong></div>`;
                } else {
                    alertaCritico.style.backgroundColor = "#e0f2fe"; 
                    alertaCritico.style.color = "#0369a1";
                    alertaCritico.style.borderLeft = "6px solid #0ea5e9";
                    alertaCritico.innerHTML = `<i class="fas fa-shield-alt fs-5 me-1" style="color: #0ea5e9;"></i> <div>Clasificación del Sistema: <strong style="font-weight: 800; color:#0c4a6e;">NORMAL</strong></div>`;
                }
            }
            
            if (alertaNotificacion) {
                alertaNotificacion.className = estiloComun;
                alertaNotificacion.style.borderRadius = radioBorde;
                alertaNotificacion.style.border = "none";
                alertaNotificacion.style.backgroundColor = "#fef3c7"; 
                alertaNotificacion.style.color = "#92400e";
                alertaNotificacion.style.borderLeft = "6px solid #f59e0b";
                alertaNotificacion.innerHTML = `🤖 <div class="ms-1"><strong>Módulo de Notificaciones:</strong> ${data.alerta_mensaje}</div>`;
            }

            // 3. Recomendaciones lógicas del sistema experto
            if (bloqueRecomendacion) {
                let sugerencias = [];
                if (reqPresentados < reqTotales) {
                    sugerencias.push(`<i class="fas fa-folder-plus text-primary me-2"></i><strong>Entrega de Documentos:</strong> Falta ingresar <strong>${reqTotales - reqPresentados}</strong> requisitos.`);
                }
                if (diasProceso >= 15) {
                    sugerencias.push(`<i class="fas fa-hourglass-half text-danger me-2"></i><strong>Exceso de Tiempo:</strong> El expediente lleva <strong>${diasProceso} días</strong> estancado.`);
                }
                if (canalIngreso.includes('Manual')) {
                    sugerencias.push(`<i class="fas fa-laptop text-warning me-2"></i><strong>Migración Digital:</strong> Se aconseja canalizar por la plataforma web.`);
                }

                bloqueRecomendacion.innerHTML = sugerencias.length > 0 
                    ? `<div class="card card-recomendacion border border-info" style="border-radius:12px; overflow:hidden;">
                        <div class="header-rec p-2 px-3 text-white fw-bold" style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);">
                            <i class="fas fa-lightbulb"></i> Plan de Acción Sugerido
                        </div>
                        <div class="card-body bg-light p-3">
                            <div class="d-flex flex-column gap-2 small text-muted">
                                ${sugerencias.map(s => `<div class="p-2 bg-white rounded border-start border-3 border-info shadow-sm text-dark">${s}</div>`).join('')}
                            </div>
                        </div>
                       </div>`
                    : `<div class="card card-recomendacion border border-success" style="border-radius:12px; overflow:hidden;">
                        <div class="card-body bg-light text-success fw-semibold p-3 small">
                            <i class="fas fa-star me-2"></i>Flujo de trámite operativo eficiente.
                        </div>
                       </div>`;
            }

            if (resultadoPanel) {
                resultadoPanel.classList.remove('d-none');
            }

            // ========================================================
            // 💾 4. PERSISTENCIA CORREGIDA: ENVIAR DÍAS AL HISTORIAL
            // ========================================================
            if (typeof HistorialModulo !== 'undefined') {
                HistorialModulo.guardarTramite({
                    tipo_tramite: tipoTramite,
                    canal_ingreso: canalIngreso,
                    eficiencia: scoreTotal,
                    dias_en_proceso: diasProceso, // <-- ¡OJO! Esto faltaba para alimentar el gráfico de líneas
                    es_critico: data.es_critico
                });
            }

        } else {
            alert('Hubo un error al procesar el trámite en el servidor.');
        }
    } catch (error) {
        console.error(error);
        alert('No se pudo conectar con el servidor backend.');
    } finally {
        btnEvaluar.disabled = false;
        btnEvaluar.innerHTML = textoOriginalBoton;
    }
});

// =========================================================================
// FUNCIÓN PARA LIMPIAR FORMULARIO Y RESULTADOS
// =========================================================================
function limpiarFormulario() {
    // Limpiar campos del formulario
    document.getElementById('requisitos_totales').value = '6';
    document.getElementById('requisitos_presentados').value = '6';
    document.getElementById('dias_en_proceso').value = '1';
    
    // Ocultar panel de resultados
    const resultadoPanel = document.getElementById('resultadoPanel');
    if (resultadoPanel) {
        resultadoPanel.classList.add('d-none');
    }
    
    // Limpiar contenido de alertas y recomendaciones
    document.getElementById('alertaCritico').innerHTML = '';
    document.getElementById('alertaNotificacion').innerHTML = '';
    document.getElementById('bloqueRecomendacion').innerHTML = '';
    
    // Resetear barra de eficiencia
    document.getElementById('barraEficiencia').style.width = '0%';
    document.getElementById('textoPorcentaje').innerText = '0%';
}

// Event listener para el botón de nueva predicción
document.addEventListener('DOMContentLoaded', () => {
    const btnNuevaPrediccion = document.getElementById('btnNuevaPrediccion');
    if (btnNuevaPrediccion) {
        btnNuevaPrediccion.addEventListener('click', limpiarFormulario);
    }
});