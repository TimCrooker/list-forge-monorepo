import { toast } from 'sonner';

/**
 * Utility functions for showing toast notifications
 * Error toasts are automatically handled by RTK Query baseQueryWithErrorHandling
 * Use these functions for success messages and manual error handling
 */

export const showSuccess = (message: string, description?: string) => {
  toast.success(message, description ? { description } : undefined);
};

export const showError = (message: string, description?: string) => {
  toast.error(message, description ? { description } : undefined);
};

export const showInfo = (message: string, description?: string) => {
  toast.info(message, description ? { description } : undefined);
};

export const showLoading = (message: string) => {
  return toast.loading(message);
};

export const dismissToast = (toastId: string | number) => {
  toast.dismiss(toastId);
};

