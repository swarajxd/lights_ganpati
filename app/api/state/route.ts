import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "../../../lib/auth";
import { getDeviceState, updateDeviceState } from "../../../lib/supabase";

const ALLOWED_KEYS = new Set([
  "mode",
  "led1",
  "led2",
  "led3",
  "led4",
  "led5",
  "led6",
  "led7",
  "speed1",
  "speed2",
  "speed3",
  "speed4",
  "speed5",
  "speed6",
  "speed7"
]);

function cleanPatch(input: Record<string, unknown>) {
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (!ALLOWED_KEYS.has(key)) continue;

    if (key === "mode") {
      if (value !== "manual" && value !== "wave") continue;
      output[key] = value;
      continue;
    }

    const number = Number(value);
    if (!Number.isFinite(number)) continue;

    if (key.startsWith("led")) {
      output[key] = Math.max(0, Math.min(80, Math.round(number)));
    } else {
      output[key] = Math.max(500, Math.min(5000, Math.round(number)));
    }
  }

  return output;
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const state = await getDeviceState();
    return NextResponse.json({ state });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not read state." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const input = await request.json();
    const patch = cleanPatch(input);

    if (!Object.keys(patch).length) {
      return NextResponse.json({ error: "No valid changes supplied." }, { status: 400 });
    }

    const state = await updateDeviceState(patch);
    return NextResponse.json({ state });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update state." },
      { status: 500 }
    );
  }
}