'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';

interface TiptapProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const Tiptap = ({ content, onChange, placeholder = 'Start typing...' }: TiptapProps) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[240px] px-4 py-3',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    isActive,
    icon,
    label,
  }: {
    onClick: () => void;
    isActive: boolean;
    icon: React.ReactNode;
    label: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded transition-colors ${
        isActive ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'
      }`}
      aria-label={label}
    >
      {icon}
    </button>
  );

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
      {/* Toolbar */}
      <div className="bg-gray-50 px-3 py-2 flex items-center gap-1 border-b border-gray-300">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon={<Bold className="w-4 h-4" />}
          label="Bold"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon={<Italic className="w-4 h-4" />}
          label="Italic"
        />
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          icon={<List className="w-4 h-4" />}
          label="Bullet list"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          icon={<ListOrdered className="w-4 h-4" />}
          label="Numbered list"
        />
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default Tiptap;