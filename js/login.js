//scripts para login 

const formLogin = document.getElementById('formLogin');
const errorLogin = document.getElementById('mensaje-error');
const contrasenaInput = document.getElementById('contrasena');

//proceso de iniciar sesion
formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usuario = document.getElementById('usuario').value.trim();
    const contrasena = contrasenaInput.value.trim();

    errorLogin.style.display = 'none';
    errorLogin.textContent = '';

    try {
        const response = await fetch('/login', {
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            body: JSON.stringify({ usuario, contrasena })
        });
        const data = await response.json();
        if (data.exito) {
            window.location.href = '/inicio';
        } else {
            errorLogin.textContent = data.mensaje || 'Credenciales incorrectas';
            errorLogin.style.display = 'block';
            contrasenaInput.value = '';
        }
    } catch (error) {
        errorLogin.textContent = 'Error de conexión con el servidor';
        errorLogin.style.display = 'block';
    }
});

//cerrar sesion
async function cerrarSesion() {
    const confirmar = confirm(`¿Seguro que quiere Cerrar Sesión?`);
    
    if (confirmar) {
        window.location.href = '/logout';
    }
}