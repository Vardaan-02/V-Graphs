"use client"

import { ChevronsUpDown, LogOut } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useUser } from "@/provider/userprovider"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const {logout}=useUser();
  const handleLogout = () => {
      logout();
      window.location.href = "/";
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start h-12 px-3 bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 text-white transition-all duration-300 rounded-xl">
          <Avatar className="h-8 w-8 rounded-lg mr-3 border border-white/20">
            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback className="rounded-lg bg-gradient-to-r from-cyan-400 to-white text-black font-semibold">JS</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold text-white">{user.name}</span>
            <span className="truncate text-xs text-white/60">{user.email}</span>
          </div>
          <ChevronsUpDown className="ml-auto size-4 text-cyan-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl bg-black/90 backdrop-blur-sm border border-white/20 text-white"
        side="top"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg border border-white/20">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback className="rounded-lg bg-gradient-to-r from-cyan-400 to-white text-black font-semibold">JS</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold text-white">{user.name}</span>
              <span className="truncate text-xs text-white/60">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/20" />
        {user.name!== "Guest" ?(
          
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer hover:bg-white/10 text-white rounded-lg transition-all duration-300">
          <LogOut className="text-cyan-400" />
          Log out
        </DropdownMenuItem>
          
        ):(
        <DropdownMenuItem onClick={()=>{
          window.location.href = "/";
        }} className="cursor-pointer hover:bg-white/10 text-white rounded-lg transition-all duration-300">
          <LogOut className="text-cyan-400" />
          Home
        </DropdownMenuItem>
          
        )}
        
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
