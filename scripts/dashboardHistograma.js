// Histograma de distribución de estudiantes por año y sección para el Panel de Control
let histogramaChart = null;
let datosSeccionesCache = [];

const COLORES_SECCION = {
    'A': { bg: '#0f766e', border: '#115e59', label: 'Sección A' }, // Teal liceo
    'B': { bg: '#0284c7', border: '#0369a1', label: 'Sección B' }, // Sky / Azul
    'C': { bg: '#059669', border: '#047857', label: 'Sección C' }, // Esmeralda
    'D': { bg: '#6366f1', border: '#4f46e5', label: 'Sección D' }  // Índigo
};

async function cargarHistogramaEstudiantes() {
    const canvas = document.getElementById('histogramaEstudiantes');
    if (!canvas) return;

    try {
        const respuesta = await fetch('/api/secciones-resumen');
        if (!respuesta.ok) throw new Error('Error al consultar /api/secciones-resumen');
        
        datosSeccionesCache = await respuesta.json();
        if (!Array.isArray(datosSeccionesCache) || datosSeccionesCache.length === 0) {
            mostrarMensajeVacio();
            return;
        }

        procesarYRenderizar(datosSeccionesCache, 'apilado');
        actualizarKpisSecciones(datosSeccionesCache);
    } catch (error) {
        console.error('Error cargando histograma de estudiantes:', error);
        const contenedor = canvas.parentElement;
        if (contenedor) {
            contenedor.innerHTML = `
                <div style="display: flex; height: 100%; align-items: center; justify-content: center; color: #dc2626; font-weight: 500;">
                    No se pudieron cargar las estadísticas de las secciones.
                </div>
            `;
        }
    }
}

function procesarYRenderizar(secciones, modo) {
    const canvas = document.getElementById('histogramaEstudiantes');
    if (!canvas || typeof Chart === 'undefined') return;

    // 1. Obtener lista ordenada de grados únicos
    const gradosMap = new Map();
    secciones.forEach(s => {
        if (!gradosMap.has(s.id_grado)) {
            gradosMap.set(s.id_grado, s.grado);
        }
    });
    const listaGrados = Array.from(gradosMap.values()); // ['1er Año', '2do Año', ...]

    // 2. Obtener letras de secciones ('A', 'B', 'C', 'D')
    const letrasSecciones = ['A', 'B', 'C', 'D'];

    // 3. Construir datasets por sección
    const datasets = letrasSecciones.map(letra => {
        const configColor = COLORES_SECCION[letra] || { bg: '#64748b', border: '#475569', label: `Sección ${letra}` };
        
        const data = listaGrados.map(gradoNom => {
            const sec = secciones.find(s => s.grado === gradoNom && s.letra === letra);
            return sec ? Number(sec.total_estudiantes) || 0 : 0;
        });

        return {
            label: configColor.label,
            data: data,
            backgroundColor: configColor.bg,
            borderColor: configColor.border,
            borderWidth: 1,
            borderRadius: 4,
            maxBarThickness: 54
        };
    });

    const esApilado = (modo === 'apilado');

    if (histogramaChart) {
        histogramaChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    histogramaChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: listaGrados,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                        boxWidth: 14,
                        boxHeight: 14,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 16,
                        font: {
                            family: 'inherit',
                            size: 12,
                            weight: '600'
                        },
                        color: '#334155'
                    }
                },
                tooltip: {
                    backgroundColor: '#0f172a',
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: {
                        family: 'inherit',
                        size: 13,
                        weight: '700'
                    },
                    bodyFont: {
                        family: 'inherit',
                        size: 12
                    },
                    callbacks: {
                        label: function(context) {
                            const val = context.raw || 0;
                            return ` ${context.dataset.label}: ${val} ${val === 1 ? 'estudiante' : 'estudiantes'}`;
                        },
                        footer: function(tooltipItems) {
                            let totalAno = 0;
                            tooltipItems.forEach(item => {
                                totalAno += item.raw || 0;
                            });
                            return ` Total año: ${totalAno} ${totalAno === 1 ? 'estudiante' : 'estudiantes'}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: esApilado,
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: 'inherit',
                            weight: '700',
                            size: 13
                        },
                        color: '#1e293b'
                    }
                },
                y: {
                    stacked: esApilado,
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        precision: 0,
                        font: {
                            family: 'inherit',
                            size: 12
                        },
                        color: '#64748b'
                    },
                    title: {
                        display: true,
                        text: 'Cantidad de Estudiantes',
                        font: {
                            family: 'inherit',
                            weight: '600',
                            size: 12
                        },
                        color: '#475569'
                    },
                    grid: {
                        color: '#f1f5f9'
                    }
                }
            }
        }
    });

    renderizarResumenPorAno(secciones, listaGrados);
}


function renderizarResumenPorAno(secciones, listaGrados) {
    const contenedor = document.getElementById('resumenTotalesPorAno');
    if (!contenedor) return;

    contenedor.innerHTML = listaGrados.map(grado => {
        const totalGrado = secciones
            .filter(s => s.grado === grado)
            .reduce((acc, curr) => acc + (Number(curr.total_estudiantes) || 0), 0);

        return `
            <div style="flex: 1 1 140px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
                <div style="font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">${grado}</div>
                <div style="font-size: 1.55rem; font-weight: 800; color: #0f766e; margin-top: 4px;">
                    ${totalGrado} <span style="font-size: 0.85rem; font-weight: 500; color: #64748b;">${totalGrado === 1 ? 'est.' : 'est.'}</span>
                </div>
            </div>
        `;
    }).join('');
}

function actualizarKpisSecciones(secciones) {
    const elTotalSecciones = document.getElementById('totalSecciones');
    const elAulaMayor = document.getElementById('aulaMayorMatricula');

    if (elTotalSecciones) {
        elTotalSecciones.textContent = secciones.length;
    }

    if (elAulaMayor) {
        let maxSec = null;
        secciones.forEach(s => {
            const tot = Number(s.total_estudiantes) || 0;
            if (!maxSec || tot > (Number(maxSec.total_estudiantes) || 0)) {
                maxSec = s;
            }
        });

        if (maxSec && Number(maxSec.total_estudiantes) > 0) {
            elAulaMayor.textContent = `${maxSec.grado} "${maxSec.letra}" (${maxSec.total_estudiantes})`;
        } else {
            elAulaMayor.textContent = 'Sin estudiantes';
        }
    }
}

function mostrarMensajeVacio() {
    const canvas = document.getElementById('histogramaEstudiantes');
    if (!canvas) return;
    const contenedor = canvas.parentElement;
    if (contenedor) {
        contenedor.innerHTML = `
            <div style="display: flex; height: 100%; align-items: center; justify-content: center; color: #64748b; font-weight: 500;">
                No hay secciones registradas para graficar.
            </div>
        `;
    }
}

// Inicialización automática al cargar el DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarHistogramaEstudiantes);
} else {
    cargarHistogramaEstudiantes();
}

