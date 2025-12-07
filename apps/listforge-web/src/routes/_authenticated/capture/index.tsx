import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  useCreateAiCaptureItemMutation,
  useListItemsQuery,
  useOrgRoom,
  useMeQuery,
} from '@listforge/api-rtk';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  Badge,
  Skeleton,
} from '@listforge/ui';
import {
  Upload,
  Camera,
  Loader2,
  X,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { cn } from '@listforge/ui';

export const Route = createFileRoute('/_authenticated/capture/')({
  component: CapturePage,
});

function CapturePage() {
  const navigate = useNavigate();
  const [createItem, { isLoading: isCreating }] = useCreateAiCaptureItemMutation();
  const { data: recentItems, isLoading: isLoadingItems } = useListItemsQuery({
    source: ['ai_capture'],
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    pageSize: 10,
  });

  // Get current org for socket subscription
  const { data: meData } = useMeQuery();
  const currentOrgId = meData?.currentOrg?.id;

  // Subscribe to org room for real-time updates on new items and status changes
  useOrgRoom(currentOrgId);

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [titleHint, setTitleHint] = useState('');
  const [descriptionHint, setDescriptionHint] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
    const newPreviews = acceptedFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic'],
    },
    onDrop,
  });

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFiles = [...files];
    const newPreviews = [...previews];

    const [draggedFile] = newFiles.splice(draggedIndex, 1);
    const [draggedPreview] = newPreviews.splice(draggedIndex, 1);

    newFiles.splice(index, 0, draggedFile);
    newPreviews.splice(index, 0, draggedPreview);

    setFiles(newFiles);
    setPreviews(newPreviews);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('photos', file);
      });
      if (titleHint.trim()) {
        formData.append('userTitleHint', titleHint.trim());
      }
      if (descriptionHint.trim()) {
        formData.append('userDescriptionHint', descriptionHint.trim());
      }

      await createItem(formData).unwrap();

      // Clear form
      previews.forEach((p) => URL.revokeObjectURL(p));
      setFiles([]);
      setPreviews([]);
      setTitleHint('');
      setDescriptionHint('');

      showSuccess('Item captured! AI is researching in the background.');
    } catch (err) {
      console.error('Failed to create draft:', err);
    }
  };

  const getStatusBadge = (lifecycleStatus: string, aiReviewState: string) => {
    if (lifecycleStatus === 'ready' && aiReviewState === 'approved') {
      return (
        <Badge variant="default" className="gap-1 bg-green-600">
          <CheckCircle className="h-3 w-3" />
          Ready
        </Badge>
      );
    }
    if (lifecycleStatus === 'draft' && aiReviewState === 'rejected') {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Needs Work
        </Badge>
      );
    }
    if (lifecycleStatus === 'draft' && aiReviewState === 'pending') {
      return (
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          Ready for Review
        </Badge>
      );
    }
    if (lifecycleStatus === 'listed') {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          Listed
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3 animate-pulse" />
        AI Processing
      </Badge>
    );
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="text-center pt-4">
        <h1 className="text-2xl font-bold">Capture Items</h1>
        <p className="text-muted-foreground mt-1">
          Snap photos and let AI do the research
        </p>
      </div>

      {/* Capture Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Photo Upload Zone */}
        <Card>
          <CardContent className="pt-6">
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                isDragActive
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50',
                files.length > 0 && 'p-4'
              )}
            >
              <input {...getInputProps()} />
              {files.length === 0 ? (
                <>
                  <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-lg font-medium">
                    {isDragActive ? 'Drop photos here' : 'Add Photos'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Drag & drop or tap to select
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Upload className="h-4 w-4" />
                  Add more photos
                </div>
              )}
            </div>

            {/* Photo Thumbnails */}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                {previews.map((preview, index) => (
                  <div
                    key={index}
                    className={cn(
                      'relative group aspect-square rounded-lg overflow-hidden bg-muted',
                      draggedIndex === index && 'opacity-50'
                    )}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <img
                      src={preview}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Drag handle */}
                    <div className="absolute top-1 left-1 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                      <GripVertical className="h-3 w-3 text-white" />
                    </div>
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {/* Primary badge */}
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

        {/* Hints Section (Collapsible) */}
        <Card>
          <CardHeader
            className="cursor-pointer py-3"
            onClick={() => setShowHints(!showHints)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">
                Add Details (Optional)
              </CardTitle>
              {showHints ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          {showHints && (
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titleHint">What is this?</Label>
                <Input
                  id="titleHint"
                  value={titleHint}
                  onChange={(e) => setTitleHint(e.target.value)}
                  placeholder="e.g., Vintage Canon AE-1 Camera"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionHint">Additional details</Label>
                <Textarea
                  id="descriptionHint"
                  value={descriptionHint}
                  onChange={(e) => setDescriptionHint(e.target.value)}
                  placeholder="e.g., Works perfectly, includes original lens and case"
                  rows={3}
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full h-14 text-lg"
          disabled={files.length === 0 || isCreating}
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Capturing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Capture Item
            </>
          )}
        </Button>
      </form>

      {/* Recent Captures */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Recent Captures</h2>
        {isLoadingItems ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : recentItems?.items.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No items captured yet</p>
              <p className="text-sm">Start by adding photos above</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentItems?.items.map((item) => (
              <Card
                key={item.id}
                className="hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate({ to: '/items/$id', params: { id: item.id } })}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {/* Thumbnail */}
                    <div className="h-14 w-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {item.primaryImageUrl ? (
                        <img
                          src={item.primaryImageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Camera className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {item.title || 'Untitled Item'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(item.lifecycleStatus, item.aiReviewState)}
                        {item.defaultPrice && (
                          <span className="text-sm text-muted-foreground">
                            ${item.defaultPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
