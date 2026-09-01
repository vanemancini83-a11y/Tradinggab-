// URL du backend Render
const API_URL = "https://tradinggab-backend-2.onrender.com";

// Mode par défaut
let currentMode = "connexion";

// Détection des onglets au chargement
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.auth-tab, [data-mode]');
  const form = document.getElementById('auth-form') || document.querySelector('form');
  const subtitle = document.getElementById('auth-subtitle');
  const errorBox = document.getElementById('error-message') || document.querySelector('.error-msg');

  // 1. Gestion du clic sur les onglets (Connexion / Inscription)
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const mode = tab.getAttribute('data-mode');
      if (!mode) return;

      currentMode = mode;
      
      // Mise à jour de la classe is-active
      tabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');

      // Masquer l'erreur
      if (errorBox) errorBox.style.display = 'none';

      // Mise à jour des textes
      if (subtitle) {
        subtitle.textContent = mode === 'connexion' 
          ? "Content de te revoir." 
          : "Crée ton compte pour suivre les marchés.";
      }

      const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
      if (submitBtn) {
        submitBtn.textContent = mode === 'connexion' ? 'Se connecter' : 'Créer mon compte';
      }
    });
  });

  // 2. Gestion de la soumission du formulaire
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorBox) errorBox.style.display = 'none';

      // Capture directe et garantie des données saisies dans les champs HTML
      const formData = new FormData(form);
      
      // On cherche la valeur du téléphone (par name="phone" ou premier input)
      let phone = (formData.get('phone') || '').toString().trim();
      let password = (formData.get('password') || '').toString().trim();

      // Secours si les inputs n'ont pas l'attribut name="..."
      if (!phone) {
        const phoneInput = form.querySelector('input[type="tel"]') || form.querySelector('input[id="phone"]');
        if (phoneInput) phone = phoneInput.value.trim();
      }
      if (!password) {
        const passwordInput = form.querySelector('input[type="password"]') || form.querySelector('input[id="password"]');
        if (passwordInput) password = passwordInput.value.trim();
      }

      // Vérification côté client
      if (!phone || !password) {
        showCustomError("Veuillez remplir le numéro de téléphone et le mot de passe.");
        return;
      }

      if (password.length < 8) {
        showCustomError("Le mot de passe doit contenir au moins 8 caractères.");
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = currentMode === "connexion" ? "Connexion..." : "Création...";
      }

      const endpoint = currentMode === "connexion" ? "/api/auth/connexion" : "/api/auth/inscription";

      try {
        const response = await fetch(`${API_URL}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, password })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || data.message || "Erreur lors de l'authentification");
        }

        if (data.token) {
          localStorage.setItem("token", data.token);
        }

        // Succès : redirection
        window.location.href = "/";

      } catch (err) {
        showCustomError(err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = currentMode === "connexion" ? "Se connecter" : "Créer mon compte";
        }
      }
    });
  }

  // 3. Bouton œil (Afficher/Masquer le mot de passe)
  const passwordInput = document.getElementById('password') || document.querySelector('input[type="password"]');
  if (passwordInput && !document.getElementById('toggle-password')) {
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.id = 'toggle-password';
    toggleBtn.innerHTML = '👁️';
    toggleBtn.style.cssText = 'position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #fff; font-size: 16px; z-index: 10;';

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

  // Fonction d'affichage des erreurs
  function showCustomError(msg) {
    if (errorBox) {
      errorBox.textContent = msg;
      errorBox.style.display = 'block';
    } else {
      alert(msg);
    }
  }
});
