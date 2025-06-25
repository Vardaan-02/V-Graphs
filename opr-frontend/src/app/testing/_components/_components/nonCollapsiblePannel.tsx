import { useDragContext } from "@/provider/dragprovider";
import { Settings, X } from "lucide-react";
import NodeTemplateCard from "./nodeTemplateCard";

export default function NodePalettePanel({ isOpen, onClose }: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    selectedCategory,
    setSelectedCategory,
    draggedItem,
    clickedItem,
    categories,
    filteredTemplates,
    handleDragStart,
    handleClick
  } = useDragContext();

  if (!isOpen) return null;

  return (
    <>
      <div
        className="inset-0 bg-black/60  backdrop-blur-sm z-40 transition-opacity duration-300 "
        onClick={onClose}
      />

      <div className={`
        fixed right-6 top-24 bottom-6 w-96 bg-black/70 backdrop-blur-2xl shadow-xl z-50
        border border-white/10 rounded-2xl overflow-y-auto
        transform transition-all duration-300 ease-out
        ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}
      `}>
        <div className="p-6 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-400/30 to-white/10 border border-white/10 flex items-center justify-center shadow-inner">
                <Settings className="w-5 h-5 text-cyan-300" />
              </div>
              <h2 className="font-semibold text-xl text-white">Node Library</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/60">Categories</label>
            <div className="flex flex-wrap gap-2">
              {(categories ?? []).map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory?.(category)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 backdrop-blur-md
                    ${selectedCategory === category
                      ? 'bg-white text-black shadow-md'
                      : 'bg-black/30 text-white/70 border border-white/20 hover:bg-white/10 hover:border-white/30 hover:text-white'
                    }
                  `}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-black/10">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-white/60 mb-4">
              <span className="font-medium">
                {filteredTemplates?.length} available nodes
                {selectedCategory !== 'All' && ` in ${selectedCategory}`}
              </span>
              <div className="flex items-center space-x-2 text-xs bg-black/30 px-3 py-1 border border-white/10 rounded-full">
                <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                <span className="text-white/70">Drag or Click</span>
              </div>
            </div>

            <div className="space-y-3">
              {(filteredTemplates ?? []).map(template => (
                <NodeTemplateCard
                  key={template.type}
                  template={template}
                  onDragStart={handleDragStart ?? (() => {})}
                  onClick={handleClick ?? (() => {})}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 bg-gradient-to-t from-white/5 to-transparent rounded-b-2xl">
          <div className="space-y-3">
            <div className="font-medium text-white text-sm">Activity Status</div>
            {draggedItem && (
              <div className="text-cyan-300 flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-cyan-400 animate-pulse rounded-full" />
                <span>Dragging: {draggedItem.label}</span>
              </div>
            )}
            {clickedItem && (
              <div className="text-white flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-white rounded-full" />
                <span>Selected: {clickedItem.label}</span>
              </div>
            )}
            {!draggedItem && !clickedItem && (
              <div className="text-white/50 flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-white/40 rounded-full" />
                <span>Ready to add nodes to workflow</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
