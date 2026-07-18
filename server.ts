import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin (using service role key)
let _supabase: any = null;
function getSupabase() {
  if (!_supabase) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    }
    _supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return _supabase;
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Admin endpoint to create user
  app.post("/api/admin/create-user", async (req, res) => {
    const { fullname, username, password, role } = req.body;
    
    try {
      // 1. Create Auth User in Supabase
      const email = `${username}@yazal-erp.com`;
      const { data: authData, error: authError } = await getSupabase().auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullname }
      });

      if (authError) throw authError;

      // 2. Create Profile in 'users' table
      const { error: dbError } = await getSupabase()
        .from('users')
        .insert([{
          uid: authData.user.id,
          name: fullname,
          username: username,
          password: password, // Note: Still in plaintext as per original logic, but Supabase Auth handles real login
          role: role,
          email: email,
          created_at: new Date().toISOString()
        }]);

      if (dbError) throw dbError;

      res.json({ success: true, uid: authData.user.id });
    } catch (error: any) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: error.message || "Failed to create user" });
    }
  });

  // Admin endpoint to delete user
  app.post("/api/admin/delete-user", async (req, res) => {
    const { username, uid } = req.body;

    try {
      // 1. Delete from Auth if UID is provided
      if (uid) {
        const { error: authError } = await getSupabase().auth.admin.deleteUser(uid);
        if (authError) throw authError;
      }

      // 2. Delete from users table
      const { error: dbError } = await getSupabase()
        .from('users')
        .delete()
        .eq('username', username);

      if (dbError) throw dbError;

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: error.message || "Failed to delete user" });
    }
  });

  app.post("/api/suggest-task", async (req, res) => {
    const { title, description } = req.body;
    
    const prompt = `Categorize and prioritize this task.
    Title: ${title}
    Description: ${description}
    Return JSON with fields: category, priority (low, medium, high).`;

    try {
      const result = await generateWithRetry(prompt);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to suggest task details" });
    }
  });

  app.post("/api/ocr-scan", async (req, res) => {
    const { imageBase64 } = req.body;
    
    const parts = [
        { text: "Extract document details: client name, document type (Passport, Visa, Contract), and date if available. Perform strict spell correction on all extracted text to ensure accuracy. Return JSON." },
        {
            inlineData: {
                data: imageBase64.split(',')[1],
                mimeType: "image/jpeg"
            }
        }
    ];

    try {
      const result = await generateWithRetry(parts);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to scan document" });
    }
  });

  async function generateWithRetry(prompt: any, retries = 2): Promise<any> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      return JSON.parse(response.text!);
    } catch (error) {
      if (retries > 0) {
        console.warn(`Retrying Gemini request. Retries left: ${retries}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return generateWithRetry(prompt, retries - 1);
      }
      throw error;
    }
  }

  app.post("/api/dashboard-insights", async (req, res) => {
    const { tasks, requests } = req.body;
    
    const prompt = `Analyze these outstanding tasks and upcoming document deadlines to provide a brief, actionable summary of priorities for the dashboard.
    Tasks: ${JSON.stringify(tasks)}.
    Service Requests: ${JSON.stringify(requests)}.
    Return a short JSON object with field: 'summary'.`;

    try {
      const result = await generateWithRetry(prompt);
      res.json(result);
    } catch (error) {
      console.error('Insights error:', error);
      res.status(500).json({ error: "Failed to generate insights" });
    }
  });

  app.post("/api/categorize-documents", async (req, res) => {
    const { documents } = req.body;
    
    const prompt = `Categorize these documents and identify the client name for each.
    Documents: ${JSON.stringify(documents.map((d: any) => ({ id: d.id, name: d.name })))}.
    Possible types: Passport, Visa, Contract.
    Return a JSON object with field: 'categorizedDocs' which is an array of objects with fields: id, type, client.`;

    try {
      const result = await generateWithRetry(prompt);
      res.json(result);
    } catch (error) {
      console.error('Categorize error:', error);
      res.status(500).json({ error: "Failed to categorize documents" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
