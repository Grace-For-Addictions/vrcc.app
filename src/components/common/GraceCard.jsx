import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function GraceCard({ 
  children, 
  className, 
  hover = true,
  gradient = false,
  delay = 0
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : {}}
      className={cn(
        "rounded-2xl p-6 shadow-sm border transition-all duration-300",
        gradient 
          ? "bg-gradient-to-br from-white to-teal-50/30 border-teal-100" 
          : "bg-white border-gray-100 hover:border-teal-200 hover:shadow-md",
        className
      )}
    >
      {children}
    </motion.div>
  );
}