// ---------------------------------------------------------------
// Config
// ---------------------------------------------------------------
const BACKEND_BASE_URL = "https://tradinggab-backend-2.onrender.com";

// Tant que le backend n'est pas déployé/lancé, l'app utilise ces données
// d'exemple — identiques en forme à la vraie réponse Mansa API testée.
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

const RELEVANT_COMMODITIES = ["BRENT", "COCOA", "COFFEE", "PALM_OIL", "RUBBER", "GOLD"];

async function fetchMarket(market) {
  if (market === "crypto") {
    return EMPTY_MARKET;
  }

  const endpoints = {
    bvmac: "/api/marches/bvmac",
    forex: "/api/marches/forex",
    matieres: "/api/marches/matieres",
  };

  try {
    const res = await fetch(`${BACKEND_BASE_URL}${endpoints[market]}`);
    if (!res.ok) throw new Error("Réponse backend non OK");
    const result = await res.json();

    if (market === "forex") {
      const filtered = (result.data || []).filter((r) => RELEVANT_FOREX_PAIRS.includes(r.pair));
      return { success: true, data: filtered.map(adaptForex) };
    }
    if (market === "matieres") {
      const filtered = (result.data || []).filter((r) => RELEVANT_COMMODITIES.includes(r.symbol));
      return { success: true, data: filtered.map(adaptCommodity) };
    }
    return result;
  } catch (err) {
    console.warn(`Backend indisponible pour ${market}, données d'exemple utilisées si BVMAC.`, err);
    return market === "bvmac" ? SAMPLE_BVMAC : EMPTY_MARKET;
  }
}

function renderPulse(items) {
  const track = document.getElementById("pulse-track");
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

  if (!featured) {
    nameEl.textContent = "Aucune donnée disponible";
    priceEl.textContent = "—";
    changeEl.textContent = "—";
    changeEl.className = "hero-change";
    return;
  }

  nameEl.textContent = featured.name;
  priceEl.textContent = formatFCFA(featured.price);
  changeEl.textContent = formatChange(featured.change_pct);
  changeEl.className = `hero-change ${changeClass(featured.change_pct)}`;
}

function renderList(items, market) {
  const list = document.getElementById("list");

  if (!items.length) {
    const messages = {
      crypto: "La crypto arrive bientôt sur TradingGab — endpoint en cours de confirmation.",
      forex: "Aucune donnée forex disponible pour le moment.",
      matieres: "Aucune donnée disponible pour le moment.",
    };
    list.innerHTML = `<div class="empty-state">${messages[market] || "Aucune donnée disponible."}</div>`;
    return;
  }

  list.innerHTML = items
    .map(
      (item) => `
      <div class="row">
        <div class="row-left">
          <span class="row-ticker">${item.ticker}</span>
          <span class="row-name">${item.name}</span>
          ${item.note ? `<span class="row-note">${item.note}</span>` : ""}
        </div>
        <div class="row-right">
          <span class="row-price">${item.priceDisplay ?? formatFCFA(item.price)}</span>
          <span class="row-change ${changeClass(item.change_pct)}">${formatChange(item.change_pct)}</span>
        </div>
      </div>`
    )
    .join("");
}

function renderFreshness() {
  const el = document.getElementById("freshness-text");
  const now = new Date();
  const time = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  el.textContent = `Mis à jour à ${time}`;
}

async function loadMarket(market) {
  const result = await fetchMarket(market);
  const items = result.data || [];

  if (market === "bvmac") {
    state.bvmac = items;
    renderHero(items);
    renderPulse(items);
  }

  renderList(items, market);
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

function setupPremiumButton() {
  const btn = document.querySelector(".premium-cta");
  btn.addEventListener("click", async () => {
    const token = localStorage.getItem("tradinggab_token");

    if (!token) {
      window.location.href = "auth.html";
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
  loadMarket(state.market);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.warn("Service worker non enregistré :", err);
    });
  }
}

init();
