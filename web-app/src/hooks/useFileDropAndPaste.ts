import { useState, useRef, type DragEvent, type ClipboardEvent } from 'react';

export interface UseFileDropAndPasteOptions {
  onFileSelect: (file: File) => void;
  accept?: string;
  disabled?: boolean;
}

export function useFileDropAndPaste({
  onFileSelect,
  accept = 'image/*',
  disabled = false,
}: UseFileDropAndPasteOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const isAccepted = (file: File): boolean => {
    if (!accept || accept === '*' || accept === '*/*') return true;
    const acceptTypes = accept.split(',').map((t) => t.trim().toLowerCase());
    const fileType = (file.type || '').toLowerCase();
    const fileName = (file.name || '').toLowerCase();

    return acceptTypes.some((type) => {
      if (type.startsWith('.')) {
        return fileName.endsWith(type);
      }
      if (type.endsWith('/*')) {
        const prefix = type.slice(0, -1);
        return fileType.startsWith(prefix);
      }
      return fileType === type;
    });
  };

  const handleDragEnter = (e: DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (isAccepted(files[i])) {
          onFileSelect(files[i]);
          break;
        }
      }
    }
  };

  const handlePaste = (e: ClipboardEvent | globalThis.ClipboardEvent) => {
    if (disabled) return;
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file && isAccepted(file)) {
            e.preventDefault();
            onFileSelect(file);
            return;
          }
        }
      }
    }

    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (isAccepted(files[i])) {
          e.preventDefault();
          onFileSelect(files[i]);
          return;
        }
      }
    }
  };

  return {
    isDragging,
    dragProps: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      onPaste: handlePaste,
    },
    handlePaste,
  };
}
