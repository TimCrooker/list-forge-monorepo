import {
  EvidenceItemType,
  EvidenceItemData,
} from '@listforge/core-types';

/**
 * DTO for an evidence item
 */
export interface EvidenceItemDto {
  id: string;
  type: EvidenceItemType;
  data: EvidenceItemData;
  createdAt: string;
}

/**
 * DTO for an evidence bundle (collection of evidence for a draft)
 */
export interface EvidenceBundleDto {
  id: string;
  listingDraftId: string;
  generatedAt: string;
  items: EvidenceItemDto[];
}

/**
 * Response for getting evidence for a draft
 */
export interface GetEvidenceResponse {
  bundle: EvidenceBundleDto | null;
}
