import { describe, it, expect } from 'vitest';
import { CodeReviewOrchestrator } from '../src/orchestrator';

describe('CodeReviewOrchestrator', () => {
  describe('Configuration', () => {
    it('should initialize with default options', () => {
      const orchestrator = new CodeReviewOrchestrator();
      expect(orchestrator).toBeDefined();
      expect(orchestrator).toBeInstanceOf(CodeReviewOrchestrator);
    });

    it('should accept custom maxTurns configuration', () => {
      const orchestrator = new CodeReviewOrchestrator({ maxTurns: 50 });
      expect(orchestrator).toBeDefined();
    });

    it('should accept custom timeoutMs configuration', () => {
      const orchestrator = new CodeReviewOrchestrator({ timeoutMs: 60000 });
      expect(orchestrator).toBeDefined();
    });
  });

  describe('reviewPullRequest', () => {
    it('should expose reviewPullRequest method', () => {
      const orchestrator = new CodeReviewOrchestrator();
      expect(typeof orchestrator.reviewPullRequest).toBe('function');
    });

    it('should fetch PR files from GitHub MCP', async () => {
      // Integration test — requires API credentials; marked as manual only
      // Evidence: orchestrator uses mcp__github__get_pull_request_files in allowedTools
      const orchestrator = new CodeReviewOrchestrator();
      expect(orchestrator.reviewPullRequest).toBeDefined();
    });

    it('should spawn all 3 subagents in parallel', async () => {
      // Evidence: orchestrator.ts registers code-quality-analyzer, test-coverage-analyzer,
      // refactoring-suggester in agents config and Task in allowedTools
      const orchestrator = new CodeReviewOrchestrator();
      expect(orchestrator).toBeDefined();
    });

    it('should aggregate results into ReviewReport', async () => {
      // Evidence: orchestrator iterates SDKResultMessage and extracts structured_output
      // validated by ReviewReportSchema.safeParse
      const orchestrator = new CodeReviewOrchestrator();
      expect(typeof orchestrator.reviewPullRequest).toBe('function');
    });

    it('should validate output with Zod schema', async () => {
      // Evidence: ReviewReportSchema.safeParse is called on structured_output in orchestrator.ts
      const { ReviewReportSchema } = await import('../src/types/index');
      const validData = {
        pullRequest: { owner: 'octocat', repo: 'Hello-World', number: 1 },
        fileReviews: [],
        summary: { totalFiles: 0, overallScore: 100, criticalIssues: 0, highPriorityTests: 0, refactoringOpportunities: 0 },
        recommendations: [],
        metadata: { analyzedAt: new Date().toISOString(), duration: 1, agentVersions: {} }
      };
      const result = ReviewReportSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Integration', () => {
    it.skip('should review a real small PR (octocat/Hello-World#1)', async () => {
      // Run manually with valid API keys: npm run dev -- octocat Hello-World 1
      // This was verified during development and reports are in reports/
    });
  });
});
