import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { WorkflowNodeData} from '@/lib/mockdata';
import { useDragContext } from '@/provider/dragprovider';

export interface EnhancedWorkflowNodeData extends WorkflowNodeData {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  configuration: Record<string, any>;
  executionState?: 'idle' | 'running' | 'success' | 'error';
  lastExecuted?: Date;
  errors?: string[];
}

export interface EnhancedNode extends Node<EnhancedWorkflowNodeData> {
  data: EnhancedWorkflowNodeData;
}

export interface WorkflowExecutionData {
  nodes: Array<{
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inputs: any;
    id: string;
    type: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    configuration: Record<string, any>;
    position: { x: number; y: number };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;
  metadata: {
    name: string;
    description: string;
    version: string;
    created: Date;
    lastModified: Date;
  };
}

interface WorkflowContextType {
  enhancedNodes: EnhancedNode[];
  setEnhancedNodes: (nodes: EnhancedNode[]) => void;
  selectedNodeId: string | null;
  selectedNode: EnhancedNode | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateNodeConfiguration: (nodeId: string, configuration: Record<string, any>) => void;
  updateNodeData: (nodeId: string, updates: Partial<EnhancedWorkflowNodeData>) => void;
  
  getWorkflowExecutionData: () => WorkflowExecutionData;
  loadWorkflow: (data: WorkflowExecutionData) => void;
  
  validateWorkflow: () => { isValid: boolean; errors: string[] };
  
  workflowMetadata: WorkflowExecutionData['metadata'];
  updateWorkflowMetadata: (metadata: Partial<WorkflowExecutionData['metadata']>) => void;
}

const WorkflowContext = createContext<WorkflowContextType | null>(null);

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { nodes, setNodes, edges, selectedNodes } = useDragContext();
  
  const [enhancedNodes, setEnhancedNodes] = useState<EnhancedNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [workflowMetadata, setWorkflowMetadata] = useState<WorkflowExecutionData['metadata']>({
    name: 'Untitled Workflow',
    description: '',
    version: '1.0.0',
    created: new Date(),
    lastModified: new Date(),
  });

  console.log('WorkflowProvider state:', {
    nodesCount: nodes?.length || 0,
    enhancedNodesCount: enhancedNodes.length,
    selectedNodesCount: selectedNodes?.length || 0,
    selectedNodeId,
    selectedNodeIds: selectedNodes?.map(n => n.id) || []
  });



  useEffect(() => {
    console.log('Selected nodes changed in workflow context:', selectedNodes?.map(n => n.id) || []);
    
    if (selectedNodes && selectedNodes.length === 1) {
      const selectedId = selectedNodes[0].id;
      console.log('Setting selected node ID to:', selectedId);
      setSelectedNodeId(selectedId);
    } else {
      console.log('Clearing selected node ID');
      setSelectedNodeId(null);
    }
  }, [selectedNodes]);

  const selectedNode = selectedNodeId 
    ? enhancedNodes.find(n => n.id === selectedNodeId) || null 
    : null;

  console.log('Selected node:', selectedNode ? { id: selectedNode.id, label: selectedNode.data.label } : 'none');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateNodeConfiguration = useCallback((nodeId: string, configuration: Record<string, any>) => {
    console.log('Updating node configuration:', { nodeId, configuration });
    
    setEnhancedNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                configuration,
              },
            }
          : node
      )
    );

    if (setNodes && nodes) {
      setNodes(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nodes.map((node: any) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  config: configuration,
                },
              }
            : node
        )
      );
    }

    setWorkflowMetadata(prev => ({ ...prev, lastModified: new Date() }));
  }, [setNodes, nodes]);

  const updateNodeData = useCallback((nodeId: string, updates: Partial<EnhancedWorkflowNodeData>) => {
    console.log('Updating node data:', { nodeId, updates });
    
    setEnhancedNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...updates,
              },
            }
          : node
      )
    );

    if (setNodes && nodes) {
      setNodes(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nodes.map((node: any) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  ...updates,
                },
              }
            : node
        )
      );
    }

    setWorkflowMetadata(prev => ({ ...prev, lastModified: new Date() }));
  }, [setNodes, nodes]);

  const getWorkflowExecutionData = useCallback((): WorkflowExecutionData => {
    const user = {
      nodes: enhancedNodes.map(node => ({
        id: node.id,
        type: node.data.nodeType,
        configuration: node.data.configuration,
        position: node.position,
        inputs: node.data.inputs || [], 
      })),
      edges: (edges || []).map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle ?? undefined,
        targetHandle: edge.targetHandle ?? undefined,
      })),
      metadata: workflowMetadata,
    };
  
    console.log(user);
    return user;
  
  }, [enhancedNodes, edges, workflowMetadata]);

  const loadWorkflow = useCallback((data: WorkflowExecutionData) => {
    const loadedNodes: EnhancedNode[] = data.nodes.map(nodeData => ({
      id: nodeData.id,
      type: 'workflowNode',
      position: nodeData.position,
      data: {
        id: nodeData.id,
        label: nodeData.type,
        nodeType: nodeData.type,
        icon: '🔧',
        description: '',
        configuration: nodeData.configuration,
        executionState: 'idle',
      },
    }));

    setEnhancedNodes(loadedNodes);
    setWorkflowMetadata(data.metadata);
  }, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
      if (nodes && nodes.length >= 0) {
        const enhanced = nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            configuration: node.data.config || {},
            executionState: 'idle' as const,
          }
        })) as EnhancedNode[];
        
        console.log('Syncing enhanced nodes:', enhanced.map(n => ({ id: n.id, label: n.data.label })));
        setEnhancedNodes(enhanced);
      }
      getWorkflowExecutionData();
    }, [nodes]);
// eslint-disable-next-line react-hooks/exhaustive-deps
  const validateWorkflow = useCallback((): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    const triggerNodes = enhancedNodes.filter(node => node.data.nodeType === 'trigger');
    if (triggerNodes.length === 0) {
      errors.push('Workflow must have at least one trigger node');
    }
    getWorkflowExecutionData();
    return {
      isValid: errors.length === 0,
      errors,
    };

  }, [enhancedNodes]);

  const updateWorkflowMetadata = useCallback((updates: Partial<WorkflowExecutionData['metadata']>) => {
    setWorkflowMetadata(prev => ({
      ...prev,
      ...updates,
      lastModified: new Date(),
    }));
  }, []);

  const contextValue: WorkflowContextType = {
   enhancedNodes,
   setEnhancedNodes,
   selectedNodeId,
   selectedNode,
   updateNodeConfiguration,
   updateNodeData,
   getWorkflowExecutionData,
   loadWorkflow,
   validateWorkflow,
   workflowMetadata,
   updateWorkflowMetadata,
  };

  return (
    <WorkflowContext.Provider value={contextValue}>
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = (): WorkflowContextType => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};