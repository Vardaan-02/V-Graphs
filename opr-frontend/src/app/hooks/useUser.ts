"use client"
import { currentUserFetcher } from "@/lib/auth";
import { User } from "@/provider/userprovider";
import { useEffect, useState } from "react";

export const useCurrentUser=()=>{
 const [currentUser, setCurrentUser] = useState<User|null>(null);
 const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const user = await currentUserFetcher();
        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    getCurrentUser();
  }, []);

  return { currentUser, isLoading };
}

