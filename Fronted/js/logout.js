// logout.js
document.addEventListener("DOMContentLoaded", () => {
  const btnLogout = document.getElementById("logoutBtn");

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      mostrarConfirmacion();
    });
  }
});

// Crear modal de confirmación personalizado
function mostrarConfirmacion() {
  const overlay = document.createElement("div");
  overlay.classList.add("overlay");

  const modal = document.createElement("div");
  modal.classList.add("logout-modal");
  modal.innerHTML = `
    <h3>¿Cerrar sesión?</h3>
    <p>Tu sesión actual se cerrará y volverás al inicio.</p>
    <div class="modal-buttons">
      <button id="confirmLogout">Sí, salir</button>
      <button id="cancelLogout">Cancelar</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.getElementById("confirmLogout").addEventListener("click", () => {
    sessionStorage.removeItem("usuario");
    window.location.href = "/html/login.html";
  });

  document.getElementById("cancelLogout").addEventListener("click", () => {
    overlay.remove();
  });
}
