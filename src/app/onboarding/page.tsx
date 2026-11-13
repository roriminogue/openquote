import { Navigate } from "react-router";
import { AuthFrame } from "@/components/auth-frame";
import { getMember } from "@/lib/auth";
import { useQuery } from "@/lib/data";
import { BusinessSetupForm } from "./form";

export default function OnboardingPage() {
  const member = useQuery("member", getMember);
  if (member) return <Navigate to="/estimates" replace />;
  return (
    <AuthFrame title="Set up your business" intro="This goes on your quotes. You can change it later.">
      <BusinessSetupForm />
    </AuthFrame>
  );
}
