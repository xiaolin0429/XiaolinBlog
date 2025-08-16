"use client"

import { cn } from '@/lib/utils';

interface ToolbarSeparatorProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function ToolbarSeparator({ 
  className, 
  orientation = 'vertical' 
}: ToolbarSeparatorProps) {
  return (
    <div 
      className={cn(
        "bg-border",
        orientation === 'vertical' ? "w-px h-6 mx-1" : "h-px w-6 my-1",
        className
      )} 
    />
  );
}