// client rendered to make further reloads faster
"use client";

import { Header } from "@/components/header";
import { HeroContent } from "@/components/hero-content";

export default function HomePage() {
  return (
    <div>
      <Header />
      <HeroContent />
    </div>
  );
}
