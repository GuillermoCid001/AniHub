const BACKEND_URL = 'http://localhost:3000';

async function verificarToken() {
    const token = localStorage.getItem('anihub_token');

    if (!token) {
        window.location.href = '/login.html';
        return null;
    }

    try {
        const res = await fetch(`${BACKEND_URL}/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            localStorage.removeItem('anihub_token');
            window.location.href = '/login.html';
            return null;
        }

        const data = await res.json();
        return data.user;

    } catch (err) {
        console.error('Error verificando token:', err);
        window.location.href = '/login.html';
        return null;
    }
}

function cerrarSesion() {
    localStorage.removeItem('anihub_token');
    localStorage.removeItem('anihub_user');
    window.location.href = '/login.html';
}

function mostrarUsuario() {
    const user = JSON.parse(localStorage.getItem('anihub_user') || '{}');
    const el = document.getElementById('user-info');
    if (el && user.username) {
        el.innerHTML = `
            <span style="color:#aaa; font-size:0.9em;">Hola, <strong style="color:#fff">${user.username}</strong></span>
            <button onclick="cerrarSesion()" style="
                margin-left: 15px;
                background: transparent;
                border: 1px solid #555;
                color: #aaa;
                padding: 4px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.85em;
                transition: all 0.2s;
            " onmouseover="this.style.borderColor='#e50914';this.style.color='#fff'"
               onmouseout="this.style.borderColor='#555';this.style.color='#aaa'">
                Cerrar sesión
            </button>
        `;
    }
}