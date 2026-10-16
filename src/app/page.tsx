import { Navbar, StickyCta } from "@/components/sections/navbar";
import { Hero } from "@/components/sections/hero";
import { Problem } from "@/components/sections/problem";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Ladder } from "@/components/sections/ladder";
import { Briefing } from "@/components/sections/briefing";
import { AiRules } from "@/components/sections/ai-rules";
import { RiskProfile } from "@/components/sections/risk-profile";
import { Personas, Security } from "@/components/sections/personas-security";
import { Partner, Faq, FinalCta, Footer } from "@/components/sections/partner-faq-final";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Briefing />
        <Problem />
        <HowItWorks />
        <Ladder />
        <AiRules />
        <RiskProfile />
        <Personas />
        <Security />
        <Partner />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <StickyCta />
    </>
  );
}
