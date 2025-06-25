
"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
      badge?: string
    }[]
  }[]
}) {
  return (
    <div className="space-y-1">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-white">Navigation</h2>
        <div className="space-y-1">
          {items.map((item) => (
            <Collapsible key={item.title} asChild defaultOpen={item.isActive} className="group/collapsible">
              <div>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant={item.isActive ? "secondary" : "ghost"} 
                    className={`w-full justify-start rounded-xl transition-all duration-300 ${
                      item.isActive 
                        ? "bg-white/10 text-white border border-white/20 backdrop-blur-sm" 
                        : "text-white/80 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {item.icon && <item.icon className={`mr-2 h-4 w-4 ${item.isActive ? "text-cyan-400" : ""}`} />}
                    <span>{item.title}</span>
                    {item.items && (
                      <ChevronRight className="ml-auto h-4 w-4 text-cyan-400 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                {item.items && (
                  <CollapsibleContent>
                    <div className="ml-6 space-y-1 border-l border-white/20 pl-4">
                      {item.items?.map((subItem) => (
                        <Button 
                          key={subItem.title} 
                          variant="ghost" 
                          className="w-full justify-start h-8 px-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-300" 
                          asChild
                        >
                          <a href={subItem.url} className="flex items-center justify-between">
                            <span className="text-sm">{subItem.title}</span>
                            {subItem.badge && (
                              <Badge variant="secondary" className="ml-auto text-xs bg-cyan-400/20 text-cyan-400 border border-cyan-400/30">
                                {subItem.badge}
                              </Badge>
                            )}
                          </a>
                        </Button>
                      ))}
                    </div>
                  </CollapsibleContent>
                )}
              </div>
            </Collapsible>
          ))}
        </div>
      </div>
    </div>
  )
}
