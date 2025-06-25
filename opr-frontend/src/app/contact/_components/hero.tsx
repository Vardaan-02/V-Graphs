import axios from "axios";
import { SendIcon } from "lucide-react";
import { useForm } from "react-hook-form";

type FormData = {
  name: string;
  email: string;
  page?: string;
  subject: string;
  message: string;
};

export default function Hero() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      console.log("Form Submitted:", data);
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contact`, data, {
        headers: {
          "Content-Type": "application/json",
        }
      });
  
      if (response.status !== 200) {
        throw new Error("Email not sent!");
      }
      reset();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("There was an error sending your message.");
    }
  };

  return (
    <div className="min-h-screen bg-black z-auto">
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            Get In Touch
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            We would love to hear from you! Please fill out the form below and we&#39;ll get back to you as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
          <div className="lg:col-span-8">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
              <h2 className="text-2xl font-semibold text-white mb-8">Send us a message</h2>

              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-white text-sm font-medium mb-2">
                      Name <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      {...register("name", { required: "Name is required" })}
                      className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-colors"
                      placeholder="Your name"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-white text-sm font-medium mb-2">
                      Email <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Invalid email address",
                        },
                      })}
                      className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-colors"
                      placeholder="your@email.com"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="page" className="block text-white text-sm font-medium mb-2">
                      Page Issue Occurred On
                    </label>
                    <input
                      type="text"
                      id="page"
                      {...register("page")}
                      className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-colors"
                      placeholder="Page name (optional)"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-white text-sm font-medium mb-2">
                      Subject <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="subject"
                      {...register("subject", { required: "Subject is required" })}
                      className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-colors"
                      placeholder="What's this about?"
                    />
                    {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-white text-sm font-medium mb-2">
                    Message <span className="text-cyan-400">*</span>
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    {...register("message", { required: "Message is required" })}
                    className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-colors resize-none"
                    placeholder="Tell us more about your inquiry..."
                  ></textarea>
                  {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-medium rounded-lg transition-colors duration-200"
                  >
                    <SendIcon size={16} />
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </form>
            </div>
          </div>



          <div className="lg:col-span-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 h-fit">
              <h3 className="text-xl font-semibold text-white mb-8">Contact Information</h3>
              

              <div className="mb-8">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Email
                </div>
                <div className="text-white font-mono text-sm break-all select-all p-3 bg-black border border-zinc-700 rounded-lg">
                  marcellapearl0627@gmail.com
                </div>
              </div>

        
              <div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
                  Connect
                </div>
                <div className="flex gap-4">
                  <a
                    href="https://instagram.com/marcelpearl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-black border border-zinc-700 rounded-lg hover:border-cyan-400 transition-colors group"
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                      <path d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2Zm0 7.8A3 3 0 1 1 12 9a3 3 0 0 1 0 6Zm4.95-8.1a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25ZM19.2 7.8a5.4 5.4 0 0 0-1.47-3.83A5.4 5.4 0 0 0 13.8 2.4h-3.6a5.4 5.4 0 0 0-3.83 1.47A5.4 5.4 0 0 0 2.4 7.8v3.6a5.4 5.4 0 0 0 1.47 3.83A5.4 5.4 0 0 0 7.8 19.2h3.6a5.4 5.4 0 0 0 3.83-1.47A5.4 5.4 0 0 0 19.2 13.8v-3.6Z" className="fill-gray-400 group-hover:fill-cyan-400 transition-colors" />
                    </svg>
                  </a>

                  <a
                    href="https://linkedin.com/in/marcelpearl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-black border border-zinc-700 rounded-lg hover:border-cyan-400 transition-colors group"
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                      <path d="M6.94 8.5a1.06 1.06 0 1 1 0-2.12 1.06 1.06 0 0 1 0 2.12ZM7.99 10.25H5.89V18h2.1v-7.75ZM12.5 10.25h-2.1V18h2.1v-4.25c0-1.13.87-2 2-2s2 .87 2 2V18h2.1v-4.5c0-2.21-1.79-4-4-4s-4 1.79-4 4V18h2.1v-7.75Z" className="fill-gray-400 group-hover:fill-cyan-400 transition-colors" />
                    </svg>
                  </a>

                  <a
                    href="https://github.com/marcelpearl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-black border border-zinc-700 rounded-lg hover:border-cyan-400 transition-colors group"
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.66-.22.66-.48 0-.24-.01-.87-.01-1.7-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.1-1.46-1.1-1.46-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85.004 1.71.12 2.51.35 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.85 0 1.33-.01 2.4-.01 2.73 0 .27.16.58.67.48A10.01 10.01 0 0 0 22 12c0-5.52-4.48-10-10-10Z" className="fill-gray-400 group-hover:fill-cyan-400 transition-colors" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
 );
}