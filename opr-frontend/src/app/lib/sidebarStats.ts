export type SidebarStats = {
    draftWorkflows: number
    activeWorkflows: number
    failedExecutions: number
    recentRuns: number
    scheduled: number
  }
  
  export async function fetchSidebarStats(): Promise<SidebarStats> {
    const rawToken = localStorage.getItem("__Pearl_Token");
  
    if (!rawToken || rawToken === "null") {
      console.error("No valid token found in localStorage.");
      throw new Error("Unauthenticated");
    }
  
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/user/sidebar-stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${rawToken}`,
      },
    });
  
    if (!res.ok) {
      throw new Error(`Failed to fetch sidebar stats: ${res.status}`);
    }
  
    return res.json();
  }
