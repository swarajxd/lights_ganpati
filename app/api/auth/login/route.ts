import { NextRequest, NextResponse } from "next/server";
import { setSession } from "../../../../lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const expectedUser = process.env.AUTH_USERNAME || "admin";
    const expectedPass = process.env.AUTH_PASSWORD || "jaju";

    if (username !== expectedUser || password !== expectedPass) {
      return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
    }

    await setSession(username);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid login request." }, { status: 400 });
  }
}
