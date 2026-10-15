import { describe, it, expect } from 'vitest';
import { ReportGenerator } from '../src/utils/report-generator';
import { RateLimiter } from '../src/utils/rate-limiter';
import { withRetry, withTimeout, ReviewError, ErrorCodes } from '../src/utils/error-handler';
import type { ReviewReport } from '../src/types/report-types';

const baseReport: ReviewReport = {
  pullRequest: { owner: 'octocat', repo: 'Hello-World', number: 1 },
  fileReviews: [],
  summary: { totalFiles: 0, overallScore: 100, criticalIssues: 0, highPriorityTests: 0, refactoringOpportunities: 0 },
  recommendations: [],
  metadata: { analyzedAt: new Date().toISOString(), duration: 1, agentVersions: {} }
};

describe('ReportGenerator', () => {
  const generator = new ReportGenerator();

  it('generates JSON report containing PR info', () => {
    const json = generator.generateJSONReport(baseReport);
    expect(json).toContain('Hello-World');
    expect(json).toContain('octocat');
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('generates Markdown report with expected header', () => {
    const md = generator.generateMarkdownReport(baseReport);
    expect(md).toContain('Code Review Report');
    expect(md).toContain('Overall Score');
  });

  it('generates HTML report with valid HTML structure', () => {
    const html = generator.generateHTMLReport(baseReport);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Code Review Report');
    expect(html).toContain('</html>');
  });

  it('includes summary metrics in Markdown', () => {
    const report: ReviewReport = {
      ...baseReport,
      summary: { totalFiles: 3, overallScore: 72, criticalIssues: 2, highPriorityTests: 5, refactoringOpportunities: 4 }
    };
    const md = generator.generateMarkdownReport(report);
    expect(md).toContain('72');
    expect(md).toContain('3');
  });
});

describe('RateLimiter', () => {
  it('allows a request when under limits', () => {
    const limiter = new RateLimiter({ maxRequestsPerMinute: 10, maxTokensPerMinute: 10000, maxConcurrent: 5 });
    expect(limiter.canProceed(100)).toBe(true);
  });

  it('denies when token limit would be exceeded', async () => {
    const limiter = new RateLimiter({ maxRequestsPerMinute: 10, maxTokensPerMinute: 100, maxConcurrent: 5 });
    await limiter.acquire(90);
    expect(limiter.canProceed(20)).toBe(false);
    limiter.release();
  });

  it('reports correct status after acquire', async () => {
    const limiter = new RateLimiter({ maxRequestsPerMinute: 10, maxTokensPerMinute: 10000, maxConcurrent: 5 });
    await limiter.acquire(500);
    const status = limiter.getStatus();
    expect(status.activeRequests).toBe(1);
    expect(status.requestsInWindow).toBe(1);
    expect(status.tokensInWindow).toBe(500);
    limiter.release();
  });

  it('decrements activeRequests after release', async () => {
    const limiter = new RateLimiter({ maxRequestsPerMinute: 10, maxTokensPerMinute: 10000, maxConcurrent: 5 });
    await limiter.acquire(100);
    limiter.release();
    expect(limiter.getStatus().activeRequests).toBe(0);
  });
});

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const result = await withRetry(async () => 'ok', 3, 1);
    expect(result).toBe('ok');
  });

  it('retries on transient failure and succeeds', async () => {
    let attempts = 0;
    const result = await withRetry(
      async () => {
        attempts++;
        if (attempts < 2) throw new Error('transient');
        return 'recovered';
      },
      3,
      1
    );
    expect(result).toBe('recovered');
    expect(attempts).toBe(2);
  });

  it('throws ReviewError after exhausting retries', async () => {
    await expect(
      withRetry(async () => { throw new Error('always fails'); }, 2, 1)
    ).rejects.toThrow(ReviewError);
  });

  it('uses RETRY_EXHAUSTED error code', async () => {
    try {
      await withRetry(async () => { throw new Error('fail'); }, 2, 1);
    } catch (err) {
      expect(err instanceof ReviewError).toBe(true);
      expect((err as ReviewError).code).toBe(ErrorCodes.RETRY_EXHAUSTED);
    }
  });
});

describe('withTimeout', () => {
  it('returns result when function completes before timeout', async () => {
    const result = await withTimeout(async () => 'fast', 1000);
    expect(result).toBe('fast');
  });

  it('throws ReviewError when timeout is exceeded', async () => {
    await expect(
      withTimeout(() => new Promise(resolve => setTimeout(resolve, 500)), 10)
    ).rejects.toThrow(ReviewError);
  });

  it('uses AGENT_TIMEOUT error code', async () => {
    try {
      await withTimeout(() => new Promise(resolve => setTimeout(resolve, 500)), 10);
    } catch (err) {
      expect((err as ReviewError).code).toBe(ErrorCodes.AGENT_TIMEOUT);
    }
  });
});
