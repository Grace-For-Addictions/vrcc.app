import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { getTooltip } from './PermissionHelper';

// Wrapper to inject trauma-informed tooltips
export default function TooltipWrapper({ tooltipKey, children, showIcon = true }) {
  const tooltipText = getTooltip(tooltipKey);
  
  if (!tooltipText) return children;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {children}
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="text-gray-400 hover:text-gray-600">
              <HelpCircle className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm">{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}