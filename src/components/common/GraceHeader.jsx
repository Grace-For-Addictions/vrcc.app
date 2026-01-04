import React from 'react';
import { motion } from 'framer-motion';

export default function GraceHeader({ title, subtitle, icon: Icon }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-8"
    >
      {Icon && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white mb-4 shadow-lg"
        >
          <Icon className="w-8 h-8" />
        </motion.div>
      )}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-lg text-gray-600 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}