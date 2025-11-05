document.addEventListener('DOMContentLoaded', () => {
  const usuario = JSON.parse(sessionStorage.getItem('usuario'));
  if (!usuario || usuario.cargo !== 'RRHH') {
    showToast('Acceso no autorizado', 'error');
    return (window.location.href = '/html/login.html');
  }

  document.getElementById('nombreUsuario').textContent = usuario.nombre;

  cargarEmpleados();
  cargarAsistencias();

  document.getElementById('logoutBtn').onclick = cerrarSesion;
  document.getElementById('agregarEmpleadoBtn').onclick = mostrarFormulario;

  const fechaFiltro = document.getElementById('fechaFiltro');
  if (fechaFiltro) {
    fechaFiltro.addEventListener('change', () => {
      cargarAsistencias(fechaFiltro.value);
    });
  }
});


async function cargarEmpleados() {
  try {
    const res = await fetch('/api/empleados');
    const empleados = await res.json();
    document.querySelector('#tablaEmpleados tbody').innerHTML = empleados.map(emp => `
      <tr>
        <td>${emp.id}</td>
        <td>${emp.nombre}</td>
        <td>${emp.correo}</td>
        <td>${emp.cargo}</td>
        <td>
          <button onclick="editarEmpleado(${emp.id})">✏️</button>
          <button onclick="confirmarEliminar(${emp.id})">🗑️</button>
        </td>
      </tr>
    `).join('');
  } catch {
    showToast('Error cargando empleados', 'error');
  }
}

async function agregarEmpleado(nombre, correo, contraseña, cargo = 'empleado') {
  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, correo, contraseña, cargo })
    });
    const data = await res.json();
    showToast(data.msg || 'Empleado agregado', 'success');
    cargarEmpleados();
  } catch {
    showToast('Error al agregar empleado', 'error');
  }
}

function editarEmpleado(id) {
  mostrarModal({
    titulo: 'Editar empleado',
    campos: [
      { id: 'editNombre', placeholder: 'Nuevo nombre' },
      { id: 'editCorreo', placeholder: 'Nuevo correo' },
      { id: 'editContraseña', placeholder: 'Nueva contraseña', type: 'password' },
      { id: 'editCargo', tipo: 'select', opciones: ['empleado', 'RRHH'] }
    ],
    onGuardar: async valores => {
      const { editNombre, editCorreo, editContraseña, editCargo } = valores;
      if (!editNombre || !editCorreo)
        return showToast('Completa todos los campos', 'warning');

      try {
        const res = await fetch(`/empleados/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: editNombre,
            correo: editCorreo,
            contraseña: editContraseña,
            cargo: editCargo
          })
        });
        const data = await res.json();
        showToast(data.msg || 'Empleado actualizado', 'success');
        cargarEmpleados();
      } catch {
        showToast('Error al actualizar', 'error');
      }
    }
  });
}

async function eliminarEmpleado(id) {
  try {
    const res = await fetch(`/api/empleados/${id}`, { method: 'DELETE' });
    const data = await res.json();
    showToast(data.msg, 'success');
    cargarEmpleados();
  } catch {
    showToast('Error al eliminar empleado', 'error');
  }
}

function confirmarEliminar(id) {
  mostrarConfirm('¿Eliminar este empleado?', async () => {
    await eliminarEmpleado(id);
  });
}


async function cargarAsistencias(fecha = '') {
  try {
    let url = '/api/asistencias?cargo=RRHH';
    if (fecha) url += `&fechaInicio=${encodeURIComponent(fecha)}&fechaFin=${encodeURIComponent(fecha)}`;

    const res = await fetch(url);
    const data = await res.json();
    const tbody = document.querySelector('#tablaAsistencias tbody');

    tbody.innerHTML = data.length
      ? data.map(a => `
        <tr>
          <td>${a.nombre}</td>
          <td>${a.fecha}</td>
          <td>${a.hora_entrada || '—'}</td>
          <td>${a.hora_salida || '—'}</td>
          <td>${a.horas_trabajadas || '—'}</td>
        </tr>`).join('')
      : '<tr><td colspan="5">No hay registros</td></tr>';
  } catch {
    showToast('Error cargando asistencias', 'error');
  }
}


function cerrarSesion() {
  sessionStorage.clear();
  showToast('Sesión cerrada', 'info');
  setTimeout(() => (window.location.href = '/html/login.html'), 1000);
}


function mostrarFormulario() {
  mostrarModal({
    titulo: 'Registrar nuevo empleado',
    campos: [
      { id: 'nuevoNombre', placeholder: 'Nombre' },
      { id: 'nuevoCorreo', placeholder: 'Correo' },
      { id: 'nuevoPass', placeholder: 'Contraseña', type: 'password' },
      { id: 'nuevoCargo', tipo: 'select', opciones: ['empleado', 'RRHH'] }
    ],
    onGuardar: async valores => {
      const { nuevoNombre, nuevoCorreo, nuevoPass, nuevoCargo } = valores;
      if (!nuevoNombre || !nuevoCorreo || !nuevoPass)
        return showToast('Completa todos los campos', 'warning');
      await agregarEmpleado(nuevoNombre, nuevoCorreo, nuevoPass, nuevoCargo);
    }
  });
}


function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast-msg toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function mostrarConfirm(mensaje, onConfirm) {
  const box = document.createElement('div');
  box.className = 'confirm-box';
  box.innerHTML = `
    <div class="confirm-content">
      <p>${mensaje}</p>
      <div class="confirm-buttons">
        <button id="yesBtn">Sí</button>
        <button id="noBtn">No</button>
      </div>
    </div>`;
  document.body.appendChild(box);

  box.querySelector('#yesBtn').onclick = async () => {
    await onConfirm();
    box.remove();
  };
  box.querySelector('#noBtn').onclick = () => box.remove();
}

function mostrarModal({ titulo, campos = [], onGuardar }) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';

  const inputsHTML = campos.map(c => {
    if (c.tipo === 'select') {
      return `
        <select id="${c.id}">
          ${c.opciones.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
        </select>`;
    }
    return `<input id="${c.id}" placeholder="${c.placeholder}" type="${c.type || 'text'}">`;
  }).join('');

  overlay.innerHTML = `
    <div class="form-modal">
      <h3>${titulo}</h3>
      ${inputsHTML}
      <div class="form-buttons">
        <button id="guardarBtn">Guardar</button>
        <button id="cancelarBtn">Cancelar</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.querySelector('#cancelarBtn').onclick = () => overlay.remove();
  overlay.querySelector('#guardarBtn').onclick = async () => {
    const valores = {};
    campos.forEach(c => (valores[c.id] = document.getElementById(c.id).value.trim()));
    await onGuardar(valores);
    overlay.remove();
  };
}
