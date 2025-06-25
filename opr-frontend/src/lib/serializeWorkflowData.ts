import type { WorkflowExecutionData } from '@/provider/statecontext';

export function serializeWorkflowForBackend(data: WorkflowExecutionData) {
  return {
    nodes: data.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      data: node.configuration, 
    })),
    edges: data.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target
    })),
  };
}
