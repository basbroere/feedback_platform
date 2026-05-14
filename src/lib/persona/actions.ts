"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PERSONA_COOKIE } from "./types";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function selectPersona(userId: string, redirectTo: string = "/dashboard") {
  const cookieStore = await cookies();
  cookieStore.set(PERSONA_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
  redirect(redirectTo);
}

export async function clearPersona() {
  const cookieStore = await cookies();
  cookieStore.delete(PERSONA_COOKIE);
  redirect("/");
}
