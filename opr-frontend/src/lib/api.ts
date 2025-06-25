import { Tag } from '@/components/ui/tag-input';
import axios from 'axios';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/workflows`;

function getAuthToken() {
  const rawToken = localStorage.getItem('__Pearl_Token');
  if (!rawToken) throw new Error('User not authenticated');
  return `Bearer ${rawToken}`;
}

export async function createWorkflow(data: {
  name: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workflowData: any;
}) {
  try {
    const token = getAuthToken();

    const response = await axios.post(`${API_BASE_URL}`, data, {
      headers: {
        Authorization: token,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error creating workflow:', error);
    throw error;
  }
}


export async function runWorkflow(
  workflowId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workflowData: any = {},
   tags:Tag[],
  googleToken?: string
 
) {
  console.log("📌 runWorkflow called with ID:", workflowId);
  console.log("📌 Workflow data structure:", workflowData);
  
  try {
    const headers: Record<string, string> = {
      Authorization: getAuthToken(),
      "Content-Type": "application/json",
    };

    const nodes = workflowData?.nodes || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasGoogleNode = nodes.some((node: any) => {
      const url: string = node?.data?.url || "";
      const explicitGoogle = node?.data?.useGoogleAuth === true;
      const isGoogleCalendar = node?.type === "googleCalendar";
      const isGmailNode = node?.type?.startsWith("gmail");
      
      console.log("🔍 Checking node:", {
        id: node.id,
        type: node.type,
        url,
        useGoogleAuth: explicitGoogle,
        isGoogleCalendar,
        isGmailNode
      });
      
      return url.includes("googleapis.com") || explicitGoogle || isGoogleCalendar || isGmailNode;
    });
    
    console.log("🔍 Has Google node:", hasGoogleNode);
    
    if (hasGoogleNode) {
      const tokenToUse = googleToken || localStorage.getItem("__Google_Access_Token__");
      console.log("🔐 Token being sent:", tokenToUse ? "TOKEN_PRESENT" : "NO_TOKEN");
      
      if (tokenToUse) {
        headers["X-Google-Access-Token"] = tokenToUse;
        console.log("✅ Added X-Google-Access-Token header");
      } else {
        console.warn("⚠️ Missing Google access token for workflow with Google-auth node");
      }
    }

    console.log("📤 Request headers:", Object.keys(headers));
    const request={
      workflowData,
      returnVariables:tags.map(tag => tag.text),
      waitForCompletion:true
    }
    const response = await axios.post(
      `${API_BASE_URL}/${workflowId}/run`,
      request,
      { headers }
    );

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("❌ Error running workflow:", error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Workflow run failed");
    }
    throw error;
  }
}