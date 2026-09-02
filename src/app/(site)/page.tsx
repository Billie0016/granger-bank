import { Hero } from "@/components/home/Hero";
import { TrustSection } from "@/components/home/TrustSection";
import { AccountsSection } from "@/components/home/AccountsSection";
import { FinancialExperience } from "@/components/home/FinancialExperience";
import { DashboardPreview } from "@/components/home/DashboardPreview";
import { FinalCTA } from "@/components/home/FinalCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustSection />
      <AccountsSection />
      <FinancialExperience />
      <DashboardPreview />
      <FinalCTA />
    </>
  );
}
