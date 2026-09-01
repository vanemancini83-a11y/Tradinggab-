// URL du backend Render
const API_URL = "https://tradinggab-backend-2.onrender.com";

// État de l'application
const state = {
  mode: "connexion" // 'connexion' ou 'inscription'
};

// Éléments du DOM
const els = {
  form: document.getElementById('auth-form'),
  phoneInput: document.getElementById('phone'),
  passwordInput: document.getElementById('password'),
  tabs: document.querySelectorAll('.auth-tab'),
  subtitle: document.getElementById('auth-subtitle'),
  submitBtn: document.querySelector('#auth-form button[type="submit"]') || document.querySelector('.auth-form button'),
  errorBox: document.getElementById('error-message') || document.querySelector('.error-msg'),
  passwordHelpText: document.getElementById('password-help') || document.querySelector('.password-help') || document.querySelector('small')
};

// Affichage des messages d'erreur
function showError(msg) {
  if (els.errorBox) {
    els.errorBox.textContent = msg;
    els.errorBox.style.display = "block";
  } else {
    alert(msg);
  }
}

function hideError() {
  if (els.errorBox) {
    els.errorBox.textContent = "";
    els.errorBox.style.display = "none";
  }
}

// Gestion du changement d'onglet (Connexion / Inscription)
function setMode(mode) {
  state.mode = mode;
  hideError();

  // Mettre à jour l'état visuel des onglets (is-active)
  els.tabs.forEach(tab => {
    const tabMode = tab.getAttribute('data-mode');
    if (tabMode === mode) {
      tab.classList.add('is-active');
    } else {
      tab.classList.remove('is-active');
    }
  });

  // Mettre à jour le texte du sous-titre et du bouton
  if (els.subtitle) {
    els.subtitle.textContent = mode === 'connexion' 
      ? "Content de te revoir." 
      : "Crée ton compte pour suivre les marchés.";
  }

  const submitButton = els.form ? els.form.querySelector('button') : els.submitBtn;
  if (submitButton) {
    submitButton.textContent = mode === 'connexion' ? 'Se connecter' : 'Créer mon compte';
  }
}

// Gestion de l'œil pour afficher/masquer le mot de passe
function setupPasswordToggle() {
  if (!els.passwordInput) return;

  let toggleBtn = document.getElementById('toggle-password');
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

// Soumission du formulaire
async function handleSubmit(event) {
  event.preventDefault();
  hideError();

  const phone = els.phoneInput ? els.phoneInput.value.trim() : "";
  const password = els.passwordInput ? els.passwordInput.value : "";

  // Validation des champs
  if (!phone || !password) {
    showError("Le numéro de téléphone et le mot de passe sont requis.");
    return;
  }

  if (password.length < 8) {
    showError("Le mot de passe doit contenir au moins 8 caractères.");
    return;
  }

  const submitButton = els.form ? els.form.querySelector('button') : els.submitBtn;
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = state.mode === "connexion" ? "Connexion..." : "Création...";
  }

  const endpoint = state.mode === "connexion" ? "/api/auth/connexion" : "/api/auth/inscription";

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || "Une erreur est survenue.");
    }

    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    window.location.href = "/";
  } catch (err) {
    showError(err.message);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = state.mode === "connexion" ? "Se connecter" : "Créer mon compte";
    }
  }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  // Attacher le changement d'onglets aux clics sur [data-mode]
  els.tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const mode = tab.getAttribute('data-mode');
      if (mode) setMode(mode);
    });
  });

  // Écouter la soumission du formulaire
  if (els.form) {
    els.form.addEventListener('submit', handleSubmit);
  }

  // Configurer l'œil du mot de passe
  setupPasswordToggle();

  // Appliquer la consigne des 8 caractères
  if (els.passwordHelpText) {
    els.passwordHelpText.textContent = "Au moins 8 caractères.";
  }
});
