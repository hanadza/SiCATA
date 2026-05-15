/**
 * api.js — SiCATA API Layer
 *
 * ╔══════════════════════════════════════════════════════════╗
 * ║  CARA MENGHUBUNGKAN FRONTEND KE BACKEND                  ║
 * ║                                                          ║
 * ║  1. Jalankan backend Laravel:                            ║
 * ║     cd sicata-backend                                    ║
 * ║     php artisan serve                                    ║
 * ║     → berjalan di http://127.0.0.1:8000                 ║
 * ║                                                          ║
 * ║  2. Ganti nilai API_BASE di bawah menjadi:               ║
 * ║     const API_BASE = 'http://127.0.0.1:8000';           ║
 * ║                                                          ║
 * ║  3. Buka frontend (sicata-v2) dengan Live Server / WAMP  ║
 * ║                                                          ║
 * ║  Selama API_BASE kosong → pakai mock data (localStorage) ║
 * ╚══════════════════════════════════════════════════════════╝
 */

const API_BASE = 'https://sicata-production.up.railway.app'; // Ganti → 'http://127.0.0.1:8000' setelah backend berjalan

// ─── AUTH HELPERS ────────────────────────────────────────────
function getToken()  { return localStorage.getItem('sicata_token'); }
function getUser()   { return JSON.parse(localStorage.getItem('sicata_user') || 'null'); }
function isLoggedIn(){ return !!getToken(); }

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  };
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

async function logout() {
  try {
    if (API_BASE && getToken()) {
      await fetch(`${API_BASE}/api/logout`, {
        method: 'POST',
        headers: authHeaders()
      });
    }
  } catch(e) { /* ignore — clearing local state regardless */ }
  localStorage.removeItem('sicata_token');
  localStorage.removeItem('sicata_user');
  window.location.href = 'login.html';
}

// ─── MOCK DB (dipakai saat API_BASE kosong) ──────────────────
const MOCK_DB = {
  get db()  { return JSON.parse(localStorage.getItem('sicata_db')  || '[]'); },
  set db(v) { localStorage.setItem('sicata_db',  JSON.stringify(v)); },
  get ctr() { return JSON.parse(localStorage.getItem('sicata_ctr') || '{}'); },
  set ctr(v){ localStorage.setItem('sicata_ctr', JSON.stringify(v)); },
};

const ROM   = ['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
const KODE_MAP = {
  keluar_keterangan: {kode:'SK',  label:'Surat Keterangan',       kat:'keluar'},
  keluar_undangan:   {kode:'SU',  label:'Surat Undangan',         kat:'keluar'},
  keluar_permohonan: {kode:'SP',  label:'Surat Permohonan',       kat:'keluar'},
  keluar_pengantar:  {kode:'SPG', label:'Surat Pengantar',        kat:'keluar'},
  keluar_keputusan:  {kode:'SKP', label:'Surat Keputusan',        kat:'keluar'},
  keluar_edaran:     {kode:'SE',  label:'Surat Edaran',           kat:'keluar'},
  masuk_keterangan:  {kode:'SK',  label:'Surat Keterangan',       kat:'masuk'},
  masuk_undangan:    {kode:'SU',  label:'Surat Undangan',         kat:'masuk'},
  masuk_permohonan:  {kode:'SP',  label:'Surat Permohonan',       kat:'masuk'},
  masuk_pengantar:   {kode:'SPG', label:'Surat Pengantar',        kat:'masuk'},
  masuk_keputusan:   {kode:'SKP', label:'Surat Keputusan',        kat:'masuk'},
  masuk_edaran:      {kode:'SE',  label:'Surat Edaran',           kat:'masuk'},
  // Backward compat — old masuk types
  masuk_umum:        {kode:'SM',  label:'Surat Masuk Umum',       kat:'masuk'},
  masuk_dinas:       {kode:'SMD', label:'Surat Masuk Dinas',      kat:'masuk'},
};

function mockDelay(ms=300) { return new Promise(r=>setTimeout(r,ms)); }

function mockGenerateNomor(jenis, tgl) {
  const info = KODE_MAP[jenis];
  if (!info) throw new Error('Jenis surat tidak valid');
  const d = new Date(tgl);
  const bln = d.getMonth()+1, thn = d.getFullYear();
  const key = `${jenis}-${bln}-${thn}`;
  const ctr = MOCK_DB.ctr;
  const num = (ctr[key] || 0) + 1;
  return {
    nomor: `${String(num).padStart(3,'0')}/${info.kode}/DS-SKJ/${ROM[bln]}/${thn}`,
    key, num, info
  };
}

function seedMockData() {
  if (MOCK_DB.db.length > 0) return;
  const demos = [
    {jenis:'keluar_keterangan', tujuan:'Camat Kecamatan Sukamaju',  perihal:'Permohonan Dana BLT Desa 2025',         sifat:'Penting', tgl:'2025-11-15'},
    {jenis:'keluar_undangan',   tujuan:'Seluruh Kepala Dusun',      perihal:'Undangan Rapat Koordinasi Pembangunan', sifat:'Biasa',   tgl:'2025-11-20'},
    {jenis:'masuk_dinas',       tujuan:'Dinas PMD Kabupaten',       perihal:'Jadwal Evaluasi Program DD 2025',       sifat:'Penting', tgl:'2025-11-18'},
    {jenis:'keluar_edaran',     tujuan:'Warga Desa Sukamaju',       perihal:'Edaran Protokol Kesehatan RT/RW',       sifat:'Segera',  tgl:'2025-12-01'},
    {jenis:'masuk_umum',        tujuan:'Bank BRI Cabang Sukamaju',  perihal:'Konfirmasi Pencairan Dana Desa',        sifat:'Rahasia', tgl:'2025-12-05'},
  ];
  const db = [], ctr = {};
  demos.forEach((d,i) => {
    const info = KODE_MAP[d.jenis];
    const dt   = new Date(d.tgl);
    const bln  = dt.getMonth()+1, thn = dt.getFullYear();
    const key  = `${d.jenis}-${bln}-${thn}`;
    ctr[key]   = (ctr[key]||0)+1;
    const nomor = `${String(ctr[key]).padStart(3,'0')}/${info.kode}/DS-SKJ/${ROM[bln]}/${thn}`;
    db.push({ id:Date.now()+i, nomor, jenis:d.jenis, jenisLabel:info.label, kat:info.kat,
      tgl:d.tgl, tujuan:d.tujuan, perihal:d.perihal, isi:'', sifat:d.sifat,
      jabatan:'Kepala Desa', nama:'H. Supriyadi, S.IP', createdAt:new Date().toISOString() });
  });
  MOCK_DB.db  = db;
  MOCK_DB.ctr = ctr;
}

// ─── API FUNCTIONS ───────────────────────────────────────────
const API = {

  /** GET /api/surat */
  async getSurat(params={}) {
    await mockDelay();
    if (API_BASE) {
      const qs = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/api/surat?${qs}`, { headers: authHeaders() });
      if (res.status===401) { logout(); return; }
      if (!res.ok) throw new Error('Gagal memuat data');
      return res.json();
    }
    let data = [...MOCK_DB.db];
    if (params.search) {
      const kw = params.search.toLowerCase();
      data = data.filter(s =>
        s.nomor.toLowerCase().includes(kw) ||
        s.perihal.toLowerCase().includes(kw) ||
        s.tujuan.toLowerCase().includes(kw)
      );
    }
    if (params.kat && params.kat !== 'semua') data = data.filter(s => s.kat === params.kat);
    if (params.sifat && params.sifat !== 'semua') data = data.filter(s => s.sifat === params.sifat);
    if (params.tgl_dari) data = data.filter(s => s.tgl >= params.tgl_dari);
    if (params.tgl_sampai) data = data.filter(s => s.tgl <= params.tgl_sampai);
    const page  = parseInt(params.page)  || 1;
    const limit = parseInt(params.limit) || 10;
    const total = data.length;
    const items = data.slice((page-1)*limit, page*limit);
    return { data: items, total, page, limit, totalPages: Math.ceil(total/limit) };
  },

  /** GET /api/surat/:id */
  async getSuratById(id) {
    await mockDelay(200);
    if (API_BASE) {
      const res = await fetch(`${API_BASE}/api/surat/${id}`, { headers: authHeaders() });
      if (res.status===401) { logout(); return; }
      if (!res.ok) throw new Error('Surat tidak ditemukan');
      return res.json();
    }
    const s = MOCK_DB.db.find(x => x.id === parseInt(id));
    if (!s) throw new Error('Surat tidak ditemukan');
    return s;
  },

  /** POST /api/surat */
  async createSurat(payload) {
    await mockDelay(500);
    if (API_BASE) {
      const res = await fetch(`${API_BASE}/api/surat`, {
        method:'POST', headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.status===401) { logout(); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan surat');
      return data;
    }
    const { nomor, key, num, info } = mockGenerateNomor(payload.jenis, payload.tgl);
    const ctr = MOCK_DB.ctr;
    ctr[key] = num;
    MOCK_DB.ctr = ctr;
    const surat = {
      id: Date.now(), nomor,
      jenis: payload.jenis, jenisLabel: info.label, kat: info.kat,
      tgl: payload.tgl, tujuan: payload.tujuan, perihal: payload.perihal,
      isi: payload.isi||'', sifat: payload.sifat,
      jabatan: payload.jabatan, nama: payload.nama,
      createdAt: new Date().toISOString()
    };
    const db = MOCK_DB.db;
    db.unshift(surat);
    MOCK_DB.db = db;
    return surat;
  },

  /** DELETE /api/surat/:id */
  async deleteSurat(id) {
    await mockDelay(300);
    if (API_BASE) {
      const res = await fetch(`${API_BASE}/api/surat/${id}`, {
        method:'DELETE', headers: authHeaders()
      });
      if (res.status===401) { logout(); return; }
      if (!res.ok) throw new Error('Gagal menghapus');
      return true;
    }
    MOCK_DB.db = MOCK_DB.db.filter(x => x.id !== parseInt(id));
    return true;
  },

  /** GET /api/stats */
  async getStats() {
    await mockDelay(200);
    if (API_BASE) {
      const res = await fetch(`${API_BASE}/api/stats`, { headers: authHeaders() });
      if (res.status===401) { logout(); return; }
      return res.json();
    }
    const db  = MOCK_DB.db;
    const now = new Date(), bln = now.getMonth()+1, thn = now.getFullYear();
    const monthly = {};
    db.forEach(s => {
      const d = new Date(s.tgl);
      const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!monthly[k]) monthly[k] = {masuk:0, keluar:0};
      monthly[k][s.kat]++;
    });
    return {
      total:  db.length,
      masuk:  db.filter(s=>s.kat==='masuk').length,
      keluar: db.filter(s=>s.kat==='keluar').length,
      bulan:  db.filter(s=>{ const d=new Date(s.tgl); return d.getMonth()+1===bln&&d.getFullYear()===thn; }).length,
      monthly
    };
  },

  /** GET /api/nomor-preview */
  async previewNomor(jenis, tgl) {
    await mockDelay(150);
    if (API_BASE) {
      const res = await fetch(`${API_BASE}/api/nomor-preview?jenis=${jenis}&tgl=${tgl}`, { headers: authHeaders() });
      return res.json();
    }
    if (!jenis || !tgl) return { nomor: null };
    const { nomor, info } = mockGenerateNomor(jenis, tgl);
    return { nomor, jenisLabel: info.label, kat: info.kat };
  },

  /**
   * POST /api/login
   * Login ke backend nyata, simpan token ke localStorage
   */
  async login(email, password) {
    if (!API_BASE) {
      // Mock login — gunakan akun demo saat backend belum tersambung
      if (email === 'admin@desa.id' && password === 'password') {
        const token = 'mock-token-' + Date.now();
        localStorage.setItem('sicata_token', token);
        localStorage.setItem('sicata_user', JSON.stringify({ name: 'Admin Demo', email }));
        return { token, user: { name: 'Admin Demo', email } };
      }
      throw new Error('Email atau password salah');
    }
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login gagal');
    localStorage.setItem('sicata_token', data.token);
    localStorage.setItem('sicata_user', JSON.stringify(data.user));
    return data;
  },

  /**
   * POST /api/register
   * Daftar akun desa baru (1 desa = 1 akun)
   */
  async register(payload) {
    if (!API_BASE) {
      // Mock register
      await mockDelay(500);
      const token = 'mock-token-' + Date.now();
      const user  = { id: Date.now(), nama: payload.name, email: payload.email,
                       desa: payload.desa, telp: payload.telp, role: 'user', jabatan: 'Kepala Desa' };
      localStorage.setItem('sicata_token', token);
      localStorage.setItem('sicata_user',  JSON.stringify(user));
      return { token, user };
    }
    const res  = await fetch(`${API_BASE}/api/register`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body   : JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.errors) throw new Error(Object.values(data.errors).flat().join(' '));
      throw new Error(data.message || 'Registrasi gagal');
    }
    return data;
  },

  /**
   * GET /api/check-desa?desa=...
   * Cek apakah nama desa sudah terdaftar
   */
  async checkDesa(desa) {
    if (!API_BASE) {
      await mockDelay(200);
      return { tersedia: true };
    }
    const res  = await fetch(`${API_BASE}/api/check-desa?desa=${encodeURIComponent(desa)}`);
    return res.json();
  },

  /**
   * POST /api/surat/masuk  — Surat Masuk dengan optional upload gambar/scan
   * payload: FormData (jenis, tgl, tujuan, perihal, isi, sifat, jabatan, nama, scan_surat?)
   */
  async createSuratMasuk(formData) {
    await mockDelay(400);
    if (API_BASE) {
      const res = await fetch(`${API_BASE}/api/surat/masuk`, {
        method : 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Accept': 'application/json' },
        // Jangan set Content-Type — biarkan browser set multipart/form-data boundary otomatis
        body   : formData
      });
      if (res.status === 401) { logout(); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan surat masuk');
      return data;
    }
    // Mock — simpan ke MOCK_DB tanpa file
    const jenis = formData.get('jenis') || 'masuk_umum';
    const tgl   = formData.get('tgl')   || new Date().toISOString().slice(0,10);
    const { nomor, key, num, info } = mockGenerateNomor(jenis, tgl);
    const ctr = MOCK_DB.ctr;
    ctr[key] = num;
    MOCK_DB.ctr = ctr;
    const surat = {
      id         : Date.now(),
      nomor,
      jenis,
      jenisLabel : info.label,
      kat        : 'masuk',
      tgl,
      tujuan     : formData.get('tujuan')  || '',
      perihal    : formData.get('perihal') || '',
      isi        : formData.get('isi')     || '',
      sifat      : formData.get('sifat')   || 'Biasa',
      jabatan    : formData.get('jabatan') || '',
      nama       : formData.get('nama')    || '',
      scanUrl    : null,
      createdAt  : new Date().toISOString()
    };
    const db = MOCK_DB.db;
    db.unshift(surat);
    MOCK_DB.db = db;
    return surat;
  },

  /**
   * POST /api/surat/keluar  — Surat Keluar (JSON biasa, tanpa upload)
   * Wrapper untuk createSurat khusus surat keluar
   */
  async createSuratKeluar(payload) {
    return this.createSurat({ ...payload });
  },

  /**
   * POST /api/change-password
   * Ganti password — kirim current_password, password, password_confirmation
   */
  async changePassword(currentPassword, newPassword, confirmPassword) {
    if (!API_BASE) {
      await mockDelay(300);
      return { message: 'Password berhasil diubah.' };
    }
    const res = await fetch(`${API_BASE}/api/change-password`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        current_password:      currentPassword,
        password:              newPassword,
        password_confirmation: confirmPassword,
      })
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.errors) throw new Error(Object.values(data.errors).flat().join(' '));
      throw new Error(data.message || 'Gagal mengganti password');
    }
    return data;
  },

  /**
   * PUT /api/profile
   * Update profil user
   */
  async updateProfile(payload) {
    if (!API_BASE) {
      await mockDelay(300);
      const u = getUser() || {};
      Object.assign(u, payload);
      localStorage.setItem('sicata_user', JSON.stringify(u));
      return { message: 'Profil berhasil diperbarui.', user: u };
    }
    const res = await fetch(`${API_BASE}/api/profile`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.errors) throw new Error(Object.values(data.errors).flat().join(' '));
      throw new Error(data.message || 'Gagal memperbarui profil');
    }
    // Sinkronkan localStorage dengan data terbaru dari server
    if (data.user) localStorage.setItem('sicata_user', JSON.stringify(data.user));
    return data;
  },

  /**
   * GET /api/users
   * Daftar user (admin only)
   */
  async getUsers() {
    if (!API_BASE) {
      await mockDelay(200);
      return { data: [
        { id:1, nama:'Admin Desa', email:'admin@desa.id', role:'admin', desa:'Desa Sukamaju', jabatan:'Kepala Desa' },
        { id:2, nama:'Staff Desa', email:'staff@desa.id', role:'user',  desa:'Desa Sukamakmur', jabatan:'Staf Administrasi' },
      ]};
    }
    const res = await fetch(`${API_BASE}/api/users`, { headers: authHeaders() });
    if (res.status === 401) { logout(); return; }
    if (res.status === 403) throw new Error('Akses ditolak');
    return res.json();
  },

  /**
   * DELETE /api/users/:id
   * Hapus user (admin only)
   */
  async deleteUser(id) {
    if (!API_BASE) {
      await mockDelay(200);
      return { message: 'Akun berhasil dihapus.' };
    }
    const res = await fetch(`${API_BASE}/api/users/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (res.status === 401) { logout(); return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal menghapus akun');
    return data;
  },
};
