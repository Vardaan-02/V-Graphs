import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles, Code2 } from "lucide-react";
import Link from "next/link";

const Hero = () => {
  return (
    <section id="hero" className="relative min-h-screen bg-black overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-48 pb-20">
        <div className="text-center">
   
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-8">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-white/80">Building the future of automation</span>
          </div>


          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
            <span className="text-white">Build </span>
            <span className="bg-gradient-to-r from-cyan-400 via-white to-cyan-400 bg-clip-text text-transparent">
              Agentic
            </span>
            <br />
            <span className="text-white">Workflows</span>
            <br />
            <span className="text-white/60 text-4xl md:text-5xl lg:text-6xl">without code</span>
          </h1>

 
          <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-3xl mx-auto leading-relaxed">
            Deploy autonomous AI agents that think, decide, and execute complex tasks. 
            Professional-grade automation for modern teams.
          </p>


          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
            <Link href="/auth">
            <Button 
              size="lg" 
              className="bg-white text-black hover:bg-white/90 px-8 py-6 text-lg rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              Start building
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            </Link>
            <Link href="/testing">
            <Button 
              variant="outline" 
              size="lg"
              className="border border-white/20 text-white hover:bg-white/5 px-8 py-6 text-lg rounded-xl backdrop-blur-sm transition-all duration-300"
            >
              <Play className="mr-2 w-5 h-5" />
              Watch demo
            </Button>
            </Link>
          </div>


          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto select-none">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <Sparkles className="w-8 h-8 text-cyan-400 mb-4 mx-auto" />
              <h3 className="text-white font-semibold mb-2">AI-Powered</h3>
              <p className="text-white/60 text-sm">Intelligent agents that learn and adapt</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <Code2 className="w-8 h-8 text-cyan-400 mb-4 mx-auto" />
              <h3 className="text-white font-semibold mb-2">No Code</h3>
              <p className="text-white/60 text-sm">Visual workflow builder for everyone</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-white rounded-lg mb-4 mx-auto" />
              <h3 className="text-white font-semibold mb-2">Enterprise</h3>
              <p className="text-white/60 text-sm">Production-ready and secure</p>
            </div>
          </div>
        </div>
      </div>

     
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
};

export default Hero;