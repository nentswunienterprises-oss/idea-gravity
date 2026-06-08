const requiredFields = [
  "organization",
  "contact_name",
  "email",
  "phone",
  "goal",
  "audience",
  "support_type",
  "preferred_layer",
  "budget_range",
  "live_date",
];

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.map(normalizeText).filter(Boolean) : [];
}

function badRequest(response, message) {
  return response.status(400).json({ error: message });
}

export default async function handler(request, response) {
  if (request.method === "OPTIONS") {
    response.setHeader("Allow", "POST, OPTIONS");
    return response.status(204).end();
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, OPTIONS");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return response.status(503).json({ error: "Brief database is not configured yet." });
  }

  const body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};

  const liveDate = normalizeText(body.live_date || body.deadline);

  const brief = {
    organization: normalizeText(body.organization),
    contact_name: normalizeText(body.contact_name),
    email: normalizeText(body.email).toLowerCase(),
    phone: normalizeText(body.phone),
    goal: normalizeText(body.goal),
    audience: normalizeText(body.audience),
    desired_actions: normalizeArray(body.desired_actions),
    channels: normalizeArray(body.channels),
    support_type: normalizeText(body.support_type),
    preferred_layer: normalizeText(body.preferred_layer),
    live_date: liveDate,
    duration: normalizeText(body.duration),
    existing_materials: normalizeText(body.existing_materials),
    budget_range: normalizeText(body.budget_range),
    status: "new",
  };

  const missingField = requiredFields.find((field) => !brief[field]);

  if (missingField) {
    return badRequest(response, `Missing required field: ${missingField}`);
  }

  if (!brief.email.includes("@")) {
    return badRequest(response, "Please provide a valid email address.");
  }

  const insertResponse = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/gravity_briefs`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(brief),
  });

  if (!insertResponse.ok) {
    const detail = await insertResponse.text();
    console.error("Supabase insert failed:", detail);
    return response.status(502).json({ error: "Could not save the brief. Please try again." });
  }

  const [createdBrief] = await insertResponse.json();

  return response.status(201).json({
    ok: true,
    id: createdBrief?.id,
    message: "Gravity brief submitted.",
  });
}
