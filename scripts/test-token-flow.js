/**
 * PARKIN — Smart Campus Parking
 * Script Pengujian Otomatis Alur Token Authentication & Sesi
 *
 * Menjalankan uji menyeluruh untuk:
 * 1. Task 01 — Implement Token Authentication (POST /login)
 * 2. Task 02 — Attach Token to API Request (GET /programs with Authorization: Bearer <token>)
 * 3. Task 03 — Protect the Website Session (GET /user/profile & 401 Guard)
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

async function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = {
      'Accept': 'application/json',
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = rawData ? JSON.parse(rawData) : {};
            resolve({ status: res.statusCode, headers: res.headers, data: parsed });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, data: rawData });
          }
        });
      }
    );

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTestSuite() {
  console.log('\n============================================================');
  console.log('   PARKIN — PENGUJIAN REST API & TOKEN AUTHENTICATION');
  console.log('============================================================\n');

  let passedTests = 0;
  let totalTests = 5;

  // ------------------------------------------------------------
  // Test 1: Task 01 - Login dengan Kredensial Salah
  // ------------------------------------------------------------
  console.log('[TEST 1] Task 01: POST /login dengan password salah');
  try {
    const res1 = await request('POST', '/login', {
      email: 'mahasiswa@parkin.campus.id',
      password: 'password_salah',
    });

    if (res1.status === 401) {
      console.log('  ✅ Status HTTP: 401 Unauthorized');
      console.log('  ✅ Respons error:', res1.data.message || res1.data.error);
      passedTests++;
    } else {
      console.log(`  ❌ Gagal: Status yang diterima ${res1.status}, diharapkan 401`);
    }
  } catch (err) {
    console.log('  ❌ Koneksi gagal:', err.message);
  }

  // ------------------------------------------------------------
  // Test 2: Task 01 - Login dengan Kredensial Valid & Dapatkan Token
  // ------------------------------------------------------------
  console.log('\n[TEST 2] Task 01: POST /login dengan kredensial valid (Dapatkan Token)');
  let token = null;
  try {
    const res2 = await request('POST', '/login', {
      email: 'mahasiswa@parkin.campus.id',
      password: 'parkin123',
    });

    if (res2.status === 200 && res2.data.access_token) {
      token = res2.data.access_token;
      console.log('  ✅ Status HTTP: 200 OK');
      console.log('  ✅ Access Token Diterima:', token.substring(0, 30) + '...');
      console.log('  ✅ User Profil:', res2.data.user.name, `(${res2.data.user.role})`);
      passedTests++;
    } else {
      console.log(`  ❌ Gagal: Token tidak ditemukan dalam respons.`);
    }
  } catch (err) {
    console.log('  ❌ Koneksi gagal:', err.message);
  }

  // ------------------------------------------------------------
  // Test 3: Task 02 - Akses Endpoint Terproteksi Tanpa Token
  // ------------------------------------------------------------
  console.log('\n[TEST 3] Task 02: GET /programs tanpa header Authorization (Harus 401)');
  try {
    const res3 = await request('GET', '/programs');
    if (res3.status === 401) {
      console.log('  ✅ Status HTTP: 401 Unauthorized');
      console.log('  ✅ Akses ditolak karena tidak ada token Bearer.');
      passedTests++;
    } else {
      console.log(`  ❌ Gagal: Status yang diterima ${res3.status}, diharapkan 401`);
    }
  } catch (err) {
    console.log('  ❌ Koneksi gagal:', err.message);
  }

  // ------------------------------------------------------------
  // Test 4: Task 02 - Akses Endpoint Terproteksi Dengan Bearer Token
  // ------------------------------------------------------------
  console.log('\n[TEST 4] Task 02: GET /programs dengan Authorization: Bearer <token>');
  try {
    const res4 = await request('GET', '/programs', null, token);
    if (res4.status === 200 && Array.isArray(res4.data)) {
      console.log('  ✅ Status HTTP: 200 OK');
      console.log(`  ✅ Berhasil mengambil ${res4.data.length} program kampus terproteksi:`);
      res4.data.forEach((p) => {
        console.log(`     • [${p.id}] ${p.title} (${p.category})`);
      });
      passedTests++;
    } else {
      console.log(`  ❌ Gagal: Status ${res4.status}`);
    }
  } catch (err) {
    console.log('  ❌ Koneksi gagal:', err.message);
  }

  // ------------------------------------------------------------
  // Test 5: Task 03 - Protect Website Session (GET /user/profile)
  // ------------------------------------------------------------
  console.log('\n[TEST 5] Task 03: GET /user/profile (Verifikasi Sesi Pengguna Aktif)');
  try {
    const res5 = await request('GET', '/user/profile', null, token);
    if (res5.status === 200 && res5.data.user) {
      console.log('  ✅ Status HTTP: 200 OK');
      console.log('  ✅ Sesi valid untuk:', res5.data.user.name, `(${res5.data.user.email})`);
      passedTests++;
    } else {
      console.log(`  ❌ Gagal: Status ${res5.status}`);
    }
  } catch (err) {
    console.log('  ❌ Koneksi gagal:', err.message);
  }

  console.log('\n============================================================');
  console.log(`   HASIL PENGUJIAN: ${passedTests}/${totalTests} BERHASIL ${passedTests === totalTests ? '🎉' : '⚠️'}`);
  console.log('============================================================\n');
}

runTestSuite();
