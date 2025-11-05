document.addEventListener('DOMContentLoaded', () => {
  const usuario = JSON.parse(sessionStorage.getItem('usuario'));

  if (!usuario || usuario.cargo !== 'empleado') {
    showToast('Acceso no autorizado', 'error');
    window.location.href = '/html/login.html';
    return;
  }

  document.getElementById('nombreUsuario').textContent = usuario.nombre;
  cargarHistorial();

  document.getElementById('checkInBtn').onclick = registrarEntrada;
  document.getElementById('checkOutBtn').onclick = registrarSalida;
  document.getElementById('logoutBtn').onclick = cerrarSesion;
});


async function registrarEntrada() {
  const usuario = JSON.parse(sessionStorage.getItem('usuario'));
  try {
    const res = await fetch('/api/asistencia/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empleado_id: usuario.id })
    });
    const data = await res.json();
    showToast(data.msg || 'Entrada registrada', 'success');
    cargarHistorial();
  } catch {
    showToast('Error al registrar entrada', 'error');
  }
}

async function registrarSalida() {
  const usuario = JSON.parse(sessionStorage.getItem('usuario'));
  try {
    const res = await fetch('/api/asistencia/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empleado_id: usuario.id })
    });
    const data = await res.json();
    showToast(data.msg || 'Salida registrada', 'info');
    cargarHistorial();
  } catch {
    showToast('Error al registrar salida', 'error');
  }
}

async function cargarHistorial() {
  const usuario = JSON.parse(sessionStorage.getItem('usuario'));
  try {
    const res = await fetch(`/api/asistencias?empleado_id=${usuario.id}`);
    const data = await res.json();
    const tbody = document.querySelector('table tbody');

    tbody.innerHTML = data.length
      ? data.map(a => `
        <tr>
          <td>${a.fecha}</td>
          <td>${a.hora_entrada || '—'}</td>
          <td>${a.hora_salida || '—'}</td>
          <td>${a.horas_trabajadas || '—'}</td>
        </tr>
      `).join('')
      : '<tr><td colspan="4">No hay registros</td></tr>';
  } catch {
    showToast('Error al cargar historial', 'error');
  }
}

function cerrarSesion() {
  sessionStorage.clear();
  showToast('Sesión cerrada correctamente', 'info');
  setTimeout(() => (window.location.href = '/html/login.html'), 1500);
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast-msg toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
