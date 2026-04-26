import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Members } from "@/components/sections/Members";
import { Activities } from "@/components/sections/Activities";
import { Events } from "@/components/sections/Events";
import { Achievements } from "@/components/sections/Achievements";
import { Gallery } from "@/components/sections/Gallery";
import { Register } from "@/components/sections/Register";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen relative">
      <Navbar />
      <Hero />
      <About />
      <Members />
      <Activities />
      <Events />
      <Achievements />
      <Gallery />
      <Register />
      <Contact />
      <Footer />
    </main>
  );
};

export default Index;
