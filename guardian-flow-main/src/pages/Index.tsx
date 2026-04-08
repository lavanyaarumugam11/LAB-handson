import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import FeatureCards from "@/components/FeatureCards";
import InteractivePlayground from "@/components/InteractivePlayground";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <StatsBar />
      <FeatureCards />
      <InteractivePlayground />
      <Footer />
    </div>
  );
};

export default Index;
