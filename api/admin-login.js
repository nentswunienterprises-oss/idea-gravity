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

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredPassword) {
    return response.status(503).json({ error: "Admin dashboard is not configured yet." });
  }

  const body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};
  const password = typeof body.password === "string" ? body.password : "";

  if (!password || !timingSafeEqualText(password, configuredPassword)) {
    return response.status(401).json({ error: "Invalid admin password." });
  }

  return response.status(200).json({ ok: true });
}
