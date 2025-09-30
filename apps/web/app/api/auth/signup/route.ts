// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@repo/db/prisma";
import { SignupSchema } from "../../../../lib/zodValidation/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues?.[0]?.message || "Invalid input" },
      { status: 400 },
    );
  }
  const { name, password, email } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    return NextResponse.json(
      { error: "Email ID already exists" },
      { status: 409 },
    );

  const passwordHash = await hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name: name,
      email: email,
      password: passwordHash,
    },
  });

  if (user) {
    return NextResponse.json({ id: user.id }, { status: 201 });
  } else {
    return NextResponse.json({ error: "Some server error" }, { status: 400 });
  }
}
