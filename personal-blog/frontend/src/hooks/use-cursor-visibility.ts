"use client"

import * as React from "react"
import type { Editor } from "@tiptap/react"

interface CursorRect {
  x: number
  y: number
  width: number
  height: number
}

interface UseCursorVisibilityProps {
  editor: Editor | null
  overlayHeight?: number
}

/**
 * Hook to track cursor visibility and position in the editor
 * @param editor - The TipTap editor instance
 * @param overlayHeight - Height of any overlay (like toolbar) that might obscure the cursor
 * @returns Cursor rectangle position
 */
export function useCursorVisibility({
  editor,
  overlayHeight = 0,
}: UseCursorVisibilityProps): CursorRect {
  const [rect, setRect] = React.useState<CursorRect>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  })

  React.useEffect(() => {
    if (!editor) return

    const updateCursorPosition = () => {
      try {
        const { state } = editor
        const { selection } = state
        const { from } = selection

        // Get the DOM position of the cursor
        const coords = editor.view.coordsAtPos(from)
        
        setRect({
          x: coords.left,
          y: coords.top - overlayHeight,
          width: 2, // Cursor width
          height: coords.bottom - coords.top,
        })
      } catch (error) {
        // Silently handle errors - cursor position tracking is not critical
        console.debug('Cursor position tracking error:', error)
      }
    }

    // Update on selection change
    editor.on('selectionUpdate', updateCursorPosition)
    editor.on('transaction', updateCursorPosition)

    // Initial update
    updateCursorPosition()

    return () => {
      editor.off('selectionUpdate', updateCursorPosition)
      editor.off('transaction', updateCursorPosition)
    }
  }, [editor, overlayHeight])

  return rect
}
