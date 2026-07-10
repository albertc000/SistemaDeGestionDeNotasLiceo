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
