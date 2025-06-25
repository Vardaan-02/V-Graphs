import { runWorkflow } from "@/lib/api";
import { getGoogleToken } from "@/lib/google";
import { useGoogleAccessTokenLogin } from "@/hooks/useGoogleAuth";
import { Tag } from "@/components/ui/tag-input";

export function useRunWorkflow() {
   console.log("first");
  const login = useGoogleAccessTokenLogin(); // safe usage of hook
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (workflowId: string, payload: any,tags:Tag[]) => {
    const googleToken = getGoogleToken();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    const needsGoogleLogin = Object.values(payload.nodes || {}).some((node: any) => {
      const url: string = node?.data?.url || "";
      const useGoogle = node?.data?.useGoogleAuth === true;
      return url.includes("googleapis.com") || useGoogle;
    });

    if (needsGoogleLogin && !googleToken) {
      console.log("🔐 Prompting Google login...");
      login(); 

      return new Promise((resolve, reject) => {
        const checkToken = () => {
          const token = getGoogleToken();
          if (token) {
            runWorkflow(workflowId, payload,tags, token).then(resolve).catch(reject);
          } else {
            setTimeout(checkToken, 500);
          }
        };
        checkToken();
      });
    }

    return runWorkflow(workflowId, payload,tags, googleToken || undefined);
  };
}
