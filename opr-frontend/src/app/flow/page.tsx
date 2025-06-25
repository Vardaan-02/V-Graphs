"use client";
import { DragProvider } from "@/provider/dragprovider";
import { WorkflowProvider} from "@/provider/statecontext";
import NodePalette from "../testing/_components/node-pallete";
import { PropertiesPanel } from "../testing/_components/properties";
import Sidebar from "./sidebar";
import CanvasDropZone from "../testing/_components/drop-zone";
import { SidebarProvider } from "@/provider/sidebarContext";
import { UserProvider } from "@/provider/userprovider";

export default function FlowPage() {
  return (
    <UserProvider> 
      <SidebarProvider>
        <DragProvider>
              <WorkflowProvider>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            
                <div className="overflow-hidden h-screen bg-background flex">
                  <CanvasDropZone />
                  <NodePalette />
                  <PropertiesPanel />
                </div>
             
          </div>
        </div>
         </WorkflowProvider>
            </DragProvider>
      </SidebarProvider>
    </UserProvider>
  );
}



/*
USAGE INSTRUCTIONS:

2. For backend integration, use the workflow data:

   import { useWorkflow } from './enhanced-flow-page';
   
   function MyComponent() {
     const { getWorkflowExecutionData, loadWorkflow } = useWorkflow();
     
     const saveToBackend = async () => {
       const workflowData = getWorkflowExecutionData();
       await fetch('/api/workflows', {
         method: 'POST',
         body: JSON.stringify(workflowData),
         headers: { 'Content-Type': 'application/json' }
       });
     };
     
     const loadFromBackend = async (workflowId: string) => {
       const response = await fetch(`/api/workflows/${workflowId}`);
       const workflowData = await response.json();
       loadWorkflow(workflowData);
     };
   }

3. The workflow execution data structure sent to backend:
   {
     nodes: [
       {
         id: "node-1",
         type: "trigger",
         configuration: { url: "https://api.example.com", method: "POST" },
         position: { x: 100, y: 200 }
       }
     ],
     edges: [
       {
         id: "edge-1",
         source: "node-1",
         target: "node-2",
         sourceHandle: "output",
         targetHandle: "input"
       }
     ],
     metadata: {
       name: "My Workflow",
       description: "Example workflow",
       version: "1.0.0",
       created: "2024-01-01T00:00:00Z",
       lastModified: "2024-01-01T00:00:00Z"
     }
   }

4. Key improvements:
   - Proper state management for node configurations
   - Real-time property editing with validation
   - Backend-ready data structure
   - Execution state tracking
   - Workflow validation
   - Better visual feedback
   - Enhanced node components with execution states
*/


