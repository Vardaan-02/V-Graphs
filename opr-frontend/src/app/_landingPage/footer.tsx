import Link from "next/link";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white border-t border-white/10 ">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
      <div className="md:col-span-2">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-white rounded-lg" />
          <h3 className="text-2xl font-bold">MarcelPearl</h3>
        </div>
        <p className="text-white/60 mb-6 max-w-md leading-relaxed">
          The professional no-code platform for building intelligent, 
          autonomous workflows that scale with your business.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-white/10 rounded-full text-sm border border-white/20">Real-Time</span>
          <span className="px-3 py-1 bg-white/10 rounded-full text-sm border border-white/20">Enterprise Ready</span>
          <span className="px-3 py-1 bg-white/10 rounded-full text-sm border border-white/20">99.9% Uptime</span>
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-6 text-white ">Company</h4>
        <ul className="space-y-4 text-white/60">
          <li><a href="#creators" className="hover:text-cyan-400 transition-colors">About</a></li>
          <li><a href="/testing" className="hover:text-cyan-400 transition-colors">Blog</a></li>
          <li><a href="#features" className="hover:text-cyan-400 transition-colors">Features</a></li>
          <li><a href="/contact" className="hover:text-cyan-400 transition-colors">Contact</a></li>
          <li><a href="#" className="hover:text-cyan-400 transition-colors">Security</a></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 text-white/60">
        <p>&copy; {currentYear} MarcelPearl. All rights reserved.</p>
        <Link href="/privacy-policy" className="hover:text-cyan-400 transition-colors">
        <p  className="hover:text-cyan-400 transition-colors">Privacy Policy</p>
        </Link>
        <Link href="/terms-of-service" className="hover:text-cyan-400 transition-colors">
        <p  className="hover:text-cyan-400 transition-colors">Terms of Service</p>
        </Link>
      </div>
      <div className="flex items-center gap-2 text-white/60">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-sm">All systems operational</span>
      </div>
    </div>
  </div>
</footer>
 
  );
};

export default Footer;