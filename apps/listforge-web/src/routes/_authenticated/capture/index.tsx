import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useCallback, useEffect } from 'react';
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
  AppContent,
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
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      setShowHints(false);

      showSuccess('Item captured! AI is researching in the background.');
    } catch (err) {
      console.error('Failed to create draft:', err);
    }
  };

  const getStatusBadge = (lifecycleStatus: string, aiReviewState: string) => {
    if (lifecycleStatus === 'ready' && aiReviewState === 'approved') {
      return (
        <Badge variant="default" className="gap-1 bg-green-600 text-xs">
          <CheckCircle className="h-3 w-3" />
          Ready
        </Badge>
      );
    }
    if (lifecycleStatus === 'draft' && aiReviewState === 'rejected') {
      return (
        <Badge variant="destructive" className="gap-1 text-xs">
          <AlertCircle className="h-3 w-3" />
          Needs Work
        </Badge>
      );
    }
    if (lifecycleStatus === 'draft' && aiReviewState === 'pending') {
      return (
        <Badge variant="secondary" className="gap-1 text-xs">
          <Sparkles className="h-3 w-3" />
          Ready for Review
        </Badge>
      );
    }
    if (lifecycleStatus === 'draft' && aiReviewState === 'researching') {
      return (
        <Badge variant="outline" className="gap-1 text-xs">
          <Loader2 className="h-3 w-3 animate-spin" />
          Researching...
        </Badge>
      );
    }
    if (lifecycleStatus === 'listed') {
      return (
        <Badge variant="default" className="gap-1 text-xs">
          <CheckCircle className="h-3 w-3" />
          Listed
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 text-xs">
        <Clock className="h-3 w-3 animate-pulse" />
        AI Processing
      </Badge>
    );
  };

  return (
    <AppContent
      title={isMobile ? "Capture" : "Capture Items"}
      description={isMobile ? undefined : "Snap photos and let AI do the research"}
      className={cn("mx-auto", isMobile ? "max-w-full px-0" : "max-w-2xl")}
    >
      {/* Capture Form */}
      <form onSubmit={handleSubmit} className={cn("space-y-4", isMobile && "px-4")}>
        {/* Photo Upload Zone */}
        <Card className={isMobile ? "border-0 rounded-lg" : ""}>
          <CardContent className={cn(isMobile ? "p-4" : "pt-6")}>
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-xl text-center cursor-pointer transition-all',
                isDragActive
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50',
                files.length > 0 ? 'p-3' : (isMobile ? 'p-12' : 'p-8')
              )}
            >
              <input {...getInputProps()} />
              {files.length === 0 ? (
                <>
                  <div className={cn(
                    "mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3",
                    isMobile ? "h-20 w-20" : "h-16 w-16"
                  )}>
                    <Camera className={cn("text-primary", isMobile ? "h-10 w-10" : "h-8 w-8")} />
                  </div>
                  <p className={cn("font-medium", isMobile ? "text-xl mb-1" : "text-lg")}>
                    {isDragActive ? 'Drop photos here' : 'Add Photos'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isMobile ? 'Tap to select photos' : 'Drag & drop or tap to select'}
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
              <div className={cn(
                "grid gap-3 mt-4",
                isMobile ? "grid-cols-2" : "grid-cols-3 sm:grid-cols-4"
              )}>
                {previews.map((preview, index) => (
                  <div
                    key={index}
                    className={cn(
                      'relative group aspect-square rounded-lg overflow-hidden bg-muted',
                      draggedIndex === index && 'opacity-50'
                    )}
                    draggable={!isMobile}
                    onDragStart={() => !isMobile && handleDragStart(index)}
                    onDragOver={(e) => !isMobile && handleDragOver(e, index)}
                    onDragEnd={() => !isMobile && handleDragEnd()}
                  >
                    <img
                      src={preview}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Drag handle - desktop only */}
                    {!isMobile && (
                      <div className="absolute top-1 left-1 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                        <GripVertical className="h-3 w-3 text-white" />
                      </div>
                    )}
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className={cn(
                        "absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full transition-opacity",
                        isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}
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

        {/* Hints Section - Hidden on mobile by default */}
        {!isMobile && (
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
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className={cn(
            "w-full font-medium",
            isMobile ? "h-16 text-lg sticky bottom-4 shadow-lg" : "h-14 text-lg"
          )}
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
              Capture Item ({files.length} photo{files.length !== 1 ? 's' : ''})
            </>
          )}
        </Button>
      </form>

      {/* Recent Captures - Hide on mobile when photos selected */}
      {(!isMobile || files.length === 0) && (
        <div className={cn("space-y-3", isMobile ? "px-4 pb-4" : "")}>
          <h2 className={cn("font-semibold", isMobile ? "text-base" : "text-lg")}>
            Recent Captures
          </h2>
          {isLoadingItems ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : recentItems?.items.length === 0 ? (
            <Card className={isMobile ? "border-0 shadow-sm" : ""}>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No items captured yet</p>
                <p className="text-sm">Start by adding photos above</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentItems?.items.slice(0, isMobile ? 5 : 10).map((item) => (
                <Card
                  key={item.id}
                  className={cn(
                    "hover:bg-muted/50 transition-colors cursor-pointer",
                    isMobile && "border-0 shadow-sm"
                  )}
                  onClick={() => navigate({ to: '/items/$id', params: { id: item.id } })}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      {/* Thumbnail */}
                      <div className={cn(
                        "rounded-lg bg-muted overflow-hidden flex-shrink-0",
                        isMobile ? "h-16 w-16" : "h-14 w-14"
                      )}>
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
                        <p className={cn(
                          "font-medium truncate",
                          isMobile ? "text-base" : "text-sm"
                        )}>
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
      )}
    </AppContent>
  );
}
