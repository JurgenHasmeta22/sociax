"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
	Bold,
	Italic,
	List,
	ListOrdered,
	Heading2,
	Heading3,
	Link2,
	Image as ImageIcon,
	Quote,
	Code,
	Undo,
	Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BlogEditorProps {
	initialContent?: string;
	onChange: (json: string) => void;
	placeholder?: string;
}

function ToolbarButton({
	onClick,
	active,
	title,
	children,
}: {
	onClick: () => void;
	active?: boolean;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			title={title}
			className={cn(
				"h-8 w-8 flex items-center justify-center rounded-md transition-colors text-sm",
				active
					? "bg-primary text-primary-foreground"
					: "text-muted-foreground hover:bg-muted hover:text-foreground",
			)}
		>
			{children}
		</button>
	);
}

export function BlogEditor({ initialContent, onChange, placeholder = "Write your blog post…" }: BlogEditorProps) {
	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit.configure({
				heading: { levels: [2, 3] },
				bulletList: {},
				orderedList: {},
				blockquote: {},
				code: {},
				codeBlock: false,
			}),
			Image.configure({ inline: false, allowBase64: false }),
			Link.configure({ openOnClick: false, autolink: true }),
			Placeholder.configure({ placeholder }),
		],
		content: initialContent ? JSON.parse(initialContent) : undefined,
		onUpdate: ({ editor }) => {
			onChange(JSON.stringify(editor.getJSON()));
		},
		editorProps: {
			attributes: {
				class: "prose prose-sm max-w-none focus:outline-none min-h-[300px] px-4 py-3",
			},
		},
	});

	if (!editor) return null;

	function insertImage() {
		const url = prompt("Enter image URL:");
		if (url) editor?.chain().focus().setImage({ src: url }).run();
	}

	function setLink() {
		const url = prompt("Enter URL:");
		if (url) {
			editor?.chain().focus().setLink({ href: url }).run();
		} else {
			editor?.chain().focus().unsetLink().run();
		}
	}

	return (
		<div className="border rounded-xl overflow-hidden">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/30">
				<ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo className="h-3.5 w-3.5" /></ToolbarButton>
				<ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo className="h-3.5 w-3.5" /></ToolbarButton>
				<div className="w-px h-5 bg-border mx-1" />
				<ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold"><Bold className="h-3.5 w-3.5" /></ToolbarButton>
				<ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><Italic className="h-3.5 w-3.5" /></ToolbarButton>
				<div className="w-px h-5 bg-border mx-1" />
				<ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2"><Heading2 className="h-3.5 w-3.5" /></ToolbarButton>
				<ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3"><Heading3 className="h-3.5 w-3.5" /></ToolbarButton>
				<div className="w-px h-5 bg-border mx-1" />
				<ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list"><List className="h-3.5 w-3.5" /></ToolbarButton>
				<ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered list"><ListOrdered className="h-3.5 w-3.5" /></ToolbarButton>
				<div className="w-px h-5 bg-border mx-1" />
				<ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote"><Quote className="h-3.5 w-3.5" /></ToolbarButton>
				<ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code"><Code className="h-3.5 w-3.5" /></ToolbarButton>
				<div className="w-px h-5 bg-border mx-1" />
				<ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Link"><Link2 className="h-3.5 w-3.5" /></ToolbarButton>
				<ToolbarButton onClick={insertImage} title="Insert image"><ImageIcon className="h-3.5 w-3.5" /></ToolbarButton>
			</div>

			{/* Editor area */}
			<EditorContent editor={editor} />
		</div>
	);
}
