import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface GenerateCodeBody {
  prompt?: string;
  activeFilePath?: string;
  activeFileContent?: string;
  projectFiles?: Array<{ path: string }>;
  locale?: 'en' | 'ku';
}

function stripMarkdownFences(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/^```[a-zA-Z0-9_-]*\n([\s\S]*?)\n?```$/);
  return match ? match[1] : raw;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.post('/api/ai/code', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
      return;
    }

    const body = (req.body ?? {}) as GenerateCodeBody;
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }

    const projectFileList = Array.isArray(body.projectFiles)
      ? body.projectFiles
          .map((f) => f?.path)
          .filter((p): p is string => typeof p === 'string' && p.length > 0)
          .slice(0, 30)
      : [];

    const contextSections: string[] = [];
    if (projectFileList.length > 0) {
      contextSections.push(`Project files: ${projectFileList.join(', ')}`);
    }
    if (body.activeFilePath) {
      contextSections.push(`Active file path: ${body.activeFilePath}`);
    }
    if (typeof body.activeFileContent === 'string' && body.activeFileContent.trim()) {
      const truncatedContent = body.activeFileContent.slice(0, 12000);
      contextSections.push(`Active file content:\n${truncatedContent}`);
    }

    const systemInstruction = [
      'You are an expert software developer assistant built into a multi-file mobile and desktop code editor.',
      'The user may write prompts in Kurdish (Badini or Sorani), English, Arabic, or mixed languages.',
      'Write clean, complete, production-ready, runnable code matching the user request.',
      'Return valid JSON with three fields:',
      '- explanation: A brief, helpful summary in the SAME language as the user prompt.',
      '- filename: A clean relative file path with extension (e.g., index.html, style.css, app.js, main.py).',
      '- code: The pure source code ONLY, without markdown triple-backtick fences.',
    ].join('\n');

    const userContent =
      contextSections.length > 0
        ? `${contextSections.join('\n\n')}\n\nUser request:\n${prompt}`
        : `User request:\n${prompt}`;

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: userContent,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanation: {
                type: Type.STRING,
                description: 'Brief explanation in the user prompt language.',
              },
              filename: {
                type: Type.STRING,
                description: 'Suggested relative file name with extension.',
              },
              code: {
                type: Type.STRING,
                description: 'Complete generated source code without markdown fences.',
              },
            },
            required: ['explanation', 'filename', 'code'],
          },
        },
      });

      const rawText = response.text?.trim();
      if (!rawText) {
        res.status(502).json({ error: 'Empty response from AI model.' });
        return;
      }

      const parsed = JSON.parse(rawText) as {
        explanation?: string;
        filename?: string;
        code?: string;
      };

      const code = stripMarkdownFences(parsed.code ?? '');
      const filename = (parsed.filename || body.activeFilePath || 'generated.html')
        .trim()
        .replace(/^\/+/, '');
      const explanation = (parsed.explanation || '').trim();

      res.json({ explanation, filename, code });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to generate code.';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Coding Editor server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
