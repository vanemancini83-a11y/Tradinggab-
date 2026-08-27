const BACKEND_BASE_URL = "https://tradinggab-backend-2.onrender.com";

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
    submitLoading: "Connexion…",
  },
  inscription: {
    subtitle: "Crée ton compte pour suivre les marchés.",
    hint: "Au moins 6 caractères.",
    submit: "Créer mon compte",
    submitLoading: "Création…",
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
    const res = await fetch(`${BACKEND_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.error || "Une erreur est survenue, réessaie.");
      return;
    }

    localStorage.setItem("tradinggab_token", data.token);
    localStorage.setItem("tradinggab_user_id", data.userId);
    localStorage.setItem("tradinggab_is_premium", String(Boolean(data.isPremium)));

    window.location.href = "index.html";
  } catch (err) {
    console.error(err);
    showError("Impossible de joindre le serveur. Vérifie ta connexion et réessaie.");
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
