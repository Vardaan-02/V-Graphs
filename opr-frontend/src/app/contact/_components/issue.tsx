
"use client"
import { MailIcon } from "lucide-react";

export default function Issue() {
  return (
    <button 
      className="fixed bottom-8 left-8 z-50 inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 hover:border-cyan-400 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl group"
      onClick={() => window.location.href = "/contact"}
    >
      <div className="flex items-center justify-center w-6 h-6 bg-cyan-400/10 rounded-md group-hover:bg-cyan-400/20 transition-colors">
        <MailIcon className="w-4 h-4 text-cyan-400" />
      </div>
      <span className="text-sm font-medium text-white">
        Need Help?
      </span>
    </button>
  );
}
