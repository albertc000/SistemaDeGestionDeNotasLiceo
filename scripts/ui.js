//scripts para interfaz

//seleccion de opciones a la izquierda
const burger = document.getElementById('burger');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');

if (burger) {
    burger.addEventListener('click', () => {
        sidebar.classList.add('active');
    });
}

if (closeSidebar) {
    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('active');
    });
}

function updateRgbVariables() {
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    if (primaryColor.startsWith('#')) {
        const r = parseInt(primaryColor.slice(1, 3), 16);
        const g = parseInt(primaryColor.slice(3, 5), 16);
        const b = parseInt(primaryColor.slice(5, 7), 16);
        document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
    }
}
updateRgbVariables();

// ========================================================
// Sistema Global de Notificaciones Toast
// ========================================================
function mostrarToast(mensaje, tipo = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;

    const icono = tipo === 'error'
        ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';

    toast.innerHTML = `${icono}<span>${mensaje}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastFadeOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

window.mostrarToast = mostrarToast;

// Disparar toast automáticamente si viene un mensaje en la URL
function verificarMensajeUrl() {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('msg');
    if (msg) {
        const mensajes = {
            'profesor_asignado': 'Profesor asignado con éxito',
            'profesor_desasignado': 'Asignación de profesor removida',
            'estudiante_inscrito': 'Estudiante inscrito en la sección',
            'estudiante_desincorporado': 'Estudiante desincorporado de la sección',
            'estudiante_guardado': 'Datos del estudiante guardados con éxito',
            'notas_guardadas': 'Calificaciones actualizadas con éxito',
            'profesor_guardado': 'Datos del profesor guardados con éxito',
            'error': 'Ocurrió un error al procesar la operación'
        };
        const texto = mensajes[msg] || decodeURIComponent(msg);
        const tipo = msg.includes('error') ? 'error' : 'success';
        mostrarToast(texto, tipo);

        // Limpiar el parámetro de la URL sin recargar
        params.delete('msg');
        const nuevaUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
        window.history.replaceState({}, '', nuevaUrl);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', verificarMensajeUrl);
} else {
    verificarMensajeUrl();
}
