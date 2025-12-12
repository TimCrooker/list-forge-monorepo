/**
 * Research Graph Tools - Slice 3 + Slice 4
 *
 * Utility tools for research graph operations
 */

export {
  validateComp,
  validateAllComps,
  getValidationSummary,
  type ItemValidationContext,
  type ValidationConfig,
} from './validate-comp.tool';

// Slice 4: Category Detection
export {
  detectCategory,
  createDetectCategoryTool,
  DetectCategoryToolSchema,
  type DetectCategoryInput,
  type DetectCategoryOutput,
} from './detect-category.tool';
