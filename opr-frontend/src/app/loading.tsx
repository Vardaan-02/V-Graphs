'use client';

import React from 'react';
import { motion } from 'framer-motion';

const Loader = () => {
 
 const gridSize = 3; 
 const kiteSize = 40; 
 const gap = 20; 
 const middleIndex = Math.floor((gridSize * gridSize) / 2); 
 return (
  <div className="flex justify-center items-center h-screen bg-secondary-background">
   <div
    className="grid"
    style={{
     display: 'grid',
     gridTemplateColumns: `repeat(${gridSize}, ${kiteSize}px)`,
     gridTemplateRows: `repeat(${gridSize}, ${kiteSize}px)`,
     gap: `${gap}px`,
     justifyContent: 'center',
     alignItems: 'center',
    }}
   >
    {Array.from({ length: gridSize * gridSize }).map((_, index) => {
     const isMiddle = index === middleIndex;

     const circularMotion = {
      animate: {
       rotate: [0, 360],
       scale: isMiddle ? [1, 2, 1] : [1, 1, 1, 1],
      },
      transition: {
       repeat: Infinity,
       duration: 2.5,
       ease: [0.42, 0, 0.58, 1] as [number, number, number, number],
      },
     };

     return (
      <motion.svg
       key={index}
       xmlns="http://www.w3.org/2000/svg"
       viewBox="0 0 100 100"
       style={{
        width: isMiddle ? kiteSize * 1.5 - 20 : kiteSize,
        height: isMiddle ? kiteSize * 1.5 : kiteSize,
        transform: isMiddle
         ? `translate(-${kiteSize * 0.25}px, -${kiteSize * 0.25 - 9}px)`
         : 'none',
       }}
       {...circularMotion}
      >
       <defs>
                <linearGradient id={`grad${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 0.8 }} />
                  <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.6 }} />
                </linearGradient>
              </defs>
       <polygon points="50,0 100,50 50,100 0,50" fill={`url(#grad${index})`} />
      </motion.svg>
     );
    })}
   </div>
  </div>
 );
};

export default Loader;
