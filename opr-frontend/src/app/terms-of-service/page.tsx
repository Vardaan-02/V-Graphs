
import { Scale, FileText, Shield, AlertTriangle, Users, Clock, Mail } from "lucide-react";

import Footer from "../_landingPage/footer";
import Header from "../_landingPage/header";

const Terms = () => {
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
            <Scale className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-white/80">Legal Terms</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-white to-cyan-400 bg-clip-text text-transparent">
              Terms of Service
            </span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl">
            Please read these terms carefully before using our AI workflow automation platform.
          </p>
          <p className="text-white/50 mt-2">Last updated: December 24, 2024</p>
        </div>

       
        <div className="space-y-12">
         
          <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-semibold text-white">Acceptance of Terms</h2>
            </div>
            <div className="space-y-4 text-white/70">
              <p>
                By accessing and using our AI workflow automation platform Service, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
              <p>
                If you do not agree to abide by the above, please do not use this service. These terms apply to all users of the service, including without limitation users who are browsers, vendors, customers, merchants, and/or contributors of content.
              </p>
            </div>
          </section>

   
          <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-semibold text-white">Use License</h2>
            </div>
            <div className="space-y-4 text-white/70">
              <p>Permission is granted to temporarily access and use our platform for personal and commercial purposes, subject to the restrictions in these terms.</p>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-white font-medium mb-3">You may not:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                    <span>Modify or copy the platform materials</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                    <span>Use the materials for commercial purposes or public display</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                    <span>Attempt to reverse engineer any software on our platform</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                    <span>Remove any copyright or proprietary notations</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

       
          <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-semibold text-white">Service Terms</h2>
            </div>
            <div className="space-y-4 text-white/70">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-white font-medium mb-2">Account Responsibility</h4>
                  <p className="text-sm">You are responsible for maintaining the confidentiality of your account and password</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-white font-medium mb-2">Acceptable Use</h4>
                  <p className="text-sm">Use the service only for lawful purposes and in accordance with these terms</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-white font-medium mb-2">Content Guidelines</h4>
                  <p className="text-sm">Do not upload or create workflows with illegal, harmful, or offensive content</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-white font-medium mb-2">Resource Limits</h4>
                  <p className="text-sm">Respect usage limits and do not attempt to circumvent restrictions</p>
                </div>
              </div>
            </div>
          </section>

   
          <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-semibold text-white">Disclaimer</h2>
            </div>
            <div className="space-y-4 text-white/70">
              <p>
                The information on this platform is provided on an as is basis. To the fullest extent permitted by law, this Company:
              </p>
              <ul className="space-y-2 mt-4">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2" />
                  <span>Excludes all representations and warranties relating to this platform and its contents</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2" />
                  <span>Does not guarantee the accuracy, completeness, or timeliness of the information</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2" />
                  <span>Excludes liability for any direct, indirect, or consequential loss or damage</span>
                </li>
              </ul>
            </div>
          </section>


          <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Scale className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-semibold text-white">Limitations</h2>
            </div>
            <div className="space-y-4 text-white/70">
              <p>
                In no event shall our Company or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our platform.
              </p>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 mt-4">
                <h4 className="text-white font-medium mb-2">Service Availability</h4>
                <p className="text-sm">We strive for 99.9% uptime but do not guarantee uninterrupted service. Maintenance windows and updates may cause temporary downtime.</p>
              </div>
            </div>
          </section>

   
          <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-semibold text-white">Termination</h2>
            </div>
            <div className="space-y-4 text-white/70">
              <p>
                We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation.
              </p>
              <div className="space-y-3 mt-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="text-white font-medium mb-1">Grounds for Termination</h4>
                  <p className="text-sm">Violation of terms, fraudulent activity, or misuse of the platform</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="text-white font-medium mb-1">Effect of Termination</h4>
                  <p className="text-sm">Your right to use the service will cease immediately upon termination</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-semibold text-white">Changes to Terms</h2>
            </div>
            <div className="text-white/70">
              <p className="mb-4">
                We reserve the right, at our sole discretion, to modify or replace these terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-sm">
                  <strong className="text-white">Your continued use</strong> of our service after any such changes constitutes your acceptance of the new terms.
                </p>
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

export default Terms;