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
 * DTO for an evidence bundle (collection of evidence for an item)
 * Phase 6: Links to Item and ItemResearchRun
 */
export interface EvidenceBundleDto {
  id: string;
  itemId: string | null;
  researchRunId: string | null;
  generatedAt: string;
  items: EvidenceItemDto[];
}

/**
 * Response for getting evidence for a draft
 */
export interface GetEvidenceResponse {
  bundle: EvidenceBundleDto | null;
}
