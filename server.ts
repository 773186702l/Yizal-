import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin (using service role key)
let _supabase: any = null;
function getSupabase() {
  if (!_supabase) {
    const rawUrl = (process.env.SUPABASE_URL || '').trim();
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
    
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    const secretKey = (process.env.SUPABASE_SECRET_KEY || '').trim();
    const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
    const pubKey = (process.env.SUPABASE_PUBLISHABLE_KEY || '').trim();
    
    const isJwt = (k: string) => k.startsWith('eyJ') && k.split('.').length === 3;
    const isSbKey = (k: string) => k.startsWith('sb_');
    const isDbUrl = (k: string) => k.startsWith('postgresql://') || k.startsWith('postgres://');
    
    let supabaseServiceKey = '';
    let keyType = 'NONE';
    
    // Priority 1: Service Role JWT (if we can identify it, usually starts with eyJ)
    // We check serviceKey and secretKey for JWTs first
    if (isJwt(serviceKey) && !isDbUrl(serviceKey)) {
      supabaseServiceKey = serviceKey;
      keyType = 'SERVICE_ROLE_JWT';
    } else if (isJwt(secretKey) && !isDbUrl(secretKey)) {
      supabaseServiceKey = secretKey;
      keyType = 'SECRET_KEY_JWT';
    } 
    // Priority 2: New Secret Keys (sb_secret_)
    else if (isSbKey(serviceKey) && serviceKey.includes('_secret_')) {
      supabaseServiceKey = serviceKey;
      keyType = 'SERVICE_ROLE_SB_SECRET';
    } else if (isSbKey(secretKey) && secretKey.includes('_secret_')) {
      supabaseServiceKey = secretKey;
      keyType = 'SECRET_KEY_SB_SECRET';
    }
    // Priority 3: Any other sb_ key that isn't a DB URL
    else if (isSbKey(secretKey)) {
      supabaseServiceKey = secretKey;
      keyType = 'SECRET_KEY_SB';
    } else if (isSbKey(serviceKey)) {
      supabaseServiceKey = serviceKey;
      keyType = 'SERVICE_ROLE_SB';
    }
    // Priority 4: Fallback to Anon/Publishable Keys
    else if (isJwt(anonKey)) {
      supabaseServiceKey = anonKey;
      keyType = 'ANON_JWT';
    } else if (isSbKey(pubKey)) {
      supabaseServiceKey = pubKey;
      keyType = 'PUB_SB';
    }
    // Last resort: just pick something if it's not a DB URL
    else if (serviceKey && !isDbUrl(serviceKey)) {
      supabaseServiceKey = serviceKey;
      keyType = 'SERVICE_ROLE_RAW';
    } else if (secretKey && !isDbUrl(secretKey)) {
      supabaseServiceKey = secretKey;
      keyType = 'SECRET_KEY_RAW';
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing on server:', {
        hasUrl: !!supabaseUrl,
        keyType,
        envKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
      });
      throw new Error(`Supabase configuration missing. URL present: ${!!supabaseUrl}, Key Type: ${keyType}. Please provide a valid Supabase key (JWT or sb_secret_).`);
    }

    _supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log(`Supabase client initialized on server. URL: ${supabaseUrl}, Key Type: ${keyType}, Prefix: ${supabaseServiceKey.substring(0, 10)}...`);
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

  // Server Diagnostics
  app.get("/api/diag", (req, res) => {
    const rawUrl = (process.env.SUPABASE_URL || '').trim();
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    const secretKey = (process.env.SUPABASE_SECRET_KEY || '').trim();
    
    const isJwt = (k: string) => k.startsWith('eyJ') && k.split('.').length === 3;
    const isSbKey = (k: string) => k.startsWith('sb_');

    res.json({
      url: supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'MISSING',
      hasUrl: !!supabaseUrl,
      serviceKey: {
        present: !!serviceKey,
        isJwt: isJwt(serviceKey),
        isSb: isSbKey(serviceKey),
        prefix: serviceKey ? serviceKey.substring(0, 12) : 'N/A'
      },
      secretKey: {
        present: !!secretKey,
        isJwt: isJwt(secretKey),
        isSb: isSbKey(secretKey),
        prefix: secretKey ? secretKey.substring(0, 10) : 'N/A'
      },
      envKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
    });
  });

  // Generic DB Proxy (GET)
  app.get("/api/db/:table", async (req, res) => {
    try {
      const { data, error } = await getSupabase().from(req.params.table).select('*');
      if (error) throw error;
      res.json(data || []);
    } catch (e: any) {
      console.error(`DB Proxy Error [GET ${req.params.table}]:`, e);
      res.status(500).json({ 
        error: e.message || 'Internal Server Error',
        details: e.details,
        hint: e.hint,
        code: e.code
      });
    }
  });

  // Generic DB Proxy (POST/UPSERT)
  app.post("/api/db/:table", async (req, res) => {
    try {
      const { data, error } = await getSupabase()
        .from(req.params.table)
        .upsert(req.body, { onConflict: req.query.onConflict as string || 'id' });
      if (error) throw error;
      res.json(data || { status: 'ok' });
    } catch (e: any) {
      console.error(`DB Proxy Error [POST ${req.params.table}]:`, e);
      res.status(500).json({ 
        error: e.message || 'Internal Server Error',
        details: e.details,
        hint: e.hint,
        code: e.code
      });
    }
  });

  // Generic DB Proxy (DELETE)
  app.delete("/api/db/:table", async (req, res) => {
    try {
      const { column, value } = req.query;
      if (!column || !value) throw new Error("Missing column or value for delete");
      const { error } = await getSupabase()
        .from(req.params.table)
        .delete()
        .eq(column as string, value as string);
      if (error) throw error;
      res.json({ status: 'ok' });
    } catch (e: any) {
      console.error(`DB Proxy Error [DELETE ${req.params.table}]:`, e);
      res.status(500).json({ 
        error: e.message || 'Internal Server Error',
        details: e.details,
        hint: e.hint,
        code: e.code
      });
    }
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
