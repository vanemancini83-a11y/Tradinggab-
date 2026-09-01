// URL du backend Render
const API_URL = "https://tradinggab-backend-2.onrender.com";

// État de l'interface
const state = {
  mode: "connexion" // 'connexion' ou 'inscription'
};

// Fonction pour récupérer les éléments à la volée (évite les valeurs nulles)
function getElements() {
  return {
    tabConnexion: document.querySelector('#tab-connexion') || document.querySelectorAll('.tab')[0],
    tabInscription: document.querySelector('#tab-inscription') || document.querySelectorAll('.tab')[1],
    form: document.querySelector('form') || document.querySelector('#auth-form'),
    phoneInput: document.querySelector('input[type="tel"]') || document.querySelector('input[name="phone"]') || document.querySelector('#phone') || document.querySelectorAll('input')[0],
    passwordInput: document.querySelector('input[type="password"]') || document.querySelector('input[name="password"]') || document.querySelector('#password') || document.querySelectorAll('input')[1],
    submitBtn: document.querySelector('button[type="submit"]') || document.querySelector('button.btn-primary') || document.querySelector('button'),
    errorBox: document.querySelector('#error-message') || document.querySelector('.error-msg'),
    passwordHelpText: document.querySelector('#password-help') || document.querySelector('.password-help') || document.querySelector('small')
  };
}

// Afficher / Masquer l'erreur
function showError(msg) {
  const els = getElements();
  if (els.errorBox) {
    els.errorBox.textContent = msg;
    els.errorBox.style.display = "block";
  } else {
    alert(msg);
  }
}

function hideError() {
  const els = getElements();
  if (els.errorBox) {
    els.errorBox.textContent = "";
    els.errorBox.style.display = "none";
  }
}

// Basculer entre les onglets Connexion et Inscription
function setMode(mode) {
  state.mode = mode;
  hideError();

  const els = getElements();
  if (els.tabConnexion && els.tabInscription) {
    els.tabConnexion.classList.toggle('active', mode === 'connexion');
    els.tabInscription.classList.toggle('active', mode === 'inscription');
  }

  if (els.submitBtn) {
    els.submitBtn.textContent = mode === 'connexion' ? 'Se connecter' : 'Créer mon compte';
  }

  if (els.passwordHelpText) {
    els.passwordHelpText.textContent = "Au moins 8 caractères.";
  }
}

// Gestion de l'œil pour la visibilité du mot de passe
function setupPasswordToggle() {
  const els = getElements();
  if (!els.passwordInput) return;

  let toggleBtn = document.querySelector('#toggle-password');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.id = 'toggle-password';
    toggleBtn.innerHTML = '👁️';
    toggleBtn.style.cssText = 'position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #fff; font-size: 16px; z-index: 10;';
    
    const parent = els.passwordInput.parentElement;
    if (parent) {
      parent.style.position = 'relative';
      parent.appendChild(toggleBtn);
    }
  }

  toggleBtn.onclick = (e) => {
    e.preventDefault();
    const isPassword = els.passwordInput.type === 'password';
    els.passwordInput.type = isPassword ? 'text' : 'password';
    toggleBtn.innerHTML = isPassword ? '🙈' : '👁️';
  };
}

// Validation et soumission du formulaire
async function handleSubmit(event) {
  event.preventDefault();
  hideError();

  const els = getElements();
  const phone = els.phoneInput ? els.phoneInput.value.trim() : "";
  const password = els.passwordInput ? els.passwordInput.value.trim() : "";

  // 1. Vérification côté client
  if (!phone || !password) {
    showError("Veuillez remplir le téléphone et le mot de passe.");
    return;
  }

  if (password.length < 8) {
    showError("Le mot de passe doit contenir au moins 8 caractères.");
    return;
  }

  const endpoint = state.mode === "connexion" ? "/api/auth/connexion" : "/api/auth/inscription";

  if (els.submitBtn) {
    els.submitBtn.disabled = true;
    els.submitBtn.textContent = state.mode === "connexion" ? "Connexion..." : "Création...";
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Envoie des clés compatibles pour le backend
      body: JSON.stringify({ 
        phone: phone, 
        telephone: phone, 
        password: password 
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || "Erreur d'authentification");
    }

    // Connexion réussie
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    
    window.location.href = "/";
  } catch (err) {
    showError(err.message);
  } finally {
    if (els.submitBtn) {
      els.submitBtn.disabled = false;
      els.submitBtn.textContent = state.mode === "connexion" ? "Se connecter" : "Créer mon compte";
    }
  }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  setupPasswordToggle();

  const els = getElements();
  if (els.tabConnexion) els.tabConnexion.addEventListener('click', () => setMode('connexion'));
  if (els.tabInscription) els.tabInscription.addEventListener('click', () => setMode('inscription'));
  if (els.form) els.form.addEventListener('submit', handleSubmit);

  if (els.passwordHelpText) {
    els.passwordHelpText.textContent = "Au moins 8 caractères.";
  }
});
