import { describe, it, expect } from 'vitest';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  CodeQualityResultSchema,
  TestCoverageResultSchema,
  RefactoringSuggestionSchema
} from '../src/types/analysis-results';
import {
  ReviewReportSchema
} from '../src/types/report-types';

const validCodeQuality = {
  file: 'src/app.ts',
  issues: [
    {
      line: 10,
      severity: 'high' as const,
      category: 'security' as const,
      description: 'SQL injection vulnerability',
      suggestion: 'Use parameterized queries'
    }
  ],
  overallScore: 75,
  summary: 'The file has one high severity issue'
};

const validTestCoverage = {
  file: 'src/app.ts',
  hasTests: true,
  testFiles: ['src/app.test.ts'],
  untestedPaths: [
    {
      type: 'function' as const,
      location: 'getUserById',
      priority: 'high' as const,
      reasoning: 'Core authentication function not tested',
      suggestedTest: "it('should return null when user not found', ...)"
    }
  ],
  coverageEstimate: 60,
  summary: 'File has partial test coverage with gaps in error paths'
};

const validRefactoring = {
  file: 'src/app.ts',
  suggestions: [
    {
      type: 'extract-function' as const,
      location: 'lines 45-67',
      impact: 'high' as const,
      description: 'Extract validation logic into separate function',
      before: 'if (user && user.name && user.email) { ... }',
      after: 'if (isValidUser(user)) { ... }',
      benefits: 'Improves readability and reusability'
    }
  ],
  summary: 'Multiple opportunities to extract reusable functions'
};

const validReviewReport = {
  pullRequest: { owner: 'octocat', repo: 'Hello-World', number: 1 },
  fileReviews: [
    {
      file: 'src/app.ts',
      codeQuality: validCodeQuality,
      testCoverage: validTestCoverage,
      refactorings: validRefactoring
    }
  ],
  summary: {
    totalFiles: 1,
    overallScore: 75,
    criticalIssues: 0,
    highPriorityTests: 1,
    refactoringOpportunities: 1
  },
  recommendations: [
    {
      priority: 'high' as const,
      category: 'security',
      description: 'Fix SQL injection vulnerability',
      files: ['src/app.ts']
    }
  ],
  metadata: {
    analyzedAt: new Date().toISOString(),
    duration: 5000,
    agentVersions: {
      'code-quality-analyzer': '1.0.0',
      'test-coverage-analyzer': '1.0.0',
      'refactoring-suggester': '1.0.0'
    }
  }
};

describe('CodeQualityResultSchema', () => {
  it('accepts valid code quality data', () => {
    expect(() => CodeQualityResultSchema.parse(validCodeQuality)).not.toThrow();
  });

  it('accepts empty issues array', () => {
    const data = { ...validCodeQuality, issues: [] };
    expect(() => CodeQualityResultSchema.parse(data)).not.toThrow();
  });

  it('rejects invalid severity', () => {
    const data = { ...validCodeQuality, issues: [{ ...validCodeQuality.issues[0], severity: 'extreme' }] };
    expect(() => CodeQualityResultSchema.parse(data)).toThrow();
  });

  it('rejects score above 100', () => {
    const data = { ...validCodeQuality, overallScore: 101 };
    expect(() => CodeQualityResultSchema.parse(data)).toThrow();
  });

  it('rejects score below 0', () => {
    const data = { ...validCodeQuality, overallScore: -1 };
    expect(() => CodeQualityResultSchema.parse(data)).toThrow();
  });

  it('accepts score of 0 (boundary)', () => {
    const data = { ...validCodeQuality, overallScore: 0 };
    expect(() => CodeQualityResultSchema.parse(data)).not.toThrow();
  });

  it('accepts score of 100 (boundary)', () => {
    const data = { ...validCodeQuality, overallScore: 100 };
    expect(() => CodeQualityResultSchema.parse(data)).not.toThrow();
  });

  it('rejects missing required fields', () => {
    expect(() => CodeQualityResultSchema.parse({ file: 'src/app.ts' })).toThrow();
  });
});

describe('TestCoverageResultSchema', () => {
  it('accepts valid test coverage data', () => {
    expect(() => TestCoverageResultSchema.parse(validTestCoverage)).not.toThrow();
  });

  it('accepts empty untestedPaths', () => {
    const data = { ...validTestCoverage, untestedPaths: [] };
    expect(() => TestCoverageResultSchema.parse(data)).not.toThrow();
  });

  it('accepts empty testFiles array', () => {
    const data = { ...validTestCoverage, hasTests: false, testFiles: [] };
    expect(() => TestCoverageResultSchema.parse(data)).not.toThrow();
  });

  it('rejects invalid priority', () => {
    const data = {
      ...validTestCoverage,
      untestedPaths: [{ ...validTestCoverage.untestedPaths[0], priority: 'urgent' }]
    };
    expect(() => TestCoverageResultSchema.parse(data)).toThrow();
  });

  it('rejects coverage estimate above 100', () => {
    const data = { ...validTestCoverage, coverageEstimate: 110 };
    expect(() => TestCoverageResultSchema.parse(data)).toThrow();
  });
});

describe('RefactoringSuggestionSchema', () => {
  it('accepts valid refactoring data', () => {
    expect(() => RefactoringSuggestionSchema.parse(validRefactoring)).not.toThrow();
  });

  it('accepts empty suggestions array', () => {
    const data = { ...validRefactoring, suggestions: [] };
    expect(() => RefactoringSuggestionSchema.parse(data)).not.toThrow();
  });

  it('rejects invalid suggestion type', () => {
    const data = {
      ...validRefactoring,
      suggestions: [{ ...validRefactoring.suggestions[0], type: 'delete-code' }]
    };
    expect(() => RefactoringSuggestionSchema.parse(data)).toThrow();
  });

  it('rejects invalid impact level', () => {
    const data = {
      ...validRefactoring,
      suggestions: [{ ...validRefactoring.suggestions[0], impact: 'critical' }]
    };
    expect(() => RefactoringSuggestionSchema.parse(data)).toThrow();
  });
});

describe('ReviewReportSchema', () => {
  it('accepts valid report data', () => {
    expect(() => ReviewReportSchema.parse(validReviewReport)).not.toThrow();
  });

  it('accepts empty fileReviews array', () => {
    const data = { ...validReviewReport, fileReviews: [] };
    expect(() => ReviewReportSchema.parse(data)).not.toThrow();
  });

  it('accepts empty recommendations array', () => {
    const data = { ...validReviewReport, recommendations: [] };
    expect(() => ReviewReportSchema.parse(data)).not.toThrow();
  });

  it('rejects invalid recommendation priority', () => {
    const data = {
      ...validReviewReport,
      recommendations: [{ ...validReviewReport.recommendations[0], priority: 'urgent' }]
    };
    expect(() => ReviewReportSchema.parse(data)).toThrow();
  });

  it('rejects missing pullRequest', () => {
    const { pullRequest: _, ...data } = validReviewReport;
    expect(() => ReviewReportSchema.parse(data)).toThrow();
  });

  it('rejects missing metadata', () => {
    const { metadata: _, ...data } = validReviewReport;
    expect(() => ReviewReportSchema.parse(data)).toThrow();
  });
});

describe('JSON Schema Export', () => {
  it('produces valid JSON schema from CodeQualityResultSchema', () => {
    const schema = zodToJsonSchema(CodeQualityResultSchema, { $refStrategy: 'root' });
    expect(schema).toBeDefined();
    expect(typeof schema).toBe('object');
  });

  it('produces valid JSON schema from ReviewReportSchema', () => {
    const schema = zodToJsonSchema(ReviewReportSchema, { $refStrategy: 'root' });
    expect(schema).toBeDefined();
    expect(typeof schema).toBe('object');
  });

  it('ReviewReport JSON schema has required properties', () => {
    const schema = zodToJsonSchema(ReviewReportSchema, { $refStrategy: 'root' }) as Record<string, unknown>;
    expect(schema['properties']).toBeDefined();
    const props = schema['properties'] as Record<string, unknown>;
    expect(props['pullRequest']).toBeDefined();
    expect(props['fileReviews']).toBeDefined();
    expect(props['summary']).toBeDefined();
    expect(props['metadata']).toBeDefined();
  });
});
