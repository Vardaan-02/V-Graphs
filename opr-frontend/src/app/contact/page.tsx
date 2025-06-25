"use client";
import Footer from "../_landingPage/footer";
import Header from "../_landingPage/header";
import Hero from "./_components/hero";

export default function Page() {
 return (
  <div className="relative">
    <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] pointer-events-none" />
      </div>

      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none" />
    <div className=" bg-transparent z-50">
      <Header></Header>
    <Hero></Hero>
    <Footer></Footer>
    </div>
    
  </div>
 );
}