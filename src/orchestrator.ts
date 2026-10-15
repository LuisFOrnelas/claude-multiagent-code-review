import { query } from '@anthropic-ai/claude-agent-sdk';
import { mcpServersConfig } from './config/mcp.config.js';
import { codeQualityAnalyzer } from './agents/code-quality-analyzer.js';
import { testCoverageAnalyzer } from './agents/test-coverage-analyzer.js';
import { refactoringSuggester } from './agents/refactoring-suggester.js';
import { buildOrchestratorPrompt } from './prompts/orchestrator.prompt.js';
import { ReviewReportSchema, ReviewReportJSONSchema } from './types/index.js';
import type { ReviewReport } from './types/report-types.js';
import { logger } from './utils/logger.js';

export interface OrchestratorOptions {
  maxTurns?: number;
  timeoutMs?: number;
}

export class CodeReviewOrchestrator {
  private options: Required<OrchestratorOptions>;

  constructor(options: OrchestratorOptions = {}) {
    this.options = {
      maxTurns: options.maxTurns ?? 80,
      timeoutMs: options.timeoutMs ?? 300000
    };
  }

  async reviewPullRequest(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<ReviewReport> {
    const startTime = Date.now();
    logger.info(`Starting review for ${owner}/${repo}#${prNumber}`);

    const prompt = buildOrchestratorPrompt(owner, repo, prNumber);

    const projectRoot = process.env['PROJECT_ROOT'] ?? process.cwd();

    const queryGen = query({
      prompt,
      options: {
        model: process.env['ANTHROPIC_MODEL'],
        cwd: projectRoot,
        mcpServers: mcpServersConfig,
        agents: {
          'code-quality-analyzer': codeQualityAnalyzer,
          'test-coverage-analyzer': testCoverageAnalyzer,
          'refactoring-suggester': refactoringSuggester
        },
        allowedTools: [
          'Task',
          'Read',
          'Grep',
          'Glob',
          'Skill',
          'mcp__github__get_pull_request',
          'mcp__github__get_pull_request_files',
          'mcp__github__get_file_contents',
          'mcp__github__list_pull_requests',
          'mcp__github__get_pull_request_diff',
          'mcp__eslint__lint_files'
        ],
        outputFormat: {
          type: 'json_schema',
          schema: ReviewReportJSONSchema as Record<string, unknown>
        },
        maxTurns: this.options.maxTurns,
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
        settingSources: ['project'],
        persistSession: false
      }
    });

    let structuredOutput: unknown = null;

    for await (const message of queryGen) {
      if (message.type === 'result') {
        if (message.subtype === 'success') {
          structuredOutput = message.structured_output;
          logger.info(`Review completed in ${Date.now() - startTime}ms`);
        } else {
          const errors = 'errors' in message ? message.errors : [];
          throw new Error(`Review failed: ${JSON.stringify(errors)}`);
        }
      } else if (message.type === 'assistant') {
        logger.debug('Agent response received');
      }
    }

    if (!structuredOutput) {
      throw new Error('No structured output received from orchestrator');
    }

    const result = ReviewReportSchema.safeParse(structuredOutput);
    if (!result.success) {
      logger.warn('Structured output validation failed, attempting to use raw output');
      const raw = structuredOutput as ReviewReport;
      raw.metadata = raw.metadata ?? {
        analyzedAt: new Date().toISOString(),
        duration: Date.now() - startTime,
        agentVersions: {
          'code-quality-analyzer': '1.0.0',
          'test-coverage-analyzer': '1.0.0',
          'refactoring-suggester': '1.0.0'
        }
      };
      return raw;
    }

    return result.data;
  }
}
