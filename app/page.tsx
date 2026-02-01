import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Categories } from "@/components/landing/Categories";
import { WhyUs } from "@/components/landing/WhyUs";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden selection:bg-red-100 selection:text-red-900">
      <Navbar />
      <Hero />
      <WhyUs />
      <Categories />
      <CTA />
      <Footer />
    </main>
  );
}