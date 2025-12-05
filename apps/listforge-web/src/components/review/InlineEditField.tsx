import { useState, useRef, useEffect } from 'react';
import {
  Input,
  Textarea,
  Button,
} from '@listforge/ui';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@listforge/ui';

type FieldType = 'text' | 'textarea' | 'number' | 'price';

interface InlineEditFieldProps {
  value: string | number | null;
  onSave: (value: string | number | null) => Promise<void>;
  type?: FieldType;
  placeholder?: string;
  className?: string;
  displayClassName?: string;
  label?: string;
  emptyText?: string;
  disabled?: boolean;
}

export function InlineEditField({
  value,
  onSave,
  type = 'text',
  placeholder,
  className,
  displayClassName,
  label,
  emptyText = 'Not set',
  disabled = false,
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Reset edit value when value changes
  useEffect(() => {
    if (value !== null && value !== undefined) {
      setEditValue(type === 'price' ? String(value) : String(value));
    } else {
      setEditValue('');
    }
  }, [value, type]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (disabled) return;
    setEditValue(value !== null && value !== undefined ? String(value) : '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value !== null && value !== undefined ? String(value) : '');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let saveValue: string | number | null = editValue.trim();

      if (type === 'number' || type === 'price') {
        if (saveValue === '') {
          saveValue = null;
        } else {
          const num = parseFloat(saveValue);
          if (isNaN(num)) {
            setIsSaving(false);
            return;
          }
          saveValue = num;
        }
      } else if (saveValue === '') {
        saveValue = null;
      }

      await onSave(saveValue);
      setIsEditing(false);
    } catch (error) {
      // Error handling is done in parent
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const formatDisplayValue = () => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground italic">{emptyText}</span>;
    }

    if (type === 'price') {
      return `$${Number(value).toFixed(2)}`;
    }

    return String(value);
  };

  if (isEditing) {
    return (
      <div className={cn('flex items-start gap-2', className)}>
        {type === 'textarea' ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[80px] flex-1"
            disabled={isSaving}
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type === 'price' || type === 'number' ? 'number' : 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1"
            disabled={isSaving}
            step={type === 'price' ? '0.01' : undefined}
          />
        )}
        <div className="flex gap-1 flex-shrink-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 w-8"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4 text-green-600" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-8 w-8"
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group flex items-start gap-2 cursor-pointer rounded-md transition-colors',
        !disabled && 'hover:bg-muted/50',
        className
      )}
      onClick={handleStartEdit}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartEdit();
        }
      }}
    >
      <div className={cn('flex-1', displayClassName)}>
        {label && (
          <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        )}
        <div className={type === 'textarea' ? 'whitespace-pre-wrap' : ''}>
          {formatDisplayValue()}
        </div>
      </div>
      {!disabled && (
        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
      )}
    </div>
  );
}
