"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AuthFormState } from "./types";

type CredentialsResult =
  | {
      email: string;
      password: string;
    }
  | {
      error: string;
    };

function readCredentials(formData: FormData): CredentialsResult {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || email.trim() === "") {
    return { error: "Email wajib diisi." };
  }

  if (!email.includes("@")) {
    return { error: "Format email belum benar." };
  }

  if (typeof password !== "string" || password.length < 6) {
    return { error: "Password minimal 6 karakter." };
  }

  return {
    email: email.trim(),
    password,
  };
}

export async function login(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const credentials = readCredentials(formData);

  if ("error" in credentials) {
    return {
      message: credentials.error,
      status: "error",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    return {
      message: "Email atau password belum cocok.",
      status: "error",
    };
  }

  redirect("/");
}

export async function signup(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const credentials = readCredentials(formData);

  if ("error" in credentials) {
    return {
      message: credentials.error,
      status: "error",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(credentials);

  if (error) {
    return {
      message: "Gagal bikin akun. Coba pakai email lain atau login kalau sudah punya akun.",
      status: "error",
    };
  }

  if (!data.session) {
    return {
      message: "Akun dibuat. Cek email kamu dulu kalau Supabase minta konfirmasi.",
      status: "success",
    };
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
