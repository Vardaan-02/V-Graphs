
"use client";
import { DragProvider } from "@/provider/dragprovider";
import CanvasDropZone from "./_components/drop-zone";
import NodePalette from "./_components/node-pallete";
import { PropertiesPanel } from "./_components/properties";
import { WorkflowProvider } from "../../provider/statecontext";

export default function Page() {
  return (
    <DragProvider>
      <WorkflowProvider>
        <div className="overflow-hidden h-screen bg-background flex">
          <CanvasDropZone />
          <NodePalette />
          <PropertiesPanel />
        </div>
      </WorkflowProvider>
    </DragProvider>
  );
}