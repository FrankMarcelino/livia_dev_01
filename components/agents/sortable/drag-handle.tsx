// Drag Handle Component
// Feature: Drag and Drop para Prompts

'use client';

import { GripVertical } from 'lucide-react';

export function DragHandle() {
  return (
    <div className="cursor-grab active:cursor-grabbing touch-none">
      <GripVertical className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
    </div>
  );
}
