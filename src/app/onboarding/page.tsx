import type { Metadata } from "next";
import { OnboardingFlow } from "@/features/profile/components/onboarding-flow";

export const metadata: Metadata = { title: "Finpass | Profil Anda" };

export default function Onboarding() {
  return <OnboardingFlow />;
}
