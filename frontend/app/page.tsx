import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import TentangSection from './components/TentangSection';
import LineupSection from './components/LineupSection';
import TiketSection from './components/TiketSection';
import Footer from './components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <TentangSection />
      <LineupSection />
      <TiketSection />
      <Footer />
    </>
  );
}
