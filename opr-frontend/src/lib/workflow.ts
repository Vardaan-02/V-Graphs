// import { WorkflowExecutionData } from "@/provider/statecontext";

// // API Client for Workflow Backend Integration
// export class WorkflowApiClient {
//   private baseUrl: string;
//   private token?: string;

//   constructor(baseUrl: string = '/api', token?: string) {
//     this.baseUrl = baseUrl;
//     this.token = token;
//   }

//   private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
//     const url = `${this.baseUrl}${endpoint}`;
//     const headers: Record<string, string> = {
//       'Content-Type': 'application/json',
//       ...(options.headers as Record<string, string>),
//     };

//     if (this.token) {
//       headers['Authorization'] = `Bearer ${this.token}`;
//     }

//     const response = await fetch(url, {
//       ...options,
//       headers,
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//     }

//     return response.json();
//   }

//   // Workflow CRUD operations
//   async saveWorkflow(workflow: WorkflowExecutionData): Promise<{ id: string; success: boolean }> {
//     return this.request('/workflows', {
//       method: 'POST',
//       body: JSON.stringify(workflow),
//     });
//   }

//   async loadWorkflow(id: string): Promise<WorkflowExecutionData> {
//     return this.request(`/workflows/${id}`);
//   }

//   async updateWorkflow(id: string, workflow: WorkflowExecutionData): Promise<{ success: boolean }> {
//     return this.request(`/workflows/${id}`, {
//       method: 'PUT',
//       body: JSON.stringify(workflow),
//     });
//   }

//   async deleteWorkflow(id: string): Promise<{ success: boolean }> {
//     return this.request(`/workflows/${id}`, {
//       method: 'DELETE',
//     });
//   }

//   async listWorkflows(): Promise<Array<{ id: string; name: string; lastModified: string }>> {
//     return this.request('/workflows');
//   }

//   // Workflow execution
//   async executeWorkflow(id: string, input?: Record<string, any>): Promise<{
//     executionId: string;
//     status: 'running' | 'completed' | 'failed';
//     result?: any;
//     error?: string;
//   }> {
//     return this.request(`/workflows/${id}/execute`, {
//       method: 'POST',
//       body: JSON.stringify({ input }),
//     });
//   }

//   async getExecutionStatus(executionId: string): Promise<{
//     status: 'running' | 'completed' | 'failed';
//     progress?: number;
//     result?: any;
//     error?: string;
//     logs?: Array<{ timestamp: string; level: string; message: string; nodeId?: string }>;
//   }> {
//     return this.request(`/executions/${executionId}`);
//   }

//   // Workflow validation
//   async validateWorkflow(workflow: WorkflowExecutionData): Promise<{
//     isValid: boolean;
//     errors: Array<{ nodeId?: string; message: string; severity: 'error' | 'warning' }>;
//   }> {
//     return this.request('/workflows/validate', {
//       method: 'POST',
//       body: JSON.stringify(workflow),
//     });
//   }
// }

// // Workflow Validation Utilities
// export class WorkflowValidator {
//   static validateWorkflowStructure(workflow: WorkflowExecutionData): {
//     isValid: boolean;
//     errors: Array<{ nodeId?: string; message: string; severity: 'error' | 'warning' }>;
//   } {
//     const errors: Array<{ nodeId?: string; message: string; severity: 'error' | 'warning' }> = [];

//     // Check for trigger nodes
//     const triggerNodes = workflow.nodes.filter(node => node.type === 'trigger');
//     if (triggerNodes.length === 0) {
//       errors.push({
//         message: 'Workflow must have at least one trigger node',
//         severity: 'error',
//       });
//     }

//     // Check for orphaned nodes
//     const edgeTargets = new Set(workflow.edges.map(edge => edge.target));
//     const orphanedNodes = workflow.nodes.filter(
//       node => node.type !== 'trigger' && !edgeTargets.has(node.id)
//     );
    
//     orphanedNodes.forEach(node => {
//       errors.push({
//         nodeId: node.id,
//         message: `Node "${node.id}" is orphaned and will never execute`,
//         severity: 'warning',
//       });
//     });

//     // Check for cycles
//     const cycles = this.detectCycles(workflow.nodes, workflow.edges);
//     cycles.forEach(cycle => {
//       errors.push({
//         message: `Detected cycle in workflow: ${cycle.join(' -> ')}`,
//         severity: 'error',
//       });
//     });

//     // Check for missing required configurations
//     workflow.nodes.forEach(node => {
//       const missingConfigs = this.validateNodeConfiguration(node);
//       missingConfigs.forEach(config => {
//         errors.push({
//           nodeId: node.id,
//           message: `Missing required configuration: ${config}`,
//           severity: 'error',
//         });
//       });
//     });

//     return {
//       isValid: errors.filter(e => e.severity === 'error').length === 0,
//       errors,
//     };
//   }

//   private static detectCycles(
//     nodes: WorkflowExecutionData['nodes'],
//     edges: WorkflowExecutionData['edges']
//   ): string[][] {
//     const visited = new Set<string>();
//     const recursionStack = new Set<string>();
//     const cycles: string[][] = [];

//     const adjacencyList = new Map<string, string[]>();
//     nodes.forEach(node => {
//       adjacencyList.set(node.id, []);
//     });

//     edges.forEach(edge => {
//       const targets = adjacencyList.get(edge.source) || [];
//       targets.push(edge.target);
//       adjacencyList.set(edge.source, targets);
//     });

//     const dfs = (nodeId: string, path: string[]): boolean => {
//       visited.add(nodeId);
//       recursionStack.add(nodeId);
//       path.push(nodeId);

//       const neighbors = adjacencyList.get(nodeId) || [];
//       for (const neighbor of neighbors) {
//         if (!visited.has(neighbor)) {
//           if (dfs(neighbor, [...path])) {
//             return true;
//           }
//         } else if (recursionStack.has(neighbor)) {
//           const cycleStart = path.indexOf(neighbor);
//           cycles.push([...path.slice(cycleStart), neighbor]);
//           return true;
//         }
//       }

//       recursionStack.delete(nodeId);
//       return false;
//     };

//     nodes.forEach(node => {
//       if (!visited.has(node.id)) {
//         dfs(node.id, []);
//       }
//     });

//     return cycles;
//   }

//   private static validateNodeConfiguration(node: WorkflowExecutionData['nodes'][0]): string[] {
//     const missing: string[] = [];
    
//     // Define required configurations for each node type
//     const requiredConfigs: Record<string, string[]> = {
//       'webhook': ['url'],
//       'email': ['to', 'subject'],
//       'http-request': ['url', 'method'],
//       'database-query': ['connection', 'query'],
//       'filter': ['condition'],
//       'transform': ['mapping'],
//     };

//     const required = requiredConfigs[node.type] || [];
//     required.forEach(configKey => {
//       if (!node.configuration[configKey] || 
//           node.configuration[configKey] === '' ||
//           node.configuration[configKey] === null ||
//           node.configuration[configKey] === undefined) {
//         missing.push(configKey);
//       }
//     });

//     return missing;
//   }
// }

// // Workflow Export/Import Utilities
// export class WorkflowSerializer {
//   static exportWorkflow(workflow: WorkflowExecutionData): string {
//     return JSON.stringify(workflow, null, 2);
//   }

//   static importWorkflow(data: string): WorkflowExecutionData {
//     try {
//       const workflow = JSON.parse(data);
//       this.validateImportedWorkflow(workflow);
//       return workflow;
//     } catch (error) {
//       throw new Error(`Invalid workflow format: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }
//   }

//   static exportToFile(workflow: WorkflowExecutionData, filename?: string): void {
//     const data = this.exportWorkflow(workflow);
//     const blob = new Blob([data], { type: 'application/json' });
//     const url = URL.createObjectURL(blob);
    
//     const link = document.createElement('a');
//     link.href = url;
//     link.download = filename || `${workflow.metadata.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
    
//     URL.revokeObjectURL(url);
//   }

//   static async importFromFile(): Promise<WorkflowExecutionData> {
//     return new Promise((resolve, reject) => {
//       const input = document.createElement('input');
//       input.type = 'file';
//       input.accept = '.json';
      
//       input.onchange = (event) => {
//         const file = (event.target as HTMLInputElement).files?.[0];
//         if (!file) {
//           reject(new Error('No file selected'));
//           return;
//         }
        
//         const reader = new FileReader();
//         reader.onload = (e) => {
//           try {
//             const data = e.target?.result as string;
//             const workflow = this.importWorkflow(data);
//             resolve(workflow);
//           } catch (error) {
//             reject(error);
//           }
//         };
//         reader.onerror = () => reject(new Error('Failed to read file'));
//         reader.readAsText(file);
//       };
      
//       input.click();
//     });
//   }

//   private static validateImportedWorkflow(workflow: any): void {
//     if (!workflow || typeof workflow !== 'object') {
//       throw new Error('Workflow must be an object');
//     }

//     if (!Array.isArray(workflow.nodes)) {
//       throw new Error('Workflow must have a nodes array');
//     }

//     if (!Array.isArray(workflow.edges)) {
//       throw new Error('Workflow must have an edges array');
//     }

//     if (!workflow.metadata || typeof workflow.metadata !== 'object') {
//       throw new Error('Workflow must have metadata');
//     }

//     // Validate required metadata fields
//     const requiredMetadataFields = ['name', 'version', 'created', 'lastModified'];
//     requiredMetadataFields.forEach(field => {
//       if (!workflow.metadata[field]) {
//         throw new Error(`Workflow metadata must include ${field}`);
//       }
//     });

//     // Validate node structure
//     workflow.nodes.forEach((node: any, index: number) => {
//       if (!node.id || !node.type || !node.configuration || !node.position) {
//         throw new Error(`Invalid node structure at index ${index}`);
//       }
//     });

//     // Validate edge structure
//     workflow.edges.forEach((edge: any, index: number) => {
//       if (!edge.id || !edge.source || !edge.target) {
//         throw new Error(`Invalid edge structure at index ${index}`);
//       }
//     });
//   }
// }

// // Workflow Execution Mock (for testing)
// export class WorkflowExecutionMock {
//   static async simulateExecution(
//     workflow: WorkflowExecutionData,
//     onProgress?: (nodeId: string, status: 'running' | 'success' | 'error', result?: any) => void
//   ): Promise<{ success: boolean; results: Record<string, any>; errors: string[] }> {
//     const results: Record<string, any> = {};
//     const errors: string[] = [];

//     // Simulate execution order based on dependencies
//     const executionOrder = this.getExecutionOrder(workflow);
    
//     for (const nodeId of executionOrder) {
//       const node = workflow.nodes.find(n => n.id === nodeId);
//       if (!node) continue;

//       onProgress?.(nodeId, 'running');
      
//       // Simulate processing time
//       await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

//       try {
//         const result = await this.simulateNodeExecution(node);
//         results[nodeId] = result;
//         onProgress?.(nodeId, 'success', result);
//       } catch (error) {
//         const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//         errors.push(`Node ${nodeId}: ${errorMessage}`);
//         onProgress?.(nodeId, 'error');
//       }
//     }

//     return {
//       success: errors.length === 0,
//       results,
//       errors,
//     };
//   }

//   private static getExecutionOrder(workflow: WorkflowExecutionData): string[] {
//     const order: string[] = [];
//     const visited = new Set<string>();
//     const adjacencyList = new Map<string, string[]>();

//     // Build adjacency list
//     workflow.nodes.forEach(node => {
//       adjacencyList.set(node.id, []);
//     });

//     workflow.edges.forEach(edge => {
//       const targets = adjacencyList.get(edge.source) || [];
//       targets.push(edge.target);
//       adjacencyList.set(edge.source, targets);
//     });

//     // Start with trigger nodes
//     const triggerNodes = workflow.nodes.filter(node => node.type === 'trigger');
    
//     const dfs = (nodeId: string) => {
//       if (visited.has(nodeId)) return;
//       visited.add(nodeId);
      
//       const dependencies = workflow.edges
//         .filter(edge => edge.target === nodeId)
//         .map(edge => edge.source);
      
//       dependencies.forEach(depId => {
//         if (!visited.has(depId)) {
//           dfs(depId);
//         }
//       });
      
//       order.push(nodeId);
//     };

//     triggerNodes.forEach(node => dfs(node.id));

//     return order;
//   }

//   private static async simulateNodeExecution(node: WorkflowExecutionData['nodes'][0]): Promise<any> {
//     // Simulate different node types
//     switch (node.type) {
//       case 'webhook':
//         return { 
//           timestamp: new Date().toISOString(),
//           data: { message: 'Webhook triggered successfully' }
//         };
      
//       case 'email':
//         if (!node.configuration.to) {
//           throw new Error('Email recipient is required');
//         }
//         return { 
//           sent: true, 
//           to: node.configuration.to,
//           messageId: `msg_${Date.now()}`
//         };
      
//       case 'http-request':
//         if (!node.configuration.url) {
//           throw new Error('URL is required');
//         }
//         return { 
//           status: 200, 
//           data: { success: true },
//           url: node.configuration.url
//         };
      
//       case 'filter':
//         return { 
//           passed: Math.random() > 0.5,
//           condition: node.configuration.condition
//         };
      
//       case 'transform':
//         return { 
//           transformed: true,
//           mapping: node.configuration.mapping
//         };
      
//       default:
//         return { 
//           executed: true,
//           type: node.type,
//           configuration: node.configuration
//         };
//     }
//   }
// }

// // Usage Examples and Documentation
// export const WorkflowUtils = {
//   // Create a new API client
//   createApiClient: (baseUrl?: string, token?: string) => new WorkflowApiClient(baseUrl, token),
  
//   // Validate a workflow
//   validate: (workflow: WorkflowExecutionData) => WorkflowValidator.validateWorkflowStructure(workflow),
  
//   // Export/Import workflows
//   export: (workflow: WorkflowExecutionData) => WorkflowSerializer.exportWorkflow(workflow),
//   import: (data: string) => WorkflowSerializer.importWorkflow(data),
//   exportToFile: (workflow: WorkflowExecutionData, filename?: string) => 
//     WorkflowSerializer.exportToFile(workflow, filename),
//   importFromFile: () => WorkflowSerializer.importFromFile(),
  
//   // Simulate execution for testing
//   simulateExecution: (
//     workflow: WorkflowExecutionData,
//     onProgress?: (nodeId: string, status: 'running' | 'success' | 'error', result?: any) => void
//   ) => WorkflowExecutionMock.simulateExecution(workflow, onProgress),
// };

// /* 
// USAGE EXAMPLES:

// 1. API Integration:
//    const api = WorkflowUtils.createApiClient('https://api.yourbackend.com', 'your-token');
   
//    // Save workflow
//    const { id } = await api.saveWorkflow(workflowData);
   
//    // Execute workflow
//    const execution = await api.executeWorkflow(id, { inputData: 'test' });

// 2. Validation:
//    const validation = WorkflowUtils.validate(workflowData);
//    if (!validation.isValid) {
//      console.error('Validation errors:', validation.errors);
//    }

// 3. Export/Import:
//    // Export to file
//    WorkflowUtils.exportToFile(workflowData, 'my-workflow.json');
   
//    // Import from file
//    const importedWorkflow = await WorkflowUtils.importFromFile();

// 4. Testing:
//    const results = await WorkflowUtils.simulateExecution(workflowData, (nodeId, status) => {
//      console.log(`Node ${nodeId}: ${status}`);
//    });
// */