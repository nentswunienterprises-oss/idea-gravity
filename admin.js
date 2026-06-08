const loginSection = document.querySelector("[data-admin-login]");
const dashboardSection = document.querySelector("[data-admin-dashboard]");
const loginForm = document.querySelector("[data-admin-login-form]");
const statusElement = document.querySelector("[data-admin-status]");
const briefList = document.querySelector("[data-brief-list]");
const statsElement = document.querySelector("[data-admin-stats]");
const emptyElement = document.querySelector("[data-admin-empty]");
const searchInput = document.querySelector("[data-admin-search]");
const filterSelect = document.querySelector("[data-admin-filter]");
const refreshButton = document.querySelector("[data-admin-refresh]");
const logoutButton = document.querySelector("[data-admin-logout]");

const passwordStorageKey = "ideaGravityAdminPassword";
let briefs = [];

function getStoredPassword() {
  return sessionStorage.getItem(passwordStorageKey) || "";
}

function setStatus(message, type = "") {
  if (!statusElement) {
    return;
  }

  statusElement.textContent = message;
  statusElement.className = `form-status is-visible ${type}`.trim();
}

function formatDate(value) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function asList(value) {
  return Array.isArray(value) && value.length ? value.join(", ") : "Not specified";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function adminFetch(path, options = {}) {
  const password = getStoredPassword();
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": password,
      ...(options.headers || {}),
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      sessionStorage.removeItem(passwordStorageKey);
      showLogin();
    }

    throw new Error(result.error || "Admin request failed.");
  }

  return result;
}

function showLogin() {
  if (loginSection) {
    loginSection.hidden = false;
  }

  if (dashboardSection) {
    dashboardSection.hidden = true;
  }
}

function showDashboard() {
  if (loginSection) {
    loginSection.hidden = true;
  }

  if (dashboardSection) {
    dashboardSection.hidden = false;
  }
}

function renderStats(items) {
  if (!statsElement) {
    return;
  }

  const statuses = ["new", "reviewing", "quoted", "accepted", "archived"];
  const counts = Object.fromEntries(statuses.map((status) => [status, 0]));

  items.forEach((brief) => {
    if (brief.status in counts) {
      counts[brief.status] += 1;
    }
  });

  statsElement.innerHTML = [
    `<article><span>Total</span><strong>${items.length}</strong></article>`,
    ...statuses.map((status) => `<article><span>${status}</span><strong>${counts[status]}</strong></article>`),
  ].join("");
}

function matchesSearch(brief, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    brief.organization,
    brief.contact_name,
    brief.email,
    brief.phone,
    brief.goal,
    brief.audience,
    brief.preferred_layer,
    brief.budget_range,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

function getFilteredBriefs() {
  const query = searchInput instanceof HTMLInputElement ? searchInput.value.trim() : "";
  const status = filterSelect instanceof HTMLSelectElement ? filterSelect.value : "all";

  return briefs.filter((brief) => {
    const statusMatches = status === "all" || brief.status === status;
    return statusMatches && matchesSearch(brief, query);
  });
}

function renderBriefs() {
  if (!briefList || !emptyElement) {
    return;
  }

  const visibleBriefs = getFilteredBriefs();
  emptyElement.hidden = visibleBriefs.length > 0;

  briefList.innerHTML = visibleBriefs
    .map(
      (brief) => `
        <article class="admin-brief-card" data-brief-id="${escapeHtml(brief.id)}">
          <div class="brief-card-top">
            <div>
              <span class="status-pill">${escapeHtml(brief.status)}</span>
              <h3>${escapeHtml(brief.organization)}</h3>
              <p>${escapeHtml(brief.contact_name)} · <a href="mailto:${escapeHtml(brief.email)}">${escapeHtml(brief.email)}</a> · ${escapeHtml(brief.phone)}</p>
            </div>
            <time datetime="${escapeHtml(brief.created_at)}">${formatDate(brief.created_at)}</time>
          </div>

          <div class="brief-card-grid">
            <div>
              <h4>Goal</h4>
              <p>${escapeHtml(brief.goal)}</p>
            </div>
            <div>
              <h4>Audience</h4>
              <p>${escapeHtml(brief.audience)}</p>
            </div>
            <div>
              <h4>Action</h4>
              <p>${escapeHtml(asList(brief.desired_actions))}</p>
            </div>
            <div>
              <h4>Channels</h4>
              <p>${escapeHtml(asList(brief.channels))}</p>
            </div>
            <div>
              <h4>Layer</h4>
              <p>${escapeHtml(brief.preferred_layer)} · ${escapeHtml(brief.support_type)}</p>
            </div>
            <div>
              <h4>Budget / Deadline</h4>
              <p>${escapeHtml(brief.budget_range)} · ${escapeHtml(brief.deadline || "No deadline")}</p>
            </div>
          </div>

          <div class="brief-materials">
            <h4>Existing material</h4>
            <p>${escapeHtml(brief.existing_materials || "None supplied")}</p>
          </div>

          <div class="brief-card-actions">
            <label>
              <span>Move status</span>
              <select data-status-select>
                ${["new", "reviewing", "quoted", "accepted", "archived"]
                  .map((status) => `<option value="${status}" ${brief.status === status ? "selected" : ""}>${status}</option>`)
                  .join("")}
              </select>
            </label>
            <button class="admin-button" type="button" data-copy-contact>Copy contact</button>
          </div>
        </article>
      `,
    )
    .join("");
}

async function loadBriefs() {
  showDashboard();

  if (briefList) {
    briefList.innerHTML = `<div class="admin-empty">Loading briefs...</div>`;
  }

  const result = await adminFetch("/api/admin-briefs");
  briefs = Array.isArray(result.briefs) ? result.briefs : [];
  renderStats(briefs);
  renderBriefs();
}

async function updateBriefStatus(card, status) {
  const id = card.getAttribute("data-brief-id");

  if (!id) {
    return;
  }

  await adminFetch("/api/admin-briefs", {
    method: "PATCH",
    body: JSON.stringify({ id, status }),
  });

  const brief = briefs.find((item) => item.id === id);

  if (brief) {
    brief.status = status;
  }

  renderStats(briefs);
  renderBriefs();
}

if (loginForm instanceof HTMLFormElement) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const password = String(formData.get("password") || "");

    setStatus("Checking access...");

    try {
      const response = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Login failed.");
      }

      sessionStorage.setItem(passwordStorageKey, password);
      loginForm.reset();
      await loadBriefs();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Login failed.", "is-error");
    }
  });
}

briefList?.addEventListener("change", async (event) => {
  const target = event.target;

  if (!(target instanceof HTMLSelectElement) || !target.matches("[data-status-select]")) {
    return;
  }

  const card = target.closest("[data-brief-id]");

  if (!(card instanceof HTMLElement)) {
    return;
  }

  target.disabled = true;

  try {
    await updateBriefStatus(card, target.value);
  } catch (error) {
    alert(error instanceof Error ? error.message : "Could not update status.");
    target.disabled = false;
  }
});

briefList?.addEventListener("click", async (event) => {
  const target = event.target;

  if (!(target instanceof HTMLButtonElement) || !target.matches("[data-copy-contact]")) {
    return;
  }

  const card = target.closest("[data-brief-id]");
  const id = card?.getAttribute("data-brief-id");
  const brief = briefs.find((item) => item.id === id);

  if (!brief) {
    return;
  }

  await navigator.clipboard.writeText(`${brief.contact_name}\n${brief.email}\n${brief.phone}`);
  target.textContent = "Copied";
  setTimeout(() => {
    target.textContent = "Copy contact";
  }, 1200);
});

searchInput?.addEventListener("input", renderBriefs);
filterSelect?.addEventListener("change", renderBriefs);
refreshButton?.addEventListener("click", () => loadBriefs().catch((error) => alert(error.message)));
logoutButton?.addEventListener("click", () => {
  sessionStorage.removeItem(passwordStorageKey);
  showLogin();
});

if (getStoredPassword()) {
  loadBriefs().catch(() => showLogin());
} else {
  showLogin();
}
