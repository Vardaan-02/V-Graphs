
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Workflow, Zap, Shield, Globe, Puzzle } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Bot,
      title: "Autonomous Agents",
      description: "Deploy AI agents that operate independently, making intelligent decisions and executing complex workflows without human intervention."
    },
    {
      icon: Workflow,
      title: "Visual Builder",
      description: "Intuitive drag-and-drop interface that transforms complex logic into simple visual workflows. No programming experience required."
    },
    {
      icon: Zap,
      title: "Real-time Execution",
      description: "Lightning-fast processing with real-time monitoring and instant feedback. Scale from prototype to production seamlessly."
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade security with end-to-end encryption, SOC 2 compliance, and comprehensive audit trails for enterprise peace of mind."
    },
    {
      icon: Globe,
      title: "Universal Integrations",
      description: "Connect with 1000+ services and APIs. From databases to SaaS platforms, integrate everything in your tech stack."
    },
    {
      icon: Puzzle,
      title: "Adaptive Intelligence",
      description: "Self-improving workflows that learn from patterns, optimize performance, and adapt to changing business requirements."
    }
  ];

  return (
    <section id="features" className="py-32 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 border border-black/10 mb-6">
            <div className="w-2 h-2 bg-cyan-500 rounded-full" />
            <span className="text-sm text-black/60 font-medium">Features</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-black mb-6">
            Everything you need to
            <span className="block bg-gradient-to-r from-cyan-600 to-black bg-clip-text text-transparent">
              automate anything
            </span>
          </h2>
          
          <p className="text-xl text-black/60 max-w-2xl mx-auto">
            Professional-grade tools designed for teams that demand reliability, 
            security, and performance at scale.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group bg-white/80 backdrop-blur-sm border border-black/10 hover:border-cyan-500/20 hover:shadow-2xl transition-all duration-500 rounded-2xl overflow-hidden"
            >
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/10 to-black/5 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-black" />
                </div>
                <CardTitle className="text-xl font-bold text-black">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-black/60 leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

       
         
      </div>
    </section>
  );
};

export default Features;
