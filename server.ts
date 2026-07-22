import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
import express from 'express';
import nodemailer from 'nodemailer';
import { chromium } from 'playwright';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to get SMTP transporter with dynamic credentials
function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;

  if (!(user && pass)) {
    throw new Error(
      'Email credentials (EMAIL_USER and EMAIL_APP_PASSWORD) are not configured in environment variables.',
    );
  }

  const emailLower = user.toLowerCase().trim();
  
  // Custom SMTP configuration override from environment
  let host = process.env.SMTP_HOST;
  let port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  let secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : undefined;

  // Auto-detect based on domain if not explicitly provided
  if (!host) {
    if (emailLower.endsWith('@gmail.com')) {
      host = 'smtp.gmail.com';
      port = port || 465;
      secure = secure !== undefined ? secure : true;
    } else if (emailLower.endsWith('@outlook.com') || emailLower.endsWith('@hotmail.com') || emailLower.endsWith('@live.com')) {
      host = 'smtp.office365.com';
      port = port || 587;
      secure = secure !== undefined ? secure : false; // 587 uses STARTTLS (secure: false in nodemailer with requireTLS/starttls)
    } else if (emailLower.endsWith('@yahoo.com')) {
      host = 'smtp.mail.yahoo.com';
      port = port || 465;
      secure = secure !== undefined ? secure : true;
    } else {
      // Default to Lark Mail if not matched
      host = 'smtp.larksuite.com';
      port = port || 465;
      secure = secure !== undefined ? secure : true;
    }
  }

  console.log(`[SMTP] Initializing transporter for ${user} with host: ${host}, port: ${port}, secure: ${secure}`);

  return nodemailer.createTransport({
    host,
    port: port || 465,
    secure: secure === undefined ? true : secure,
    auth: {
      user: user.trim(),
      pass: pass.trim(),
    },
    tls: {
      rejectUnauthorized: false, // Prevents certificate verification issues
    },
  });
}

// Helper function for scraping
async function scrapeUrl(url: string) {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve(null);
          }
        }, 100);
      });
    });

    const title = await page.title();
    const content = await page.content();
    const screenshot = await page.screenshot({ type: 'jpeg', quality: 60 });
    const base64Screenshot = screenshot.toString('base64');

    await browser.close();

    return {
      success: true,
      url,
      title,
      markdown: content.substring(0, 5000),
      screenshot: `data:image/jpeg;base64,${base64Screenshot}`,
      metadata: { title },
    };
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

async function callGeminiWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 4,
  initialDelay = 1500
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      const errorStr = String(error).toLowerCase();
      const isTransient =
        error?.status === 'UNAVAILABLE' ||
        error?.code === 503 ||
        errorStr.includes('503') ||
        errorStr.includes('unavailable') ||
        errorStr.includes('resource_exhausted') ||
        errorStr.includes('429') ||
        error?.status === 'RESOURCE_EXHAUSTED';

      if (isTransient && attempt <= maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1) + Math.random() * 500;
        console.warn(
          `[GEMINI RETRY] Attempt ${attempt} failed with transient error: ${error.message || error}. Retrying in ${Math.round(delay)}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

async function callNvidiaNemotron(promptMessages: any[], systemInstruction?: string, responseSchema?: any) {
  const rawKey = process.env.NVIDIA_API_KEY || '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';
  let nvidiaKey = rawKey.trim();
  if (nvidiaKey.startsWith('"') && nvidiaKey.endsWith('"')) {
    nvidiaKey = nvidiaKey.substring(1, nvidiaKey.length - 1);
  }

  if (!nvidiaKey) {
    throw new Error('NVIDIA_API_KEY is not configured in environment variables.');
  }

  const messages: any[] = [];
  let sysInstructionText = systemInstruction || '';
  if (responseSchema) {
    sysInstructionText += `\n\nIMPORTANT: Return ONLY valid JSON matching this schema:\n${JSON.stringify(responseSchema, null, 2)}`;
  }

  if (sysInstructionText) {
    messages.push({ role: 'system', content: sysInstructionText });
  }

  for (const item of promptMessages) {
    if (typeof item === 'string') {
      messages.push({ role: 'user', content: item });
    } else if (item.parts && Array.isArray(item.parts)) {
      const textContent = item.parts.map((p: any) => p.text || '').join('\n');
      const role = item.role === 'model' ? 'assistant' : item.role || 'user';
      messages.push({ role, content: textContent });
    } else if (item.text) {
      messages.push({ role: 'user', content: item.text });
    }
  }

  console.log(`[NVIDIA NEMOTRON] Executing request with ${messages.length} messages using nvidia/nemotron-3-ultra-550b-a55b...`);

  const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${nvidiaKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      model: 'nvidia/nemotron-3-ultra-550b-a55b',
      messages,
      temperature: 1,
      top_p: 0.95,
      max_tokens: 16384,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`NVIDIA Nemotron Ultra 3 API Error (${res.status}): ${errorText}`);
  }

  const data: any = await res.json();
  const textOutput = data.choices?.[0]?.message?.content || '';

  return {
    candidates: [
      {
        content: {
          parts: [{ text: textOutput }],
          role: 'model',
        },
        finishReason: 'STOP',
      },
    ],
  };
}

async function startServer() {
  const app = express();
  const Port = 3000;

  app.use(express.json());

  // API Route for AI content generation (NVIDIA Nemotron Ultra 3 primary, Gemini fallback)
  app.post('/api/gemini/generateContent', async (req, res) => {
    const { model, contents, config } = req.body;

    // Check if NVIDIA_API_KEY is available first
    if (process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY.trim()) {
      try {
        console.log('[SERVER] Processing request via NVIDIA Nemotron Ultra 3...');
        const systemInst = config?.systemInstruction?.parts?.[0]?.text || config?.systemInstruction;
        const schema = config?.responseSchema;
        const inputContents = Array.isArray(contents) ? contents : [contents];
        const response = await callNvidiaNemotron(inputContents, systemInst, schema);
        return res.json(response);
      } catch (nvidiaErr: any) {
        console.error('[NVIDIA NEMOTRON ERROR]', nvidiaErr.message || nvidiaErr);
        // If Gemini key is also missing, return the error
        if (!process.env.GEMINI_API_KEY) {
          return res.status(500).json({ error: nvidiaErr.message || String(nvidiaErr) });
        }
        console.warn('[SERVER] Falling back to Gemini API...');
      }
    }

    const rawKey = process.env.GEMINI_API_KEY || '';
    let apiKey = rawKey.trim();
    if (apiKey.startsWith('"') && apiKey.endsWith('"')) {
      apiKey = apiKey.substring(1, apiKey.length - 1);
    }
    if (apiKey.startsWith("'") && apiKey.endsWith("'")) {
      apiKey = apiKey.substring(1, apiKey.length - 1);
    }

    if (!apiKey) {
      console.error(
        '[AI PROXY] Neither NVIDIA_API_KEY nor GEMINI_API_KEY is defined in environment variables.',
      );
      return res.status(500).json({ error: 'NVIDIA_API_KEY or GEMINI_API_KEY environment variable is required.' });
    }

    let modelToUse = model || 'gemini-3.5-flash';
    if (
      modelToUse.includes('preview') ||
      modelToUse === 'gemini-3-flash-preview' ||
      modelToUse.includes('2.0') ||
      modelToUse.includes('1.5')
    ) {
      modelToUse = 'gemini-3.5-flash';
    }

    try {
      console.log(
        `[SERVER] Generating content proxy with model: ${modelToUse}. Key length: ${apiKey.length}.`,
      );
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
          model: modelToUse,
          contents,
          config,
        })
      );
      res.json(response);
    } catch (error) {
      console.error('[GEMINI PROXY ERROR]', error);
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // API Route for AI chat (NVIDIA Nemotron Ultra 3 primary, Gemini fallback)
  app.post('/api/gemini/chat', async (req, res) => {
    const { model, config, history, message } = req.body;

    if (process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY.trim()) {
      try {
        console.log('[SERVER] Processing chat via NVIDIA Nemotron Ultra 3...');
        const systemInst = config?.systemInstruction?.parts?.[0]?.text || config?.systemInstruction;
        const schema = config?.responseSchema;
        const chatMessages = [...(history || []), { role: 'user', parts: [{ text: message }] }];
        const response = await callNvidiaNemotron(chatMessages, systemInst, schema);
        return res.json(response);
      } catch (nvidiaErr: any) {
        console.error('[NVIDIA CHAT ERROR]', nvidiaErr.message || nvidiaErr);
        if (!process.env.GEMINI_API_KEY) {
          return res.status(500).json({ error: nvidiaErr.message || String(nvidiaErr) });
        }
        console.warn('[SERVER] Falling back to Gemini Chat API...');
      }
    }

    const rawKey = process.env.GEMINI_API_KEY || '';
    let apiKey = rawKey.trim();
    if (apiKey.startsWith('"') && apiKey.endsWith('"')) {
      apiKey = apiKey.substring(1, apiKey.length - 1);
    }
    if (apiKey.startsWith("'") && apiKey.endsWith("'")) {
      apiKey = apiKey.substring(1, apiKey.length - 1);
    }

    if (!apiKey) {
      console.error(
        '[AI PROXY] Neither NVIDIA_API_KEY nor GEMINI_API_KEY is defined in environment variables.',
      );
      return res.status(500).json({ error: 'NVIDIA_API_KEY or GEMINI_API_KEY environment variable is required.' });
    }

    let modelToUse = model || 'gemini-3.5-flash';
    if (
      modelToUse.includes('preview') ||
      modelToUse === 'gemini-3-flash-preview' ||
      modelToUse.includes('2.0') ||
      modelToUse.includes('1.5')
    ) {
      modelToUse = 'gemini-3.5-flash';
    }

    try {
      console.log(
        `[SERVER] Chat proxy with model: ${modelToUse}. Key length: ${apiKey.length}.`,
      );
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      const chat = ai.chats.create({
        model: modelToUse,
        config,
        history,
      });
      const response = await callGeminiWithRetry(() => chat.sendMessage({ message }));
      res.json(response);
    } catch (error) {
      console.error('[GEMINI CHAT PROXY ERROR]', error);
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // API Route for Deep Scraping (Playwright Native)
  app.post('/api/scrape', async (req, res) => {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`[SERVER] Initiating Stealth Scraper for: ${url}`);
    try {
      const result = await scrapeUrl(url);
      res.json(result);
    } catch (error) {
      console.error(`[SCRAPE ERROR] ${error}`);
      res.status(500).json({
        error: 'Scraping failed',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Backend helper for GitHub Pages deployment
  async function deployToGitHubPages(leadId: string, html: string): Promise<string> {
    const GithubToken = process.env.GITHUB_TOKEN;
    const GithubUsername = process.env.GITHUB_USERNAME;
    const RepoName = process.env.GITHUB_REPO || 'business-previews';

    if (!GithubToken) {
      throw new Error('Missing GITHUB_TOKEN in environment variables.');
    }

    const octokit = new Octokit({ auth: GithubToken });
    let owner = GithubUsername?.trim();

    if (!owner) {
      try {
        const { data: userData } = await octokit.users.getAuthenticated();
        owner = userData.login;
        console.log(`[GITHUB] GITHUB_USERNAME not set. Resolved dynamically to authenticated user: ${owner}`);
      } catch (err: any) {
        throw new Error(`GITHUB_USERNAME is missing and failed to resolve authenticated user from token: ${err.message || String(err)}`);
      }
    }

    console.log(`[GITHUB] Deploying preview for lead ${leadId} to owner: ${owner}, repo: ${RepoName}`);

    try {
      // 1. Ensure repository exists
      try {
        await octokit.repos.get({
          owner,
          repo: RepoName,
        });
        console.log(`[GITHUB] Repository ${owner}/${RepoName} exists.`);
      } catch (e: any) {
        if (e.status === 404) {
          console.log(`[GITHUB] Repository ${owner}/${RepoName} not found. Creating...`);
          try {
            let isOrg = false;
            try {
              const { data: userData } = await octokit.users.getAuthenticated();
              if (userData.login.toLowerCase() !== owner.toLowerCase()) {
                isOrg = true;
              }
            } catch {}

            if (isOrg) {
              console.log(`[GITHUB] Owner ${owner} seems to be an organization. Creating org repo...`);
              await octokit.repos.createInOrg({
                org: owner,
                name: RepoName,
                auto_init: true,
                description: 'Automated business website previews (Prospekt.ai)',
                private: false,
              });
            } else {
              console.log(`[GITHUB] Creating repository for authenticated user...`);
              await octokit.repos.createForAuthenticatedUser({
                name: RepoName,
                auto_init: true,
                description: 'Automated business website previews (Prospekt.ai)',
                private: false,
              });
            }
            console.log(`[GITHUB] Repository ${owner}/${RepoName} created successfully.`);
            await new Promise((r) => setTimeout(r, 3000));
          } catch (createErr: any) {
            const errMsg = createErr.message || '';
            const status = createErr.status;
            // If repository already exists or we get a 422 name collision, proceed gracefully
            if (
              status === 422 ||
              errMsg.includes('already exists') ||
              errMsg.includes('name already exists')
            ) {
              console.log(
                `[GITHUB] Repository ${owner}/${RepoName} already exists (collision handled). Proceeding.`,
              );
            } else {
              throw createErr;
            }
          }
        } else {
          throw e;
        }
      }

      // 2. Upload index.html
      const filePath = `${leadId}/index.html`;
      let sha: string | undefined;

      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo: RepoName,
          path: filePath,
        });
        if (!Array.isArray(data)) {
          sha = data.sha;
          console.log(`[GITHUB] Found existing file at ${filePath} with SHA: ${sha}`);
        }
      } catch {
        console.log(`[GITHUB] No existing file found at ${filePath}. Creating new file.`);
      }

      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo: RepoName,
        path: filePath,
        message: `Deploy preview for lead ${leadId}`,
        content: Buffer.from(html).toString('base64'),
        sha,
      });
      console.log(`[GITHUB] Successfully wrote file to ${owner}/${RepoName}/${filePath}`);

      // 3. Ensure GitHub Pages is enabled
      try {
        await octokit.repos.getPages({
          owner,
          repo: RepoName,
        });
      } catch (e: any) {
        if (e.status === 404) {
          console.log(`[GITHUB] Pages not enabled for ${owner}/${RepoName}. Enabling...`);
          try {
            await octokit.repos.createPagesSite({
              owner,
              repo: RepoName,
              source: {
                branch: 'main',
                path: '/',
              },
            });
            console.log(`[GITHUB] Pages enabled successfully.`);
          } catch (pagesErr) {
            console.warn('[GITHUB] Pages already exists or creation failed', pagesErr);
          }
        }
      }

      return `https://${owner}.github.io/${RepoName}/${leadId}/`;
    } catch (error: any) {
      console.error('[GITHUB ERROR] Deployment failed:', error);
      const status = error?.status;
      const message = error?.message || String(error);
      let customErr = `GitHub deployment failed: ${message}`;
      if (status === 404) {
        customErr += ` (Not Found - 404). Please verify that:
1. Your GITHUB_TOKEN has "repo" scope (for classic tokens) or "Contents: Read and write" permission (for fine-grained tokens).
2. The GITHUB_USERNAME (${owner}) matches the token's owner or you have write permissions to their repositories/orgs.
3. The repository ${owner}/${RepoName} exists or your token has repository creation permissions.`;
      }
      throw new Error(customErr);
    }
  }

  // API Route for deploying preview to GitHub Pages
  app.post('/api/deploy-preview', async (req, res) => {
    const { leadId, html } = req.body;

    if (!(leadId && html)) {
      return res.status(400).json({ error: 'leadId and html are required' });
    }

    try {
      const previewUrl = await deployToGitHubPages(leadId, html);
      res.json({ success: true, previewUrl });
    } catch (error) {
      console.error('[DEPLOY API ERROR]', error);
      res.status(500).json({
        error: 'GitHub deployment failed',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // API Route for Outreach Logging
  app.post('/api/send-outreach', async (req, res) => {
    const { leadId, businessName, email, subject, bodyHtml, bodyText, previewUrl } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required for outreach' });
    }

    if (!(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD)) {
      console.error('[OUTREACH] Email credentials missing');
      return res.status(500).json({ error: 'Email credentials not configured' });
    }

    try {
      const emailTransporter = getTransporter();
      const userEmail = (process.env.EMAIL_USER || '').trim();
      await emailTransporter.sendMail({
        from: userEmail,
        to: email,
        subject: subject || `Partnership Proposal: Website for ${businessName}`,
        text:
          bodyText ||
          `Hi ${businessName} team,\n\nWe would love to help you build a new website.\n\nBest,\nProspekt.ai Team`,
        html:
          bodyHtml ||
          `<p>Hi ${businessName} team,</p><p>We would love to help you build a new website.</p><p>Best,<br>Prospekt.ai Team</p>`,
      });
      console.log(`[OUTREACH] Email sent to ${email} for ${businessName}`);
      res.json({ success: true, message: 'Outreach sent via Lark Mail' });
    } catch (error) {
      console.error(`[OUTREACH ERROR] ${error}`);
      const errStr = String(error);
      if (errStr.includes('535') || errStr.toLowerCase().includes('authentication failed')) {
        res.status(500).json({
          error: 'SMTP Authentication Failed (535)',
          details:
            'Authentication failed. Please verify that:\n' +
            '1. Your EMAIL_USER and EMAIL_APP_PASSWORD are correct.\n' +
            '2. If you are using Gmail (or Outlook/Yahoo), you MUST generate and use an "App Password" (or "App-Specific Password") instead of your normal email password.\n' +
            '3. If you are using Lark Mail, ensure you generated a "Third-Party Client/App-Specific Password" (Exclusive Password) from Lark Mail settings.',
        });
      } else {
        res.status(500).json({ error: 'Failed to send email', details: errStr });
      }
    }
  });

  // API Route for Test Email
  app.post('/api/send-test-email', async (_req, res) => {
    if (!(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD)) {
      return res.status(500).json({ error: 'Email credentials not configured' });
    }

    try {
      const emailTransporter = getTransporter();
      const userEmail = (process.env.EMAIL_USER || '').trim();
      await emailTransporter.sendMail({
        from: userEmail,
        to: userEmail, // Send to self
        subject: 'Prospekt.ai - Test Email Connection',
        text: 'This is a test email from your Prospekt.ai platform. If you received this, your email configuration is working correctly!',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #000;">Connection Successful!</h2>
            <p>This is a test email from your <strong>Prospekt.ai</strong> platform.</p>
            <p>If you received this, your SMTP configuration is working correctly and you are ready to launch campaigns.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666;">Sent at: ${new Date().toLocaleString()}</p>
          </div>
        `,
      });
      console.log(`[TEST EMAIL] Sent to ${userEmail}`);
      res.json({ success: true, message: 'Test email sent successfully to your inbox.' });
    } catch (error) {
      console.error(`[TEST EMAIL ERROR] ${error}`);
      const errStr = String(error);
      if (errStr.includes('535') || errStr.toLowerCase().includes('authentication failed')) {
        res.status(500).json({
          error: 'SMTP Authentication Failed (535)',
          details:
            'Authentication failed. Please verify that:\n' +
            '1. Your EMAIL_USER and EMAIL_APP_PASSWORD are correct.\n' +
            '2. If you are using Gmail (or Outlook/Yahoo), you MUST generate and use an "App Password" (or "App-Specific Password") instead of your normal email password.\n' +
            '3. If you are using Lark Mail, ensure you generated a "Third-Party Client/App-Specific Password" (Exclusive Password) from Lark Mail settings.',
        });
      } else {
        res.status(500).json({ error: 'Failed to send test email', details: errStr });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Port, '0.0.0.0', () => {
    console.log(`[SERVER] Prospekt.ai Backend running on http://localhost:${Port}`);
  });
}

startServer();
