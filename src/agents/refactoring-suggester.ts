import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { REFACTORING_SUGGESTER_PROMPT } from '../prompts/refactoring-suggester.prompt.js';

export const refactoringSuggester: AgentDefinition = {
  description: 'Identifies refactoring opportunities to improve code structure, apply design patterns, modernize language features, and eliminate code smells. Use this agent when you need architectural improvement suggestions.',
  model: 'inherit',
  tools: ['Read', 'Grep', 'Glob', 'Skill'],
  mcpServers: ['github'],
  prompt: REFACTORING_SUGGESTER_PROMPT
};
