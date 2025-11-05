document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form');
  const correoInput = document.getElementById('correo');
  const contraseñaInput = document.getElementById('contraseña');
  const titulo = document.getElementById('titulo');
  const btnAccion = document.getElementById('btnAccion');

  titulo.textContent = 'Iniciar Sesión';
  btnAccion.textContent = 'Login';

  // Evento de envío del formulario
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const correo = correoInput.value.trim();
    const contraseña = contraseñaInput.value.trim();

    if (!correo || !contraseña) {
      showToast('Por favor completa todos los campos', 'warning');
      return;
    }

    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contraseña })
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.msg || 'Credenciales inválidas', 'error');
        return;
      }

      // Guardar datos de usuario en sesión
      sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
      showToast('Inicio de sesión exitoso', 'success');

      // Redirigir según cargo
      setTimeout(() => {
        window.location.href =
  data.usuario.cargo === 'RRHH'
    ? '/html/rrhh.html'
    : '/html/empleado.html';

      }, 1000);
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      showToast('Error en el servidor', 'error');
    }
  });
});

// Función para mostrar mensajes flotantes
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast-msg toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

