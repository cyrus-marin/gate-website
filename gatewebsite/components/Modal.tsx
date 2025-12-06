'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="overflow-hidden rounded-xl border border-monokai-gray bg-monokai-bg shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-monokai-gray px-6 py-4">
                        <h2 className="text-xl font-bold text-monokai-fg">{title}</h2>
                        <button
                            onClick={onClose}
                            className="rounded-full p-1 text-monokai-gray hover:bg-monokai-gray/20 hover:text-monokai-fg transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="max-h-[80vh] overflow-y-auto px-6 py-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
