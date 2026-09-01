// URL du backend Render
const API_URL = "https://tradinggab-backend-2.onrender.com";

// État de l'interface
const state = {
  mode: "connexion" // 'connexion' ou 'inscription'
};

// Sélection des éléments HTML
const els = {
  tabConnexion: document.querySelector('#tab-connexion') || document.querySelector('[data-tab="connexion"]'),
  tabInscription: document.querySelector('#tab-inscription') || document.querySelector('[data-tab="inscription"]'),
  form: document.querySelector('form') || document.querySelector('#auth-form'),
  phoneInput: document.querySelector('input[type="tel"]') || document.querySelector('input[name="phone"]') || document.querySelector('#phone'),
  passwordInput: document.querySelector('input[type="password"]') || document.querySelector('input[name="password"]') || document.querySelector('#password'),
  togglePasswordBtn: document.querySelector('#toggle-password') || document.querySelector('.toggle-password'),
  submitBtn: document.querySelector('button[type="submit"]') || document.querySelector('#submit-btn'),
  errorBox: document.querySelector('#error-message') || document.querySelector('.error-msg'),
  passwordHelpText: document.querySelector('#password-help') || document.querySelector('.password-help')
};

// Afficher / Masquer l'erreur
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

// Basculer entre les onglets Connexion et Inscription
function setMode(mode) {
  state.mode = mode;
  hideError();

  if (els.tabConnexion && els.tabInscription) {
    els.tabConnexion.classList.toggle('active', mode === 'connexion');
    els.tabInscription.classList.toggle('active', mode === 'inscription');
  }

  if (els.submitBtn) {
    els.submitBtn.textContent = mode === 'connexion' ? 'Se connecter' : 'Créer mon compte';
  }

  // Mettre à jour la consigne du mot de passe (8 caractères min)
  if (els.passwordHelpText) {
    els.passwordHelpText.textContent = "Au moins 8 caractères.";
  }
}

// Gestion de la visibilité du mot de passe (L'œil)
function setupPasswordToggle() {
  if (!els.passwordInput) return;

  // Si le bouton d'œil n'existe pas dans le HTML, on le crée dynamiquement à côté du mot de passe
  let toggleBtn = els.togglePasswordBtn;
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.id = 'toggle-password';
    toggleBtn.innerHTML = '👁️';
    toggleBtn.style.cssText = 'position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #fff; font-size: 16px;';
    
    const parent = els.passwordInput.parentElement;
    if (parent) {
      parent.style.position = 'relative';
      parent.appendChild(toggleBtn);
    }
  }

  toggleBtn.addEventListener('click', () => {
    const isPassword = els.passwordInput.type === 'password';
    els.passwordInput.type = isPassword ? 'text' : 'password';
    toggleBtn.innerHTML = isPassword ? '🙈' : '👁️';
  });
}

// Validation et soumission du formulaire
async function handleSubmit(event) {
  event.preventDefault();
  hideError();

  const phone = els.phoneInput ? els.phoneInput.value.trim() : "";
  const password = els.passwordInput ? els.passwordInput.value : "";

  // 1. Vérification des champs vides
  if (!phone || !password) {
    showError("Le numéro de téléphone et le mot de passe sont requis.");
    return;
  }

  // 2. Vérification de la sécurité du mot de passe (8 caractères minimum)
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
      body: JSON.stringify({ phone, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || "Une erreur est survenue.");
    }

    // Sauvegarde du token de session et rechargement
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    
    window.location.href = "/"; // Redirection vers l'accueil
  } catch (err) {
    showError(err.message);
  } finally {
    if (els.submitBtn) {
      els.submitBtn.disabled = false;
      els.submitBtn.textContent = state.mode === "connexion" ? "Se connecter" : "Créer mon compte";
    }
  }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  setupPasswordToggle();

  if (els.tabConnexion) {
    els.tabConnexion.addEventListener('click', () => setMode('connexion'));
  }
  if (els.tabInscription) {
    els.tabInscription.addEventListener('click', () => setMode('inscription'));
  }

  if (els.form) {
    els.form.addEventListener('submit', handleSubmit);
  }

  // S'assurer que le message sous le mot de passe affiche 8 caractères
  if (els.passwordHelpText) {
    els.passwordHelpText.textContent = "Au moins 8 caractères.";
  }
});

