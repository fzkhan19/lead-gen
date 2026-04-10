import { Octokit } from "@octokit/rest";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const REPO_NAME = process.env.GITHUB_REPO || "business-previews";

export async function deployToGitHubPages(leadId: string, html: string): Promise<string | null> {
  if (!GITHUB_TOKEN || !GITHUB_USERNAME) {
    console.warn("GitHub credentials missing. Skipping deployment.");
    return null;
  }

  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  try {
    // 1. Ensure repository exists (Auto-recreates if deleted)
    let repoExists = false;
    try {
      await octokit.repos.get({
        owner: GITHUB_USERNAME,
        repo: REPO_NAME,
      });
      repoExists = true;
    } catch (e: any) {
      if (e.status === 404) {
        console.log(`[GITHUB] Repository ${REPO_NAME} not found. Creating a new one...`);
        await octokit.repos.createForAuthenticatedUser({
          name: REPO_NAME,
          auto_init: true,
          description: "Automated business website previews (LeadGen.ai)",
          private: false // Must be public for free GitHub Pages
        });
        // Wait for GitHub to provision the repo
        await new Promise(r => setTimeout(r, 3000));
      } else {
        throw e;
      }
    }

    // 2. Upload index.html to a lead-specific directory
    const path = `${leadId}/index.html`;
    let sha: string | undefined;

    try {
      const { data } = await octokit.repos.getContent({
        owner: GITHUB_USERNAME,
        repo: REPO_NAME,
        path,
      });
      if (!Array.isArray(data)) {
        sha = data.sha;
      }
    } catch (e) {}

    await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_USERNAME,
      repo: REPO_NAME,
      path,
      message: `Deploy preview for lead ${leadId}`,
      content: Buffer.from(html).toString("base64"),
      sha,
    });

    // 3. Ensure GitHub Pages is enabled
    try {
      await octokit.repos.getPages({
        owner: GITHUB_USERNAME,
        repo: REPO_NAME,
      });
    } catch (e: any) {
      if (e.status === 404) {
        await octokit.repos.createPagesSite({
          owner: GITHUB_USERNAME,
          repo: REPO_NAME,
          source: {
            branch: "main",
            path: "/",
          },
        });
      }
    }

    return `https://${GITHUB_USERNAME}.github.io/${REPO_NAME}/${leadId}/`;
  } catch (error) {
    console.error("GitHub deployment failed:", error);
    return null;
  }
}
