import { Card, CardContent, CardHeader, CardTitle, cn } from '@listforge/ui';
import { Upload, X, GripVertical } from 'lucide-react';
import type { DropzoneOptions } from 'react-dropzone';

interface ItemPhotoUploadProps {
  files: File[];
  previews: string[];
  draggedIndex: number | null;
  dropzoneProps: {
    getRootProps: () => any;
    getInputProps: () => any;
    isDragActive: boolean;
  };
  onRemoveFile: (index: number) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
}

/**
 * ItemPhotoUpload - Photo upload component with drag-and-drop reordering
 *
 * Handles photo upload via dropzone and allows users to reorder photos
 * with drag-and-drop. First photo is automatically marked as primary.
 */
export function ItemPhotoUpload({
  files,
  previews,
  draggedIndex,
  dropzoneProps,
  onRemoveFile,
  onDragStart,
  onDragOver,
  onDragEnd,
}: ItemPhotoUploadProps) {
  const { getRootProps, getInputProps, isDragActive } = dropzoneProps;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50',
            files.length > 0 && 'p-4'
          )}
        >
          <input {...getInputProps()} />
          {files.length === 0 ? (
            <>
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">
                {isDragActive ? 'Drop photos here' : 'Drag & drop photos here'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to select files
              </p>
            </>
          ) : (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4" />
              Add more photos
            </div>
          )}
        </div>

        {previews.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {previews.map((preview, index) => (
              <div
                key={index}
                className={cn(
                  'relative group aspect-square rounded-lg overflow-hidden bg-muted',
                  draggedIndex === index && 'opacity-50'
                )}
                draggable
                onDragStart={() => onDragStart(index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDragEnd={onDragEnd}
              >
                <img
                  src={preview}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1 left-1 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                  <GripVertical className="h-3 w-3 text-white" />
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveFile(index)}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                {index === 0 && (
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded">
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
