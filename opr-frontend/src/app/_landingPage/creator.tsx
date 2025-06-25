import { ArrowLeft, ArrowRight, Github, Linkedin, Mail } from "lucide-react";
import { useState } from "react";
import { FaCloud, FaCogs, FaJava } from "react-icons/fa";
import { MdApi } from "react-icons/md";
import { SiFastapi, SiLangchain } from "react-icons/si";
import {
  SiDocker,
  SiGit,
  SiGraphql,
  SiNextdotjs,
  SiPostgresql,
  SiSpringboot,
  SiTypescript,
} from "react-icons/si";
import Image from "next/image";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Creator() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");

  const creator = [
    {
      name: "Saumya",
      email: "saumyasood27@gmail.com",
      linkdin: "https://www.linkedin.com/in/saumya-sood-875837332/",
      github: "https://github.com/Marcella2706",
      about:
        "Full Stack Developer with expertise in both TypeScript and Java. Proficient in building scalable web applications using Next.js for frontend and Spring Boot for backend. Experienced in designing robust APIs with GraphQL and integrating modern technologies across the stack.",
      techUsed: [
        { icon: FaJava, name: "Java" },
        { icon: SiSpringboot, name: "Spring Boot" },
        { icon: SiGraphql, name: "GraphQL" },
        { icon: MdApi, name: "REST APIs" },
        { icon: SiPostgresql, name: "PostgreSQL" },
        { icon: SiTypescript, name: "TypeScript" },
        { icon: SiNextdotjs, name: "Next.js" },
        { icon: SiDocker, name: "Docker" },
        { icon: FaCloud, name: "Cloud" },
      ],
      imageUrl: "finalSaumya.png",
    },
    {
      name: "Vishwas",
      email: "kaixoxerl@gmail.com",
      linkdin: "https://www.linkedin.com/in/vishwas-pahwa-694928328/",
      github: "https://github.com/ScorchedPearl",
      about:
        "Full Stack Developer skilled in TypeScript with experience building various projects such as PostPearl. Adept in both frontend and backend development, and highly proficient in DevOps practices including Docker, CI/CD, and cloud deployment.",
      techUsed: [
        { icon: SiTypescript, name: "TypeScript" },
        { icon: SiNextdotjs, name: "Next.js" },
        { icon: SiDocker, name: "Docker" },
        { icon: FaCogs, name: "DevOps" },
        { icon: FaCloud, name: "Cloud" },
        { icon: SiGit, name: "Git" },
        { icon: FaJava, name: "Java" },
        { icon: SiGraphql, name: "GraphQL" },
        { icon: SiFastapi, name: "FastAPI" },
        {icon: SiLangchain , name: "LangChain"},
        { icon: SiPostgresql, name: "PostgreSQL" },
      ],
      imageUrl: "vishwasfinal.png",
    },
  ];

  function handleNext() {
    setDirection("right");
    if (index < creator.length - 1) {
      setIndex(index + 1);
    } else {
      setIndex(0);
    }
  }
  function handlePrev() {
    setDirection("left");
    if (index > 0) {
      setIndex(index - 1);
    } else {
      setIndex(creator.length - 1);
    }
  }
  useEffect(() => {
    const interval = setInterval(() => {
      setDirection("right");
      setIndex((prevIndex) => (prevIndex + 1) % creator.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [creator.length]);

  const variants = {
    enter: (dir: "left" | "right") => ({
      x: dir === "right" ? 300 : -300,
      opacity: 0,
      position: "absolute" as const,
      width: "100%",
      height: "100%",
    }),
    center: {
      x: 0,
      opacity: 1,
      position: "relative" as const,
      width: "100%",
      height: "100%",
    },
    exit: (dir: "left" | "right") => ({
      x: dir === "right" ? -300 : 300,
      opacity: 0,
      position: "absolute" as const,
      width: "100%",
      height: "100%",
    }),
  };

  return (
    <section  className="py-32 bg-gradient-to-b from-gray-50 to-white select-none">
      <div className=" mx-auto  text-center">
        <div className="bg-black rounded-3xl py-12 md:py-16 relative overflow-hidden">
  
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:2rem_2rem]" />
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          
      <div id="creators" className="grid grid-rows-[auto,1fr] md:grid-rows-10 mx-4 md:mx-10 lg:mx-40">
        <div className="row-span-3 w-full">
          <div className="flex flex-col md:flex-row justify-between w-full py-4">
            <div className="text-white pt-2 md:pt-5">
              <div className="text-3xl sm:text-5xl font-bold py-2 sm:py-4">
                MarcelPearl Creators
              </div>
              <div className="text-gray-300 text-sm sm:text-base">
                Our skills made this project come to live
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 text-4xl sm:text-6xl py-4 sm:py-8 items-center">
              <div
                className="rounded-full p-2 bg-[#17171d] h-8 w-8 md:h-10 md:w-10"
                onClick={handlePrev}
              >
                <ArrowLeft className="text-white" />
              </div>
              <div
                className="rounded-full bg-[#17171d] h-8 w-8 md:h-10 md:w-10 p-2"
                onClick={handleNext}
              >
                <ArrowRight className="text-white" />
              </div>
            </div>
          </div>
        </div>
        <div className="row-span-7  grid grid-cols-1 md:grid-cols-10 relative overflow-hidden min-h-[400px] md:min-h-[510px]">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={index}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="col-span-1 md:col-span-10 flex flex-col md:flex-row w-full h-full"
            >
              <div className="w-full md:w-1/3 flex justify-center items-center">
                <Image
                  src={`/${creator[index].imageUrl}`}
                  width={500}
                  height={500}
                  className="w-3/4 md:w-full h-auto ml-5"
                  alt="Creator"
                />
              </div>
              <div className="w-full md:w-2/3 p-4 md:p-8 text-white relative z-10">
                <h1 className="text-5xl font-bold mb-1">
                  {creator[index].name}
                </h1>
                <h2 className="text-xl text-gray-300 mb-8 w-full">
                  Full Stack Developer
                </h2>
                <p className="text-lg mb-8">{creator[index].about}</p>
                <div className="mb-6">
                  <h3 className="font-semibold text-xl mb-4">Tech Stack</h3>
                  <div className="flex flex-wrap gap-3">
                    {creator[index].techUsed.map((tech, idx) => (
                      <div
                        key={idx}
                        className="bg-[#1A1F2C] px-4 py-2 rounded-full flex items-center gap-2"
                      >
                        <tech.icon className="w-5 h-5 text-cyan-500" />
                        <span>{tech.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-8">
                  <a
                    href={creator[index].github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#1A1F2C] p-3 rounded-full hover:bg-[#9b87f5]/20 transition-colors"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                  <a
                    href={creator[index].linkdin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#1A1F2C] p-3 rounded-full hover:bg-[#9b87f5]/20 transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a
                    href={`mailto:${creator[index].email}`}
                    className="bg-[#1A1F2C] p-3 rounded-full hover:bg-[#9b87f5]/20 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
       </div>
      </div>
    </section>
  );
}
