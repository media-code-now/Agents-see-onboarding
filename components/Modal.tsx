'use client';

import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div 
        className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-zinc-900/95 backdrop-blur-2xl shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-8 py-6">
          <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-white hover:scale-110"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[calc(90vh-8rem)] overflow-y-auto px-8 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
