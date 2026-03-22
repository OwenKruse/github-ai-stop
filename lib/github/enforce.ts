import { getInstallationOctokit } from "./app";

const TRUSTED_LABEL = "Trusted Contributor";
const TRUSTED_LABEL_COLOR = "0e8a16";

export interface EnforceParams {
  installationId: number;
  owner: string;
  repoName: string;
  prNumber: number;
  eventAction: "labeled_trusted" | "flagged" | "auto_closed";
  trustScore: number;
  autoLabel: boolean;
  autoClose: boolean;
  contributorUsername: string;
}

export async function enforce(params: EnforceParams) {
  const {
    installationId,
    owner,
    repoName,
    prNumber,
    eventAction,
    trustScore,
    autoLabel,
    autoClose,
    contributorUsername,
  } = params;

  const octokit = await getInstallationOctokit(installationId);

  if (eventAction === "labeled_trusted" && autoLabel) {
    await ensureLabel(octokit, owner, repoName);
    await octokit.rest.issues.addLabels({
      owner,
      repo: repoName,
      issue_number: prNumber,
      labels: [TRUSTED_LABEL],
    });
  }

  if (eventAction === "flagged") {
    await octokit.rest.issues.createComment({
      owner,
      repo: repoName,
      issue_number: prNumber,
      body:
        `⚠️ **GitGuard** — This PR has been **flagged for review**.\n\n` +
        `@${contributorUsername} has a cross-repo trust score of **${trustScore}**, ` +
        `which is below this repository's threshold.\n\n` +
        `A maintainer will review this PR manually.`,
    });
  }

  if (eventAction === "auto_closed" && autoClose) {
    await octokit.rest.issues.createComment({
      owner,
      repo: repoName,
      issue_number: prNumber,
      body:
        `🚫 **GitGuard** — This PR has been **automatically closed**.\n\n` +
        `@${contributorUsername} has a cross-repo trust score of **${trustScore}**, ` +
        `which is significantly below this repository's threshold.\n\n` +
        `If you believe this is an error, please contact the repository maintainers.`,
    });

    await octokit.rest.pulls.update({
      owner,
      repo: repoName,
      pull_number: prNumber,
      state: "closed",
    });
  }
}

async function ensureLabel(
  octokit: Awaited<ReturnType<typeof getInstallationOctokit>>,
  owner: string,
  repo: string
) {
  try {
    await octokit.rest.issues.getLabel({ owner, repo, name: TRUSTED_LABEL });
  } catch {
    await octokit.rest.issues.createLabel({
      owner,
      repo,
      name: TRUSTED_LABEL,
      color: TRUSTED_LABEL_COLOR,
      description: "PR from a contributor with a high GitGuard trust score",
    });
  }
}
