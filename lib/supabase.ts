const BASE = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SECRET_KEY;

if (!BASE || !KEY) {
  console.warn("Supabase environment variables are not configured.");
}

function headers() {
  return {
    apikey: KEY || "",
    Authorization: `Bearer ${KEY || ""}`,
    "Content-Type": "application/json"
  };
}

export async function getDeviceState() {
  if (!BASE || !KEY) throw new Error("Supabase environment variables are missing.");

  const url =
    `${BASE}/rest/v1/device_state` +
    `?device_id=eq.esp32-01&select=*`;

  const res = await fetch(url, {
    headers: headers(),
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error(`Supabase read failed (${res.status})`);
  }

  const rows = await res.json();

  if (!rows.length) {
    throw new Error("No device_state row exists for esp32-01.");
  }

  return rows[0];
}

export async function updateDeviceState(patch: Record<string, unknown>) {
  if (!BASE || !KEY) throw new Error("Supabase environment variables are missing.");

  const url =
    `${BASE}/rest/v1/device_state` +
    `?device_id=eq.esp32-01`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      ...headers(),
      Prefer: "return=representation"
    },
    body: JSON.stringify(patch),
    cache: "no-store"
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase update failed (${res.status}): ${text}`);
  }

  const rows = await res.json();

  if (!rows.length) {
    throw new Error("Supabase updated 0 rows.");
  }

  return rows[0];
}
