import { classifyError, retryWithBackoff, withRetry } from '../error-handling';

describe('Error Handling Utilities', () => {
  describe('classifyError', () => {
    it('should classify network errors as retryable', () => {
      const error = new Error('ECONNREFUSED');
      const classification = classifyError(error);

      expect(classification.isRetryable).toBe(true);
      expect(classification.category).toBe('network');
    });

    it('should classify rate limit errors as retryable', () => {
      const error = { status: 429, message: 'Too many requests' };
      const classification = classifyError(error);

      expect(classification.isRetryable).toBe(true);
      expect(classification.category).toBe('rate_limit');
    });

    it('should classify validation errors as non-retryable', () => {
      const error = { status: 400, message: 'Invalid input' };
      const classification = classifyError(error);

      expect(classification.isRetryable).toBe(false);
      expect(classification.category).toBe('validation');
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first try', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn, { maxRetries: 3, useCircuitBreaker: false });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on transient failures', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('ETIMEDOUT'))
        .mockResolvedValue('success');

      const result = await retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelay: 10,
        useCircuitBreaker: false
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry validation errors', async () => {
      const fn = jest.fn().mockRejectedValue({ status: 400, message: 'Bad request' });

      await expect(
        retryWithBackoff(fn, { maxRetries: 3, useCircuitBreaker: false })
      ).rejects.toMatchObject({ status: 400 });

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should fail after max retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        retryWithBackoff(fn, {
          maxRetries: 2,
          initialDelay: 10,
          useCircuitBreaker: false
        })
      ).rejects.toThrow('Network error');

      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('withRetry', () => {
    it('should create a retryable function', async () => {
      const fn = jest.fn().mockResolvedValue(42);
      const retryableFn = withRetry(fn, 'test', { maxRetries: 3, useCircuitBreaker: false });

      const result = await retryableFn('arg1', 'arg2');

      expect(result).toBe(42);
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });
});
