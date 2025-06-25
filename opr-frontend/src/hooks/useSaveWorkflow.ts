import { useWorkflow } from "@/provider/statecontext";
import { createWorkflow } from "@/lib/api";
import { serializeWorkflowForBackend } from "@/lib/serializeWorkflowData";

export function useSaveWorkflow() {
  const { getWorkflowExecutionData } = useWorkflow();

  return async () => {
    const fullWorkflow = getWorkflowExecutionData();

    const payload = {
      name: fullWorkflow.metadata.name,
      description: fullWorkflow.metadata.description,
      workflowData: serializeWorkflowForBackend(fullWorkflow),
    };

    const response = await createWorkflow(payload);
    return response;
  };
}
