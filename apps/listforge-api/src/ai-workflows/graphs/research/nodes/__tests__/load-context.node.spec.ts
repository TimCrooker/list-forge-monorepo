import { loadContextNode, ResearchTools } from '../load-context.node';
import { ResearchGraphState, ItemSnapshot } from '../../research-graph.state';

describe('loadContextNode', () => {
  const mockItem: ItemSnapshot = {
    id: 'item-123',
    title: 'Test Item',
    description: 'Test description',
    condition: 'new',
    attributes: [],
    media: [],
    defaultPrice: null,
    lifecycleStatus: 'draft',
    aiReviewState: 'not_reviewed',
  };

  const mockTools: ResearchTools = {
    getItemSnapshot: jest.fn().mockResolvedValue(mockItem),
    getLatestResearch: jest.fn().mockResolvedValue(null),
  };

  const mockState: Partial<ResearchGraphState> = {
    itemId: 'item-123',
    researchRunId: 'run-123',
    organizationId: 'org-123',
  };

  it('should load item snapshot and existing research', async () => {
    const config = { configurable: { tools: mockTools } };
    const result = await loadContextNode(mockState as ResearchGraphState, config);

    expect(result.item).toEqual(mockItem);
    expect(result.existingResearch).toBeNull();
    expect(mockTools.getItemSnapshot).toHaveBeenCalledWith({ itemId: 'item-123' });
    expect(mockTools.getLatestResearch).toHaveBeenCalledWith({ itemId: 'item-123' });
  });

  it('should throw error if tools not provided', async () => {
    await expect(
      loadContextNode(mockState as ResearchGraphState, {}),
    ).rejects.toThrow('ResearchTools not provided');
  });
});
