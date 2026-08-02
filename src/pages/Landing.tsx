import { Nav } from '../components/landing/Nav';
import { Hero } from '../components/landing/Hero';
import { Features } from '../components/landing/Features';
import { HowItWorks } from '../components/landing/HowItWorks';
import { StatsStrip } from '../components/landing/StatsStrip';
import { ClosingCta } from '../components/landing/ClosingCta';
import { Footer } from '../components/landing/Footer';

export function Landing() {
  return (
    <div className="bg-base">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <StatsStrip />
      <ClosingCta />
      <Footer />
    </div>
  );
}
