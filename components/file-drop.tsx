'use client';

import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FileDropProps {
  onFileSelect: (file: File) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  currentPreview?: string;
  onClear?: () => void;
}

export function FileDrop({
  onFileSelect,
  accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
  maxSize = 5 * 1024 * 1024, // 5MB
  maxFiles = 1,
  disabled = false,
  className,
  currentPreview,
  onClear,
}: FileDropProps) {
  const [preview, setPreview] = React.useState<string | undefined>(
    currentPreview || undefined
  );
  const [error, setError] = React.useState<string | undefined>(undefined);

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      accept,
      maxSize,
      maxFiles,
      disabled,
      onDrop: (acceptedFiles, rejectedFiles) => {
        setError(undefined);

        if (rejectedFiles.length > 0) {
          const file = rejectedFiles[0];
          if (file.errors[0]?.code === 'file-too-large') {
            setError('File is too large (max 5MB)');
          } else if (file.errors[0]?.code === 'file-invalid-type') {
            setError('Invalid file type');
          } else {
            setError('File upload failed');
          }
          return;
        }

        const file = acceptedFiles[0];
        if (file) {
          // Create preview for images
          if (file.type.startsWith('image/')) {
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
          }
          onFileSelect(file);
        }
      },
    });

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(undefined);
    setError(undefined);
    if (onClear) onClear();
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all',
          'hover:border-primary/50 hover:bg-accent/50',
          'ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          isDragActive && !isDragReject && 'border-primary bg-accent',
          isDragReject && 'border-destructive bg-destructive/10',
          disabled && 'cursor-not-allowed opacity-50',
          error && 'border-destructive bg-destructive/5'
        )}
      >
        <Input {...getInputProps()} className="hidden" />

        {preview ? (
          <div className="group relative">
            <div className="size-32 overflow-hidden rounded-lg">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
              />
            </div>
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 size-6 opacity-0 transition-opacity group-hover:opacity-100 hover:!bg-destructive hover:!text-white"
                onClick={handleClear}
              >
                <X className="size-3" />
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div
              className={cn(
                'flex size-12 items-center justify-center rounded-full transition-colors',
                isDragActive && !isDragReject
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary/10 text-primary'
              )}
            >
              {isDragActive ? (
                <Upload className="size-5 animate-bounce" />
              ) : (
                <ImageIcon className="size-5" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {isDragActive
                  ? 'Drop the image here'
                  : 'Drag & drop an image, or click to browse'}
              </p>
              <p className="text-muted-foreground text-xs">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-destructive mt-2 text-xs">{error}</p>}
    </div>
  );
}
