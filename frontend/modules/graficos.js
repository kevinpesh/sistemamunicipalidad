// frontend/modules/graficos.js

const GraficosModulo = {
    instanciaBarras: null,
    instanciaDona: null,
    instanciaLineas: null, 
    instanciaTorta: null,  

    // Inicializa o actualiza los 4 gráficos extrayendo la data del módulo Historial
    inicializarOActualizar: function() {
        if (typeof HistorialModulo === 'undefined') return;

        const datos = HistorialModulo.obtenerTodos();
        // Clonamos e invertimos la lista para mostrar la línea de tiempo en orden cronológico correcto (Pasado -> Presente)
        const datosCronologicos = [...datos].reverse();

        // ---------------------------------------------------------
        // 1. DATA: Eficiencia Promedio por Tipo de Trámite (Barras)
        // ---------------------------------------------------------
        const acumuladorTramites = {};
        datos.forEach(d => {
            if (!acumuladorTramites[d.tipo_tramite]) {
                acumuladorTramites[d.tipo_tramite] = { suma: 0, cantidad: 0 };
            }
            acumuladorTramites[d.tipo_tramite].suma += d.eficiencia;
            acumuladorTramites[d.tipo_tramite].cantidad++;
        });

        const labelsBarras = Object.keys(acumuladorTramites);
        const dataBarras = labelsBarras.map(key => Math.round(acumuladorTramites[key].suma / acumuladorTramites[key].cantidad));

        // ---------------------------------------------------------
        // 2. DATA: Conteo de Prioridades de la IA (Dona)
        // ---------------------------------------------------------
        let conteoCritico = 0;
        let conteoControlado = 0;
        datos.forEach(d => {
            if (d.es_critico === 1) conteoCritico++;
            else conteoControlado++;
        });

        // ---------------------------------------------------------
        // 3. DATA: Evolución de Días en Proceso (Líneas)
        // ---------------------------------------------------------
        const dataLineas = datosCronologicos.map(d => d.dias_en_proceso || 0);
        const labelsLineas = datosCronologicos.map((_, index) => `Eval ${index + 1}`);

        // ---------------------------------------------------------
        // 4. DATA: Proporción de Canales de Ingreso (Torta)
        // ---------------------------------------------------------
        let conteoDigital = 0;
        let conteoManual = 0;
        datos.forEach(d => {
            if (d.canal_ingreso === 'Digital') conteoDigital++;
            else conteoManual++;
        });


        // =========================================================
        // 🛠️ RENDERIZACIÓN Y CONTROL DE INSTANCIAS (CHART.JS)
        // =========================================================

        // --- Gráfico 1: Barras (Eficiencia por Trámite) ---
        const ctxBarras = document.getElementById('chartBarras');
        if (ctxBarras) {
            if (this.instanciaBarras) this.instanciaBarras.destroy(); 
            this.instanciaBarras = new Chart(ctxBarras, {
                type: 'bar',
                data: {
                    labels: labelsBarras.length > 0 ? labelsBarras : ['Sin datos'],
                    datasets: [{
                        label: 'Eficiencia Promedio (%)',
                        data: dataBarras.length > 0 ? dataBarras : [0],
                        backgroundColor: 'rgba(38, 208, 206, 0.7)',
                        borderColor: '#1a2980',
                        borderWidth: 2,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { min: 0, max: 100 } }
                }
            });
        }

        // --- Gráfico 2: Dona (Prioridades de la IA) ---
        const ctxDona = document.getElementById('chartDona');
        if (ctxDona) {
            if (this.instanciaDona) this.instanciaDona.destroy();
            this.instanciaDona = new Chart(ctxDona, {
                type: 'doughnut',
                data: {
                    labels: ['Crítico', 'Controlado'],
                    datasets: [{
                        data: datos.length > 0 ? [conteoCritico, conteoControlado] : [0, 0],
                        backgroundColor: ['#dc2626', '#3b82f6'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // --- Gráfico 3: Líneas (Evolución Temporal de Días) ---
        const ctxLineas = document.getElementById('chartLineasTiempo');
        if (ctxLineas) {
            if (this.instanciaLineas) this.instanciaLineas.destroy();
            this.instanciaLineas = new Chart(ctxLineas, {
                type: 'line',
                data: {
                    labels: labelsLineas.length > 0 ? labelsLineas : ['Sin datos'],
                    datasets: [{
                        label: 'Días del Expediente',
                        data: dataLineas.length > 0 ? dataLineas : [0],
                        borderColor: '#ff9f43',
                        backgroundColor: 'rgba(255, 159, 67, 0.15)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointBackgroundColor: '#ff9f43'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } }
                }
            });
        }

        // --- Gráfico 4: Torta (Uso de Canales de Ingreso) ---
        const ctxTorta = document.getElementById('chartTortaCanal');
        if (ctxTorta) {
            if (this.instanciaTorta) this.instanciaTorta.destroy();
            this.instanciaTorta = new Chart(ctxTorta, {
                type: 'pie',
                data: {
                    labels: ['Digital', 'Manual'],
                    datasets: [{
                        data: datos.length > 0 ? [conteoDigital, conteoManual] : [0, 0],
                        backgroundColor: ['#10b981', '#64748b'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }
};

// Escuchar los clics en la pestaña de gráficos para refrescar las animaciones de Chart.js
document.addEventListener('DOMContentLoaded', () => {
    const tabGraficos = document.getElementById('graficos-tab');
    if (tabGraficos) {
        tabGraficos.addEventListener('shown.bs.tab', () => {
            GraficosModulo.inicializarOActualizar();
        });
    }
});