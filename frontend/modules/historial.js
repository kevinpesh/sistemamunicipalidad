// frontend/modules/historial.js

const HistorialModulo = {
    KEY_STORAGE: 'historial_tramites_yau',
    paginaActual: 1,
    registrosPorPagina: 10,
    ultimoFiltro: '',

    // Guardar una nueva evaluación en la lista
    guardarTramite: function(tramiteInfo) {
        let registros = this.obtenerTodos();
        
        // Agregar la fecha y hora exacta del registro
        tramiteInfo.fecha = new Date().toLocaleString('es-PE', { hour12: false });
        
        registros.unshift(tramiteInfo);

        localStorage.setItem(this.KEY_STORAGE, JSON.stringify(registros));
        this.paginaActual = 1;
        this.renderizarTabla(this.ultimoFiltro, this.paginaActual);
        if (typeof actualizarResumenDashboard === 'function') actualizarResumenDashboard();
    },

    // Obtener la lista del localStorage
    obtenerTodos: function() {
        const data = localStorage.getItem(this.KEY_STORAGE);
        return data ? JSON.parse(data) : [];
    },

    obtenerEstadisticas: function() {
        const registros = this.obtenerTodos();
        const total = registros.length;
        const promedioEficiencia = total === 0 ? 0 : Math.round(registros.reduce((sum, item) => sum + Number(item.eficiencia || 0), 0) / total);
        const critico = registros.filter(item => item.es_critico === 1).length;
        const controlado = total - critico;
        return { total, promedioEficiencia, critico, controlado, ultimaPrioridad: total === 0 ? 'N/A' : (registros[0].es_critico === 1 ? 'CRÍTICO' : 'CONTROLADO') };
    },

    renderizarResumen: function() {
        const resumenContenedor = document.getElementById('resumenHistorial');
        if (!resumenContenedor) return;

        const stats = this.obtenerEstadisticas();
        resumenContenedor.innerHTML = `
            <span class="history-badge">Total: ${stats.total}</span>
            <span class="history-badge">Eficiencia media: ${stats.promedioEficiencia}%</span>
            <span class="history-badge">Crítico: ${stats.critico}</span>
            <span class="history-badge">Controlado: ${stats.controlado}</span>
        `;
    },

    // Renderizar las filas de la tabla de auditoría con badges estilizados
    renderizarTabla: function(filtro = '', pagina = 1) {
        const tbody = document.getElementById('tablaHistorialCuerpo');
        const paginacion = document.getElementById('tablaHistorialPaginacion');
        if (!tbody) return;

        this.ultimoFiltro = filtro;
        this.paginaActual = pagina;

        const registros = this.obtenerTodos();
        tbody.innerHTML = '';

        const termino = String(filtro || '').trim().toLowerCase();
        const registrosFiltrados = termino.length === 0
            ? registros
            : registros.filter(reg => {
                const texto = `${reg.fecha} ${reg.tipo_tramite} ${reg.canal_ingreso} ${reg.eficiencia} ${reg.es_critico === 1 ? 'CRÍTICO' : 'CONTROLADO'}`.toLowerCase();
                return texto.includes(termino);
            });

        if (registrosFiltrados.length === 0) {
            const mensaje = registros.length === 0
                ? 'No hay trámites registrados en el historial local.'
                : 'No hay coincidencias para su búsqueda.';
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">${mensaje}</td></tr>`;
            if (paginacion) paginacion.innerHTML = '';
            this.renderizarResumen();
            return;
        }

        const totalPaginas = Math.max(1, Math.ceil(registrosFiltrados.length / this.registrosPorPagina));
        if (this.paginaActual > totalPaginas) this.paginaActual = totalPaginas;

        const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
        const registrosPagina = registrosFiltrados.slice(inicio, inicio + this.registrosPorPagina);

        registrosPagina.forEach(reg => {
            const badgePrioridad = reg.es_critico === 1 
                ? `<span class="badge bg-danger text-uppercase px-2 py-1">CRÍTICO</span>`
                : `<span class="badge bg-primary text-uppercase px-2 py-1">CONTROLADO</span>`;

            const badgeEficiencia = reg.eficiencia >= 80 
                ? `<span class="fw-bold text-success">${reg.eficiencia}%</span>`
                : reg.eficiencia >= 50 
                    ? `<span class="fw-bold text-warning">${reg.eficiencia}%</span>`
                    : `<span class="fw-bold text-danger">${reg.eficiencia}%</span>`;

            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td class="small text-muted">${reg.fecha}</td>
                <td class="fw-semibold text-dark">${reg.tipo_tramite}</td>
                <td>${reg.canal_ingreso === 'Digital' ? 'Digital' : 'Manual'}</td>
                <td>${badgeEficiencia}</td>
                <td>${badgePrioridad}</td>
            `;
            tbody.appendChild(fila);
        });

        if (paginacion) this.renderizarPaginacion(totalPaginas);
        this.renderizarResumen();
    },

    renderizarPaginacion: function(totalPaginas) {
        const paginacion = document.getElementById('tablaHistorialPaginacion');
        if (!paginacion) return;

        let html = '';
        if (totalPaginas > 1) {
            const mostrar = 5;
            const medio = Math.floor(mostrar / 2);
            let inicio = Math.max(1, this.paginaActual - medio);
            let fin = Math.min(totalPaginas, inicio + mostrar - 1);
            if (fin - inicio < mostrar - 1) {
                inicio = Math.max(1, fin - mostrar + 1);
            }

            html += `<nav aria-label="Paginación historial"><ul class="pagination mb-0 justify-content-center">`;
            html += `<li class="page-item ${this.paginaActual === 1 ? 'disabled' : ''}"><button class="page-link" type="button" data-page="${this.paginaActual - 1}">Anterior</button></li>`;

            for (let i = inicio; i <= fin; i++) {
                html += `<li class="page-item ${this.paginaActual === i ? 'active' : ''}"><button class="page-link" type="button" data-page="${i}">${i}</button></li>`;
            }

            html += `<li class="page-item ${this.paginaActual === totalPaginas ? 'disabled' : ''}"><button class="page-link" type="button" data-page="${this.paginaActual + 1}">Siguiente</button></li>`;
            html += `</ul></nav>`;
        }

        paginacion.innerHTML = html;

        const botones = paginacion.querySelectorAll('button[data-page]');
        botones.forEach(boton => {
            boton.addEventListener('click', () => {
                const pagina = parseInt(boton.dataset.page, 10);
                if (!isNaN(pagina)) {
                    this.renderizarTabla(this.ultimoFiltro, pagina);
                }
            });
        });
    },

    // Borrar todo el historial
    limpiarTodo: function() {
        localStorage.removeItem(this.KEY_STORAGE);
        this.paginaActual = 1;
        this.renderizarTabla();
        this.renderizarResumen();
    },

    exportarCSV: function() {
        const registros = this.obtenerTodos();
        if (registros.length === 0) {
            alert('No hay registros para exportar.');
            return;
        }

        const cabeceras = ['Fecha', 'Trámite', 'Canal', 'Eficiencia', 'Prioridad'];
        const filas = registros.map(reg => {
            const prioridad = reg.es_critico === 1 ? 'CRÍTICO' : 'CONTROLADO';
            return [
                reg.fecha,
                reg.tipo_tramite,
                reg.canal_ingreso === 'Digital' ? 'Digital' : 'Manual',
                `${reg.eficiencia}%`,
                prioridad
            ].map(campo => `"${String(campo).replace(/"/g, '""')}"`).join(',');
        });

        const contenidoCSV = [cabeceras.join(','), ...filas].join('\n');
        const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `Historial_Tramites_${new Date().getTime()}.csv`;
        enlace.click();
        URL.revokeObjectURL(url);
    },

    // Descargar historial en PDF
    descargarPDF: function() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const registros = this.obtenerTodos();
        if (registros.length === 0) {
            alert('No hay registros para descargar.');
            return;
        }

        // ============ ENCABEZADO ============
        // Fondo gradiente (simulado con rectángulo azul)
        doc.setFillColor(26, 41, 128);
        doc.rect(0, 0, 210, 45, 'F');
        
        // Título principal
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('HISTORIAL DE TRÁMITES', 14, 18);
        doc.text('Municipalidad Provincial de Yau', 14, 28);
        
        // Información de generación
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`Reporte generado: ${new Date().toLocaleString('es-PE')}`, 14, 40);
        doc.text(`Total de registros: ${registros.length}`, 14, 44);

        // ============ TABLA DE DATOS ============
        let yPosition = 55;
        
        // Encabezados de tabla
        doc.setTextColor(255, 255, 255);
        doc.setFillColor(38, 208, 206);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        
        const headers = ['Fecha', 'Trámite', 'Canal', 'Eficiencia', 'Prioridad'];
        const columnWidths = [38, 52, 25, 28, 35];
        const pageWidth = 196;
        let xPosition = 14;
        
        // Fondo para encabezados
        doc.rect(14, yPosition - 5, pageWidth, 7, 'F');
        
        // Textos de encabezados
        headers.forEach((header, i) => {
            doc.text(header, xPosition + 2, yPosition);
            xPosition += columnWidths[i];
        });
        
        yPosition += 8;
        
        // Línea divisora
        doc.setDrawColor(38, 208, 206);
        doc.setLineWidth(0.5);
        doc.line(14, yPosition, 196, yPosition);
        yPosition += 4;

        // ============ DATOS ============
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);
        
        registros.forEach((reg, index) => {
            // Fondo alternado para filas
            if (index % 2 === 0) {
                doc.setFillColor(245, 245, 245);
                doc.rect(14, yPosition - 3, pageWidth, 6, 'F');
            }
            
            const prioridad = reg.es_critico === 1 ? 'CRÍTICO' : 'CONTROLADO';
            const rowData = [
                reg.fecha,
                reg.tipo_tramite,
                reg.canal_ingreso === 'Digital' ? 'Digital' : 'Manual',
                reg.eficiencia + '%',
                prioridad
            ];

            xPosition = 14;
            rowData.forEach((data, i) => {
                // Color especial para eficiencia
                if (i === 3) {
                    if (reg.eficiencia >= 80) {
                        doc.setTextColor(34, 197, 94);
                        doc.setFont(undefined, 'bold');
                    } else if (reg.eficiencia >= 50) {
                        doc.setTextColor(245, 158, 11);
                        doc.setFont(undefined, 'bold');
                    } else {
                        doc.setTextColor(239, 68, 68);
                        doc.setFont(undefined, 'bold');
                    }
                } else if (i === 4) {
                    // Color para prioridad
                    if (reg.es_critico === 1) {
                        doc.setTextColor(239, 68, 68);
                        doc.setFont(undefined, 'bold');
                    } else {
                        doc.setTextColor(59, 130, 246);
                        doc.setFont(undefined, 'bold');
                    }
                } else {
                    doc.setTextColor(50, 50, 50);
                    doc.setFont(undefined, 'normal');
                }
                
                doc.text(String(data), xPosition + 2, yPosition);
                xPosition += columnWidths[i];
            });

            yPosition += 6;
            
            // Paginación automática
            if (yPosition > 275) {
                // Pie de página
                doc.setTextColor(150, 150, 150);
                doc.setFontSize(8);
                doc.text('M.P. Yau - Dashboard Inteligente', 14, 290);
                
                doc.addPage();
                
                // Repetir encabezado en nueva página
                doc.setFillColor(26, 41, 128);
                doc.rect(0, 0, 210, 20, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text('Historial de Trámites (continuación)', 14, 12);
                
                yPosition = 30;
                
                // Encabezados
                doc.setTextColor(255, 255, 255);
                doc.setFillColor(38, 208, 206);
                doc.setFontSize(9);
                doc.setFont(undefined, 'bold');
                xPosition = 14;
                doc.rect(14, yPosition - 5, pageWidth, 7, 'F');
                headers.forEach((header, i) => {
                    doc.text(header, xPosition + 2, yPosition);
                    xPosition += columnWidths[i];
                });
                
                yPosition += 8;
                doc.setDrawColor(38, 208, 206);
                doc.line(14, yPosition, 196, yPosition);
                yPosition += 4;
            }
        });

        // ============ PIE DE PÁGINA ============
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.text('M.P. Yau - Dashboard Inteligente | Reporte de Auditoría Local', 14, 290);

        // Descargar
        doc.save(`Historial_Tramites_${new Date().getTime()}.pdf`);
    }
};

// Configurar los botones al cargar el módulo
document.addEventListener('DOMContentLoaded', () => {
    const btnLimpiar = document.getElementById('btnLimpiarHistorial');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', () => {
            if(confirm('¿Está seguro de eliminar los logs del historial?')) {
                HistorialModulo.limpiarTodo();
                // Si el módulo de gráficos está presente, refrescar los gráficos vacíos
                if (typeof GraficosModulo !== 'undefined') GraficosModulo.inicializarOActualizar();
                if (typeof actualizarResumenDashboard === 'function') actualizarResumenDashboard();
            }
        });
    }

    const btnDescargar = document.getElementById('btnDescargarPDF');
    if (btnDescargar) {
        btnDescargar.addEventListener('click', () => {
            HistorialModulo.descargarPDF();
        });
    }

    const btnExportarCSV = document.getElementById('btnExportarCSV');
    if (btnExportarCSV) {
        btnExportarCSV.addEventListener('click', () => {
            HistorialModulo.exportarCSV();
        });
    }

    const buscador = document.getElementById('buscadorHistorial');
    if (buscador) {
        buscador.addEventListener('input', (event) => {
            HistorialModulo.renderizarTabla(event.target.value, 1);
        });
    }

    HistorialModulo.renderizarTabla();
});