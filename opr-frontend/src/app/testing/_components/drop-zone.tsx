
import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Node,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  SelectionMode,
  OnSelectionChangeParams,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NodeTemplate, nodeTemplates, WorkflowNodeData } from '@/lib/mockdata';
import WorkflowNode from './_components/wokrflowNode';
import { useDragContext } from '@/provider/dragprovider';

export type CustomNode = Node<WorkflowNodeData> 

const nodeTypes = {
  workflowNode: WorkflowNode,
};

const WorkflowCanvas = () => {
  const { 
    useProject, 
    nodes, 
    setNodes, 
    onEdgesChange, 
    onNodesChange, 
    edges, 
    nodeIdCounter, 
    setNodeIdCounter, 
    isDragOver, 
    setIsDragOver, 
    dropPosition, 
    setDropPosition, 
    onConnect, 
    onNodesDelete,
    onSelectionChange,
    setSelectedNodes,
  } = useDragContext();
  
  const project = useProject()
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  console.log('WorkflowCanvas render:', {
    nodesCount: nodes?.length || 0,
    onSelectionChange: !!onSelectionChange
  });

  const screenToFlowPosition = useCallback(
    ({ x, y }: { x: number; y: number }) => {
      if (!reactFlowWrapper.current) return { x, y };
      const rect = reactFlowWrapper.current.getBoundingClientRect();
      return project({
        x: x - rect.left,
        y: y - rect.top,
      });
    },
    [project]
  );
  
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (setIsDragOver) {
      setIsDragOver(true);
    }
    if (reactFlowWrapper.current) {
      const rect = reactFlowWrapper.current.getBoundingClientRect();
      if (setDropPosition) {
        setDropPosition({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        });
      }
    }
  }, [setIsDragOver, setDropPosition]);

  const onDragLeave = useCallback((event: React.DragEvent) => {
    if (!reactFlowWrapper.current?.contains(event.relatedTarget as Element | null)) {
      if (setIsDragOver) {
        setIsDragOver(false);
      }
      if (setDropPosition) {
        setDropPosition(null);
      }
    }
  }, [setIsDragOver, setDropPosition]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (setIsDragOver) {
        setIsDragOver(false);
      }
      if (setDropPosition) {
        setDropPosition(null);
      }

      if (!reactFlowWrapper.current) return;

      const templateData = event.dataTransfer.getData('application/reactflow');
      if (!templateData) return;

      try {
        const template: NodeTemplate = JSON.parse(templateData);
        const foundTemplate = nodeTemplates.find(t => t.type === template.type);
        if (!foundTemplate) {
          console.error('Template not found for type:', template.type);
          return;
        }
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const newNode: Node<WorkflowNodeData> = {
          id: `node-${nodeIdCounter}`,
          type: 'workflowNode',
          position,
          data: {
            id: `node-${nodeIdCounter}`,
            label: foundTemplate.label,
            nodeType: foundTemplate.type,
            icon: foundTemplate.icon,
            config: foundTemplate.defaultConfig,
            inputs: foundTemplate.inputs,
            outputs: foundTemplate.outputs,
            description: foundTemplate.description,
          },
        };

        console.log('Adding new node:', newNode);

        if (setNodes) {
          setNodes([...(nodes ?? []), newNode]);
        }
        if (setNodeIdCounter) {
          setNodeIdCounter((nodeIdCounter ?? 0) + 1);
        }
      } catch (error) {
        console.error('Error parsing dropped data:', error);
      }
    },
    [screenToFlowPosition, nodeIdCounter, setNodes, nodes, setNodeIdCounter, setIsDragOver, setDropPosition]
  );
const handleSelectionChange = useCallback((params: OnSelectionChangeParams) => {
  console.log('🔥 ReactFlow Selection changed:', params);
  console.log('🔥 Selected node IDs:', params.nodes.map(n => n.id));
  
  if (onSelectionChange) {
    onSelectionChange(params);
  }
  
  if (setSelectedNodes) {
    setSelectedNodes(params.nodes as Node<WorkflowNodeData>[]);
  }
}, [onSelectionChange, setSelectedNodes]);
  return (
    <div className="h-screen w-full relative bg-black">
      <div 
        className="w-full h-full" 
        ref={reactFlowWrapper}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          onSelectionChange={handleSelectionChange}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
          minZoom={0.2}
          maxZoom={2}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#06b6d4', strokeWidth: 2 },
          }}
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode={['Meta', 'Ctrl']}
          panOnScroll
          selectionOnDrag
          selectionMode={SelectionMode.Partial}
        >
          <Background
            color="#1f2937"
            gap={20}
            size={1}
            variant={BackgroundVariant.Dots}
          />
          <Controls
            showInteractive={false}
            showZoom={false}
            className="bg-black/80 backdrop-blur-xl border border-white/10 shadow-xl [&>button]:bg-black/60 [&>button]:border-white/10 [&>button]:text-white/60 [&>button:hover]:bg-black/80 [&>button:hover]:text-white [&>button:hover]:border-cyan-400/50"
          />
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="bg-black/80 backdrop-blur-xl border border-white/10 shadow-xl"
            style={{
              backgroundColor: '#000000',
            }}
          />
        </ReactFlow>
        
        {isDragOver && (
          <div className="absolute inset-0 bg-cyan-400/10 border-4 border-dashed border-cyan-400 pointer-events-none z-10">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/90 backdrop-blur-xl border border-cyan-400/50 px-8 py-4 shadow-2xl">
                <div className="text-cyan-400 font-semibold text-lg">Drop node here to add to workflow</div>
              </div>
            </div>
            {dropPosition && (
              <div 
                className="absolute w-6 h-6 bg-cyan-400 animate-pulse shadow-lg shadow-cyan-400/50"
                style={{
                  left: dropPosition.x - 12,
                  top: dropPosition.y - 12,
                }}
              />
            )}
          </div>
        )}

        {(nodes?.length === 0) && !isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center space-y-6">
              <div className="text-8xl opacity-20">🎯</div>
              <div className="space-y-2">
                <div className="text-2xl font-semibold text-white">
                  Start Building Your Workflow
                </div>
                <div className="text-white/60 max-w-md mx-auto leading-relaxed">
                  Add nodes from the palette to create powerful automated workflows. 
                  Connect them together to build complex logic flows.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CanvasDropZone: React.FC = () => {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas />
    </ReactFlowProvider>
  );
};

export default CanvasDropZone;