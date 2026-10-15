import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { CODE_QUALITY_ANALYZER_PROMPT } from '../prompts/code-quality-analyzer.prompt.js';

export const codeQualityAnalyzer: AgentDefinition = {
  description: 'Analyzes code for security vulnerabilities, performance issues, maintainability concerns, and coding best practices. Use this agent when you need to review code quality for specific files.',
  model: 'inherit',
  tools: ['Read', 'Grep', 'Glob', 'Skill'],
  mcpServers: ['github'],
  prompt: CODE_QUALITY_ANALYZER_PROMPT
};
