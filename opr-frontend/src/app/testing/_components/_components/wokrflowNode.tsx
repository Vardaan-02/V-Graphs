import { useState } from "react";
import { CustomNode } from "../drop-zone";
import { Handle, Position } from "@xyflow/react";
import { EyeOff, Settings } from "lucide-react";

export default function WorkflowNode({ 
  data,
  selected,
  dragging 
}: {
  data: CustomNode['data'],
  selected?: boolean;
  dragging?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const getNodeColors = () => {
    switch (data.nodeType) {
      case 'trigger':
        return {
          bg: 'bg-black/60',
          border: 'border-cyan-400/30',
          icon: 'text-cyan-400',
          iconBg: 'bg-cyan-400/10'
        };
      case 'condition':
        return {
          bg: 'bg-black/60',
          border: 'border-white/20',
          icon: 'text-white',
          iconBg: 'bg-white/10'
        };
      case 'action':
        return {
          bg: 'bg-black/60',
          border: 'border-white/10',
          icon: 'text-white/90',
          iconBg: 'bg-white/5'
        };
      default:
        return {
          bg: 'bg-black/60',
          border: 'border-cyan-400/30',
          icon: 'text-cyan-400',
          iconBg: 'bg-cyan-400/10'
        };
    }
  };

  const colors = getNodeColors();

  if (!isExpanded) {
    return (
      <div
        className={`
          w-12 h-12 ${colors.bg} ${colors.border} border-2 backdrop-blur-xl
          flex items-center justify-center cursor-pointer
          transition-all duration-200 hover:scale-110
          ${selected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-black' : ''}
          ${dragging ? 'rotate-6 scale-110' : ''}
          relative group
        `}
        onClick={() => setIsExpanded(true)}
      >
        <div className={`text-xl ${colors.icon}`}>
          {data.icon}
        </div>
        
        {data.inputs?.map((input, index) => (
          <Handle
            key={`input-${index}`}
            type="target"
            position={Position.Left}
            id={input.id}
            className={`
              w-2 h-2 border border-black opacity-0 group-hover:opacity-100
              ${input.required ? 'bg-white' : 'bg-cyan-400'}
              transition-opacity duration-200
            `}
            style={{ top: `${20 + index * 16}px`, left: '-4px' }}
          />
        ))}

        {data.outputs?.map((output, index) => (
          <Handle
            key={`output-${index}`}
            type="source"
            position={Position.Right}
            id={output.id}
            className="w-2 h-2 bg-white border border-black opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ top: `${20 + index * 16}px`, right: '-4px' }}
          />
        ))}

        {selected && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 animate-pulse" />
        )}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 backdrop-blur-xl border border-white/10 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
          {data.label}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-black/80 backdrop-blur-xl border-2 ${colors.border} shadow-lg min-w-[280px] max-w-[320px]
        transition-all duration-300 relative text-white
        ${selected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-black' : ''}
        ${dragging ? 'rotate-1 scale-105' : ''}
      `}
    >
      {data.inputs?.map((input, index) => (
        <Handle
          key={`input-${index}`}
          type="target"
          position={Position.Left}
          id={input.id}
          className={`
            w-3 h-3 border-2 border-black transition-all duration-200
            ${input.required ? 'bg-white' : 'bg-cyan-400'}
            hover:scale-125
          `}
          style={{ top: `${40 + index * 32}px` }}
        />
      ))}

      <div className={`p-4 ${colors.bg} backdrop-blur-sm border-b border-white/10`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`
              flex items-center justify-center w-10 h-10 ${colors.iconBg} backdrop-blur-sm border border-white/10
            `}>
              <span className={`text-lg ${colors.icon}`}>{data.icon}</span>
            </div>
            <div>
              <div className="font-semibold text-sm text-white">{data.label}</div>
              <div className="text-xs text-white/60 capitalize">{data.nodeType}</div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`
                p-2 transition-colors backdrop-blur-sm border border-white/10
                ${showConfig ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30' : 'hover:bg-white/5 text-white/60 hover:text-white'}
              `}
              title="Toggle Configuration"
            >
              {showConfig ? <EyeOff className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 hover:bg-white/5 text-white/60 hover:text-white transition-colors backdrop-blur-sm border border-white/10"
              title="Minimize"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="text-sm text-white/70 mb-3 leading-relaxed">
          {data.description}
        </div>

        <div className="space-y-2 text-xs">
          {data.inputs && data.inputs.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-white/50">Inputs:</span>
              <div className="flex space-x-1">
                {data.inputs.map((input, index) => (
                  <span
                    key={index}
                    className={`px-2 py-1 text-xs backdrop-blur-sm border ${
                      input.required ? 'bg-white/10 text-white border-white/20' : 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20'
                    }`}
                  >
                    {input.label}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {data.outputs && data.outputs.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-white/50">Outputs:</span>
              <div className="flex space-x-1">
                {data.outputs.map((output, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-white/10 text-white border border-white/20 backdrop-blur-sm"
                  >
                    {output.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {showConfig && data.config && (
          <div className="mt-4 p-3 bg-black/40 backdrop-blur-sm border border-white/10">
            <div className="font-medium text-white/80 mb-2 text-sm">Configuration</div>
            <pre className="text-xs text-white/70 whitespace-pre-wrap max-h-32 overflow-y-auto">
              {JSON.stringify(data.config, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {data.outputs?.map((output, index) => (
        <Handle
          key={`output-${index}`}
          type="source"
          position={Position.Right}
          id={output.id}
          className="w-3 h-3 bg-white border-2 border-black hover:scale-125 transition-all duration-200"
          style={{ top: `${40 + index * 32}px` }}
        />
      ))}

      {selected && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 animate-pulse" />
      )}
    </div>
  );
}
