import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import { googleEnabled } from "@/lib/google";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm mode="login" googleEnabled={googleEnabled()} />
    </Suspense>
  );
}
