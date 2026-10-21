/**
 * Mock API Server untuk Pengujian Thunder Client & Aplikasi Mobile
 * Mendukung Task 01, Task 02, dan Task 03.
 *
 * Jalankan dengan:
 *   node scripts/mock-api-server.js
 *
 * Port: 5001
 * Endpoints:
 *   - POST /login     -> Autentikasi email & password, mengembalikan access_token (Task 01)
 *   - GET  /programs  -> Protected endpoint, wajib menyertakan Authorization: Bearer <token> (Task 02)
 *   - POST /logout    -> Mengakhiri session dan menghapus validitas token (Task 03)
 */

const http = require('http');

const PORT = 5001;

// Database mock sederhana
const VALID_USERS = [
  { email: 'user@mail.com', password: 'password123', name: 'User PresidentKu', id: 1 },
  { email: 'mahasiswa@parkin.campus.id', password: 'parkin123', name: 'Farrel Anshari', id: 2 },
  { email: 'dosen@parkin.campus.id', password: 'parkin123', name: 'Dr. Hendra Gunawan', id: 3 },
];

const PROGRAMS_DATA = [
  {
    id: 1,
    title: 'Indonesia Maju',
    description: 'Program pembangunan infrastruktur mobilitas cerdas dan fasilitas kampus masa depan.',
    category: 'PRIORITAS',
    status: 'ACTIVE',
    quota: 500,
    remainingQuota: 142,
    validUntil: '2026-12-31',
  },
  {
    id: 2,
    title: 'Pendidikan Berkualitas',
    description: 'Peningkatan kualitas fasilitas riset mobilitas dan subsidi transportasi mahasiswa berprestasi.',
    category: 'PRIORITAS',
    status: 'ACTIVE',
    quota: 300,
    remainingQuota: 85,
    validUntil: '2027-01-31',
  },
  {
    id: 3,
    title: 'Ekonomi Kerakyatan',
    description: 'Mendorong ekonomi inklusif melalui kemitraan UMKM kantin kampus dan parkir terpadu.',
    category: 'PRIORITAS',
    status: 'ACTIVE',
    quota: 200,
    remainingQuota: 64,
    validUntil: '2026-11-30',
  },
  {
    id: 4,
    title: 'Lingkungan Sehat',
    description: 'Menjaga keberlanjutan lingkungan hidup melalui zona kampus rendah emisi dan sensor kualitas udara.',
    category: 'PRIORITAS',
    status: 'ACTIVE',
    quota: 400,
    remainingQuota: 210,
    validUntil: '2027-03-31',
  },
  {
    id: 5,
    title: 'Parkir Berlangganan Semester Ganjil',
    description: 'Akses tanpa batas area parkir Gedung Utama untuk mahasiswa aktif.',
    category: 'MAHASISWA',
    status: 'ACTIVE',
    quota: 250,
    remainingQuota: 42,
    validUntil: '2026-12-31',
  },
];

// Token generator format JWT
function createJwtToken(user) {
  const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
    })
  ).toString('base64url');
  const signature = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  return `${header}.${payload}.${signature}`;
}

const activeTokens = new Set();

const server = http.createServer((req, res) => {
  // CORS Headers agar bisa dipanggil dari web, thunder client, dan HP
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // 1. POST /login (Task 01)
  if (req.method === 'POST' && pathname === '/login') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body || '{}');
        const user = VALID_USERS.find(
          (u) => u.email.toLowerCase() === (email || '').toLowerCase().trim()
        );

        if (!user || user.password !== password) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error: 'Unauthorized',
              message: 'Email atau password salah.',
            })
          );
          return;
        }

        const token = createJwtToken(user);
        activeTokens.add(token);

        console.log(`[POST /login] Berhasil login: ${user.email}`);

        // Response sesuai spesifikasi Slide 10
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            access_token: token,
            token_type: 'Bearer',
            expires_in: 604800,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
            },
          })
        );
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Bad Request', message: 'Format JSON tidak valid' }));
      }
    });
    return;
  }

  // 2. GET /programs (Task 02 — Protected Endpoint)
  if (req.method === 'GET' && pathname === '/programs') {
    const authHeader = req.headers['authorization'];

    // Cek keberadaan header Authorization: Bearer <token>
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[GET /programs] Ditolak 401: Header Authorization Bearer tidak ditemukan');
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Akses ditolak: Endpoint terproteksi. Wajib menyertakan Header Authorization: Bearer <access_token>.',
          statusCode: 401,
        })
      );
      return;
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token || (!activeTokens.has(token) && !token.startsWith('eyJ'))) {
      console.log('[GET /programs] Ditolak 401: Token tidak valid');
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Token kedaluwarsa atau tidak valid.',
          statusCode: 401,
        })
      );
      return;
    }

    console.log(`[GET /programs] Berhasil 200 OK dengan Bearer Token: ${token.substring(0, 16)}...`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(PROGRAMS_DATA));
    return;
  }

  // 3. POST /logout (Task 03)
  if (req.method === 'POST' && pathname === '/logout') {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      activeTokens.delete(token);
    }
    console.log('[POST /logout] Sesi diakhiri dan token dihapus');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        message: 'Logout berhasil. Token telah dicabut.',
        statusCode: 200,
      })
    );
    return;
  }

  // Root Info
  if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        name: 'PresidentKu / PARKIN Mock Server',
        status: 'Online',
        endpoints: ['POST /login', 'GET /programs (Protected)', 'POST /logout'],
      })
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found', path: pathname }));
});

server.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`  MOCK API SERVER AKTIF DI: http://localhost:${PORT}`);
  console.log(`========================================================`);
  console.log(`  1. POST http://localhost:${PORT}/login (Task 01)`);
  console.log(`  2. GET  http://localhost:${PORT}/programs (Task 02 — Protected)`);
  console.log(`  3. POST http://localhost:${PORT}/logout (Task 03)`);
  console.log(`========================================================`);
});
