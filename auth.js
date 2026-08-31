// ---------------------------------------------------------------
// Config - URL Dynamique local / prod
// ---------------------------------------------------------------
const BACKEND_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:3000"
  : "https://tradinggab-backend-2.onrender.com";

const state = { mode: "connexion" };

const els = {
  tabs: document.querySelectorAll(".auth-tab"),
  subtitle: document.getElementById("auth-subtitle"),
  hint: document.getElementById("auth-hint"),
  form: document.getElementById("auth-form"),
  phone: document.getElementById("phone"),
  password: document.getElementById("password"),
  error: document.getElementById("auth-error"),
  submit: document.getElementById("auth-submit"),
};

const COPY = {
  connexion: {
    subtitle: "Content de te revoir.",
    hint: "",
    submit: "Se connecter",
    submitLoading: "Connexion (réveil du serveur...)…",
  },
  inscription: {
    subtitle: "Crée ton compte pour suivre les marchés.",
    hint: "Au moins 6 caractères.",
    submit: "Créer mon compte",
    submitLoading: "Création (réveil du serveur...)…",
  },
};

function setMode(mode) {
  state.mode = mode;
  els.tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.mode === mode));
  els.subtitle.textContent = COPY[mode].subtitle;
  els.hint.textContent = COPY[mode].hint;
  els.submit.textContent = COPY[mode].submit;
  hideError();
}

function showError(message) {
  els.error.textContent = message;
  els.error.classList.add("is-visible");
}

function hideError() {
  els.error.classList.remove("is-visible");
  els.error.textContent = "";
}

function setupTabs() {
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => setMode(tab.dataset.mode));
  });
}

// Utilitaire avec Timeout pour le Cold Start Render
async function fetchWithTimeout(resource, options = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  hideError();

  const phoneNumber = els.phone.value.trim();
  const password = els.password.value;

  if (!phoneNumber || !password) {
    showError("Remplis les deux champs pour continuer.");
    return;
  }

  const endpoint = state.mode === "connexion" ? "/api/auth/connexion" : "/api/auth/inscription";

  els.submit.disabled = true;
  els.submit.textContent = COPY[state.mode].submitLoading;

  try {
    const res = await fetchWithTimeout(`${BACKEND_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber, password }),
    }, 20000);

    const data = await res.json();

    if (!res.ok) {
      showError(data.error || "Une erreur est survenue, réessaie.");
      return;
    }

    // Stockage du Token et Redirection
    localStorage.setItem("tradinggab_token", data.token);
    localStorage.setItem("tradinggab_user_id", data.userId);
    localStorage.setItem("tradinggab_is_premium", String(Boolean(data.isPremium)));

    window.location.href = "index.html";
  } catch (err) {
    console.error(err);
    if (err.name === 'AbortError') {
      showError("Le serveur met du temps à répondre. Réessaie dans quelques secondes.");
    } else {
      showError("Impossible de joindre le serveur. Vérifie ta connexion.");
    }
  } finally {
    els.submit.disabled = false;
    els.submit.textContent = COPY[state.mode].submit;
  }
}

function init() {
  setupTabs();
  els.form.addEventListener("submit", handleSubmit);

  if (localStorage.getItem("tradinggab_token")) {
    window.location.href = "index.html";
  }
}

init();
