function qs(sel, root = document) {
  return root.querySelector(sel);
}

function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function fmt(v) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function cssVar(name) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

function toNumberOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function shortTimestamp(ts) {
  if (!ts) return "";
  const s = String(ts);
  if (s.includes(" ")) {
    const parts = s.split(" ");
    return parts[1] || s;
  }
  return s;
}

let chartTemperatura = null;
let chartUmidade = null;

function chartOptions() {
  const border = cssVar("--border") || "#27272a";
  const tick = cssVar("--muted-foreground") || "#a1a1aa";

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: {
        grid: { color: border },
        ticks: {
          color: tick,
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },
      },
      y: {
        grid: { color: border },
        ticks: { color: tick },
      },
    },
  };
}

function ensureCharts(readings) {
  const canvasT = qs("#chartTemperatura");
  const canvasU = qs("#chartUmidade");
  if (!canvasT || !canvasU) return;
  if (typeof Chart === "undefined") return;

  const chronological = readings.slice().reverse();
  const labels = chronological.map((r) => shortTimestamp(r.timestamp));
  const temps = chronological.map((r) => toNumberOrNull(r.temperatura));
  const hums = chronological.map((r) => toNumberOrNull(r.umidade));

  const lineCommon = {
    borderWidth: 2,
    pointRadius: 0,
    tension: 0.35,
    fill: false,
  };

  const c1 = cssVar("--chart-1") || cssVar("--primary") || "#fafafa";
  const c2 = cssVar("--chart-2") || cssVar("--muted-foreground") || "#a1a1aa";

  if (!chartTemperatura) {
    chartTemperatura = new Chart(canvasT, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            ...lineCommon,
            label: "Temperatura",
            data: temps,
            borderColor: c1,
          },
        ],
      },
      options: chartOptions(),
    });
  } else {
    chartTemperatura.data.labels = labels;
    chartTemperatura.data.datasets[0].data = temps;
    chartTemperatura.update();
  }

  if (!chartUmidade) {
    chartUmidade = new Chart(canvasU, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            ...lineCommon,
            label: "Umidade",
            data: hums,
            borderColor: c2,
          },
        ],
      },
      options: chartOptions(),
    });
  } else {
    chartUmidade.data.labels = labels;
    chartUmidade.data.datasets[0].data = hums;
    chartUmidade.update();
  }
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok) {
    const message = body?.message || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return body;
}

function setStatus(el, text) {
  if (!el) return;
  el.textContent = text;
}

function setBusyDot(isBusy) {
  const dot = qs(".dot");
  if (!dot) return;
  dot.classList.toggle("dot--busy", isBusy);
}

function rowActionsHtml(id) {
  return `
    <div style="display:flex; gap:8px; align-items:center;">
      <a class="btn" href="/editar/${id}">Editar</a>
      <button class="btn" data-action="delete" data-id="${id}" type="button">Excluir</button>
    </div>
	`;
}

function renderCards(readings) {
  const cards = qs("#cards");
  if (!cards) return;

  cards.innerHTML = readings
    .slice(0, 6)
    .map(
      (r) => `
      <article class="card">
        <div class="card__header">
          <span class="badge">#${fmt(r.id)}</span>
          <span class="text-xs text-muted-foreground">${fmt(r.timestamp)}</span>
        </div>
        <div class="card__content grid gap-3">
          <div class="rounded-lg border bg-secondary px-3 py-2 flex items-center justify-between gap-3">
            <span class="text-xs font-semibold text-muted-foreground">Temperatura</span>
            <span class="text-sm font-extrabold">${fmt(r.temperatura)}</span>
          </div>
          <div class="rounded-lg border bg-secondary px-3 py-2 flex items-center justify-between gap-3">
            <span class="text-xs font-semibold text-muted-foreground">Umidade</span>
            <span class="text-sm font-extrabold">${fmt(r.umidade)}</span>
          </div>
        </div>
      </article>
    `,
    )
    .join("");
}

function renderLatestTable(readings) {
  const tbody = qs("#latestTable");
  if (!tbody) return;
  tbody.innerHTML = readings
    .map(
      (r) => `
			<tr>
				<td>${fmt(r.id)}</td>
				<td>${fmt(r.temperatura)}</td>
				<td>${fmt(r.umidade)}</td>
				<td>${fmt(r.pressao)}</td>
				<td>${fmt(r.timestamp)}</td>
        <td><a class="btn btn--ghost" href="/editar/${r.id}">Editar</a></td>
			</tr>
		`,
    )
    .join("");
}

async function loadLatest() {
  const status = qs("#updateStatus");
  const btn = qs("#refreshBtn");
  try {
    if (btn) btn.disabled = true;
    setBusyDot(true);
    setStatus(status, "Atualizando…");

    const readings = await api("/leituras?limit=12&offset=0");
    renderCards(readings);
    renderLatestTable(readings);
    ensureCharts(readings);

    const now = new Date();
    const hhmmss = now.toLocaleTimeString();
    setStatus(status, `Atualizado às ${hhmmss}`);
  } catch (e) {
    setStatus(status, `Erro: ${e.message}`);
  } finally {
    setBusyDot(false);
    if (btn) btn.disabled = false;
  }
}

function initIndex() {
  const btn = qs("#refreshBtn");
  if (btn) btn.addEventListener("click", loadLatest);

  setInterval(loadLatest, 10000);
  loadLatest();
}

// --- Histórico ---

function renderHistoricoRows(readings) {
  const tbody = qs("#historicoTable");
  if (!tbody) return;

  const html = readings
    .map(
      (r) => `
			<tr data-row-id="${r.id}">
				<td>${fmt(r.id)}</td>
				<td>${fmt(r.temperatura)}</td>
				<td>${fmt(r.umidade)}</td>
				<td>${fmt(r.pressao)}</td>
				<td>${fmt(r.localizacao)}</td>
				<td>${fmt(r.timestamp)}</td>
				<td>${rowActionsHtml(r.id)}</td>
			</tr>
		`,
    )
    .join("");

  tbody.insertAdjacentHTML("beforeend", html);
}

function initHistorico() {
  const status = qs("#historicoStatus");
  const tbody = qs("#historicoTable");
  const sentinel = qs("#sentinel");
  const refreshBtn = qs("#refreshHistoricoBtn");

  let isLoading = false;
  let offset = 0;
  const limit = 50;
  let done = false;

  async function loadMore(reset = false) {
    if (isLoading) return;
    if (done && !reset) return;

    try {
      isLoading = true;
      setStatus(status, reset ? "Recarregando…" : "Carregando…");

      if (reset) {
        offset = 0;
        done = false;
        if (tbody) tbody.innerHTML = "";
      }

      const readings = await api(`/leituras?limit=${limit}&offset=${offset}`);
      if (!Array.isArray(readings) || readings.length === 0) {
        done = true;
        setStatus(status, "Fim do histórico");
        return;
      }

      renderHistoricoRows(readings);
      offset += readings.length;
      setStatus(status, `Carregadas ${offset} leituras`);
    } catch (e) {
      setStatus(status, `Erro: ${e.message}`);
    } finally {
      isLoading = false;
    }
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => loadMore(true));
  }

  document.addEventListener("click", async (ev) => {
    const btn = ev.target?.closest?.("button[data-action='delete']");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    if (!id) return;

    const ok = confirm(`Excluir a leitura #${id}?`);
    if (!ok) return;

    try {
      btn.disabled = true;
      await api(`/leituras/${id}`, { method: "DELETE" });
      const row = qs(`tr[data-row-id='${id}']`);
      if (row) row.remove();
      setStatus(status, `Leitura #${id} excluída`);
    } catch (e) {
      setStatus(status, `Erro ao excluir: ${e.message}`);
    } finally {
      btn.disabled = false;
    }
  });

  if (sentinel && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        loadMore(false);
      }
    });
    io.observe(sentinel);
  }

  loadMore(true);
}

// --- Editar ---

function initEditar() {
  const main = qs("main[data-page='editar']");
  const status = qs("#editarStatus");
  const form = qs("#editarForm");
  const salvarBtn = qs("#salvarBtn");
  const id = main?.getAttribute("data-id");
  if (!id || !form) return;

  async function load() {
    try {
      setStatus(status, "Carregando dados atuais…");
      const leitura = await api(`/leituras/${id}`);

      qs("#timestamp")?.setAttribute("value", fmt(leitura.timestamp));
      qs("#temperatura")?.setAttribute("value", fmt(leitura.temperatura));
      qs("#umidade")?.setAttribute("value", fmt(leitura.umidade));
      qs("#pressao")?.setAttribute("value", leitura.pressao ?? "");

      setStatus(status, "Pronto para editar");
    } catch (e) {
      setStatus(status, `Erro: ${e.message}`);
    }
  }

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    try {
      if (salvarBtn) salvarBtn.disabled = true;
      setStatus(status, "Salvando…");

      const payload = {
        temperatura: Number(qs("#temperatura").value),
        umidade: Number(qs("#umidade").value),
        pressao:
          qs("#pressao").value === "" ? null : Number(qs("#pressao").value),
      };

      const res = await api(`/leituras/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setStatus(status, res?.message || "Atualizado");
    } catch (e) {
      setStatus(status, `Erro: ${e.message}`);
    } finally {
      if (salvarBtn) salvarBtn.disabled = false;
    }
  });

  load();
}

// --- Boot ---

document.addEventListener("DOMContentLoaded", () => {
  const page = document.querySelector("main")?.getAttribute("data-page");
  if (page === "index") initIndex();
  if (page === "historico") initHistorico();
  if (page === "editar") initEditar();
});
