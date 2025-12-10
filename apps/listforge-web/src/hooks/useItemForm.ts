import { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useDropzone } from 'react-dropzone';
import { useCreateManualItemMutation } from '@listforge/api-rtk';
import { showSuccess, showError } from '@/utils/toast';
import type { ItemAttribute } from '@listforge/core-types';

export interface UseItemFormReturn {
  // Photo state
  files: File[];
  previews: string[];
  draggedIndex: number | null;
  setDraggedIndex: (index: number | null) => void;
  dropzoneProps: ReturnType<typeof useDropzone>;
  removeFile: (index: number) => void;
  handleDragStart: (index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDragEnd: () => void;

  // Core details
  title: string;
  setTitle: (value: string) => void;
  subtitle: string;
  setSubtitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  condition: string;
  setCondition: (value: string) => void;

  // Pricing & inventory
  defaultPrice: string;
  setDefaultPrice: (value: string) => void;
  quantity: string;
  setQuantity: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  costBasis: string;
  setCostBasis: (value: string) => void;

  // Shipping
  shippingType: string;
  setShippingType: (value: string) => void;
  flatRateAmount: string;
  setFlatRateAmount: (value: string) => void;
  domesticOnly: boolean;
  setDomesticOnly: (value: boolean) => void;

  // Advanced
  showAdvanced: boolean;
  setShowAdvanced: (value: boolean) => void;
  categoryPath: string;
  setCategoryPath: (value: string) => void;
  attributes: ItemAttribute[];
  newAttrKey: string;
  setNewAttrKey: (value: string) => void;
  newAttrValue: string;
  setNewAttrValue: (value: string) => void;
  addAttribute: () => void;
  removeAttribute: (index: number) => void;

  // Validation
  validationErrors: string[];

  // Form submission
  isSubmitting: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

/**
 * Custom hook for managing item creation form state and logic
 *
 * Handles all form fields, photo uploads, validation, and submission
 * for the manual item creation flow.
 *
 * @example
 * ```tsx
 * const form = useItemForm();
 *
 * return (
 *   <form onSubmit={form.handleSubmit}>
 *     <Input value={form.title} onChange={(e) => form.setTitle(e.target.value)} />
 *     // ... more fields
 *     <Button type="submit" disabled={form.isSubmitting}>Create</Button>
 *   </form>
 * );
 * ```
 */
export function useItemForm(): UseItemFormReturn {
  const navigate = useNavigate();
  const [createItem, { isLoading: isSubmitting }] = useCreateManualItemMutation();

  // Photo state
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Core details
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('');

  // Pricing & inventory
  const [defaultPrice, setDefaultPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [location, setLocation] = useState('');
  const [costBasis, setCostBasis] = useState('');

  // Shipping
  const [shippingType, setShippingType] = useState('');
  const [flatRateAmount, setFlatRateAmount] = useState('');
  const [domesticOnly, setDomesticOnly] = useState(true);

  // Category & attributes
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [categoryPath, setCategoryPath] = useState('');
  const [attributes, setAttributes] = useState<ItemAttribute[]>([]);
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrValue, setNewAttrValue] = useState('');

  // Form validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Photo upload handlers
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
    const newPreviews = acceptedFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  }, []);

  const dropzoneProps = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic'],
    },
    onDrop,
  });

  const removeFile = useCallback((index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }, [previews]);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
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
  }, [draggedIndex, files, previews]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  // Attribute handlers
  const addAttribute = useCallback(() => {
    if (!newAttrKey.trim() || !newAttrValue.trim()) return;

    setAttributes((prev) => [
      ...prev,
      {
        key: newAttrKey.trim(),
        value: newAttrValue.trim(),
        source: 'user',
      },
    ]);
    setNewAttrKey('');
    setNewAttrValue('');
  }, [newAttrKey, newAttrValue]);

  const removeAttribute = useCallback((index: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Form validation
  const validateForm = useCallback((): boolean => {
    const errors: string[] = [];

    if (!title.trim()) {
      errors.push('Title is required');
    }
    if (!description.trim()) {
      errors.push('Description is required');
    }
    if (!condition) {
      errors.push('Condition is required');
    }
    if (defaultPrice && parseFloat(defaultPrice) < 0) {
      errors.push('Price must be non-negative');
    }
    if (quantity && parseInt(quantity, 10) < 1) {
      errors.push('Quantity must be at least 1');
    }
    if (shippingType === 'flat' && !flatRateAmount) {
      errors.push('Flat rate amount is required when using flat rate shipping');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [title, description, condition, defaultPrice, quantity, shippingType, flatRateAmount]);

  // Form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError('Please fix the validation errors');
      return;
    }

    try {
      const formData = new FormData();

      // Add photos
      files.forEach((file) => {
        formData.append('photos', file);
      });

      // Add core fields
      formData.append('title', title.trim());
      if (subtitle.trim()) {
        formData.append('subtitle', subtitle.trim());
      }
      formData.append('description', description.trim());
      formData.append('condition', condition);

      // Add pricing & inventory
      if (defaultPrice) {
        formData.append('defaultPrice', defaultPrice);
      }
      formData.append('quantity', quantity);
      if (location.trim()) {
        formData.append('location', location.trim());
      }
      if (costBasis) {
        formData.append('costBasis', costBasis);
      }

      // Add shipping
      if (shippingType) {
        formData.append('shippingType', shippingType);
      }
      if (shippingType === 'flat' && flatRateAmount) {
        formData.append('flatRateAmount', flatRateAmount);
      }
      formData.append('domesticOnly', String(domesticOnly));

      // Add category
      if (categoryPath.trim()) {
        const pathArray = categoryPath.split('>').map((s) => s.trim());
        formData.append('categoryPath', JSON.stringify(pathArray));
      }

      // Add attributes
      if (attributes.length > 0) {
        formData.append('attributes', JSON.stringify(attributes));
      }

      const result = await createItem(formData).unwrap();

      showSuccess('Item created and added to inventory');
      navigate({ to: '/items/$id', params: { id: result.item.id } });
    } catch (err) {
      console.error('Failed to create item:', err);
      showError('Failed to create item');
    }
  }, [
    validateForm,
    files,
    title,
    subtitle,
    description,
    condition,
    defaultPrice,
    quantity,
    location,
    costBasis,
    shippingType,
    flatRateAmount,
    domesticOnly,
    categoryPath,
    attributes,
    createItem,
    navigate,
  ]);

  return {
    // Photo state
    files,
    previews,
    draggedIndex,
    setDraggedIndex,
    dropzoneProps,
    removeFile,
    handleDragStart,
    handleDragOver,
    handleDragEnd,

    // Core details
    title,
    setTitle,
    subtitle,
    setSubtitle,
    description,
    setDescription,
    condition,
    setCondition,

    // Pricing & inventory
    defaultPrice,
    setDefaultPrice,
    quantity,
    setQuantity,
    location,
    setLocation,
    costBasis,
    setCostBasis,

    // Shipping
    shippingType,
    setShippingType,
    flatRateAmount,
    setFlatRateAmount,
    domesticOnly,
    setDomesticOnly,

    // Advanced
    showAdvanced,
    setShowAdvanced,
    categoryPath,
    setCategoryPath,
    attributes,
    newAttrKey,
    setNewAttrKey,
    newAttrValue,
    setNewAttrValue,
    addAttribute,
    removeAttribute,

    // Validation
    validationErrors,

    // Form submission
    isSubmitting,
    handleSubmit,
  };
}
