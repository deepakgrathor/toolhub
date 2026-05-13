"use client";

import * as LucideIcons from "lucide-react";
import { Box } from "lucide-react";
import type { LucideProps } from "lucide-react";

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export function DynamicIcon({ name, className, size = 24 }: DynamicIconProps) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>)[name];
  if (!Icon) return <Box size={size} className={className} />;
  return <Icon size={size} className={className} />;
}
