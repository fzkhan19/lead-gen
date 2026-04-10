import express from 'express';
import { createServer as createViteServer } from 'vite';
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// Helper function for scraping
async function scrapeUrl(url: string) {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
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
      metadata: { title }
    };
  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
      res.status(500).json({ error: 'Scraping failed', details: error instanceof Error ? error.message : String(error) });
    }
  });

  // API Route for Outreach Logging
  app.post('/api/send-outreach', async (req, res) => {
    const { leadId, businessName, email, subject, bodyHtml, bodyText, previewUrl } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email address is required for outreach' });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      console.error('[OUTREACH] Email credentials missing');
      return res.status(500).json({ error: 'Email credentials not configured' });
    }

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject || `Partnership Proposal: Website for ${businessName}`,
        text: bodyText || `Hi ${businessName} team,\n\nWe would love to help you build a new website.\n\nBest,\nLeadGen.ai Team`,
        html: bodyHtml || `<p>Hi ${businessName} team,</p><p>We would love to help you build a new website.</p><p>Best,<br>LeadGen.ai Team</p>`,
      });
      console.log(`[OUTREACH] Email sent to ${email} for ${businessName}`);
      res.json({ success: true, message: 'Outreach sent via Gmail' });
    } catch (error) {
      console.error(`[OUTREACH ERROR] ${error}`);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Lead-Generator Backend running on http://localhost:${PORT}`);
  });
}

startServer();
