import * as React from 'react'
import {
  FileText,
  Image,
  Search,
  Tag,
  Barcode,
  TrendingUp,
  DollarSign,
  BarChart3,
  Save,
  Edit,
  Brain,
  HelpCircle,
  Scan,
  FolderTree,
  ClipboardList, // Slice 6
} from 'lucide-react'
import type { AgentOperationType, GroupedOperation } from '@listforge/core-types'
import LoadContextRenderer from './load-context-renderer'
import MediaAnalysisRenderer from './media-analysis-renderer'
import OCRRenderer from './ocr-renderer'
import WebSearchRenderer from './web-search-renderer'
import ProductIdRenderer from './product-id-renderer'
import UPCLookupRenderer from './upc-lookup-renderer'
import CategoryDetectionRenderer from './category-detection-renderer'
import CompSearchRenderer from './comp-search-renderer'
import CompAnalysisRenderer from './comp-analysis-renderer'
import PriceCalcRenderer from './price-calc-renderer'
import ListingAssemblyRenderer from './listing-assembly-renderer' // Slice 6
import ItemUpdateRenderer from './item-update-renderer'
import PersistResultsRenderer from './persist-results-renderer'
import ReasoningRenderer from './reasoning-renderer'
import DefaultRenderer from './default-renderer'

/**
 * Icon mapping for operation types
 */
const operationIcons: Record<AgentOperationType, React.ElementType> = {
  load_context: FileText,
  media_analysis: Image,
  ocr_extraction: Scan, // Slice 2
  web_search: Search,
  product_identification: Tag,
  upc_lookup: Barcode,
  category_detection: FolderTree, // Slice 4
  comp_search: TrendingUp,
  comp_analysis: BarChart3,
  price_calculation: DollarSign,
  demand_analysis: BarChart3,
  listing_assembly: ClipboardList, // Slice 6
  item_update: Edit,
  persist_results: Save,
  reasoning: Brain,
}

/**
 * Human-readable labels for operation types
 */
const operationLabels: Record<AgentOperationType, string> = {
  load_context: 'Loading Context',
  media_analysis: 'Analyzing Media',
  ocr_extraction: 'Text Extraction', // Slice 2
  web_search: 'Web Search',
  product_identification: 'Product Identification',
  upc_lookup: 'UPC Lookup',
  category_detection: 'Detecting Category', // Slice 4
  comp_search: 'Finding Comparables',
  comp_analysis: 'Analyzing Comparables',
  price_calculation: 'Calculating Price',
  demand_analysis: 'Analyzing Demand',
  listing_assembly: 'Assembling Listing', // Slice 6
  item_update: 'Updating Item',
  persist_results: 'Saving Results',
  reasoning: 'AI Reasoning',
}

/**
 * Get the icon component for an operation type
 */
export function getOperationIcon(type: AgentOperationType): React.ElementType {
  return operationIcons[type] || HelpCircle
}

/**
 * Get the human-readable label for an operation type
 */
export function getOperationLabel(type: AgentOperationType): string {
  return operationLabels[type] || type
}

/**
 * Renderer component type
 */
export interface OperationRendererProps {
  operation: GroupedOperation
}

/**
 * Get the renderer component for an operation type
 */
export function getOperationRenderer(
  type: AgentOperationType
): React.ComponentType<OperationRendererProps> {
  switch (type) {
    case 'load_context':
      return LoadContextRenderer
    case 'media_analysis':
      return MediaAnalysisRenderer
    case 'ocr_extraction': // Slice 2
      return OCRRenderer
    case 'web_search':
      return WebSearchRenderer
    case 'product_identification':
      return ProductIdRenderer
    case 'upc_lookup': // Slice 2 - now has dedicated renderer
      return UPCLookupRenderer
    case 'category_detection': // Slice 4
      return CategoryDetectionRenderer
    case 'comp_search':
      return CompSearchRenderer
    case 'comp_analysis':
      return CompAnalysisRenderer
    case 'price_calculation':
      return PriceCalcRenderer
    case 'listing_assembly': // Slice 6
      return ListingAssemblyRenderer
    case 'item_update':
      return ItemUpdateRenderer
    case 'persist_results':
      return PersistResultsRenderer
    case 'reasoning':
      return ReasoningRenderer
    // demand_analysis uses default renderer
    default:
      return DefaultRenderer
  }
}
