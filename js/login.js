
(function checkAlreadyLogged() {
  const userData = sessionStorage.getItem("userData");
  if (userData) {
    const user = JSON.parse(userData);
    if (user.rol === "ADMIN") {
      window.location.href = "dashboard.html";
    }
  }
})();

window.login = async function () {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  if (!username || !password) {
    document.getElementById('login-status').innerText = "Todos los campos son obligatorios.";
    return;
  }

  try {
    const response = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (response.ok) {
      const user = await response.json();

      if (user.rol !== "ADMIN") {
        document.getElementById('login-status').innerText = "Acceso denegado. Solo administradores.";
        return;
      }

      sessionStorage.setItem("userData", JSON.stringify(user));
      document.getElementById('login-status').innerText = "Inicio de sesión exitoso.";

  
      window.location.href = "dashboard.html";

    } else {
      let errorMessage = "Usuario o contraseña incorrectos";
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } else {
        errorMessage = await response.text();
      }

      document.getElementById('login-status').innerText = errorMessage;
    }

  } catch (error) {
    document.getElementById('login-status').innerText = "Error: " + error.message;
  }
};

