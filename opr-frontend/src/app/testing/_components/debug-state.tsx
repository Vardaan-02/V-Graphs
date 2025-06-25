
import { useDragContext } from "@/provider/dragprovider";
import { useWorkflow } from "@/provider/statecontext";

export const SimpleDebug = () => {
  const dragContext = useDragContext();
  const workflowContext = useWorkflow();

  return (
    <div className="fixed top-4 right-4 bg-red-900/90 text-white p-4 rounded border z-50 text-xs max-w-sm">
      <h3 className="font-bold mb-2 text-red-300">DEBUG INFO</h3>
      
      <div className="space-y-2">
        <div className="border-b border-red-700 pb-2">
          <div className="font-semibold text-yellow-300">Drag Context:</div>
          <div>Nodes: {dragContext.nodes?.length || 0}</div>
          <div>Selected Nodes: {dragContext.selectedNodes?.length || 0}</div>
          <div>Selected IDs: {dragContext.selectedNodes?.map(n => n.id).join(', ') || 'none'}</div>
        </div>
        
        <div className="border-b border-red-700 pb-2">
          <div className="font-semibold text-green-300">Workflow Context:</div>
          <div>Enhanced Nodes: {workflowContext.enhancedNodes?.length || 0}</div>
          <div>Selected Node ID: {workflowContext.selectedNodeId || 'none'}</div>
          <div>Selected Node: {workflowContext.selectedNode?.data.label || 'none'}</div>
        </div>
        
        <div>
          <div className="font-semibold text-blue-300">Selection Status:</div>
          <div className={`text-sm ${
            dragContext.selectedNodes?.length === (workflowContext.selectedNodeId ? 1 : 0) 
              ? 'text-green-400' : 'text-red-400'
          }`}>
            {dragContext.selectedNodes?.length === (workflowContext.selectedNodeId ? 1 : 0) 
              ? '✓ SYNCED' : '✗ NOT SYNCED'}
          </div>
        </div>
      </div>
      
      <button
        onClick={() => {
          console.log('=== FULL DEBUG ===');
          console.log('Drag nodes:', dragContext.nodes?.map(n => ({ id: n.id, label: n.data.label })));
          console.log('Selected nodes:', dragContext.selectedNodes?.map(n => ({ id: n.id, label: n.data.label })));
          console.log('Enhanced nodes:', workflowContext.enhancedNodes?.map(n => ({ id: n.id, label: n.data.label })));
          console.log('Selected node ID:', workflowContext.selectedNodeId);
          console.log('Selected node:', workflowContext.selectedNode);
        }}
        className="mt-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
      >
        Log to Console
      </button>
    </div>
  );
};