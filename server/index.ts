import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const startTime = Date.now();
// Robust path detection for different environments
const getDbPath = () => {
  if (process.env.VERCEL === '1' || process.env.K_SERVICE) {
    return '/tmp/telex.db';
  }
  return path.join(process.cwd(), 'telex.db');
};
const dbPath = getDbPath();
let db: any;
let Database: any;
let dbPromise: Promise<any> | null = null;

async function ensureDb() {
  if (db) return db;
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    try {
      if (!Database) {
        const mod = await import("better-sqlite3");
        Database = mod.default;
      }
      
      console.log(`Attempting to connect to database at: ${dbPath}`);
      try {
        db = new Database(dbPath, { timeout: 10000 });
        // Enable WAL mode for better concurrency and to help with "database is locked" errors
        db.pragma('journal_mode = WAL');
      } catch (openErr: any) {
        console.error(`Failed to open database at ${dbPath}:`, openErr);
        // Fallback to /tmp if local path fails
        if (dbPath !== '/tmp/telex.db') {
          console.log("Falling back to /tmp/telex.db...");
          db = new Database('/tmp/telex.db', { timeout: 10000 });
          db.pragma('journal_mode = WAL');
        } else {
          throw openErr;
        }
      }
      
      // Initialize Database structure
      db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        );

        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT,
          ip_address TEXT,
          coins INTEGER DEFAULT 0,
          total_earned INTEGER DEFAULT 0,
          join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_blocked INTEGER DEFAULT 0,
          block_reason TEXT
        );

        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          reward INTEGER,
          time_estimate TEXT,
          category TEXT,
          icon TEXT,
          link TEXT,
          active INTEGER DEFAULT 1,
          expires_at DATETIME
        );

        CREATE TABLE IF NOT EXISTS coupons (
          code TEXT PRIMARY KEY,
          reward INTEGER,
          usage_limit INTEGER,
          used_count INTEGER DEFAULT 0,
          expiry_date DATETIME,
          active INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS ads (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          placement TEXT,
          code TEXT,
          active INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS withdrawals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          amount INTEGER,
          method TEXT,
          address TEXT,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS daily_claims (
          user_id TEXT,
          claim_date DATE,
          streak INTEGER,
          PRIMARY KEY (user_id, claim_date)
        );

        CREATE TABLE IF NOT EXISTS user_tasks (
          user_id TEXT,
          task_id INTEGER,
          completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, task_id)
        );

        CREATE TABLE IF NOT EXISTS game_plays (
          user_id TEXT,
          game_id TEXT,
          play_date DATE,
          play_count INTEGER DEFAULT 0,
          PRIMARY KEY (user_id, game_id, play_date)
        );

        CREATE TABLE IF NOT EXISTS user_coupons (
          user_id TEXT,
          coupon_code TEXT,
          redeemed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, coupon_code)
        );
      `);

      // Migrations (run every time to ensure schema is up to date)
      const tableInfo = db.prepare("PRAGMA table_info(tasks)").all();
      const columns = tableInfo.map((c: any) => c.name);
      if (!columns.includes('link')) {
        db.prepare("ALTER TABLE tasks ADD COLUMN link TEXT").run();
      }
      if (!columns.includes('expires_at')) {
        db.prepare("ALTER TABLE tasks ADD COLUMN expires_at DATETIME").run();
      }

      // Seed initial settings
      const seedSettings = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
      seedSettings.run("withdrawals_enabled", "true");
      seedSettings.run("min_withdrawal", "1000");

      // Seed initial tasks if empty
      const taskCount = db.prepare("SELECT COUNT(*) as count FROM tasks").get() as any;
      if (taskCount.count === 0) {
        console.log("Seeding initial tasks...");
        const insertTask = db.prepare("INSERT INTO tasks (title, reward, time_estimate, category, icon, link) VALUES (?, ?, ?, ?, ?, ?)");
        insertTask.run("Complete Survey", 50, "5 min", "Survey", "ClipboardList", "https://google.com");
        insertTask.run("Watch Video Ad", 10, "30 sec", "Video", "Zap", "https://youtube.com");
        insertTask.run("Download App", 200, "10 min", "App", "Star", "https://play.google.com");
        insertTask.run("Follow on Twitter", 20, "1 min", "Social", "TrendingUp", "https://twitter.com");
        insertTask.run("Test New Feature", 100, "15 min", "Testing", "CheckCircle2", "https://github.com");
      }

      // Seed initial coupons if empty
      const couponCount = db.prepare("SELECT COUNT(*) as count FROM coupons").get() as any;
      if (couponCount.count === 0) {
        console.log("Seeding initial coupons...");
        const insertCoupon = db.prepare("INSERT INTO coupons (code, reward, usage_limit, expiry_date) VALUES (?, ?, ?, ?)");
        insertCoupon.run("WELCOME100", 100, 1000, "2026-12-31");
        insertCoupon.run("TELEX2026", 50, 5000, "2026-12-31");
      }
      
      console.log("Database ready.");
      return db;
    } catch (err) {
      console.error("Database initialization error:", err);
      dbPromise = null; // Allow retry
      throw err;
    }
  })();

  return dbPromise;
}

const app = express();
app.use(express.json());

// Database Middleware
app.use(async (req, res, next) => {
  if (req.path.startsWith("/api") && req.path !== "/api/health" && req.path !== "/api/debug" && req.path !== "/api/test") {
    try {
      await ensureDb();
    } catch (err: any) {
      return res.status(500).json({ error: "Database initialization failed", message: err.message });
    }
  }
  next();
});

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    database: !!db,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    dbPath,
    env: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
    cloudRun: !!process.env.K_SERVICE,
    cwd: process.cwd()
  });
});

app.get("/api/debug", (req, res) => {
  res.json({
    headers: req.headers,
    url: req.url,
    method: req.method,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL
    }
  });
});

app.get("/api/test", (req, res) => {
  res.send("API is working!");
});

// API Routes
app.use("/api/admin", (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.get("/api/settings", (req, res) => {
  try {
    if (!db) throw new Error("Database not initialized");
    const settings = db.prepare("SELECT * FROM settings").all();
    const settingsObj = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  if (email === "t6068422@gmail.com" && password === "Aass1122@") {
    res.json({ success: true, token: "admin-token-placeholder" });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// User management
app.post("/api/user/sync", (req, res) => {
  try {
    if (!db) throw new Error("Database not initialized");
    const { userId, username, ip } = req.body;
    
    if (!userId || typeof userId !== 'string' || userId.trim() === '' || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({ error: "Invalid User ID provided" });
    }

    console.log(`[USER] Syncing user: ${userId}`);
    
    let user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
    
    if (!user) {
      console.log(`[USER] Creating new user: ${userId}`);
      db.prepare("INSERT INTO users (id, username, ip_address) VALUES (?, ?, ?)").run(
        userId, 
        username || `User_${userId.slice(0, 4)}`, 
        ip || req.ip || "127.0.0.1"
      );
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    } else {
      db.prepare("UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?").run(userId);
    }
    
    if (!user) {
      throw new Error("Failed to retrieve user after sync/create");
    }
    
    res.json(user);
  } catch (err: any) {
    console.error("[USER] Sync error:", err);
    res.status(500).json({ error: "Database error during sync", message: err.message });
  }
});

app.post("/api/user/add-coins", (req, res) => {
  try {
    if (!db) throw new Error("Database not initialized");
    const { userId, amount, reason } = req.body;
    const user = db.prepare("SELECT coins FROM users WHERE id = ?").get(userId) as any;
    if (!user) return res.status(404).json({ message: "User not found" });
    
    const newCoins = user.coins + amount;
    if (newCoins < 0) return res.status(400).json({ message: "Insufficient balance" });

    const totalEarnedAdd = amount > 0 ? amount : 0;
    db.prepare("UPDATE users SET coins = ?, total_earned = total_earned + ? WHERE id = ?").run(newCoins, totalEarnedAdd, userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/user/update", (req, res) => {
  try {
    const { id, coins, total_earned, is_blocked, block_reason } = req.body;
    db.prepare("UPDATE users SET coins = ?, total_earned = ?, is_blocked = ?, block_reason = ? WHERE id = ?").run(coins, total_earned, is_blocked ? 1 : 0, block_reason, id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Tasks
app.get("/api/tasks", (req, res) => {
  try {
    if (!db) throw new Error("Database not initialized");
    const userId = req.query.userId;
    const now = new Date().toISOString();
    let tasks;
    if (userId) {
      tasks = db.prepare(`
        SELECT t.*, 
        CASE WHEN ut.task_id IS NOT NULL THEN 1 ELSE 0 END as completed
        FROM tasks t
        LEFT JOIN user_tasks ut ON t.id = ut.task_id AND ut.user_id = ?
        WHERE t.active = 1 AND (t.expires_at IS NULL OR t.expires_at > ?)
      `).all(userId, now);
    } else {
      tasks = db.prepare("SELECT * FROM tasks WHERE active = 1 AND (expires_at IS NULL OR expires_at > ?)").all(now);
    }
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/tasks/complete", (req, res) => {
  try {
    if (!db) throw new Error("Database not initialized");
    const { userId, taskId } = req.body;
    const existing = db.prepare("SELECT * FROM user_tasks WHERE user_id = ? AND task_id = ?").get(userId, taskId);
    if (existing) return res.status(400).json({ message: "Task already completed" });

    const task = db.prepare("SELECT reward FROM tasks WHERE id = ?").get(taskId) as any;
    if (!task) return res.status(404).json({ message: "Task not found" });

    db.prepare("INSERT INTO user_tasks (user_id, task_id) VALUES (?, ?)").run(userId, taskId);
    db.prepare("UPDATE users SET coins = coins + ?, total_earned = total_earned + ? WHERE id = ?").run(task.reward, task.reward, userId);
    res.json({ success: true, reward: task.reward });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Task Admin
app.get("/api/admin/tasks", (req, res) => {
  try {
    if (!db) throw new Error("Database not initialized");
    const tasks = db.prepare("SELECT * FROM tasks").all();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/admin/tasks", (req, res) => {
  try {
    const { title, reward, time_estimate, category, icon, link, expires_at } = req.body;
    const info = db.prepare("INSERT INTO tasks (title, reward, time_estimate, category, icon, link, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(title, reward, time_estimate, category, icon, link, expires_at || null);
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/admin/tasks/:id", (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) return res.status(400).json({ message: "Invalid task ID" });
    const { title, reward, time_estimate, category, icon, link, active, expires_at } = req.body;
    db.prepare("UPDATE tasks SET title = ?, reward = ?, time_estimate = ?, category = ?, icon = ?, link = ?, active = ?, expires_at = ? WHERE id = ?").run(title, reward, time_estimate, category, icon, link, active ? 1 : 0, expires_at || null, taskId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.all("/api/admin/tasks/delete", (req, res) => {
  try {
    const id = req.body.id || req.query.id;
    const taskId = parseInt(id as string);
    if (isNaN(taskId)) return res.status(400).json({ success: false, message: "Invalid Task ID" });

    db.prepare("DELETE FROM user_tasks WHERE task_id = ?").run(taskId);
    db.prepare("DELETE FROM tasks WHERE id = ?").run(taskId);
    res.json({ success: true, message: "Task deleted" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.all("/api/admin/tasks/bulk-delete", (req, res) => {
  try {
    const ids = req.body.ids || (req.query.ids ? (req.query.ids as string).split(',').map(Number) : null);
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: "No task IDs provided" });
    
    const bulkDelete = db.transaction((taskIds) => {
      for (const id of taskIds) {
        db.prepare("DELETE FROM user_tasks WHERE task_id = ?").run(id);
        db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
      }
    });
    bulkDelete(ids);
    res.json({ success: true, message: `Successfully deleted ${ids.length} tasks` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Coupons
app.get("/api/admin/coupons", (req, res) => {
  try {
    const coupons = db.prepare("SELECT * FROM coupons").all();
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/admin/coupons", (req, res) => {
  try {
    const { code, reward, usage_limit, expiry_date } = req.body;
    db.prepare("INSERT INTO coupons (code, reward, usage_limit, expiry_date) VALUES (?, ?, ?, ?)").run(code, reward, usage_limit, expiry_date);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/admin/coupons/:code", (req, res) => {
  try {
    db.prepare("DELETE FROM coupons WHERE code = ?").run(req.params.code);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/coupons/redeem", (req, res) => {
  try {
    const { code, userId } = req.body;
    const coupon = db.prepare("SELECT * FROM coupons WHERE code = ? AND active = 1").get(code) as any;
    if (!coupon) return res.status(404).json({ message: "Invalid coupon" });
    
    const alreadyRedeemed = db.prepare("SELECT * FROM user_coupons WHERE user_id = ? AND coupon_code = ?").get(userId, code);
    if (alreadyRedeemed) return res.status(400).json({ message: "You have already redeemed this coupon" });

    if (coupon.used_count >= coupon.usage_limit) return res.status(400).json({ message: "Coupon limit reached" });
    
    const redeemTransaction = db.transaction(() => {
      db.prepare("INSERT INTO user_coupons (user_id, coupon_code) VALUES (?, ?)").run(userId, code);
      db.prepare("UPDATE coupons SET used_count = used_count + 1 WHERE code = ?").run(code);
      db.prepare("UPDATE users SET coins = coins + ? WHERE id = ?").run(coupon.reward, userId);
    });
    redeemTransaction();
    res.json({ success: true, reward: coupon.reward });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Withdrawals
app.post("/api/withdrawals", (req, res) => {
  try {
    const { userId, amount, method, address } = req.body;
    const settings = db.prepare("SELECT value FROM settings WHERE key = 'withdrawals_enabled'").get() as any;
    if (settings.value !== 'true') return res.status(403).json({ message: "Withdrawals are paused" });

    const user = db.prepare("SELECT coins FROM users WHERE id = ?").get(userId) as any;
    if (user.coins < amount) return res.status(400).json({ message: "Insufficient balance" });

    db.prepare("UPDATE users SET coins = coins - ? WHERE id = ?").run(amount, userId);
    db.prepare("INSERT INTO withdrawals (user_id, amount, method, address) VALUES (?, ?, ?, ?)").run(userId, amount, method, address);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/admin/withdrawals/status", (req, res) => {
  try {
    const { id, status } = req.body;
    db.prepare("UPDATE withdrawals SET status = ? WHERE id = ?").run(status, id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Daily Bonus
app.get("/api/daily/status", (req, res) => {
  try {
    const { userId } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const claim = db.prepare("SELECT * FROM daily_claims WHERE user_id = ? AND claim_date = ?").get(userId, today);
    
    const lastClaim = db.prepare("SELECT * FROM daily_claims WHERE user_id = ? ORDER BY claim_date DESC LIMIT 1").get(userId) as any;
    let streak = 0;
    if (lastClaim) {
      const lastDate = new Date(lastClaim.claim_date);
      const diff = Math.floor((new Date(today).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 0) streak = lastClaim.streak;
      else if (diff === 1) streak = lastClaim.streak;
      else streak = 0;
    }
    res.json({ claimed: !!claim, streak });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/daily/claim", (req, res) => {
  try {
    const { userId } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    const existingClaim = db.prepare("SELECT * FROM daily_claims WHERE user_id = ? AND claim_date = ?").get(userId, today);
    if (existingClaim) return res.status(400).json({ message: "Already claimed today" });

    const lastClaim = db.prepare("SELECT * FROM daily_claims WHERE user_id = ? ORDER BY claim_date DESC LIMIT 1").get(userId) as any;
    let streak = 1;
    if (lastClaim) {
      const lastDate = new Date(lastClaim.claim_date);
      const diff = Math.floor((new Date(today).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) streak = lastClaim.streak + 1;
      else if (diff === 0) return res.status(400).json({ message: "Already claimed today" });
    }

    const reward = [10, 20, 30, 40, 50, 75, 100][(streak - 1) % 7];
    db.prepare("INSERT INTO daily_claims (user_id, claim_date, streak) VALUES (?, ?, ?)").run(userId, today, streak);
    db.prepare("UPDATE users SET coins = coins + ?, total_earned = total_earned + ? WHERE id = ?").run(reward, reward, userId);
    res.json({ success: true, reward, streak });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Game Plays Tracking
app.get("/api/games/plays", (req, res) => {
  try {
    const { userId, gameId } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const plays = db.prepare("SELECT play_count FROM game_plays WHERE user_id = ? AND game_id = ? AND play_date = ?").get(userId, gameId, today) as any;
    res.json({ count: plays ? plays.play_count : 0 });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/games/play", (req, res) => {
  try {
    const { userId, gameId } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const plays = db.prepare("SELECT play_count FROM game_plays WHERE user_id = ? AND game_id = ? AND play_date = ?").get(userId, gameId, today) as any;
    const count = plays ? plays.play_count : 0;
    if (count >= 10) return res.status(403).json({ message: "Daily limit reached (10 plays per day)" });
    if (plays) {
      db.prepare("UPDATE game_plays SET play_count = play_count + 1 WHERE user_id = ? AND game_id = ? AND play_date = ?").run(userId, gameId, today);
    } else {
      db.prepare("INSERT INTO game_plays (user_id, game_id, play_date, play_count) VALUES (?, ?, ?, 1)").run(userId, gameId, today);
    }
    res.json({ success: true, newCount: count + 1 });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Ads Management
app.get("/api/admin/ads", (req, res) => {
  try {
    const ads = db.prepare("SELECT * FROM ads").all();
    res.json(ads);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/admin/ads", (req, res) => {
  try {
    const { placement, code, active } = req.body;
    const existing = db.prepare("SELECT id FROM ads WHERE placement = ?").get(placement) as any;
    if (existing) {
      db.prepare("UPDATE ads SET code = ?, active = ? WHERE placement = ?").run(code, active ? 1 : 0, placement);
    } else {
      db.prepare("INSERT INTO ads (placement, code, active) VALUES (?, ?, ?)").run(placement, code, active ? 1 : 0);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/admin/ads/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM ads WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/ads/:placement", (req, res) => {
  try {
    if (!db) throw new Error("Database not initialized");
    const { placement } = req.params;
    const ad = db.prepare("SELECT code FROM ads WHERE placement = ? AND active = 1").get(placement) as any;
    res.json(ad || { code: null });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/ads", (req, res) => {
  try {
    const ads = db.prepare("SELECT placement, code FROM ads WHERE active = 1").all();
    const adsMap = ads.reduce((acc: any, ad: any) => {
      acc[ad.placement] = ad.code;
      return acc;
    }, {});
    res.json(adsMap);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/admin/users", (req, res) => {
  try {
    const users = db.prepare("SELECT * FROM users").all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/admin/withdrawals", (req, res) => {
  try {
    const withdrawals = db.prepare("SELECT w.*, u.username FROM withdrawals w JOIN users u ON w.user_id = u.id").all();
    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/admin/settings", (req, res) => {
  try {
    const { key, value } = req.body;
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ 
    error: "Internal Server Error", 
    message: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Vite / Static logic
async function startServer() {
  console.log(`Starting server in ${process.env.NODE_ENV} mode...`);
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "..", "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    const PORT = process.env.PORT || 3000;
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});

export default app;
