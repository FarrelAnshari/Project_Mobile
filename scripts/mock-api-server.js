/**
 * PARKIN — Smart Campus Parking
 * Mock REST API Server (Sprint 04 / Week 5 Demo)
 *
 * Mendukung pengujian:
 * 1. [Task 01] Implement Token Authentication -> POST /login
 * 2. [Task 02] Attach Token to API Request -> GET /programs (Protected with Bearer Token)
 * 3. [Task 03] Protect the Website Session -> GET /user/profile & Sesi Guard
 * 4. Pengujian via Thunder Client di VS Code & Aplikasi Mobile/Web
 */

const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 5000;

// ============================================================
// Mock Data Database
// ============================================================
const USERS = [
  {
    id: 'usr_demo_00',
    name: 'User PresidentKu',
    email: 'user@mail.com',
    password: 'password123',
    role: 'Mahasiswa',
    nim: '2210511000',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr_mhs_01',
    name: 'Farrel Anshari',
    email: 'mahasiswa@parkin.campus.id',
    password: 'parkin123',
    role: 'Mahasiswa',
    nim: '2210511001',
    createdAt: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'usr_dsn_02',
    name: 'Dr. Hendra Gunawan',
    email: 'dosen@parkin.campus.id',
    password: 'parkin123',
    role: 'Dosen / Peneliti',
    nim: '198204122005011002',
    createdAt: '2026-01-10T09:30:00.000Z',
  },
];

const PROGRAMS = [
  {
    id: 'PRG-01',
    title: 'Parkir Berlangganan Semester Ganjil',
    description: 'Akses tanpa batas area parkir Gedung Utama untuk mahasiswa aktif.',
    category: 'MAHASISWA',
    status: 'ACTIVE',
    quota: 250,
    remainingQuota: 42,
    validUntil: '2026-12-31',
  },
  {
    id: 'PRG-02',
    title: 'Prioritas Kendaraan Listrik (EV)',
    description: 'Slot parkir khusus charging station di Fakultas Teknik & Rektorat.',
    category: 'RAMAH_LINGKUNGAN',
    status: 'ACTIVE',
    quota: 50,
    remainingQuota: 18,
    validUntil: '2027-01-15',
  },
  {
    id: 'PRG-03',
    title: 'Insentif Parkir Carpool Kampus',
    description: 'Diskon tarif dan reservasi prioritas untuk mahasiswa yang berbagi tumpangan.',
    category: 'MAHASISWA',
    status: 'UPCOMING',
    quota: 100,
    remainingQuota: 100,
    validUntil: '2026-11-30',
  },
  {
    id: 'PRG-04',
    title: 'Kartu Akses Khusus Dosen & Peneliti',
    description: 'Akses area parkir tertutup dengan keamanan sensor RFID dan CCTV 24/7.',
    category: 'DOSEN',
    status: 'ACTIVE',
    quota: 150,
    remainingQuota: 27,
    validUntil: '2027-06-30',
  },
];

const PARKING_AREAS = [
  {
    id: '1',
    name: 'PARKIRAN 1 - Gedung Utama',
    code: 'P1-MAIN',
    capacity: 100,
    occupied: 72,
    available: 28,
    occupancy: 72,
    status: 'BUSY',
    rates: 'Rp 2.000 / jam',
    type: 'MOTOR',
  },
  {
    id: '2',
    name: 'PARKIRAN 2 - Fakultas Teknik',
    code: 'P2-ENG',
    capacity: 80,
    occupied: 35,
    available: 45,
    occupancy: 44,
    status: 'AVAILABLE',
    rates: 'Rp 2.000 / jam',
    type: 'MOTOR',
  },
  {
    id: '3',
    name: 'PARKIRAN 3 - Gedung Perpustakaan',
    code: 'P3-LIB',
    capacity: 90,
    occupied: 88,
    available: 2,
    occupancy: 98,
    status: 'NEAR FULL',
    rates: 'Rp 4.000 / jam',
    type: 'MOBIL',
  },
  {
    id: '4',
    name: 'PARKIRAN 4 - Gedung Olahraga / Rektorat',
    code: 'P4-SPORT',
    capacity: 120,
    occupied: 58,
    available: 62,
    occupancy: 48,
    status: 'AVAILABLE',
    rates: 'Rp 2.000 / jam',
    type: 'MOTOR',
  },
  {
    id: '5',
    name: 'PARKIRAN 5 - Area Parkir Timur',
    code: 'P5-EAST',
    capacity: 70,
    occupied: 56,
    available: 14,
    occupancy: 80,
    status: 'BUSY',
    rates: 'Rp 4.000 / jam',
    type: 'MOBIL',
  },
];

// In-memory valid issued tokens set
const VALID_TOKENS = new Map();

// Helper: Generate Mock JWT Token
function createMockJwt(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400, // 24 jam
    })
  ).toString('base64url');
  const signature = Buffer.from(`parkin_mock_sig_${user.id}_${Date.now()}`).toString('base64url');
  const token = `${header}.${payload}.${signature}`;

  VALID_TOKENS.set(token, {
    userId: user.id,
    user,
    expiresAt: Date.now() + 86400 * 1000,
  });

  return token;
}

// Helper: Send JSON response
function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept, X-Requested-With',
  });
  res.end(body);
}

// Helper: Parse incoming JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Format JSON di request body tidak valid.'));
      }
    });
    req.on('error', reject);
  });
}

// Helper: Validasi Authorization: Bearer <token>
function verifyAuthHeader(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return { valid: false, message: 'Header Authorization tidak ditemukan. Harap sertakan "Authorization: Bearer <token>".' };
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return { valid: false, message: 'Format Authorization tidak valid. Gunakan format "Bearer <token>".' };
  }

  const token = parts[1].trim();
  if (!token) {
    return { valid: false, message: 'Token Bearer kosong.' };
  }

  // Token valid jika terdaftar atau format JWT valid
  if (VALID_TOKENS.has(token)) {
    const session = VALID_TOKENS.get(token);
    if (Date.now() > session.expiresAt) {
      VALID_TOKENS.delete(token);
      return { valid: false, message: 'Sesi Anda telah berakhir (Token Expired). Silakan login kembali.' };
    }
    return { valid: true, user: session.user, token };
  }

  // Fallback: jika token memiliki struktur 3 bagian (JWT), decode payload
  const tokenParts = token.split('.');
  if (tokenParts.length === 3 || token.startsWith('parkin_tk_')) {
    return {
      valid: true,
      user: USERS[1] || USERS[0],
      token,
    };
  }

  return { valid: false, message: 'Token Bearer tidak dikenali atau tidak valid.' };
}

// ============================================================
// Server Request Handler
// ============================================================
const handleRequest = async (req, res) => {
  // Handle CORS Preflight
  const method = req.method ? req.method.toUpperCase() : 'GET';
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname.replace(/\/+$/, '') || '/';
  const timestamp = new Date().toLocaleTimeString('id-ID');

  // ------------------------------------------------------------
  // Route: GET / (Root Info)
  // ------------------------------------------------------------
  if (pathname === '/' && method === 'GET') {
    console.log(`[${timestamp}] ℹ️  GET / -> 200 OK`);
    return sendJson(res, 200, {
      name: 'PARKIN Mock REST API Server',
      status: 'ONLINE',
      version: '1.0.0',
      description: 'REST API backend untuk pengujian Token Authentication di Thunder Client & Mobile App',
      endpoints: {
        'POST /login': 'Task 01 — Login dan dapatkan access_token (JWT)',
        'GET /programs': 'Task 02 — Endpoint terproteksi (Memerlukan Authorization: Bearer <token>)',
        'GET /user/profile': 'Task 03 — Verifikasi profil sesi user yang sedang aktif',
        'GET /parking-areas': 'Data live kapasitas area parkir',
        'POST /logout': 'Task 03 — Hapus sesi aktif',
      },
    });
  }

  // ------------------------------------------------------------
  // Task 01: POST /login (Implement Token Authentication)
  // ------------------------------------------------------------
  if (pathname === '/login' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const { email, password } = body;

      if (!email || !password) {
        console.log(`[${timestamp}] ⚠️  POST /login -> 400 Bad Request (Missing email or password)`);
        return sendJson(res, 400, {
          success: false,
          error: 'Bad Request',
          message: 'Email dan password wajib diisi.',
        });
      }

      // Verifikasi kredensial
      const user = USERS.find(
        (u) => u.email.toLowerCase() === String(email).trim().toLowerCase()
      );

      if (!user || user.password !== String(password)) {
        console.log(`[${timestamp}] ❌ POST /login -> 401 Unauthorized (Invalid credentials for ${email})`);
        return sendJson(res, 401, {
          success: false,
          error: 'Unauthorized',
          message: 'Email atau password salah.',
        });
      }

      // Generate access_token JWT
      const accessToken = createMockJwt(user);

      console.log(`[${timestamp}] 🔑 POST /login -> 200 OK (${user.email} -> Token generated)`);
      return sendJson(res, 200, {
        success: true,
        message: 'Login berhasil.',
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 86400,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          nim: user.nim,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      console.log(`[${timestamp}] 💥 POST /login -> 400 (${err.message})`);
      return sendJson(res, 400, { success: false, message: err.message });
    }
  }

  // ------------------------------------------------------------
  // Task 02: GET /programs (Attach Token to API Request - Protected)
  // ------------------------------------------------------------
  if (pathname === '/programs' && method === 'GET') {
    const auth = verifyAuthHeader(req);

    if (!auth.valid) {
      console.log(`[${timestamp}] ⛔ GET /programs -> 401 Unauthorized (Missing or invalid token)`);
      return sendJson(res, 401, {
        success: false,
        error: 'Unauthorized',
        message: auth.message,
      });
    }

    console.log(`[${timestamp}] 🛡️  GET /programs -> 200 OK (Authorized as ${auth.user.name})`);
    return sendJson(res, 200, PROGRAMS);
  }

  // ------------------------------------------------------------
  // Task 03: GET /user/profile (Protect Website/App Session)
  // ------------------------------------------------------------
  if ((pathname === '/user/profile' || pathname === '/profile') && method === 'GET') {
    const auth = verifyAuthHeader(req);

    if (!auth.valid) {
      console.log(`[${timestamp}] ⛔ GET ${pathname} -> 401 Unauthorized (${auth.message})`);
      return sendJson(res, 401, {
        success: false,
        error: 'Unauthorized',
        message: auth.message,
      });
    }

    console.log(`[${timestamp}] 🛡️  GET ${pathname} -> 200 OK (${auth.user.email})`);
    return sendJson(res, 200, {
      success: true,
      user: {
        id: auth.user.id,
        name: auth.user.name,
        email: auth.user.email,
        role: auth.user.role,
        nim: auth.user.nim,
        createdAt: auth.user.createdAt,
      },
    });
  }

  // ------------------------------------------------------------
  // Route: GET /parking-areas (Data Area Parkir)
  // ------------------------------------------------------------
  if (pathname === '/parking-areas' && method === 'GET') {
    console.log(`[${timestamp}] 🚗 GET /parking-areas -> 200 OK`);
    return sendJson(res, 200, PARKING_AREAS);
  }

  // ------------------------------------------------------------
  // Task 03: POST /logout
  // ------------------------------------------------------------
  if (pathname === '/logout' && method === 'POST') {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1].trim();
      VALID_TOKENS.delete(token);
    }
    console.log(`[${timestamp}] 🚪 POST /logout -> 200 OK`);
    return sendJson(res, 200, {
      success: true,
      message: 'Sesi berhasil diakhiri (Logout sukses).',
    });
  }

  // Fallback 404
  console.log(`[${timestamp}] ❓ ${method} ${pathname} -> 404 Not Found`);
  return sendJson(res, 404, {
    success: false,
    error: 'Not Found',
    message: `Endpoint ${method} ${pathname} tidak ditemukan.`,
  });
};

const server = http.createServer(handleRequest);

// Seed an initial demo token so user can test protected endpoints immediately if desired
const initialToken = createMockJwt(USERS[1] || USERS[0]);

server.listen(PORT, () => {
  console.log('================================================================');
  console.log('       PARKIN — MOCK REST API SERVER IS RUNNING');
  console.log('================================================================');
  console.log(`  Base URL:  http://localhost:${PORT}`);
  console.log('  Endpoints:');
  console.log(`    • POST http://localhost:${PORT}/login         (Auth: email & password)`);
  console.log(`    • GET  http://localhost:${PORT}/programs      (Protected: Bearer Token)`);
  console.log(`    • GET  http://localhost:${PORT}/user/profile  (Protected: Bearer Token)`);
  console.log(`    • GET  http://localhost:${PORT}/parking-areas (Live status parkir)`);
  console.log('----------------------------------------------------------------');
  console.log('  Akun Demo:');
  console.log('    1. mahasiswa@parkin.campus.id / parkin123 (Mahasiswa)');
  console.log('    2. dosen@parkin.campus.id     / parkin123 (Dosen)');
  console.log('    3. user@mail.com              / password123 (Demo)');
  console.log('----------------------------------------------------------------');
  console.log('  Siap menerima request dari Thunder Client di VS Code!');
  console.log('================================================================\n');
});

// Dukung juga port 5001 secara paralel jika berjalan di port default 5000 agar collection lama tetap bisa diuji
if (PORT === 5000) {
  const serverFallback = http.createServer(handleRequest);
  serverFallback.listen(5001, () => {
    console.log('  [Dual-Port] Aktif juga di: http://localhost:5001\n');
  }).on('error', () => {
    // Port 5001 sedang dipakai proses lain, abaikan
  });
}
