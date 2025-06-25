"use client";
import { UserProvider } from "@/provider/userprovider";
import AuthPage from "./_components/authPage";
export default function AuthForm(){
  return( 
    <UserProvider>
      <AuthPage></AuthPage>
    </UserProvider>
  )
}
