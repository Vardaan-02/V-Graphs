"use client";
import Header from "./_landingPage/header";
import Hero from "./_landingPage/hero";
import Features from "./_landingPage/features";
import Creator from "./_landingPage/creator";
import Footer from "./_landingPage/footer";
import Issue from "./contact/_components/issue";
import { UserProvider } from "@/provider/userprovider";

export default function Home() {
  return (
    <UserProvider>
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <Creator/>
      <Footer />
      <Issue />
    </div>
    </UserProvider>
  );
}
