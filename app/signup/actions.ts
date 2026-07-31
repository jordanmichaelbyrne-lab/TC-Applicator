"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { createSignupRequest } from "@/app/lib/repositories/signupRequests";

export async function signup(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const companyName = String(formData.get("companyName") ?? "").trim();

  if (!fullName || !email || !password || !companyName) {
    redirect("/signup?error=Please%20fill%20in%20every%20field.");
  }

  const supabase = await createClient();

  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        requested_company_name: companyName,
      },
    },
  });

  if (signUpError) {
    redirect(`/signup?error=${encodeURIComponent(signUpError.message)}`);
  }

  // "Confirm email" is on for this project, so signUp() returns a user
  // but no active session yet. The signup request gets created the
  // first time they actually log in (see ensureOwnSignupRequest),
  // using the name/company stashed in user metadata above.
  if (!data.session) {
    redirect("/signup/check-email");
  }

  try {
    await createSignupRequest({
      fullName,
      email,
      requestedCompanyName: companyName,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to submit your access request.";
    redirect(`/signup?error=${encodeURIComponent(message)}`);
  }

  redirect("/signup/pending");
}