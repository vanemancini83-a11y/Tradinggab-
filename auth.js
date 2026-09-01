// URL du backend Render
const API_URL = "https://tradinggab-backend-2.onrender.com";

// Mode par défaut
let currentMode = "connexion";

// Fonction globale pour changer d'onglet (accessible partout)
window.switchTab = function(mode) {
  currentMode = mode;
  
  const tabConnexion = document.querySelector('#tab-connexion') || document.querySelectorAll('.tab, [data-tab]')[0];
  const tabInscription = document.querySelector('#tab-inscription') || document.querySelectorAll('.tab, [data-tab]')[1];
  const submitBtn = document.querySelector('button[type="submit"]') || document.querySelector('#submit-btn');
  const errorBox = document.querySelector('#error-message') || document.querySelector('.error-msg');

  if (errorBox) errorBox.style.display = "none";

  if (tabConnexion && tabInscription) {
    if (mode === 'connexion') {
      tabConnexion.classList.add('active');
      tabInscription.classList.remove('active');
    } else {
      tabInscription.classList.add('active');
      tabConnexion.classList.remove('active');
    }
  }

  if (submitBtn) {
    submitBtn.textContent = mode === 'connexion' ? 'Se connecter' : 'Créer mon compte';
  }

  // Mettre à jour le texte d'aide du mot de passe
  const helpText = document.querySelector('#password-help') || document.querySelector('.password-help') || document.querySelector('small');
  if (helpText) helpText.textContent = "Au moins 8 caractères.";
};

// Afficher une erreur
function displayError(message) {
  const errorBox = document.querySelector('#error-message') || document.querySelector('.error-msg');
  if (errorBox) {
    errorBox.textContent = message;
    errorBox.style.display = "block";
  } else {
    alert(message);
  }
}

// Gestion de la soumission du formulaire
async function handleFormSubmit(e) {
  e.preventDefault();

  // Récupération de TOUS les inputs de la page
  const inputs = document.querySelectorAll('input');
  let phone = "";
  let password = "";

  inputs.forEach(input => {
    if (input.type === 'tel' || input.name === 'phone' || input.id === 'phone' || input.placeholder.toLowerCase().includes('téléphone') || input.placeholder.toLowerCase().includes('telephone')) {
      phone = input.value.trim();
    }
    if (input.type === 'password' || input.name === 'password' || input.id === 'password') {
      password = input.value.trim();
    }
  });

  // Si non trouvé par type/name, on prend le 1er input pour le tel et le 2e pour le mdp
  if (!phone && inputs[0]) phone = inputs[0].value.trim();
  if (!password && inputs[1]) password = inputs[1].value.trim();

  // Validation
  if (!phone || !password) {
    displayError("Veuillez renseigner votre numéro et votre mot de passe.");
    return;
  }

  if (password.length < 8) {
    displayError("Le mot de passe doit contenir au moins 8 caractères.");
    return;
  }

  const submitBtn = document.querySelector('button[type="submit"]') || document.querySelector('#submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = currentMode === "connexion" ? "Connexion..." : "Création...";
  }

  const endpoint = currentMode === "connexion" ? "/api/auth/connexion" : "/api/auth/inscription";

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    
    window.location.href = "/";
  } catch (err) {
    displayError(err.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = currentMode === "connexion" ? "Se connecter" : "Créer mon compte";
    }
  }
}

// Ajout de l'œil pour la visibilité du mot de passe
function initPasswordToggle() {
  const passwordInput = document.querySelector('input[type="password"]') || document.querySelector('input[name="password"]');
  if (!passwordInput) return;

  if (document.querySelector('#toggle-password')) return;

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.id = 'toggle-password';
  toggleBtn.innerHTML = '👁️';
  toggleBtn.style.cssText = 'position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 16px; z-index: 10;';

  const parent = passwordInput.parentElement;
  if (parent) {
    parent.style.position = 'relative';
    parent.appendChild(toggleBtn);
  }

  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const isPass = passwordInput.type === 'password';
    passwordInput.type = isPass ? 'text' : 'password';
    toggleBtn.innerHTML = isPass ? '🙈' : '👁️';
  });
}

// Chargement et écouteurs d'événements
document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggle();

  // Rattachement du formulaire
  const form = document.querySelector('form') || document.querySelector('#auth-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  // Rattachement dynamique des onglets Connexion / Inscription
  const tabs = document.querySelectorAll('.tab, [data-tab], button');
  tabs.forEach(tab => {
    const text = tab.textContent.toLowerCase();
    if (text.includes('connexion')) {
      tab.addEventListener('click', () => window.switchTab('connexion'));
    } else if (text.includes('créer') || text.includes('creer') || text.includes('inscription')) {
      tab.addEventListener('click', () => window.switchTab('inscription'));
    }
  });

  // Forcer la consigne 8 caractères
  const helpText = document.querySelector('#password-help') || document.querySelector('.password-help') || document.querySelector('small');
  if (helpText) helpText.textContent = "Au moins 8 caractères.";
});
