import { App } from "octokit";

let _app: App | null = null;

export function getGitHubApp(): App {
  if (_app) return _app;

  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY;
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!appId || !privateKey || !webhookSecret) {
    throw new Error(
      "Missing GITHUB_APP_ID, GITHUB_PRIVATE_KEY, or GITHUB_WEBHOOK_SECRET"
    );
  }

  _app = new App({
    appId,
    privateKey,
    webhooks: { secret: webhookSecret },
  });

  return _app;
}

export async function getInstallationOctokit(installationId: number) {
  const app = getGitHubApp();
  return app.getInstallationOctokit(installationId);
}
