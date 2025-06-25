import { NodeTemplate } from "@/lib/mockdata";
import { useDragContext } from "@/provider/dragprovider";

export default function NodeTemplateCard({ template, onDragStart, onClick }: {
  template: NodeTemplate;
  onDragStart: (event: React.DragEvent, template: NodeTemplate) => void;
  onClick: (template: NodeTemplate) => void;
}) { 
  const { isDragging, setIsDragging } = useDragContext();

  const getNodeColors = () => {
    switch (template.type) {
      case 'trigger':
        return 'border-cyan-400/20 bg-black/40 hover:bg-black/60 hover:border-cyan-400/40 text-cyan-400';
      case 'condition':
        return 'border-white/20 bg-black/40 hover:bg-black/60 hover:border-white/30 text-white';
      case 'action':
        return 'border-white/10 bg-black/40 hover:bg-black/60 hover:border-white/20 text-white/90';
      default:
        return 'border-cyan-400/20 bg-black/40 hover:bg-black/60 hover:border-cyan-400/40 text-cyan-400';
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        setIsDragging(true);
        onDragStart(e, template);
      }}
      onDragEnd={() => setIsDragging(false)}
      onClick={() => onClick(template)}
      className={`
        p-4 bg-black/60 border backdrop-blur-xl cursor-pointer
        transition-all duration-200 select-none group
        hover:shadow-lg active:scale-95
        ${getNodeColors()}
        ${isDragging ? 'opacity-50 scale-95' : ''}
      `}
    >
      <div className="flex items-center space-x-3 mb-3">
        <div className="flex items-center justify-center w-10 h-10 bg-white/5 backdrop-blur-sm border border-white/10">
          <span className="text-lg">{template.icon}</span>
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm text-white">{template.label}</div>
          <div className="text-xs font-medium uppercase tracking-wide text-white/60">
            {template.category}
          </div>
        </div>
      </div>
      
      <p className="text-sm text-white/70 leading-relaxed mb-2">
        {template.description}
      </p>

      <div className="flex items-center justify-between text-xs">
        <span className="text-white/50">Click to add or drag</span>
        <div className="w-2 h-2 bg-current opacity-40 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
