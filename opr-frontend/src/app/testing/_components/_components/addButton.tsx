import { Plus } from "lucide-react";

export function FloatingAddButton({ onClick, isOpen }: {
  onClick: () => void;
  isOpen: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        fixed top-6 right-65 z-50
        w-14 h-14 bg-black/80 hover:bg-black/90 border border-white/10
        text-white rounded-sm shadow-xl backdrop-blur-xl
        flex items-center justify-center
        transition-all duration-300 ease-out
        hover:scale-105 active:scale-95 hover:shadow-2xl hover:border-cyan-400/50
        ${isOpen ? 'rotate-45 bg-black/90 border-cyan-400/50' : 'rotate-0'}
      `}
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}