"use client"
import { useState, useRef, type KeyboardEvent } from "react"
import { Input } from "@/components/ui/input"
interface OTPInputProps {
  length: number
  onComplete: (otp: string) => void
}
export function OTPInput({ length, onComplete }: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))])

    if (element.nextSibling && element.value !== "") {
      ;(element.nextSibling as HTMLInputElement).focus()
    }

    if (index === length - 1 && element.value !== "") {
      onComplete(otp.join("") + element.value)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  return (
    <div className="flex justify-center gap-2 text-white">
      {otp.map((data, index) => (
        <Input
          key={index}
          type="text"
          inputMode="numeric"
          maxLength={1}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          value={data}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="w-12 h-12 text-center text-2xl"
          aria-label={`Digit ${index + 1} of OTP`}
        />
      ))}
    </div>
  )
}

