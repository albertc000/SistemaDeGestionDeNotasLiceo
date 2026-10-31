// Scripts para renderizar la base de datos de estudiantes y calificaciones

// Funciones de la tabla principales
async function editarEstudiante(cedula) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/busquedaEstudiante';
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'cedula';
    input.value = cedula;
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
}

let listaCompletaEstudiantes = [];
//cargar estudiantes desde la API existente
async function iniciarFiltrosSelect() {
    try {
        const respuesta = await fetch('/api/estudiantes');
        listaCompletaEstudiantes = await respuesta.json();
        
        // Renderizar todos inicialmente
        aplicarFiltrosSelect();
    } catch (error) {
        console.error("Error al cargar estudiantes:", error);
    }
}



//funcion que se ejecuta cada vez que cambia el año o la seccion
function aplicarFiltrosSelect() {
    const elAno = document.getElementById('filtroAno');
    const elSec = document.getElementById('filtroSeccion');
    if (!elAno || !elSec) return;

    const anoSeleccionado = elAno.value;
    const seccionSeleccionada = elSec.value;
    let resultado = listaCompletaEstudiantes;
    if (anoSeleccionado !== "") {
        resultado = resultado.filter(est => est.ano === anoSeleccionado);
    }
    if (seccionSeleccionada !== "") {
        resultado = resultado.filter(est => est.seccion === seccionSeleccionada);
    }
    const contador = document.getElementById('contadorAlumnosFiltrados');
    if (contador) contador.textContent = resultado.length;
    renderizarFilas(resultado);
}

//boton mostrar todos
function mostrarTodosLosEstudiantes() {
    const elAno = document.getElementById('filtroAno');
    const elSec = document.getElementById('filtroSeccion');
    if (elAno) elAno.value = "";
    if (elSec) elSec.value = "";
    aplicarFiltrosSelect();
}

//renderizar las filas en la tabla existente
function renderizarFilas(estudiantes) {
    const cuerpo = document.getElementById('cuerpoTabla');
    if (!cuerpo) return;
    // Si hubo un error en la API o no es un arreglo
    if (!Array.isArray(estudiantes)) {
        cuerpo.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: #dc2626;">
                    Error al cargar los datos desde el servidor. Verifique la base de datos.
                </td>
            </tr>
        `;
        return;
    }
    if (estudiantes.length === 0) {
        cuerpo.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: #64748b;">
                    No hay estudiantes registrados con los criterios seleccionados.
                </td>
            </tr>
        `;
        return;
    }
    cuerpo.innerHTML = estudiantes.map(est => {
        const prom = Number(est.promedio) || 0;
        const esAprobado = est.estado === "Aprobado" || prom >= 10;
        const colorEstado = esAprobado ? "color: #16a34a; font-weight: bold;" : "color: #dc2626; font-weight: bold;";
        const badgeBg = esAprobado 
            ? "background-color: #dcfce7; border: 1px solid #86efac; padding: 4px 8px; border-radius: 6px;" 
            : "background-color: #fee2e2; border: 1px solid #fca5a5; padding: 4px 8px; border-radius: 6px;";
        return `
            <tr>
                <td style="font-weight: 500;">${est.cedula}</td>
                <td style="font-weight: 600;">${est.nombre} ${est.seg_nombre} ${est.apellido} ${est.seg_apellido}</td>
                <td>${est.ano || '-'}</td>
                <td>${est.seccion || '-'}</td>
                <td><span style="${colorEstado} ${badgeBg}">${est.estado || (esAprobado ? "Aprobado" : "Reprobado")}</span></td>
                <td class="cell-actions">
                    <div class="actions-container" style="display: flex; gap: 0.4rem;">
                        <button class="action-button btn-pres" onclick="abrirModalDetalle('${est.cedula}')" title="Ver Boletín de Notas">
                            <svg class="w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 3v4a1 1 0 0 1-1 1H5m14-4v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7.414a1 1 0 0 1 .293-.707l4.414-4.414A1 1 0 0 1 10 2h8a1 1 0 0 1 1 1Z"/>
                            </svg>
                        </button>
                        <button class="action-button btn-edit" onclick="editarEstudiante('${est.cedula}')" title="Modificar">
                            <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" stroke-width="2" d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z"/>
                                <path stroke="currentColor" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

//iniciar al cargar el DOM si los filtros existen en la página
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('filtroAno')) {
        iniciarFiltrosSelect();
    }
});
async function eliminarEstudiante(cedula, nombreCompleto) {
    const confirmar = confirm(`¿Seguro que desea eliminar al estudiante: ${nombreCompleto}?`);
    if (!confirmar) return;
    const respuesta = await fetch('/eliminarEstudiante', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: cedula })
    });
    if (respuesta.ok) {
        renderizarEstudiantes();
    } else {
        alert('Error al eliminar el estudiante');
    }
}

async function renderizarEstudiantes() {
    const cuerpo = document.getElementById('cuerpoTabla');
    if (!cuerpo) return;

    try {
        const respuesta = await fetch('/api/estudiantes');
        if (!respuesta.ok) {
            cuerpo.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Error al consultar los estudiantes.</td></tr>`;
            return;
        }
        const estudiantes = await respuesta.json();
        if (!Array.isArray(estudiantes) || estudiantes.length === 0) {
            cuerpo.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b;">No hay estudiantes registrados actualmente.</td></tr>`;
            return;
        }

        cuerpo.innerHTML = estudiantes.map(est => {
            const prom = Number(est.promedio) || 0;
            const esAprobado = est.estado === "Aprobado" || prom >= 10;
            const colorEstado = esAprobado ? "color: #16a34a; font-weight: bold;" : "color: #dc2626; font-weight: bold;";
            const badgeBg = esAprobado ? "background-color: #dcfce7; border: 1px solid #86efac; padding: 4px 8px; border-radius: 6px;" : "background-color: #fee2e2; border: 1px solid #fca5a5; padding: 4px 8px; border-radius: 6px;";

            return `
                <tr>
                    <td style="font-weight: 500;">${est.cedula}</td>
                    <td style="font-weight: 600;">${est.nombre} ${est.apellido}</td>
                    <td>${est.ano || '-'}</td>
                    <td>${est.seccion || '-'}</td>
                    <td><span style="${colorEstado} ${badgeBg}">${est.estado || (esAprobado ? "Aprobado" : "Reprobado")}</span></td>
                    <td class="cell-actions">
                        <div class="actions-container" style="display: flex; gap: 0.4rem;">
                            <button class="action-button btn-pres" onclick="abrirModalDetalle('${est.cedula}')" title="Ver Boletín de Notas">
                                <svg class="w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 3v4a1 1 0 0 1-1 1H5m14-4v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7.414a1 1 0 0 1 .293-.707l4.414-4.414A1 1 0 0 1 10 2h8a1 1 0 0 1 1 1Z"/>
                                </svg>
                            </button>
                            <button class="action-button btn-edit" onclick="editarEstudiante('${est.cedula}')" title="Ver">
                                <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"> <path stroke="currentColor" stroke-width="2" d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z"/> <path stroke="currentColor" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/> </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error al renderizar los estudiantes:', error);
    }
}

//busqueda
const input = document.getElementById('searchInput');
const emptyState = document.getElementById('emptyState');

if (input) {
    input.addEventListener('keyup', (e) => {
        const term = e.target.value.toLowerCase();
        let matchCount = 0;
        const rows = document.querySelectorAll('#cuerpoTabla tr');

        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            if (text.includes(term)) {
                row.style.display = '';
                matchCount++;
            } else {
                row.style.display = 'none';
            }
        });

        if (emptyState) {
            emptyState.style.display = matchCount === 0 ? 'table-row-group' : 'none';
        }
    });
}

//modal boleta
async function abrirModalDetalle(cedula) {
    try {
        const respuesta = await fetch(`/api/calificaciones/${cedula}`);
        const data = await respuesta.json();

        if (!data.exito) {
            alert(data.mensaje || "No se pudo cargar el boletín.");
            return;
        }

        const est = data.estudiante;
        const materias = data.materias || [];

        const modalTitulo = document.getElementById('modalTitulo');
        const modalSubtitulo = document.getElementById('modalSubtitulo');
        const contenido = document.getElementById('detalleEstudianteContenido');

        if (modalTitulo) modalTitulo.textContent = `Boletín: ${est.nombre}`;
        if (modalSubtitulo) modalSubtitulo.textContent = `Cédula: V-${est.cedula}`;

        // Calcular promedio general
        let sumaPromedios = 0;
        let cantMaterias = 0;
        materias.forEach(m => {
            sumaPromedios += Number(m.promedio) || 0;
            cantMaterias++;
        });

        const promGen = cantMaterias > 0 ? (sumaPromedios / cantMaterias).toFixed(2) : "0.00";
        const esAprobado = Number(promGen) >= 10;
        const estadoTexto = esAprobado ? "Aprobado" : "Reprobado";
        const estadoColor = esAprobado ? "#16a34a" : "#dc2626";

        if (contenido) {
            contenido.innerHTML = `
                <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; overflow-x: auto;">
                    <h4 style="margin-bottom: 0.8rem; color: #334155; font-size: 1.1rem;">Calificaciones por Materia (Evaluaciones 1 a 4)</h4>
                    <table style="width: 100%; border-collapse: collapse; text-align: left; background: white; border-radius: 6px; overflow: hidden; font-size: 0.95rem;">
                        <thead>
                            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                                <th style="padding: 10px;">Asignatura</th>
                                <th style="padding: 10px; text-align: center;">Nota 1</th>
                                <th style="padding: 10px; text-align: center;">Nota 2</th>
                                <th style="padding: 10px; text-align: center;">Nota 3</th>
                                <th style="padding: 10px; text-align: center;">Nota 4</th>
                                <th style="padding: 10px; text-align: right;">Promedio</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${materias.length > 0 ? materias.map(m => `
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 10px; font-weight: 600;">${m.materia}</td>
                                    <td style="padding: 10px; text-align: center;">${m.lapso1 !== null ? m.lapso1 : '-'}</td>
                                    <td style="padding: 10px; text-align: center;">${m.lapso2 !== null ? m.lapso2 : '-'}</td>
                                    <td style="padding: 10px; text-align: center;">${m.lapso3 !== null ? m.lapso3 : '-'}</td>
                                    <td style="padding: 10px; text-align: center;">${m.lapso4 !== null ? m.lapso4 : '-'}</td>
                                    <td style="padding: 10px; text-align: right; font-weight: bold; color: ${m.promedio >= 10 ? '#16a34a' : '#dc2626'};">
                                        ${m.promedio} pts
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="6" style="padding: 1.5rem; text-align: center; color: #64748b;">
                                        No hay materias ni calificaciones registradas para este estudiante.
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>

                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                    <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 0.85rem; color: #166534;">Promedio General</div>
                        <div style="font-size: 1.8rem; font-weight: bold; color: ${estadoColor};">${promGen} pts</div>
                    </div>
                    <div style="flex: 1; background: ${esAprobado ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${esAprobado ? '#bbf7d0' : '#fecaca'}; padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 0.85rem; color: ${esAprobado ? '#166534' : '#991b1b'};">Condición Académica</div>
                        <div style="font-size: 1.4rem; font-weight: bold; color: ${estadoColor}; margin-top: 0.3rem;">${estadoTexto}</div>
                    </div>
                </div>
            `;
        }

        const modal = document.getElementById('modalDetalle');
        if (modal) modal.style.display = 'flex';
    } catch (err) {
        console.error("Error al abrir modal:", err);
    }
}

function cerrarModal() {
    const modal = document.getElementById('modalDetalle');
    if (modal) modal.style.display = 'none';
}

//cargar indicadores de la base de datos para el panel de control
async function cargarBD() {
    const totalEstudiantes = document.getElementById('totalEstudiantes');
    const totalProfesores = document.getElementById('totalProfesores');
    const aprobados = document.getElementById('estudiantesPrestados');
    const reprobados = document.getElementById('estudiantesReprobados');
    const promedioGeneral = document.getElementById('promedioGeneral');

    if (!totalEstudiantes && !aprobados && !reprobados && !promedioGeneral && !totalProfesores) return;

    try {
        const respuesta = await fetch('/api/estudiantes');
        if (!respuesta.ok) throw new Error('Error al cargar la base de datos');
        const estudiantes = await respuesta.json();

        const total = estudiantes.length;
        if (totalEstudiantes) totalEstudiantes.textContent = total;

        const aprobados = estudiantes.filter(e => (Number(e.promedio) || 0) >= 10 || e.estado === "Aprobado").length;
        if (aprobados) aprobados.textContent = aprobados;

        const reprobados = total - aprobados;
        if (reprobados) reprobados.textContent = reprobados;

        if (promedioGeneral) {
            if (total === 0) {
                promedioGeneral.textContent = "0.00";
            } else {
                const sumaPromedios = estudiantes.reduce((acc, curr) => acc + (Number(curr.promedio) || 0), 0);
                promedioGeneral.textContent = (sumaPromedios / total).toFixed(2);
            }
        }

        const respuestaProf = await fetch('/api/profesores');
        if (!respuestaProf.ok) throw new Error('Error al cargar la base de datos de Profesores');
        const profesores = await respuestaProf.json();

        const totalProf = profesores.length;
        if (totalProfesores) totalProfesores.textContent = totalProf;
    } catch (error) {
        console.error('Problema al cargar métricas del panel de control:', error);
    }

}

//renderizar minitablas del dashboard
async function renderizarListas() {
    const cuerpo = document.getElementById('cuerpoTabla');
    const cuerpo2 = document.getElementById('cuerpoTabla2');
    if (!cuerpo && !cuerpo2) return;

    try {
        const respuesta = await fetch('/api/estudiantes');
        const estudiantes = await respuesta.json();

        if (cuerpo) {
            const ultimos = estudiantes.slice(-3).reverse();
            cuerpo.innerHTML = ultimos.map(est => `
                <tr>
                    <td>${est.cedula}</td>
                    <td>${est.nombre} ${est.apellido}</td>
                    <td>${est.ano || '-'} ${est.seccion || ''}</td>
                    <td style="font-weight: bold;">${(Number(est.promedio) || 0).toFixed(2)} pts</td>
                </tr>
            `).join('');
        }

        if (cuerpo2) {
            const primeros = estudiantes.slice(0, 3);
            cuerpo2.innerHTML = primeros.map(est => `
                <tr>
                    <td>${est.cedula}</td>
                    <td>${est.nombre} ${est.apellido}</td>
                    <td>${est.ano || '-'} ${est.seccion || ''}</td>
                    <td style="font-weight: bold;">${(Number(est.promedio) || 0).toFixed(2)} pts</td>
                </tr>
            `).join('');
        }
    } catch (err) {
        console.error('Error al renderizar minitablas:', err);
    }
}

//renderizar reporte imprimible
async function renderizarReporte() {
    const cuerpo = document.getElementById('cuerpoTablaReporte');
    if (!cuerpo) return;

    try {
        const respuesta = await fetch('/api/estudiantes');
        const estudiantes = await respuesta.json();

        if (!Array.isArray(estudiantes) || estudiantes.length === 0) {
            cuerpo.innerHTML = `
                <tr>
                    <td colspan="11" style="text-align: center; padding: 2rem; color: #64748b;">
                        No hay estudiantes registrados para generar el reporte.
                    </td>
                </tr>
            `;
            return;
        }

        cuerpo.innerHTML = estudiantes.map(est => {
            const prom = Number(est.promedio) || 0;
            const esAprobado = prom >= 10;
            const nombres = [est.nombre, est.seg_nombre].filter(Boolean).join(' ');
            const apellidos = [est.apellido, est.seg_apellido].filter(Boolean).join(' ');
            return `
                <tr>
                    <td>${est.cedula}</td>
                    <td>${nombres}</td>
                    <td>${apellidos}</td>
                    <td>${est.ano || '-'}</td>
                    <td>${est.seccion || '-'}</td>
                    <td>${est.nota1 !== undefined ? est.nota1 : '-'}</td>
                    <td>${est.nota2 !== undefined ? est.nota2 : '-'}</td>
                    <td>${est.nota3 !== undefined ? est.nota3 : '-'}</td>
                    <td>${est.nota4 !== undefined ? est.nota4 : '-'}</td>
                    <td style="font-weight: bold;">${prom.toFixed(2)}</td>
                    <td style="font-weight: bold; color: ${esAprobado ? 'green' : 'red'};">${est.estado || (esAprobado ? "Aprobado" : "Reprobado")}</td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error('Error al renderizar el reporte:', err);
    }
}

async function imprimirTabla() {
    let contenido = document.getElementById('impresion').innerHTML;
    let ventanaImpresion = window.open('', '_blank');
    
    ventanaImpresion.document.write('<html><head><title>Imprimir Reporte Escolar</title>');
    ventanaImpresion.document.write('<style>table { border-collapse: collapse; width: 100%; font-family: sans-serif; } th, td { border: 1px solid #000; padding: 8px; text-align: center; } th { background-color: #f2f2f2; }</style>');
    ventanaImpresion.document.write('</head><body>');
    ventanaImpresion.document.write(contenido);
    ventanaImpresion.document.write('</body></html>');
    
    ventanaImpresion.document.close();
    ventanaImpresion.window.print();
    ventanaImpresion.close();
}

if (document.getElementById('cuerpoTabla') && window.location.pathname.includes('/listado')) {
    renderizarEstudiantes();
}

if (document.getElementById('totalEstudiantes')) {
    cargarBD();
}

if (document.getElementById('totalProfesores')) {
    cargarBD();
}

if (document.getElementById('cuerpoTabla2')) {
    renderizarListas();
}

if (document.getElementById('cuerpoTablaReporte')) {
    renderizarReporte();
}


