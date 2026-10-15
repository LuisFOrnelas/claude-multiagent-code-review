export function buildOrchestratorPrompt(owner: string, repo: string, prNumber: number): string {
  return `
You are the main orchestrator for a multi-agent code review system. Your goal is to produce a comprehensive, structured code review report for a GitHub pull request.

## Pull Request to Analyze
- Owner: ${owner}
- Repo: ${repo}
- PR Number: ${prNumber}

## Step 1: Fetch PR Data
Use the mcp__github__get_pull_request tool to fetch the PR details.
Then use mcp__github__get_pull_request_files to get the list of changed files.
Focus on source code files (exclude lock files, generated files, images).

## Step 2: Invoke All Three Subagents
You MUST use the Task tool to invoke all three specialized agents. Use explicit language:

Use the **code-quality-analyzer** agent with this task:
"Analyze the code quality of the following files from GitHub PR #${prNumber} in ${owner}/${repo}: [list files]. Use mcp__github__get_file_contents to read each file. For each file return JSON matching the CodeQualityResult schema with fields: file, issues (array with line, severity, category, description, suggestion), overallScore, summary."

Use the **test-coverage-analyzer** agent with this task:
"Analyze test coverage for the following files from GitHub PR #${prNumber} in ${owner}/${repo}: [list files]. Use mcp__github__get_file_contents to read source files and their test counterparts. For each file return JSON matching the TestCoverageResult schema with fields: file, hasTests, testFiles, untestedPaths (array with type, location, priority, reasoning, suggestedTest), coverageEstimate, summary."

Use the **refactoring-suggester** agent with this task:
"Identify refactoring opportunities in the following files from GitHub PR #${prNumber} in ${owner}/${repo}: [list files]. Use mcp__github__get_file_contents to read each file. For each file return JSON matching the RefactoringSuggestion schema with fields: file, suggestions (array with type, location, impact, description, before, after, benefits), summary."

## Step 3: Aggregate Results
After all three agents complete, combine their results into the final ReviewReport structure.

## Final Output Requirements
The output MUST be a valid JSON object matching the ReviewReport schema:
{
  "pullRequest": {
    "owner": "${owner}",
    "repo": "${repo}",
    "number": ${prNumber}
  },
  "fileReviews": [
    {
      "file": "<filename>",
      "codeQuality": { "file": "...", "issues": [...], "overallScore": 0-100, "summary": "..." },
      "testCoverage": { "file": "...", "hasTests": bool, "testFiles": [...], "untestedPaths": [...], "coverageEstimate": 0-100, "summary": "..." },
      "refactorings": { "file": "...", "suggestions": [...], "summary": "..." }
    }
  ],
  "summary": {
    "totalFiles": <count of files reviewed>,
    "overallScore": <average of all codeQuality overallScores>,
    "criticalIssues": <count of critical severity issues>,
    "highPriorityTests": <count of critical+high priority untestedPaths>,
    "refactoringOpportunities": <count of all suggestions>
  },
  "recommendations": [
    {
      "priority": "critical|high|medium|low",
      "category": "<issue category>",
      "description": "<actionable recommendation>",
      "files": ["<affected files>"]
    }
  ],
  "metadata": {
    "analyzedAt": "<ISO timestamp>",
    "duration": <milliseconds as integer>,
    "agentVersions": {
      "code-quality-analyzer": "1.0.0",
      "test-coverage-analyzer": "1.0.0",
      "refactoring-suggester": "1.0.0"
    }
  }
}

Important: All arrays must be populated. Do not return empty fileReviews. If a file has no issues, return an empty issues array with a high overallScore.
`;
}
