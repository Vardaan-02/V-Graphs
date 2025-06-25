"use client"
import { OTPInput } from "./otpInput"
import { Button } from "../../../components/ui/button"
import { useState } from "react"
export default function OTPEntryPage({generateOTP}:{
 generateOTP:()=>string
}) {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
const handleOTPComplete = async (otp: string) => {
 setError(null)
 setIsSubmitting(true)
 const currentOtp=localStorage.getItem('currentOtp')
 console.log(otp);
 console.log(currentOtp);
 try {
   if (otp === currentOtp) {
     localStorage.setItem('otpVerified','true')
   } else {
     setError("Invalid OTP. Please try again.")
   }
 } catch (err) {
   setError(`An error occurred ${err}. Please try again.`)
 } finally {
   setIsSubmitting(false)
 }
};
const handleResendOTP = () => {
 const newOtp=generateOTP()
 console.log(newOtp)
 localStorage.removeItem('currentOtp');
 localStorage.setItem('currentOtp',newOtp);
 console.log(localStorage.getItem('currentOtp'));
};
  return (
    <div className="flex justify-center items-center h-screen bg-black">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="w-96 bg-black/50 backdrop-blur-xl border border-white/10 shadow-xl rounded-lg p-8">
        <h1 className="text-2xl font-bold text-center bg-gradient-to-br from-cyan-500/100 to-cyan-500/50 bg-clip-text text-transparent">
          Enter OTP
        </h1>
        <p className="text-sm text-gray-300 text-center mb-4">
          Please enter the 6-digit code sent to your device
        </p>
        
        <OTPInput length={6} onComplete={handleOTPComplete}  />
        
        {error && (
          <p className="mt-4 text-red-500 text-sm text-center" role="alert">
            {error}
          </p>
        )}
        
        <div className="mt-6 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleResendOTP}
            disabled={isSubmitting}
            className="bg-white/10 border border-white/20 hover:bg-white/20 text-white py-2 px-4 rounded-lg"
          >
            Resend OTP
          </Button>
          
          <Button
            onClick={() => {
            const otpInputs = Array.from(document.querySelectorAll('input[type="text"]'));
            const otp = otpInputs.map(input => (input as HTMLInputElement).value).join('');
            handleOTPComplete(otp)
            }}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-cyan-500/100 to-cyan-500/50 text-slate-300 font-semibold hover:opacity-90 transition-opacity rounded-lg py-2 px-4"
          >
            {isSubmitting ? "Verifying..." : "Verify OTP"}
          </Button>
        </div>
      </div>
    </div>
  );
}
