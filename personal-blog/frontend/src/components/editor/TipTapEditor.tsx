'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import { useCallback, useEffect } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Highlighter
} from 'lucide-react'

interface TipTapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

// Toolbar component following TipTap official patterns
function Toolbar({ editor }: { editor: any }) {
  const setLink = useCallback(() => {
    if (!editor) return
    
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(() => {
    if (!editor) return
    
    const url = window.prompt('Image URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  if (!editor) return null

  return (
    <div className="toolbar border-b bg-gray-50 p-2 flex flex-wrap gap-1">
      {/* Text Formatting */}
      <div className="toolbar-group flex gap-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`toolbar-button p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'is-active bg-gray-300' : ''}`}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`toolbar-button p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'is-active bg-gray-300' : ''}`}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`toolbar-button p-2 rounded hover:bg-gray-200 ${editor.isActive('underline') ? 'is-active bg-gray-300' : ''}`}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`toolbar-button p-2 rounded hover:bg-gray-200 ${editor.isActive('strike') ? 'is-active bg-gray-300' : ''}`}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`toolbar-button p-2 rounded hover:bg-gray-200 ${editor.isActive('code') ? 'is-active bg-gray-300' : ''}`}
          title="Code"
        >
          <Code className="h-4 w-4" />
        </button>
      </div>

      <div className="separator w-px bg-gray-300 mx-2"></div>

      {/* Headings */}
      <div className="toolbar-group flex gap-1">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`toolbar-button p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 1 }) ? 'is-active bg-gray-300' : ''}`}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`toolbar-button p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'is-active bg-gray-300' : ''}`}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`toolbar-button p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 3 }) ? 'is-active bg-gray-300' : ''}`}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </button>
      </div>

      <div className="separator w-px bg-gray-300 mx-2"></div>

      {/* Lists */}
      <div className="toolbar-group flex gap-1">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`toolbar-button p-2 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'is-active bg-gray-300' : ''}`}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`toolbar-button p-2 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'is-active bg-gray-300' : ''}`}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`toolbar-button p-2 rounded hover:bg-gray-200 ${editor.isActive('blockquote') ? 'is-active bg-gray-300' : ''}`}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </button>
      </div>

      <div className="separator w-px bg-gray-300 mx-2"></div>

      {/* Links and Images */}
      <div className="toolbar-group flex gap-1">
        <button
          onClick={setLink}
          className={`toolbar-button p-2 rounded hover:bg-gray-200 ${editor.isActive('link') ? 'is-active bg-gray-300' : ''}`}
          title="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        <button
          onClick={addImage}
          className="toolbar-button p-2 rounded hover:bg-gray-200"
          title="Image"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="separator w-px bg-gray-300 mx-2"></div>

      {/* Text Alignment */}
      <div className="toolbar-group flex gap-1">
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`toolbar-button p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'left' }) ? 'is-active bg-gray-300' : ''}`}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`toolbar-button p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'is-active bg-gray-300' : ''}`}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`toolbar-button p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'is-active bg-gray-300' : ''}`}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`toolbar-button p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'justify' }) ? 'is-active bg-gray-300' : ''}`}
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </button>
      </div>

      <div className="separator w-px bg-gray-300 mx-2"></div>

      {/* Colors and Highlighting */}
      <div className="toolbar-group flex gap-1">
        <button
          onClick={() => editor.chain().focus().setColor('#ff0000').run()}
          className="toolbar-button p-2 rounded hover:bg-gray-200"
          title="Text Color"
        >
          <Palette className="h-4 w-4 text-red-500" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight({ color: '#ffff00' }).run()}
          className={`toolbar-button p-2 rounded hover:bg-gray-200 ${editor.isActive('highlight') ? 'is-active bg-gray-300' : ''}`}
          title="Highlight"
        >
          <Highlighter className="h-4 w-4" />
        </button>
      </div>

      <div className="separator w-px bg-gray-300 mx-2"></div>

      {/* Undo/Redo */}
      <div className="toolbar-group flex gap-1">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="toolbar-button p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="toolbar-button p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default function TipTapEditor({ content, onChange, placeholder }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'tiptap prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  return (
    <div className="tiptap-editor border rounded-lg overflow-hidden">
      <Toolbar editor={editor} />
      <EditorContent 
        editor={editor} 
        className="min-h-[300px] border-t"
      />
      
      <style jsx>{`
        .toolbar-button.is-active {
          background-color: #e5e7eb;
          color: #374151;
        }
        
        .tiptap {
          outline: none;
        }
        
        .tiptap p {
          margin: 1em 0;
        }
        
        .tiptap h1, .tiptap h2, .tiptap h3 {
          margin: 1.5em 0 0.5em 0;
        }
        
        .tiptap ul, .tiptap ol {
          margin: 1em 0;
          padding-left: 2em;
        }
        
        .tiptap blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
        }
        
        .tiptap code {
          background-color: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 0.25em;
          font-family: 'Courier New', monospace;
        }
        
        .tiptap pre {
          background-color: #f3f4f6;
          padding: 1em;
          border-radius: 0.5em;
          overflow-x: auto;
        }
        
        .tiptap img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5em;
        }
        
        .tiptap a {
          color: #2563eb;
          text-decoration: underline;
        }
        
        .tiptap mark {
          background-color: #fef08a;
          padding: 0.1em 0.2em;
          border-radius: 0.2em;
        }
      `}</style>
    </div>
  )
}