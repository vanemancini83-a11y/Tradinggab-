// ---------------------------------------------------------------
// Gestion des erreurs visibles (pour le débogage)
// ---------------------------------------------------------------
window.addEventListener("error", function (e) {
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<pre style="background:red;color:white;padding:12px;white-space:pre-wrap;font-size:14px;z-index:9999;position:relative;">ERREUR JS : ${e.message}\nFichier : ${e.filename}\nLigne : ${e.lineno}</pre>`
  );
});

// ---------------------------------------------------------------
// Config
// ---------------------------------------------------------------
const BACKEND_BASE_URL = "https://tradinggab-backend-2.onrender.com";

const SAMPLE_BVMAC = {
  success: true,
  data: [
    { ticker: "BANGE", name: "BANGE", price: 223255, change: 0, change_pct: 0, volume: 0 },
    { ticker: "BGFIHC", name: "BGFI HC", price: 90001, change: 0, change_pct: 0, volume: 0 },
    { ticker: "REGIONALE", name: "REGIONALE", price: 39000, change: 0, change_pct: 0, volume: 0 },
    { ticker: "SAFACAM", name: "SAFACAM", price: 35100, change: 0, change_pct: 0, volume: 0 },
    { ticker: "SCGRE", name: "SCG-Ré", price: 20000, change: 0, change_pct: 0, volume: 0 },
    { ticker: "SEMC", name: "SEMC", price: 53000, change: 0, change_pct: 0, volume: 0 },
    { ticker: "SOCAPALM", name: "SOCAPALM", price: 50000, change: 0, change_pct: 2.1, volume: 2 },
  ],
};

const EMPTY_MARKET = { success: true, data: [] };

const state = {
  market: "bvmac",
  bvmac: null,
  isPremium: false,
};

function formatFCFA(value) {
  return new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
}

function changeClass(pct) {
  if (pct === null || pct === undefined) return "flat";
  if (pct > 0) return "up";
  if (pct < 0) return "down";
  return "flat";
}

function formatChange(pct) {
  if (pct === null || pct === undefined) return "—";
  if (pct === 0) return "0,0 %";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1).replace(".", ",")} %`;
}

const RELEVANT_FOREX_PAIRS = ["USD/XAF", "USD/EUR", "USD/GBP", "USD/CNY"];
const RELEVANT_COMMODITIES = ["BRENT", "COCOA", "COFFEE", "PALM_OIL", "RUBBER", "GOLD"];

function adaptForex(rawItem) {
  return {
    ticker: rawItem.pair,
    name: rawItem.pair,
    price: rawItem.rate,
    priceDisplay: rawItem.rate.toLocaleString("fr-FR", { maximumFractionDigits: 4 }),
    change_pct: null,
  };
}

function adaptCommodity(rawItem) {
  return {
    ticker: rawItem.symbol,
    name: rawItem.name,
    price: rawItem.price,
    priceDisplay: `${rawItem.price.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ${rawItem.unit}`,
    change_pct: rawItem.change_pct ?? null,
    note: rawItem.africa_note,
  };
}

async function fetchMarket(market) {
  if (market === "crypto") {
    return { ...EMPTY_MARKET, isPremium: false, total: 0 };
  }

  const endpoints = {
    bvmac: "/api/marches/bvmac",
    forex: "/api/marches/forex",
    matieres: "/api/marches/matieres",
  };

  const token = localStorage.getItem("tradinggab_token");

  try {
    const res = await fetch(`${BACKEND_BASE_URL}${endpoints[market]}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Réponse backend non OK");
    const result = await res.json();
    const isPremium = !!result.isPremium;
    const total = result.total ?? 0;

    if (market === "forex") {
      const filtered = (result.data || []).filter((r) => RELEVANT_FOREX_PAIRS.includes(r.pair));
      return { success: true, data: filtered.map(adaptForex), isPremium, total };
    }
    if (market === "matieres") {
      const filtered = (result.data || []).filter((r) => RELEVANT_COMMODITIES.includes(r.symbol));
      return { success: true, data: filtered.map(adaptCommodity), isPremium, total };
    }
    return { success: true, data: result.data || [], isPremium, total };
  } catch (err) {
    console.warn(`Backend indisponible pour ${market}, données d'exemple utilisées si BVMAC.`, err);
    const fallback = market === "bvmac" ? SAMPLE_BVMAC : EMPTY_MARKET;
    return { ...fallback, isPremium: false, total: fallback.data.length };
  }
}

function renderPulse(items) {
  const track = document.getElementById("pulse-track");
  if (!track) return;
  if (!items.length) {
    track.innerHTML = "";
    return;
  }
  const doubled = [...items, ...items];
  track.innerHTML = doubled
    .map(
      (item) => `
      <span class="pulse-item">
        <span class="ticker">${item.ticker}</span>
        <span>${formatFCFA(item.price)}</span>
        <span class="${changeClass(item.change_pct)}">${formatChange(item.change_pct)}</span>
      </span>`
    )
    .join("");
}

function renderHero(items) {
  const featured = items.find((i) => i.ticker === "BGFIHC") || items[0];
  const nameEl = document.getElementById("hero-name");
  const priceEl = document.getElementById("hero-price");
  const changeEl = document.getElementById("hero-change");

  if (!featured || !nameEl || !priceEl || !changeEl) return;

  nameEl.textContent = featured.name;
  priceEl.textContent = formatFCFA(featured.price);
  changeEl.textContent = formatChange(featured.change_pct);
  changeEl.className = `hero-change ${changeClass(featured.change_pct)}`;
}

// ---------------------------------------------------------------
// ✅ CORRECTION MAJEURE : Fonction renderList réparée
// ---------------------------------------------------------------
function renderList(items, market, meta = {}) {
  const list = document.getElementById("list");
  if (!list) return;

  const isPremium = !!meta.isPremium;
  const total = meta.total ?? items.length;
  const lockedCount = isPremium ? 0 : Math.max(0, total - items.length);

  if (!items.length && !lockedCount) {
    list.innerHTML = `<p class="empty-message" style="text-align:center; padding: 20px; color: #888;">Aucune donnée disponible pour le moment.</p>`;
    return;
  }

  list.innerHTML = items
    .map((item) => {
      const initials = item.ticker.slice(0, 2).toUpperCase();
      const trend = item.change_pct > 0 ? "up" : item.change_pct < 0 ? "down" : "flat";
      const arrow = trend === "up" ? "▲" : trend === "down" ? "▼" : "–";
      // Gère à la fois priceDisplay (forex/matieres) et price (bvmac)
      const priceText = item.priceDisplay || formatFCFA(item.price);

      return `
        <div class="asset-card">
          <div class="asset-card__row">
            <div class="asset-card__avatar">${initials}</div>
            <div class="asset-card__info">
              <p class="asset-card__name">${item.name}</p>
              <p class="asset-card__price">${priceText}</p>
            </div>
            <span class="asset-card__badge asset-card__badge--${trend}">
              ${arrow} ${formatChange(item.change_pct)}
            </span>
          </div>
          ${item.note ? `<p class="asset-card__note">${item.note}</p>` : ""}
        </div>
      `;
    })
    .join("");

  if (lockedCount > 0) {
    const label = market === "forex" ? "paire" : market === "matieres" ? "matière" : "valeur";
    const plural = lockedCount > 1 ? "s" : "";
    list.insertAdjacentHTML(
      "beforeend",
      `<button class="locked-cta" type="button">
        <span class="locked-cta-count">+${lockedCount} ${label}${plural} de plus</span>
        <span class="locked-cta-action">Débloquer avec Premium →</span>
      </button>`
    );
    const cta = list.querySelector(".locked-cta");
    if (cta) cta.addEventListener("click", () => document.querySelector(".premium-cta")?.click());
  }
}

function renderFreshness() {
  const el = document.getElementById("freshness-text");
  if (!el) return;
  const now = new Date();
  const time = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  el.textContent = `Mis à jour à ${time}`;
}

async function loadMarket(market) {
  state.market = market;
  const result = await fetchMarket(market);
  const items = result.data || [];
  const premium = !!result.isPremium;
  state.isPremium = premium;

  localStorage.setItem("tradinggab_is_premium", premium ? "1" : "0");
  refreshPremiumCta(premium);

  if (market === "bvmac") {
    state.bvmac = items;
    renderHero(items);
    renderPulse(items);
  }

  renderList(items, market, result);
  renderFreshness();
}

function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      state.market = tab.dataset.market;
      loadMarket(state.market);
    });
  });
}

function setupAccountLink() {
  const btn = document.getElementById("account-link");
  if (!btn) return;
  const token = localStorage.getItem("tradinggab_token");

  btn.textContent = token ? "Déconnexion" : "Se connecter";

  btn.addEventListener("click", () => {
    if (token) {
      localStorage.removeItem("tradinggab_token");
      localStorage.removeItem("tradinggab_user_id");
      localStorage.removeItem("tradinggab_is_premium");
      window.location.reload();
    } else {
      window.location.href = "auth.html";
    }
  });
}

function refreshPremiumCta(isPremium) {
  const card = document.querySelector(".premium-card");
  const btn = document.querySelector(".premium-cta");
  if (!card || !btn) return;

  if (isPremium) {
    btn.textContent = "Abonnement actif ✓";
    btn.disabled = true;
    const copy = card.querySelector(".premium-copy");
    if (copy) copy.textContent = "Merci ! Vous avez accès à toutes les valeurs, cryptos et forex sans limite.";
  } else {
    btn.textContent = "Voir les offres";
    btn.disabled = false;
  }
}

async function loadProfile() {
  const token = localStorage.getItem("tradinggab_token");
  if (!token) return;

  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const { isPremium } = await res.json();
    localStorage.setItem("tradinggab_is_premium", isPremium ? "1" : "0");
    refreshPremiumCta(isPremium);
  } catch {
    // silencieux : l'UI reste en mode non-Premium par défaut
  }
}

function setupPremiumButton() {
  const btn = document.querySelector(".premium-cta");
  if (!btn) return;
  
  btn.addEventListener("click", async () => {
    const token = localStorage.getItem("tradinggab_token");

    if (!token) {
      window.location.href = "auth.html";
      return;
    }

    if (localStorage.getItem("tradinggab_is_premium") === "1") {
      return;
    }

    btn.disabled = true;
    btn.textContent = "Redirection…";

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/paiement/initier`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        alert("Ta session a expiré, reconnecte-toi.");
        localStorage.removeItem("tradinggab_token");
        return;
      }
      if (!res.ok) throw new Error("Échec de l'initialisation du paiement");

      const { paymentUrl } = await res.json();
      window.location.href = paymentUrl;
    } catch (err) {
      console.error(err);
      alert("Le paiement n'a pas pu être lancé. Réessaie dans un instant.");
      btn.disabled = false;
      btn.textContent = "Voir les offres";
    }
  });
}

function init() {
  setupTabs();
  setupPremiumButton();
  setupAccountLink();
  loadProfile();
  loadMarket(state.market);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.warn("Service worker non enregistré :", err);
    });
  }
}

// Initialisation propre au chargement du DOM
document.addEventListener("DOMContentLoaded", init);
