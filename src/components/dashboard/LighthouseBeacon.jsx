import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';

export default function LighthouseBeacon({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  color = 'teal',
  delay = 0,
  badge,
  isNew = false
}) {
  const colorVariants = {
    teal: 'from-teal-400 to-teal-600 hover:from-teal-500 hover:to-teal-700',
    coral: 'from-coral-400 to-coral-600 hover:from-coral-500 hover:to-coral-700',
    amber: 'from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700',
    purple: 'from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700',
    blue: 'from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700',
    rose: 'from-rose-400 to-rose-600 hover:from-rose-500 hover:to-rose-700',
    emerald: 'from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700',
    orange: 'from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link to={createPageUrl(href)} className="block">
        <div className="relative group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-teal-200 transition-all duration-300 overflow-hidden">
          {/* Animated background glow */}
          <div className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br",
            colorVariants[color]
          )} />
          
          {/* New badge */}
          {isNew && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-3 right-3 px-2 py-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-medium rounded-full"
            >
              NEW
            </motion.div>
          )}

          <div className="relative flex items-start gap-4">
            <motion.div
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
              className={cn(
                "flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                colorVariants[color]
              )}
            >
              <Icon className="w-7 h-7 text-white" />
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">
                {title}
              </h3>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                {description}
              </p>
              
              {badge && (
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 text-xs font-medium rounded-full">
                  {badge}
                </div>
              )}
            </div>
          </div>

          {/* Hover arrow indicator */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileHover={{ opacity: 1, x: 0 }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            →
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
}