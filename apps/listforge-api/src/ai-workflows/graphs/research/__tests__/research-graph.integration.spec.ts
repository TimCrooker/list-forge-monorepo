import { buildResearchGraph } from '../research-graph.builder';
import { ResearchGraphState } from '../research-graph.state';

describe('ResearchGraph Integration', () => {
  it('should build graph without checkpointer', () => {
    const graph = buildResearchGraph();
    expect(graph).toBeDefined();
  });

  it('should build graph with checkpointer', () => {
    const mockCheckpointer = {
      get: jest.fn(),
      put: jest.fn(),
      list: jest.fn(),
      getTuple: jest.fn(),
      putWrites: jest.fn(),
    } as any;

    const graph = buildResearchGraph(mockCheckpointer);
    expect(graph).toBeDefined();
  });

  it('should have all expected nodes', () => {
    const graph = buildResearchGraph();
    const graphNodes = (graph as any).nodes;

    const expectedNodes = [
      'load_context',
      'analyze_media',
      'identify_product',
      'search_comps',
      'analyze_comps',
      'calculate_price',
      'assess_missing',
      'refine_search',
      'persist_results',
    ];

    expectedNodes.forEach((nodeName) => {
      expect(graphNodes).toHaveProperty(nodeName);
    });
  });

  // Note: Full end-to-end tests would require mocking all services and tools
  // This is a structural test to ensure the graph compiles correctly
});
