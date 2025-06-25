'use client';

import { createContext, useContext, useState } from 'react';
import { useCurrentUser } from '@/hooks/useUser';
import axios from 'axios';

export interface User {
  name: string;
  email: string;
  avatar: string;
}

interface UserContextType {
  currentUser: User | null;
  isLoading: boolean;
  googleAccessToken: string | null;
  googleAuth: (token: string) => Promise<string>;
  generateOTP: () => string;
  sendOTP: (email: string) => Promise<string>;
  changePassword: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  isLoading: true,
  googleAccessToken: null,
  googleAuth: () => Promise.resolve(""),
  generateOTP: () => "",
  sendOTP: async () => Promise.resolve(""),
  changePassword: async () => Promise.resolve(),
  signUp: async () => Promise.resolve(),
  signIn: async () => Promise.resolve(),
  logout: () => {
    localStorage.removeItem('__Pearl_Token');
    window.location.reload();
  },
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, isLoading } = useCurrentUser();
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  async function googleAuth(token: string) {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/google`, {
        token
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (response.data?.token) {
        localStorage.setItem('__Pearl_Token', response.data.token);
      }
  
      localStorage.setItem('__Google_Access_Token__', token);
      setGoogleAccessToken(token);
      
      return response.data.token;
    } catch (error) {
      console.error(error);
      throw new Error('Failed to authenticate with Google');
    }
  }

  function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async function sendOTP(email: string) {
    const otp = generateOTP();
    localStorage.setItem("currentOtp", otp);
    const message = `Your OTP is ${otp}. Thank You For Registering With MarcelPearl`;

    const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/otpVerification`, {
      email,
      otp: message,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status !== 200) {
      throw new Error("Failed to send OTP");
    }

    return "OTP sent to email";
  }

  async function signUp(email: string, password: string, name: string) {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/signup`, {
      name,
      email,
      password
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const responseData = await response.data;
    if (responseData.token) {
      localStorage.setItem('__Pearl_Token', responseData.token);
    }
  }

  async function signIn(email: string, password: string) {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/signin`, {
      email,
      password
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const responseData = await response.data;
    if (responseData.token) {
      localStorage.setItem('__Pearl_Token', responseData.token);
    }
  }

  async function changePassword(email: string, newPassword: string) {
    const token = localStorage.getItem("currentOtp");
    if (!token) {
      throw new Error("OTP token is missing. Please verify your OTP again.");
    }

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/reset-password`,
      {
        email,
        newPassword,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Password reset response:", response.data);
  }
  const logout = () => {
    localStorage.removeItem('__Pearl_Token');
    setGoogleAccessToken(null);
    window.location.reload();
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        isLoading,
        googleAccessToken,
        googleAuth,
        generateOTP,
        sendOTP,
        changePassword,
        signUp,
        signIn,
        logout
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);