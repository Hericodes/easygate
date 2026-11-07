import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import { googleEnabled } from "@/lib/google";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <Suspense>
      <AuthForm mode="signup" googleEnabled={googleEnabled()} />
    </Suspense>
  );
}
