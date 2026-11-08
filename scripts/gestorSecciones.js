// Cargar todas las tarjetas organizadas por año escolar (para vista /secciones)
async function cargarTarjetas() {
    const contenedor = document.getElementById('contenedorTarjetas');
    if (!contenedor) return;

    try {
        const res = await fetch('/api/secciones-resumen');
        const secciones = await res.json();
        contenedor.innerHTML = '';

        // Agrupar por año/grado
        const grados = [...new Set(secciones.map(s => s.grado))];

        grados.forEach(grado => {
            const grupoDiv = document.createElement('div');
            grupoDiv.className = 'grupo-ano';
            grupoDiv.innerHTML = `<div class="titulo-ano">${grado.toUpperCase()}</div>`;

            const grid = document.createElement('div');
            grid.className = 'grid-tarjetas';

            secciones.filter(s => s.grado === grado).forEach(sec => {
                const enlace = document.createElement('a');
                enlace.href = `/seccion/${sec.id}`;
                enlace.style.textDecoration = 'none';
                enlace.innerHTML = `
                    <div class="card-seccion">
                        <div class="card-seccion-header">
                            <h4>${sec.grado.toUpperCase()} SECCIÓN ${sec.letra}</h4>
                            <span class="icon-link">
                                <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.248 19C3.22 15.77 5.275 8.232 12.466 8.232V6.079a1.025 1.025 0 0 1 1.644-.862l5.479 4.307a1.108 1.108 0 0 1 0 1.723l-5.48 4.307a1.026 1.026 0 0 1-1.643-.861v-2.154C5.275 13.616 4.248 19 4.248 19Z"/>
                                </svg>
                            </span>
                        </div>
                        <p>${sec.total_estudiantes} Estudiantes</p>
                    </div>
                `;
                grid.appendChild(enlace);
            });

            grupoDiv.appendChild(grid);
            contenedor.appendChild(grupoDiv);
        });
    } catch (e) {
        console.error("Error al cargar tarjetas de secciones:", e);
    }
}

// ========================================================
// Funciones para Detalle de Sección (/seccion/:id)
// ========================================================

// Abrir modal de asignación de docente
function abrirModalAsignarProfesor(idMateria, nombreMateria) {
    const elNombre = document.getElementById('modalNombreMateria');
    const elInput = document.getElementById('modalInputMateria');
    if (elNombre) elNombre.textContent = nombreMateria;
    if (elInput) elInput.value = idMateria;

    const buscador = document.getElementById('buscadorProfesorModal');
    if (buscador) buscador.value = '';
    document.querySelectorAll('.fila-profesor-modal').forEach(fila => fila.style.display = 'flex');

    const modal = document.getElementById('modalAsignarProfesor');
    if (modal) {
        modal.style.display = 'flex';
        if (buscador) setTimeout(() => buscador.focus(), 50);
    }
}

// Cerrar modal de asignación
function cerrarModalProfesor() {
    const modal = document.getElementById('modalAsignarProfesor');
    if (modal) modal.style.display = 'none';
}

// Seleccionar profesor y auto-enviar formulario
function seleccionarYGuardarProfesor(cedula) {
    const inputProf = document.getElementById('modalInputProfesor');
    const form = document.getElementById('formAutoGuardarProfesor');
    if (inputProf && form) {
        inputProf.value = cedula;
        form.submit();
    }
}

// ========================================================
// Modal de Inscripción de Estudiantes
// ========================================================

// Abrir modal de inscripción de estudiante
function abrirModalInscribirEstudiante() {
    const buscador = document.getElementById('buscadorEstudianteModal');
    if (buscador) buscador.value = '';
    document.querySelectorAll('.fila-estudiante-modal').forEach(fila => fila.style.display = 'flex');

    const modal = document.getElementById('modalInscribirEstudiante');
    if (modal) {
        modal.style.display = 'flex';
        if (buscador) setTimeout(() => buscador.focus(), 50);
    }
}

// Cerrar modal de estudiante
function cerrarModalEstudiante() {
    const modal = document.getElementById('modalInscribirEstudiante');
    if (modal) modal.style.display = 'none';
}

// Seleccionar estudiante y guardar automáticamente
function seleccionarYGuardarEstudiante(cedula) {
    const inputEst = document.getElementById('modalInputEstudiante');
    const form = document.getElementById('formAutoGuardarEstudiante');
    if (inputEst && form) {
        inputEst.value = cedula;
        form.submit();
    }
}

// Navegación para modificar docente
function editarProfesor(cedula) {
    const f = document.createElement('form');
    f.method = 'POST';
    f.action = '/busquedaProfesor';
    f.innerHTML = `
        <input type="hidden" name="cedula" value="${cedula}">
        <input type="hidden" name="from" value="${encodeURIComponent(window.location.pathname)}">
    `;
    document.body.appendChild(f);
    f.submit();
}

// Navegación para modificar estudiante (datos personales) recordando la sección de origen
function editarEstudiante(cedula) {
    window.location.href = `/estudiante/${cedula}/editar?from=${encodeURIComponent(window.location.pathname)}`;
}

// Navegación para gestionar calificaciones recordando la sección de origen
function irACalificaciones(cedula) {
    window.location.href = `/estudiante/${cedula}/notas?from=${encodeURIComponent(window.location.pathname)}`;
}

// Desincorporar estudiante de la sección
function desincorporarEstudianteSeccion(idSeccion, cedula, nombreCompleto) {
    if (!confirm(`¿Deseas desincorporar a ${nombreCompleto} (V-${cedula}) de esta sección?\nEl estudiante volverá a quedar disponible para asignarlo a otra aula.`)) {
        return;
    }
    const f = document.createElement('form');
    f.method = 'POST';
    f.action = `/seccion/${idSeccion}/desasignarEstudiante`;
    f.innerHTML = `<input type="hidden" name="cedula_estudiante" value="${cedula}">`;
    document.body.appendChild(f);
    f.submit();
}

// Eventos e inicialización
function inicializarGestorSecciones() {
    // Si estamos en la vista de tarjetas de secciones
    cargarTarjetas();

    // Cerrar modales al hacer clic en el backdrop
    window.addEventListener('click', (e) => {
        const modalProf = document.getElementById('modalAsignarProfesor');
        if (modalProf && e.target === modalProf) cerrarModalProfesor();

        const modalEst = document.getElementById('modalInscribirEstudiante');
        if (modalEst && e.target === modalEst) cerrarModalEstudiante();
    });

    // Buscador interactivo en modal de profesores
    const buscadorModal = document.getElementById('buscadorProfesorModal');
    if (buscadorModal) {
        buscadorModal.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            const filas = document.querySelectorAll('.fila-profesor-modal');
            filas.forEach(fila => {
                const texto = fila.getAttribute('data-busqueda') || '';
                fila.style.display = texto.includes(term) ? 'flex' : 'none';
            });
        });
    }

    // Buscador interactivo en modal de estudiantes sin sección
    const buscadorEstModal = document.getElementById('buscadorEstudianteModal');
    if (buscadorEstModal) {
        buscadorEstModal.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            const filas = document.querySelectorAll('.fila-estudiante-modal');
            filas.forEach(fila => {
                const texto = fila.getAttribute('data-busqueda') || '';
                fila.style.display = texto.includes(term) ? 'flex' : 'none';
            });
        });
    }

    // Buscador en tiempo real de alumnos en esta sección
    const inputBuscar = document.getElementById('inputBuscarEstudiante');
    if (inputBuscar) {
        inputBuscar.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            const filas = document.querySelectorAll('.fila-estudiante');
            filas.forEach(fila => {
                const texto = fila.textContent.toLowerCase();
                fila.style.display = texto.includes(term) ? '' : 'none';
            });
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarGestorSecciones);
} else {
    inicializarGestorSecciones();
}
