import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { COOKIE_OPTIONS } from "@/lib/cookies";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { profile: true },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const adminUser = username === "admin";
    const sessionData = {
      id: user.id,
      username: user.username,
      name: user.name,
      isAdmin: adminUser,
      currentProfileId: adminUser ? null : (user.profileId ?? null),
      currentProfileName: adminUser ? null : (user.profile?.name ?? null),
    };

    const cookieStore = await cookies();
    cookieStore.set("session", JSON.stringify(sessionData), COOKIE_OPTIONS);

    return NextResponse.json({
      message: "Login successful",
      user: { id: user.id, username: user.username, name: user.name },
      isAdmin: adminUser,
      currentProfileId: sessionData.currentProfileId,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
