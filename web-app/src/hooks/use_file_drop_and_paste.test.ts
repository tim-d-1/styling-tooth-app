import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileDropAndPaste } from './useFileDropAndPaste';

describe('useFileDropAndPaste', () => {
  it('initializes with isDragging false', () => {
    const handleFileSelect = vi.fn();
    const { result } = renderHook(() =>
      useFileDropAndPaste({ onFileSelect: handleFileSelect })
    );

    expect(result.current.isDragging).toBe(false);
  });

  it('updates isDragging on drag enter, over, and leave', () => {
    const handleFileSelect = vi.fn();
    const { result } = renderHook(() =>
      useFileDropAndPaste({ onFileSelect: handleFileSelect })
    );

    act(() => {
      result.current.dragProps.onDragEnter({
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: { items: [{ kind: 'file' }] },
      } as never);
    });

    expect(result.current.isDragging).toBe(true);

    act(() => {
      result.current.dragProps.onDragLeave({
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as never);
    });

    expect(result.current.isDragging).toBe(false);
  });

  it('handles drop event with valid accepted image file', () => {
    const handleFileSelect = vi.fn();
    const { result } = renderHook(() =>
      useFileDropAndPaste({ onFileSelect: handleFileSelect, accept: 'image/*' })
    );

    const validFile = new File(['dummy'], 'avatar.png', { type: 'image/png' });

    act(() => {
      result.current.dragProps.onDrop({
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: { files: [validFile] },
      } as never);
    });

    expect(handleFileSelect).toHaveBeenCalledWith(validFile);
    expect(result.current.isDragging).toBe(false);
  });

  it('ignores drop event with rejected file type', () => {
    const handleFileSelect = vi.fn();
    const { result } = renderHook(() =>
      useFileDropAndPaste({ onFileSelect: handleFileSelect, accept: 'image/*' })
    );

    const textFile = new File(['text'], 'notes.txt', { type: 'text/plain' });

    act(() => {
      result.current.dragProps.onDrop({
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: { files: [textFile] },
      } as never);
    });

    expect(handleFileSelect).not.toHaveBeenCalled();
  });

  it('handles paste event with image from clipboard items', () => {
    const handleFileSelect = vi.fn();
    const { result } = renderHook(() =>
      useFileDropAndPaste({ onFileSelect: handleFileSelect, accept: 'image/*' })
    );

    const pastedFile = new File(['pasted'], 'clip.png', { type: 'image/png' });
    const preventDefault = vi.fn();

    act(() => {
      result.current.handlePaste({
        preventDefault,
        clipboardData: {
          items: [
            {
              kind: 'file',
              getAsFile: () => pastedFile,
            },
          ],
        },
      } as never);
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(handleFileSelect).toHaveBeenCalledWith(pastedFile);
  });

  it('handles paste event with files array on clipboardData', () => {
    const handleFileSelect = vi.fn();
    const { result } = renderHook(() =>
      useFileDropAndPaste({ onFileSelect: handleFileSelect, accept: 'image/*' })
    );

    const pastedFile = new File(['pasted'], 'clip.jpg', { type: 'image/jpeg' });
    const preventDefault = vi.fn();

    act(() => {
      result.current.handlePaste({
        preventDefault,
        clipboardData: {
          items: [],
          files: [pastedFile],
        },
      } as never);
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(handleFileSelect).toHaveBeenCalledWith(pastedFile);
  });

  it('ignores events when disabled', () => {
    const handleFileSelect = vi.fn();
    const { result } = renderHook(() =>
      useFileDropAndPaste({
        onFileSelect: handleFileSelect,
        disabled: true,
      })
    );

    const file = new File(['dummy'], 'avatar.png', { type: 'image/png' });

    act(() => {
      result.current.dragProps.onDrop({
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: { files: [file] },
      } as never);
    });

    expect(handleFileSelect).not.toHaveBeenCalled();
    expect(result.current.isDragging).toBe(false);
  });

  it('accepts specific extensions like .pdf in documents mode', () => {
    const handleFileSelect = vi.fn();
    const { result } = renderHook(() =>
      useFileDropAndPaste({
        onFileSelect: handleFileSelect,
        accept: 'image/*,application/pdf,.pdf',
      })
    );

    const pdfFile = new File(['%PDF-1.4'], 'passport.pdf', { type: 'application/pdf' });

    act(() => {
      result.current.dragProps.onDrop({
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: { files: [pdfFile] },
      } as never);
    });

    expect(handleFileSelect).toHaveBeenCalledWith(pdfFile);
  });
});
