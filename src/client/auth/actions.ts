"use server";

import { cookies } from "next/headers";

const AUTH_COOKIE = "readyon_user";

/** Simulated auth: the "Viewing as" switcher picks a user and we remember them in a cookie. */
export async function switchPersona(userId: string) {
  const store = await cookies();
  store.set(AUTH_COOKIE, userId, { httpOnly: true, sameSite: "lax", path: "/" });
}
