import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

async function main() {
  const args = process.argv.slice(2);
  const [owner, repo, prStr] = args;

  if (!owner || !repo || !prStr) {
    console.error('Usage: npm run dev -- <owner> <repo> <pr-number>');
    console.error('Example: npm run dev -- octocat Hello-World 1');
    process.exit(1);
  }

  const prNumber = parseInt(prStr, 10);
  if (isNaN(prNumber) || prNumber <= 0 || !Number.isInteger(prNumber)) {
    console.error(`Error: PR number must be a valid positive integer, got: "${prStr}"`);
    process.exit(1);
  }

  const hasAnthropicKey = !!process.env['ANTHROPIC_API_KEY'];
  const hasAwsKey = !!(process.env['AWS_ACCESS_KEY_ID'] && process.env['AWS_SECRET_ACCESS_KEY']);

  if (!hasAnthropicKey && !hasAwsKey) {
    console.error('Error: Authentication credentials are required. Configure ONE of:');
    console.error('  Option 1 (Anthropic API): Set ANTHROPIC_API_KEY environment variable');
    console.error('  Option 2 (AWS Bedrock): Set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY');
    process.exit(1);
  }

  if (hasAwsKey) {
    if (!process.env['AWS_REGION']) {
      console.error('Error: AWS_REGION is required when using AWS Bedrock authentication');
      process.exit(1);
    }
    console.log('Using AWS Bedrock authentication');
  } else {
    console.log('Using Anthropic API authentication');
  }

  if (!process.env['ANTHROPIC_MODEL']) {
    console.error('Error: ANTHROPIC_MODEL environment variable is required');
    console.error('  For Anthropic API: ANTHROPIC_MODEL=claude-sonnet-4-5-20250929');
    console.error('  For AWS Bedrock:   ANTHROPIC_MODEL=us.anthropic.claude-sonnet-4-5-20250929-v1:0');
    process.exit(1);
  }

  console.log(`Reviewing PR #${prNumber} in ${owner}/${repo}...`);

  try {
    const { CodeReviewOrchestrator } = await import('./orchestrator.js');
    const { ReportGenerator } = await import('./utils/report-generator.js');

    const orchestrator = new CodeReviewOrchestrator();
    const report = await orchestrator.reviewPullRequest(owner, repo, prNumber);

    const generator = new ReportGenerator();
    const reportsDir = path.join(process.cwd(), 'reports');
    fs.mkdirSync(reportsDir, { recursive: true });

    const baseName = `${owner}_${repo}_${prNumber}`;

    const jsonPath = path.join(reportsDir, `${baseName}.json`);
    fs.writeFileSync(jsonPath, generator.generateJSONReport(report));
    console.log(`JSON report saved: ${jsonPath}`);

    const mdPath = path.join(reportsDir, `${baseName}.md`);
    fs.writeFileSync(mdPath, generator.generateMarkdownReport(report));
    console.log(`Markdown report saved: ${mdPath}`);

    const htmlPath = path.join(reportsDir, `${baseName}.html`);
    fs.writeFileSync(htmlPath, generator.generateHTMLReport(report));
    console.log(`HTML report saved: ${htmlPath}`);

    console.log(`\nReview complete! Overall score: ${report.summary.overallScore}/100`);
    console.log(`Critical issues: ${report.summary.criticalIssues}`);
    console.log(`Files reviewed: ${report.summary.totalFiles}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('An unexpected error occurred');
    }
    process.exit(1);
  }
}

main();
