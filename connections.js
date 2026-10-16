const API_BASE = "http://127.0.0.1:8000";
const token = sessionStorage.getItem("access_token");

if (!token) {
  window.location.href = "login.html";
}

function escapeHTML(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (res.status === 401 || res.status === 403) {
    sessionStorage.removeItem("access_token");
    window.location.href = "login.html";
    throw new Error("Unauthorized");
  }

  return res;
}

let allConnections = [];

async function loadConnections() {
  try {
    const res = await apiFetch("/connections");
    const data = await res.json();
    allConnections = Array.isArray(data) ? data : (data.connections || []);
    document.getElementById("totalConnections").textContent = allConnections.length;
    renderConnections(allConnections);
  } catch (err) {
    document.getElementById("connectionsGrid").innerHTML =
      '<div class="loading">Failed to load connections.</div>';
  }
}

function renderConnections(list) {
  const grid = document.getElementById("connectionsGrid");

  if (!list || list.length === 0) {
    grid.innerHTML = '<div class="loading">No connections yet.</div>';
    return;
  }

  grid.innerHTML = list
    .map((c) => {
      const name = c.name || c.full_name || c.user_name || "User";
      const email = c.email || "";
      const skills = c.skills || c.skill_list || [];
      const skillsHtml = Array.isArray(skills)
        ? skills
            .slice(0, 5)
            .map((s) => {
              const sName = typeof s === "string" ? s : s.name || s.skill_name || "";
              return `<span class="skill-chip">${escapeHTML(sName)}</span>`;
            })
            .join("")
        : "";

      return `
        <div class="connection-card">
          <div class="conn-avatar">${escapeHTML(name.charAt(0).toUpperCase())}</div>
          <div class="conn-info">
            <div class="conn-name">${escapeHTML(name)}</div>
            <div class="conn-email">${escapeHTML(email)}</div>
            <div class="conn-skills">${skillsHtml}</div>
          </div>
        </div>
      `;
    })
    .join("");
}

document.getElementById("searchInput").addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();

  if (!q) {
    renderConnections(allConnections);
    return;
  }

  const filtered = allConnections.filter((c) => {
    const name = (c.name || c.full_name || c.user_name || "").toLowerCase();
    const email = (c.email || "").toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  renderConnections(filtered);
});

async function loadUser() {
  try {
    const res = await apiFetch("/profile");
    const profile = await res.json();
    const name = profile.name || profile.full_name || "User";
    document.getElementById("userNameTop").textContent = escapeHTML(name);
    document.getElementById("userAvatar").textContent = name.charAt(0).toUpperCase();
  } catch (_) {}
}

loadUser();
loadConnections();