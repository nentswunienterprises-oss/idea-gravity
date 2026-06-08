const allowedStatuses = new Set(["new", "reviewing", "quoted", "accepted", "archived"]);

function timingSafeEqualText(left, right) {
  const encoder = new TextEncoder();
  const leftBuffer = encoder.encode(left);
  const rightBuffer = encoder.encode(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < leftBuffer.length; index += 1) {
    difference |= leftBuffer[index] ^ rightBuffer[index];
  }

  return difference === 0;
}

function getAdminPassword(request) {
  const headerPassword = request.headers["x-admin-password"] || request.headers["X-Admin-Password"];
  return Array.isArray(headerPassword) ? headerPassword[0] : headerPassword || "";
}

function requireAdmin(request, response) {
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredPassword) {
    response.status(503).json({ error: "Admin dashboard is not configured yet." });
    return false;
  }

  const suppliedPassword = getAdminPassword(request);

  if (!suppliedPassword || !timingSafeEqualText(suppliedPassword, configuredPassword)) {
    response.status(401).json({ error: "Invalid admin password." });
    return false;
  }

  return true;
}

function getSupabaseConfig(response) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    response.status(503).json({ error: "Brief database is not configured yet." });
    return null;
  }

  return {
    baseUrl: supabaseUrl.replace(/\/$/, ""),
    serviceRoleKey,
  };
}

async function supabaseRequest(path, options, response) {
  const config = getSupabaseConfig(response);

  if (!config) {
    return null;
  }

  const supabaseResponse = await fetch(`${config.baseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!supabaseResponse.ok) {
    const detail = await supabaseResponse.text();
    console.error("Supabase admin request failed:", detail);
    response.status(502).json({ error: "Could not read the brief database." });
    return null;
  }

  if (supabaseResponse.status === 204) {
    return null;
  }

  return supabaseResponse.json();
}

export default async function handler(request, response) {
  if (request.method === "OPTIONS") {
    response.setHeader("Allow", "GET, PATCH, OPTIONS");
    return response.status(204).end();
  }

  if (!requireAdmin(request, response)) {
    return;
  }

  if (request.method === "GET") {
    const url = new URL(request.url, "https://ideagravity.co.za");
    const status = url.searchParams.get("status");
    const query = new URLSearchParams({
      select: "*",
      order: "created_at.desc",
      limit: "100",
    });

    if (status && status !== "all") {
      query.set("status", `eq.${status}`);
    }

    const briefs = await supabaseRequest(`gravity_briefs?${query.toString()}`, { method: "GET" }, response);

    if (!briefs) {
      return;
    }

    return response.status(200).json({ briefs });
  }

  if (request.method === "PATCH") {
    const body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const status = typeof body.status === "string" ? body.status.trim() : "";

    if (!id || !allowedStatuses.has(status)) {
      return response.status(400).json({ error: "A valid brief id and status are required." });
    }

    const updatedBriefs = await supabaseRequest(
      `gravity_briefs?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ status }),
      },
      response,
    );

    if (!updatedBriefs) {
      return;
    }

    return response.status(200).json({ brief: updatedBriefs[0] });
  }

  response.setHeader("Allow", "GET, PATCH, OPTIONS");
  return response.status(405).json({ error: "Method not allowed" });
}

