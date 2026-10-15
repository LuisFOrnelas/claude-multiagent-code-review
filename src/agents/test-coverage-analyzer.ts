import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { TEST_COVERAGE_ANALYZER_PROMPT } from '../prompts/test-coverage-analyzer.prompt.js';

export const testCoverageAnalyzer: AgentDefinition = {
  description: 'Evaluates test coverage for source files, identifies untested functions and branches, and suggests specific test cases with meaningful assertions. Use this agent when you need to assess test completeness.',
  model: 'inherit',
  tools: ['Read', 'Grep', 'Glob'],
  mcpServers: ['github'],
  prompt: TEST_COVERAGE_ANALYZER_PROMPT
};
