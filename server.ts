import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin (using service role key)
const isJwt = (k: string) => !!k && k.startsWith('eyJ') && k.split('.').length === 3;
const isSbKey = (k: string) => !!k && k.startsWith('sb_');
const isDbUrl = (k: string) => !!k && (k.startsWith('postgresql://') || k.startsWith('postgres://'));

let _supabase: any = null;
function getSupabase() {
  if (!_supabase) {
    const rawUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
    
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '').trim();
    const secretKey = (process.env.SUPABASE_SECRET_KEY || '').trim();
    const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
    const pubKey = (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '').trim();
    
    console.log(`[Supabase Config] URL: ${supabaseUrl ? 'Set' : 'Missing'}, Key: ${serviceKey ? 'ServiceRole' : (anonKey ? 'Anon' : 'Missing')}`);
    
    if (!supabaseUrl) {
      console.error('CRITICAL: Supabase URL is missing in server environment');
      return {
        from: () => ({ select: () => Promise.resolve({ data: null, error: { message: 'Supabase URL missing on server' } }) }),
        auth: { signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase URL missing on server' } }) }
      } as any;
    }

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

  // Connectivity Test
  app.get("/api/test-connectivity", async (req, res) => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
      if (error) throw error;
      res.json({ status: 'ok', message: 'Successfully connected to Supabase from server.' });
    } catch (e: any) {
      console.error('Connectivity Test Failed:', e);
      res.status(500).json({ 
        status: 'error', 
        message: e.message,
        hint: 'Check if Supabase project is active and URL is correct.'
      });
    }
  });

  // Server-side Login Proxy (Fallback)
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    console.log(`[Auth Proxy] Login attempt for: ${email}`);
    try {
      const supabase = getSupabase();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
        
      if (error || !data.session) {
        console.error(`[Auth Proxy] Invalid credentials for ${email}:`, error?.message);
        return res.status(401).json({ error: error?.message || "Invalid login credentials" });
      }
      
      console.log(`[Auth Proxy] Login successful for: ${email}`);
      res.json(data);
    } catch (e: any) {
      console.error(`[Auth Proxy] Catch Error for ${email}:`, e);
      res.status(401).json({ error: e.message || "Authentication failed" });
    }
  });
  app.get("/api/db/:table", async (req, res) => {
    try {
      const supabase = getSupabase();
      let { data, error } = await supabase.from(req.params.table).select('*');
      
      // Retry logic for clock skew issues (common in cloud environments)
      if (error && error.message === 'JWT issued at future') {
        console.warn(`Clock skew detected for [GET ${req.params.table}]. Retrying in 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        const retry = await supabase.from(req.params.table).select('*');
        data = retry.data;
        error = retry.error;
      }

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
      const supabase = getSupabase();
      let { data, error } = await supabase
        .from(req.params.table)
        .upsert(req.body, { onConflict: req.query.onConflict as string || 'id' });

      // Retry logic for clock skew
      if (error && error.message === 'JWT issued at future') {
        console.warn(`Clock skew detected for [POST ${req.params.table}]. Retrying in 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        const retry = await supabase
          .from(req.params.table)
          .upsert(req.body, { onConflict: req.query.onConflict as string || 'id' });
        data = retry.data;
        error = retry.error;
      }

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
      const supabase = getSupabase();
      const { column, value } = req.query;
      if (!column || !value) throw new Error("Missing column or value for delete");
      
      let { error } = await supabase
        .from(req.params.table)
        .delete()
        .eq(column as string, value as string);

      // Retry logic for clock skew
      if (error && error.message === 'JWT issued at future') {
        console.warn(`Clock skew detected for [DELETE ${req.params.table}]. Retrying in 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        const retry = await supabase
          .from(req.params.table)
          .delete()
          .eq(column as string, value as string);
        error = retry.error;
      }

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
      const supabase = getSupabase();
      // 1. Create Auth User in Supabase
      const email = `${username}@yazal-erp.com`;
      let authResult = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullname }
      });

      // Retry logic for clock skew
      if (authResult.error && authResult.error.message === 'JWT issued at future') {
        console.warn(`Clock skew detected for [create-user auth]. Retrying in 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        authResult = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullname }
        });
      }

      let uid = authResult?.data?.user?.id;
      
      // If user already exists or another auth error occurs, try to fetch the existing user
      if (authResult.error) {
        console.warn(`Auth creation failed for ${email}, attempting fallback:`, authResult.error.message);
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existing = listData?.users?.find(u => u.email === email);
        if (existing) {
          uid = existing.id;
          // Optionally update their password if they already existed
          await supabase.auth.admin.updateUserById(uid, { password });
        } else {
           // Provide a fallback UUID if we can't create an auth user
           // We are bypassing Supabase Auth for login anyway
           import('crypto').then(crypto => {
               if (!uid) uid = crypto.randomUUID();
           }).catch(() => {
               if (!uid) uid = `fallback-${Date.now()}`;
           });
        }
      }

      // 2. Create Profile in 'users' table
      const newUser = {
        uid: uid || `local-${Date.now()}`,
        name: fullname,
        username: username,
        password: password, // Important since we use table for login now
        role: role,
        email: email,
        created_at: new Date().toISOString()
      };

      let dbResult = await supabase
        .from('users')
        .insert([newUser]);

      // Retry logic for clock skew in DB insert
      if (dbResult.error && dbResult.error.message === 'JWT issued at future') {
        console.warn(`Clock skew detected for [create-user db]. Retrying in 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        dbResult = await supabase
          .from('users')
          .insert([newUser]);
      }

      if (dbResult.error) throw dbResult.error;

      res.json({ success: true, uid: authResult.data.user.id });
    } catch (error: any) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: error.message || "Failed to create user" });
    }
  });

  // Admin endpoint to delete user
  app.post("/api/admin/delete-user", async (req, res) => {
    const { username, uid } = req.body;

    try {
      const supabase = getSupabase();
      // 1. Delete from Auth if UID is provided
      if (uid) {
        let authResult = await supabase.auth.admin.deleteUser(uid);
        
        // Retry logic for clock skew
        if (authResult.error && authResult.error.message === 'JWT issued at future') {
          console.warn(`Clock skew detected for [delete-user auth]. Retrying in 2s...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          authResult = await supabase.auth.admin.deleteUser(uid);
        }
        
        if (authResult.error) throw authResult.error;
      }

      // 2. Delete from users table
      let dbResult = await supabase
        .from('users')
        .delete()
        .eq('username', username);

      // Retry logic for clock skew
      if (dbResult.error && dbResult.error.message === 'JWT issued at future') {
        console.warn(`Clock skew detected for [delete-user db]. Retrying in 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        dbResult = await supabase
          .from('users')
          .delete()
          .eq('username', username);
      }

      if (dbResult.error) throw dbResult.error;

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
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      const text = response.text || "{}";
      return JSON.parse(text);
    } catch (error: any) {
      console.error('Gemini error:', error);
      if (error.message?.includes('quota') || error.message?.includes('429')) {
        console.warn('Quota exceeded, trying fallback...');
        try {
          const fallbackResponse = await ai.models.generateContent({
            model: "gemini-1.5-pro",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            }
          });
          return JSON.parse(fallbackResponse.text || "{}");
        } catch (innerError) {
          console.error('Fallback model also failed:', innerError);
        }
      }
      if (retries > 0) {
        console.warn(`Retrying Gemini request. Retries left: ${retries}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
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

  // Example of a protected API route (similar to the Next.js Auth0 example provided)
  app.get("/api/protected-route", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.split(' ')[1];
      const supabase = getSupabase();
      
      // Verify the token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      res.json({
        message: "This is a protected API route",
        user: user
      });
    } catch (e) {
      res.status(500).json({ error: "Internal Server Error" });
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
