
import { Shield,  Database,  Mail } from "lucide-react";

import Footer from "../_landingPage/footer";
import Header from "../_landingPage/header";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>
      
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
       <Header></Header>
        <div className="mb-12">
         
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-6">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-white/80">Privacy & Security</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-white to-cyan-400 bg-clip-text text-transparent">
              Privacy Policy
            </span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl">
            Your privacy matters to us. Learn how we collect, use, and protect your information.
          </p>
          <p className="text-white/50 mt-2">Last updated: June 24, 2025</p>
        </div>

       
        <div className="space-y-12">
     
          <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-semibold text-white">Information We Collect</h2>
            </div>
            <div className="space-y-4 text-white/70">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Personal Information</h3>
                <p>When you create an account or use our services, we may collect:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                  <li>Name and email address</li>
                  <li>Account credentials and preferences</li>
                  <li>Profile information you choose to provide</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Usage Information</h3>
                <p>We automatically collect information about how you use our platform:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                  <li>Workflow creation and execution data</li>
                  <li>Feature usage and performance metrics</li>
                  <li>Device and browser information</li>
                </ul>
              </div>
            </div>
          </section>

        
          

          <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-semibold text-white">Your Rights</h2>
            </div>
            <div className="space-y-4 text-white/70">
              <p>You have the following rights regarding your personal information:</p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                    <span className="text-white font-medium">Access</span>
                  </div>
                  <p className="text-sm ml-4">Request a copy of your personal data</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                    <span className="text-white font-medium">Correction</span>
                  </div>
                  <p className="text-sm ml-4">Update or correct inaccurate information</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                    <span className="text-white font-medium">Deletion</span>
                  </div>
                  <p className="text-sm ml-4">Request deletion of your personal data</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                    <span className="text-white font-medium">Portability</span>
                  </div>
                  <p className="text-sm ml-4">Export your data in a portable format</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-semibold text-white">Contact Us</h2>
            </div>
            <div className="text-white/70">
              <p className="mb-4">If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p><strong className="text-white">Email:</strong> marcellapearl0627.com</p>
                <p><strong className="text-white">Address:</strong> IIIT ALLAHABAD</p>
                <p><strong className="text-white">Phone:</strong> +91 7015848688</p>
              </div>
            </div>
          </section>
        </div>

        <Footer></Footer>
      </div>
    </div>
  );
};

export default Privacy;
