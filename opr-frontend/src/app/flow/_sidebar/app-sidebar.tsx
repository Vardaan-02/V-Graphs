"use client"

import {
  HelpCircle,
  Plus,
  Save,
  Settings2,
  Play
} from "lucide-react"

import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import { useSidebar } from "@/provider/sidebarContext";
import { useWorkflow } from "@/provider/statecontext"
import { useState } from "react"
import { serializeWorkflowForBackend } from "@/lib/serializeWorkflowData"
import { useRunWorkflow } from "@/hooks/useRunWorkflow"
import { useSaveWorkflow } from "@/hooks/useSaveWorkflow"
import { InputTag, Tag } from "@/components/ui/tag-input";


export function AppSidebar() {
  const { user, navMain } = useSidebar() 
   const { getWorkflowExecutionData } = useWorkflow();
   const [isRunning, setIsRunning] = useState(false);
    const [workflowId, setWorkflowId] = useState<string | null>(null);
    const runWorkflowWithAuth = useRunWorkflow();
  const saveWorkflow = useSaveWorkflow();

  const [tags, setTags] = useState<Tag[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [returnVariables, setReturnVariables] = useState<string[]>([]);

  return (
    <div className="relative flex flex-col h-screen bg-black text-white overflow-auto">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-50" />
      </div>

      <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative flex flex-col h-full">
        <div className="p-4 border-b border-white/10 backdrop-blur-sm bg-white/5">
          <div className="flex items-center gap-2">
            <Link href="/">
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">
                MarcelPearl
              </span>
            </Link>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-4">
            <NavMain items={navMain} />

            <div className="space-y-1">
              <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-white">
                  Quick Actions
                </h2>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-white/5 backdrop-blur-sm border border-white/20 hover:bg-white/10 text-white rounded-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Plus className="mr-2 h-4 w-4 text-cyan-400" />
                    New Workflow
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-white/5 backdrop-blur-sm border border-white/20 hover:bg-white/10 text-white rounded-xl transition-all duration-300 transform hover:scale-105"
                    onClick={async () => {
                      try {
                        const response = await saveWorkflow();
                        setWorkflowId(response.id);
                        console.log("✅ Workflow saved:", response);
                      } catch (error) {
                        console.error("❌ Save failed:", error);
                      }
                    }}
                  >
                    <Save className="mr-2 h-4 w-4 text-cyan-400" />
                    Save Workflow
                  </Button>
                  
                  
                  <Button
                    disabled={!workflowId}
                    variant="outline"
                    className="w-full justify-start bg-white/5 backdrop-blur-sm border border-white/20 hover:bg-white/10 text-white rounded-xl transition-all duration-300 transform hover:scale-105"
                    onClick={async () => {
                      if (!workflowId) return;

                      const fullWorkflow = getWorkflowExecutionData(); 
                      const payload = serializeWorkflowForBackend(fullWorkflow);

                      try {
                        setIsRunning(true);
                        const result = await runWorkflowWithAuth(workflowId, payload,tags); 
                        setReturnVariables(Object.values(result.variables || {}));
                        console.log('🚀 Workflow run started:', result);
                      } catch (error) {
                        console.error('❌ Failed to run workflow:', error);
                      } finally {
                        setIsRunning(false);
                      }
                    }}
                  >
                    <Play className="mr-2 h-4 w-4 text-cyan-400" />
                    {isRunning ? 'Running...' : 'Run Workflow'}
                  </Button>
                  <h2 className="mt-4 px-4 text-lg font-semibold tracking-tight text-white">
                  Return Variables
                  </h2>
                  <div className="w-60">
                    <InputTag
                      inputValue={inputValue}
                      setInputValue={setInputValue}
                      tags={tags}
                      setTags={setTags}
                      className="mt-4"
                      inputClassName="bg-white/5 text-white border-white/20 placeholder:text-white/40 w-60"
                      tagContainerClassName="bg-cyan-500 text-white"
                      removeTagButtonClassName="text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
            {returnVariables.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 py-2">
                  <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-white">
                    Return Variables
                  </h2>
                  <ul className="list-disc pl-6 space-y-1">
                    {returnVariables.map((variable, index) => (
                      <li key={index} className="text-white/80">
                        {variable}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <div className="space-y-1">
              <div className="px-3 py-2">
                <div className="space-y-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-start hover:bg-white/5 text-white/80 hover:text-white rounded-xl transition-all duration-300"
                    asChild
                  >
                    <Link href="/contact" className="flex items-center">
                      <HelpCircle className="mr-2 h-4 w-4 text-cyan-400" />
                      Help & Support
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start hover:bg-white/5 text-white/80 hover:text-white rounded-xl transition-all duration-300"
                    asChild
                  >
                    <Link href="/" className="flex items-center">
                      <Settings2 className="mr-2 h-4 w-4 text-cyan-400" />
                      Home
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t bottom-0 border-white/10 backdrop-blur-sm bg-white/5">
          <NavUser user={user} />
        </div>
      </div>
    </div>
  )
}
