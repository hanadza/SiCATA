// ─── AUTH GUARD ───────────────────────────────────────────────
(function() {
  if (!isLoggedIn()) window.location.href = 'login.html';
})();

// ─── CONSTANTS ────────────────────────────────────────────────
const MON_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const BLAN      = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const PAGE_TITLES = { dashboard:'Dashboard', 'buat-surat':'Kelola Surat', arsip:'Arsip Surat', 'kelola-akun':'Kelola Akun', profil:'Pengaturan Akun' };

// ─── STATE ────────────────────────────────────────────────────
let arsipState = { page:1, limit:10, search:'', kat:'semua', sifat:'semua', tgl_dari:'', tgl_sampai:'' };
let nomor_preview = null;
let nomorDebounce = null;
let currentUser = null;
let isAdmin = false;

// ─── INIT ─────────────────────────────────────────────────────
async function init() {
  seedMockData();

  currentUser = getUser();
  isAdmin = currentUser?.role === 'admin';

  // Apply role class to body
  document.body.classList.add(isAdmin ? 'is-admin' : 'is-user');

  // User info di sidebar
  if (currentUser) {
    const avatarEl  = document.getElementById('user-avatar');
    const nameEl    = document.getElementById('user-name');
    const desaEl    = document.getElementById('user-desa');
    const sbDesaEl  = document.getElementById('sb-desa');

    const desaNama = currentUser.desa || 'Desa';
    const namaTampil = currentUser.nama || currentUser.username || 'User';

    if (avatarEl) {
      avatarEl.textContent = namaTampil[0].toUpperCase();
      avatarEl.className = isAdmin ? 'user-avatar admin-avatar' : 'user-avatar user-avatar-color';
    }
    if (nameEl)   nameEl.textContent   = namaTampil;
    if (desaEl)   desaEl.textContent   = desaNama;
    if (sbDesaEl) sbDesaEl.textContent = desaNama;
  }

  // Dashboard title for users
  if (!isAdmin) {
    const titleEl = document.getElementById('dashboard-title');
    const subEl   = document.getElementById('dashboard-sub');
    if (titleEl) titleEl.textContent = `Halo, ${currentUser?.nama || 'Pengguna'}`;
    if (subEl)   subEl.textContent   = 'Lihat ringkasan arsip surat desa';
  }

  // Read-only tag on arsip for users
  const roTag = document.getElementById('readonly-tag');
  if (roTag && !isAdmin) roTag.style.display = 'inline-flex';

  // Tanggal di sidebar
  const now = new Date();
  const dateEl = document.getElementById('sidebar-date');
  if (dateEl) dateEl.innerHTML = now.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).replace(',','<br>');

  // Default tanggal form
  const tglInput = document.getElementById('tgl-surat');
  if (tglInput) tglInput.value = now.toISOString().slice(0,10);

  await loadDashboard();
}

// ─── NAVIGATION ───────────────────────────────────────────────
function showPage(p) {
  // Kelola Akun tetap khusus admin, Kelola Surat bisa semua user
  if (!isAdmin && p === 'kelola-akun') {
    showToast('Akses ditolak. Fitur ini khusus Admin.', 'error');
    return;
  }
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
  const pageEl = document.getElementById('page-'+p);
  const navEl  = document.getElementById('nav-'+p);
  if (pageEl) pageEl.classList.add('active');
  if (navEl)  navEl.classList.add('active');
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = PAGE_TITLES[p] || '';
  if (window.innerWidth<=900) closeSidebar();
  if (p==='arsip') loadArsip(1);
  if (p==='kelola-akun') loadAkunTable();
  if (p==='profil') {
    // loadProfil dipanggil dari index.html
    if (typeof loadProfil === 'function') loadProfil();
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

// ─── DASHBOARD ────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const stats = await API.getStats();
    renderStats(stats);
    drawCharts(stats);
  } catch(e) { showToast('Gagal memuat dashboard','error'); }

  try {
    const res = await API.getSurat({ page:1, limit:8 });
    renderDashboardTable(res.data||[]);
    document.getElementById('nav-badge').textContent = res.total||0;
  } catch(e) {}
}

function renderStats(s) {
  const grid = document.getElementById('stats-grid');
  const maxV = Math.max(s.total, 1);
  const stats = [
    { label:'TOTAL SURAT',     val:s.total,  cls:'sc-green',  icon:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>' },
    { label:'SURAT MASUK',     val:s.masuk,  cls:'sc-blue',   icon:'<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>' },
    { label:'SURAT KELUAR',    val:s.keluar, cls:'sc-orange', icon:'<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>' },
    { label:'SURAT BULAN INI', val:s.bulan,  cls:'sc-pink',   icon:'<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' },
  ];
  grid.innerHTML = stats.map(st=>`
    <div class="stat-card ${st.cls}">
      <div class="stat-top">
        <div class="stat-label">${st.label}</div>
        <div class="stat-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${st.icon}</svg>
        </div>
      </div>
      <div class="stat-value">${st.val}</div>
      <div class="stat-bar"><div class="stat-fill" style="width:${Math.min((st.val/maxV)*100,100)}%"></div></div>
    </div>
  `).join('');
}

function renderDashboardTable(list) {
  const wrap = document.getElementById('dash-table-wrap');
  if (!list.length) {
    wrap.innerHTML = `<div class="empty-state"><div class="empty-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><p>Belum ada surat${isAdmin ? '. Buat surat pertama!' : '.'}</p></div>`;
    return;
  }
  wrap.innerHTML = `<table><thead><tr><th>Nomor Surat</th><th>Jenis</th><th>Perihal</th><th>Tujuan</th><th>Tanggal</th><th>Aksi</th></tr></thead><tbody>${list.map(s=>rowHTML(s,'dash')).join('')}</tbody></table>`;
}

// ─── ARSIP ────────────────────────────────────────────────────
let searchTimer = null;
function onSearch(v) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(()=>{ arsipState.search=v; loadArsip(1); }, 350);
}

function setKat(v, el) {
  arsipState.kat = v;
  document.querySelectorAll('.filter-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  loadArsip(1);
}

function toggleAdvFilter() {
  document.getElementById('adv-filter').classList.toggle('open');
}

function resetFilter() {
  arsipState = {...arsipState, sifat:'semua', tgl_dari:'', tgl_sampai:''};
  document.getElementById('filter-sifat').value = 'semua';
  document.getElementById('filter-tgl-dari').value = '';
  document.getElementById('filter-tgl-sampai').value = '';
  loadArsip(1);
}

async function loadArsip(page=1) {
  arsipState.page       = page;
  arsipState.sifat      = document.getElementById('filter-sifat')?.value || 'semua';
  arsipState.tgl_dari   = document.getElementById('filter-tgl-dari')?.value || '';
  arsipState.tgl_sampai = document.getElementById('filter-tgl-sampai')?.value || '';

  const loading = document.getElementById('arsip-loading');
  if (loading) loading.style.display = 'flex';

  try {
    const res = await API.getSurat({
      page: arsipState.page, limit: arsipState.limit,
      search: arsipState.search, kat: arsipState.kat,
      sifat: arsipState.sifat, tgl_dari: arsipState.tgl_dari,
      tgl_sampai: arsipState.tgl_sampai,
    });
    renderArsipTable(res.data||[], res.total||0);
    renderPagination(res.page, res.totalPages, res.total);
    document.getElementById('nav-badge').textContent = res.total||0;
  } catch(e) {
    showToast('Gagal memuat arsip','error');
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

function renderArsipTable(list, total) {
  const tbody = document.getElementById('tbl-arsip');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg></div><p>Tidak ada surat ditemukan</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(s=>rowHTML(s,'arsip')).join('');
}

function renderPagination(page, totalPages, total) {
  const el = document.getElementById('pagination');
  if (!el || totalPages <= 1) { if(el) el.innerHTML=''; return; }

  let pages = [];
  for (let i=1; i<=totalPages; i++) {
    if (i===1 || i===totalPages || Math.abs(i-page)<=1) pages.push(i);
    else if (pages[pages.length-1] !== '...') pages.push('...');
  }

  el.innerHTML = `
    <div class="pag-info">${total} surat · Hal ${page} dari ${totalPages}</div>
    <div class="pag-btns">
      <button class="pag-btn" onclick="loadArsip(${page-1})" ${page===1?'disabled':''}>‹</button>
      ${pages.map(p => p==='...'
        ? `<span class="pag-dots">…</span>`
        : `<button class="pag-btn ${p===page?'active':''}" onclick="loadArsip(${p})">${p}</button>`
      ).join('')}
      <button class="pag-btn" onclick="loadArsip(${page+1})" ${page===totalPages?'disabled':''}>›</button>
    </div>
  `;
}

// ─── ROW HTML ─────────────────────────────────────────────────
function rowHTML(s, mode) {
  const isKeluar = s.kat==='keluar';
  const badge = isKeluar
    ? `<span class="badge-type badge-keluar">↗ Keluar</span>`
    : `<span class="badge-type badge-masuk">↘ Masuk</span>`;
  const sifatClass = {Penting:'badge-penting',Segera:'badge-segera',Rahasia:'badge-rahasia'}[s.sifat]||'';
  const sifatCol = mode==='arsip' ? `<td><span class="badge-sifat ${sifatClass}">${s.sifat}</span></td>` : '';
  const deleteBtn = isAdmin
    ? `<button class="btn-icon danger admin-action" onclick="confirmHapus(${s.id})" title="Hapus"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>`
    : '';

  return `<tr>
    <td class="nomor-cell">${xe(s.nomor)}</td>
    <td>${badge}<div style="font-size:10px;color:var(--text-3);margin-top:2px">${xe(s.jenisLabel)}</div></td>
    <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${xe(s.perihal)}</td>
    <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-2)">${xe(s.tujuan)}</td>
    <td style="white-space:nowrap;color:var(--text-2);font-size:11px">${fmtTgl(s.tgl)}</td>
    ${sifatCol}
    <td><div class="action-row">
      <button class="btn-icon" onclick="showDetail(${s.id})" title="Detail">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>
      <button class="btn-icon primary" onclick="downloadWord(${s.id})" title="Download Word">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </button>
      ${deleteBtn}
    </div></td>
  </tr>`;
}

// ─── KELOLA AKUN (admin only) ─────────────────────────────────
function loadAkunTable() {
  const defaultAccounts = [
    { id:1, username:'admin', nama:'Admin Desa', jabatan:'Kepala Desa', role:'admin' },
    { id:2, username:'user',  nama:'Operator Desa', jabatan:'Staf Administrasi', role:'user' },
  ];
  const registered = JSON.parse(localStorage.getItem('sicata_accounts') || '[]');
  const all = [...defaultAccounts, ...registered];

  const tbody = document.getElementById('tbl-akun');
  if (!tbody) return;
  tbody.innerHTML = all.map(a=>`
    <tr>
      <td style="font-weight:600">${xe(a.nama)}</td>
      <td class="nomor-cell">${xe(a.username)}</td>
      <td style="color:var(--text-2)">${xe(a.jabatan||'—')}</td>
      <td><span class="role-badge ${a.role}">${a.role==='admin'?'Admin':'User'}</span></td>
      <td><div class="action-row">
        ${a.id > 2 ? `<button class="btn-icon danger" onclick="hapusAkun(${a.id})" title="Hapus"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button>` : '<span style="font-size:11px;color:var(--text-3)">Sistem</span>'}
      </div></td>
    </tr>
  `).join('');
}

function hapusAkun(id) {
  const accounts = JSON.parse(localStorage.getItem('sicata_accounts') || '[]');
  localStorage.setItem('sicata_accounts', JSON.stringify(accounts.filter(a => a.id !== id)));
  loadAkunTable();
  showToast('Akun berhasil dihapus', 'success');
}

// ─── TABS: SURAT MASUK / KELUAR ──────────────────────────────
function switchSuratTab(tab) {
  document.getElementById('panel-masuk').style.display  = tab === 'masuk'  ? '' : 'none';
  document.getElementById('panel-keluar').style.display = tab === 'keluar' ? '' : 'none';
  document.getElementById('tab-masuk').classList.toggle('active',  tab === 'masuk');
  document.getElementById('tab-keluar').classList.toggle('active', tab === 'keluar');
  document.getElementById('alert-area').innerHTML = '';
}

// ─── NOMOR PREVIEW: SURAT MASUK ──────────────────────────────
let _masukNomorDebounce = null;
function onJenisMasukChange() {
  const jenis = document.getElementById('m-jenis').value;
  const tgl   = document.getElementById('m-tgl').value;
  if (!jenis) {
    document.getElementById('m-nomor-text').textContent = 'Pilih Jenis Surat';
    return;
  }
  clearTimeout(_masukNomorDebounce);
  document.getElementById('m-nomor-loading').style.display = 'flex';
  _masukNomorDebounce = setTimeout(async () => {
    try {
      const res = await API.previewNomor(jenis, tgl || new Date().toISOString().slice(0,10));
      document.getElementById('m-nomor-text').textContent  = res.nomor || '—';
      document.getElementById('m-nomor-label').textContent = res.jenisLabel || jenis;
    } catch { document.getElementById('m-nomor-text').textContent = 'Error'; }
    finally  { document.getElementById('m-nomor-loading').style.display = 'none'; }
  }, 300);
}

// ─── UPLOAD SCAN: handlers ────────────────────────────────────
function dragOver(e) {
  e.preventDefault();
  document.getElementById('m-upload-zone').classList.add('drag-over');
}
function dropFile(e, inputId) {
  e.preventDefault();
  document.getElementById('m-upload-zone').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (!file) return;
  const dt = new DataTransfer();
  dt.items.add(file);
  const inp = document.getElementById(inputId);
  inp.files = dt.files;
  onScanChange(inp);
}
function onScanChange(inp) {
  const file = inp.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showAlert('❌ File terlalu besar (maks 5 MB)', 'error');
    inp.value = '';
    return;
  }
  const isImg = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';
  document.getElementById('m-upload-placeholder').style.display = 'none';
  if (isImg) {
    const reader = new FileReader();
    reader.onload = e => { document.getElementById('m-preview-img').src = e.target.result; };
    reader.readAsDataURL(file);
    document.getElementById('m-preview-name').textContent = file.name;
    document.getElementById('m-upload-preview').style.display = 'block';
    document.getElementById('m-pdf-preview').style.display    = 'none';
  } else if (isPdf) {
    document.getElementById('m-pdf-name').textContent      = file.name;
    document.getElementById('m-pdf-preview').style.display = 'block';
    document.getElementById('m-upload-preview').style.display = 'none';
  }
}
function clearScan(e) {
  e.stopPropagation();
  const inp = document.getElementById('m-scan');
  inp.value = '';
  document.getElementById('m-upload-placeholder').style.display = '';
  document.getElementById('m-upload-preview').style.display     = 'none';
  document.getElementById('m-pdf-preview').style.display        = 'none';
}

// ─── SIMPAN SURAT MASUK ───────────────────────────────────────
async function simpanSuratMasuk() {
  const jenis   = document.getElementById('m-jenis').value;
  const tgl     = document.getElementById('m-tgl').value;
  const tujuan  = document.getElementById('m-tujuan').value.trim();
  const perihal = document.getElementById('m-perihal').value.trim();
  if (!jenis || !tgl || !tujuan || !perihal) {
    showAlert('Lengkapi semua field wajib!', 'error'); return;
  }

  const btn = document.getElementById('btn-save-masuk');
  const spn = document.getElementById('spinner-masuk');
  const ico = document.getElementById('icon-masuk');
  const txt = document.getElementById('txt-masuk');
  btn.disabled = true; spn.style.display = 'block'; ico.style.display = 'none'; txt.textContent = 'Menyimpan...';

  try {
    const fd = new FormData();
    fd.append('jenis',   jenis);
    fd.append('tgl',     tgl);
    fd.append('tujuan',  tujuan);
    fd.append('perihal', perihal);
    fd.append('isi',     document.getElementById('m-isi').value.trim());
    fd.append('sifat',   document.getElementById('m-sifat').value);
    fd.append('jabatan', document.getElementById('m-jabatan').value);
    fd.append('nama',    document.getElementById('m-nama').value.trim());
    const scanFile = document.getElementById('m-scan').files[0];
    if (scanFile) fd.append('scan_surat', scanFile);

    const surat = await API.createSuratMasuk(fd);
    showAlert(`✅ Surat Masuk disimpan! Nomor: <strong>${surat.nomor}</strong>`, 'success');
    resetFormMasuk();
    await loadDashboard();
  } catch (e) {
    showAlert('❌ ' + e.message, 'error');
  } finally {
    btn.disabled = false; spn.style.display = 'none'; ico.style.display = ''; txt.textContent = 'Simpan Surat Masuk';
  }
}

function resetFormMasuk() {
  ['m-jenis','m-tujuan','m-perihal','m-isi'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  document.getElementById('m-sifat').value   = 'Biasa';
  document.getElementById('m-jabatan').value = 'Kepala Desa';
  document.getElementById('m-tgl').value     = new Date().toISOString().slice(0,10);
  document.getElementById('m-nomor-text').textContent  = 'Pilih Jenis Surat';
  document.getElementById('m-nomor-label').textContent = 'Nomor otomatis setelah pilih jenis';
  clearScan({ stopPropagation: ()=>{} });
}

// ─── FORM: JENIS CHANGE ───────────────────────────────────────
function onJenisChange() {
  const jenis = document.getElementById('jenis-surat').value;
  const tgl   = document.getElementById('tgl-surat').value;
  const typeDot    = document.getElementById('type-dot');
  const typeLabel  = document.getElementById('type-label');
  const labelTujuan = document.getElementById('label-tujuan');

  if (!jenis) {
    document.getElementById('nomor-text').textContent = 'Pilih jenis surat';
    document.getElementById('nomor-label').textContent = 'Nomor akan terisi otomatis';
    typeDot.style.background = '#374151';
    typeLabel.textContent = '—';
    nomor_preview = null;
    return;
  }

  clearTimeout(nomorDebounce);
  document.getElementById('nomor-loading').style.display = 'flex';
  document.getElementById('nomor-content').style.opacity = '0.3';

  nomorDebounce = setTimeout(async ()=>{
    try {
      const res = await API.previewNomor(jenis, tgl||new Date().toISOString().slice(0,10));
      nomor_preview = res;
      document.getElementById('nomor-text').textContent  = res.nomor || '—';
      document.getElementById('nomor-label').textContent = res.kat==='keluar' ? 'Surat Keluar' : 'Surat Masuk';
      const isKeluar = res.kat==='keluar';
      typeDot.style.background = isKeluar ? '#f59e0b' : '#10b981';
      typeLabel.textContent    = res.jenisLabel || jenis;
      if (labelTujuan) labelTujuan.innerHTML = (isKeluar ? 'Kepada / Tujuan' : 'Dari / Pengirim') + ' <span class="req">*</span>';
    } catch(e) {
      document.getElementById('nomor-text').textContent = 'Error';
    } finally {
      document.getElementById('nomor-loading').style.display = 'none';
      document.getElementById('nomor-content').style.opacity = '1';
    }
  }, 300);
}

// ─── SIMPAN SURAT ─────────────────────────────────────────────
async function simpanSurat() {
  const jenis   = document.getElementById('jenis-surat').value;
  const tgl     = document.getElementById('tgl-surat').value;
  const tujuan  = document.getElementById('tujuan-surat').value.trim();
  const perihal = document.getElementById('perihal-surat').value.trim();

  if (!jenis||!tgl||!tujuan||!perihal) {
    showAlert('Lengkapi semua field wajib!','error'); return;
  }

  const btn = document.getElementById('btn-save');
  const spn = document.getElementById('btn-spinner');
  const txt = document.getElementById('btn-save-text');
  const ico = document.getElementById('btn-icon-save');
  btn.disabled=true; spn.style.display='block'; ico.style.display='none'; txt.textContent='Menyimpan...';

  try {
    const surat = await API.createSurat({
      jenis, tgl, tujuan, perihal,
      isi:      document.getElementById('isi-surat').value.trim(),
      sifat:    document.getElementById('sifat-surat').value,
      jabatan:  document.getElementById('jabatan-ttd').value,
      nama:     document.getElementById('nama-ttd').value.trim(),
    });
    showAlert(`✅ Surat disimpan! Nomor: <strong>${surat.nomor}</strong>`, 'success');
    resetForm();
    await loadDashboard();
    setTimeout(()=>downloadWordData(surat), 600);
  } catch(e) {
    showAlert('❌ '+e.message,'error');
  } finally {
    btn.disabled=false; spn.style.display='none'; ico.style.display=''; txt.textContent='Simpan & Download';
  }
}

function resetForm() {
  ['jenis-surat','tujuan-surat','perihal-surat','isi-surat'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('sifat-surat').value = 'Biasa';
  document.getElementById('jabatan-ttd').value = 'Kepala Desa';
  document.getElementById('nama-ttd').value    = 'H. Supriyadi, S.IP';
  document.getElementById('tgl-surat').value   = new Date().toISOString().slice(0,10);
  document.getElementById('nomor-text').textContent  = 'Pilih jenis surat';
  document.getElementById('nomor-label').textContent = 'Nomor akan terisi otomatis';
  document.getElementById('type-dot').style.background = '#374151';
  document.getElementById('type-label').textContent = '—';
  nomor_preview = null;
}

// ─── DETAIL MODAL ─────────────────────────────────────────────
async function showDetail(id) {
  document.getElementById('modal-detail').classList.add('open');
  document.getElementById('modal-title-text').textContent = '…';
  document.getElementById('modal-body').innerHTML = `<div style="display:flex;justify-content:center;padding:40px"><div class="loading-spinner"></div></div>`;
  document.getElementById('modal-dl-btn').onclick = ()=>downloadWord(id);

  try {
    const s = await API.getSuratById(id);
    const tglFmt = new Date(s.tgl).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
    document.getElementById('modal-title-text').textContent = s.nomor;
    const rows = [
      ['Jenis',    s.jenisLabel],
      ['Kategori', s.kat==='keluar'?'↗ Surat Keluar':'↘ Surat Masuk'],
      ['Tanggal',  tglFmt],
      ['Sifat',    s.sifat],
      [s.kat==='keluar'?'Kepada':'Dari', s.tujuan],
      ['Perihal',  s.perihal],
      ...(s.isi ? [['Keterangan', s.isi]] : []),
      ['Jabatan',  s.jabatan],
      ['Nama TTD', s.nama],
    ];

    // Scan surat (khusus surat masuk)
    const scanHtml = s.scanUrl ? `
      <div style="margin-top:16px;border-top:1px solid var(--border);padding-top:14px;">
        <div style="font-size:11px;font-weight:700;color:var(--text-2);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;">Scan Surat</div>
        ${s.scanUrl.toLowerCase().includes('.pdf')
          ? `<a href="${s.scanUrl}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--primary);font-weight:500;text-decoration:none;">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
               Buka File PDF
             </a>`
          : `<img src="${s.scanUrl}" alt="Scan Surat" style="max-width:100%;border-radius:8px;border:1px solid var(--border);cursor:zoom-in;" onclick="window.open('${s.scanUrl}','_blank')" title="Klik untuk buka ukuran penuh">`
        }
      </div>` : '';

    document.getElementById('modal-body').innerHTML = `
      <div class="detail-grid">
        ${rows.map(([k,v])=>`<div class="detail-key">${k}</div><div class="detail-val">${xe(v)}</div>`).join('')}
      </div>${scanHtml}`;
  } catch(e) {
    document.getElementById('modal-body').innerHTML = `<p style="color:var(--red);padding:12px">Gagal memuat detail: ${e.message}</p>`;
  }
}

function closeModal() { document.getElementById('modal-detail').classList.remove('open'); }
function handleOverlayClick(e) { if(e.target.id==='modal-detail') closeModal(); }

// ─── HAPUS CONFIRM ────────────────────────────────────────────
let _hapusId = null;
function confirmHapus(id) {
  _hapusId = id;
  document.getElementById('modal-confirm').classList.add('open');
  document.getElementById('btn-confirm-hapus').onclick = doHapus;
}
function closeConfirm() { document.getElementById('modal-confirm').classList.remove('open'); _hapusId=null; }

async function doHapus() {
  if (!_hapusId) return;
  try {
    await API.deleteSurat(_hapusId);
    closeConfirm();
    showToast('Surat berhasil dihapus','success');
    await loadDashboard();
    if (document.getElementById('page-arsip').classList.contains('active')) loadArsip(arsipState.page);
  } catch(e) { showToast('Gagal menghapus: '+e.message,'error'); }
}

// ─── DOWNLOAD WORD ────────────────────────────────────────────
async function downloadWord(id) {
  try {
    const s = await API.getSuratById(id);
    downloadWordData(s);
  } catch(e) { showToast('Gagal memuat data surat','error'); }
}

async function downloadWordData(s) {
  if (typeof JSZip === 'undefined') { showToast('JSZip belum dimuat','error'); return; }

  const tglPanjang = new Date(s.tgl).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
  const isKeluar   = s.kat==='keluar';

  // ── Helper: paragraph dengan run tunggal ──
  function P(text, opts={}) {
    const {bold=false, size=24, align='left', ul=false, color=null, space=120} = opts;
    let ppr = `<w:jc w:val="${align}"/><w:spacing w:after="${space}" w:before="0"/>`;
    let rpr = `<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>` +
              `<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>`;
    if (bold)  rpr += `<w:b/><w:bCs/>`;
    if (ul)    rpr += `<w:u w:val="single"/>`;
    if (color) rpr += `<w:color w:val="${color}"/>`;
    const esc = xe(text);
    return `<w:p><w:pPr>${ppr}</w:pPr><w:r><w:rPr>${rpr}</w:rPr><w:t xml:space="preserve">${esc}</w:t></w:r></w:p>`;
  }

  // ── Empty paragraph ──
  function EP(after=80) {
    return `<w:p><w:pPr><w:spacing w:after="${after}" w:before="0"/></w:pPr></w:p>`;
  }

  // ── Label + value row dalam satu paragraf, pakai tab ──
  function Row(label, val, boldVal=false) {
    const baseRpr = `<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>` +
                    `<w:sz w:val="24"/><w:szCs w:val="24"/>`;
    const valRpr  = boldVal ? `<w:b/><w:bCs/>${baseRpr}` : baseRpr;
    // Label lebar 3,5 cm menggunakan tab stop di 1980 twip
    return `<w:p>
      <w:pPr>
        <w:spacing w:after="80" w:before="0"/>
        <w:tabs><w:tab w:val="left" w:pos="1980"/><w:tab w:val="left" w:pos="2200"/></w:tabs>
        <w:ind w:left="0"/>
      </w:pPr>
      <w:r><w:rPr>${baseRpr}</w:rPr><w:t xml:space="preserve">${xe(label)}</w:t></w:r>
      <w:r><w:rPr>${baseRpr}</w:rPr><w:tab/></w:r>
      <w:r><w:rPr>${baseRpr}</w:rPr><w:t>: </w:t></w:r>
      <w:r><w:rPr>${valRpr}</w:rPr><w:t xml:space="preserve">${xe(val)}</w:t></w:r>
    </w:p>`;
  }

  let body = '';

  // ── KOP SURAT ──
  body += P('PEMERINTAH KABUPATEN SUKAJAYA', {bold:true, size:26, align:'center', space:60});
  body += P('KECAMATAN SUKAMAJU',            {bold:true, size:24, align:'center', space:60});
  body += P('KANTOR KEPALA DESA SUKAMAJU',   {bold:true, size:28, align:'center', space:60});
  body += P('Jl. Raya Sukamaju No. 01, Kecamatan Sukamaju, Kabupaten Sukajaya 12345',
             {size:20, align:'center', color:'555555', space:60});
  body += P('Telp. (021) 1234567  |  Email: desasukamaju@sukajaya.go.id',
             {size:20, align:'center', color:'555555', space:80});

  // Garis pemisah kop
  body += `<w:p><w:pPr><w:spacing w:after="120" w:before="0"/>
    <w:pBdr>
      <w:bottom w:val="double" w:sz="6" w:space="1" w:color="000000"/>
    </w:pBdr>
  </w:pPr></w:p>`;

  body += EP(120);

  // ── JUDUL SURAT ──
  body += P(s.jenisLabel.toUpperCase(), {bold:true, size:26, align:'center', ul:true, space:60});
  body += P(`Nomor : ${s.nomor}`,       {bold:true, size:24, align:'center', space:160});

  // ── ISI SURAT ──
  if (isKeluar) {
    body += P('Yang bertanda tangan di bawah ini:', {size:24, space:120});
    body += EP(80);
    body += Row('Nama',    s.nama,    true);
    body += Row('Jabatan', `${s.jabatan} Desa Sukamaju`);
    body += EP(120);
    body += P('Dengan ini menerangkan / memberitahukan bahwa:', {size:24, space:120});
    body += EP(80);
    body += Row('Perihal',     s.perihal, true);
    body += Row('Kepada Yth.', s.tujuan);
    body += Row('Sifat',       s.sifat);
    if (s.isi && s.isi.trim()) {
      body += EP(100);
      body += P(s.isi, {size:24, space:100});
    }
  } else {
    body += P('Surat masuk yang telah diterima dengan keterangan sebagai berikut:', {size:24, space:120});
    body += EP(80);
    body += Row('Dari',    s.tujuan,  true);
    body += Row('Perihal', s.perihal);
    body += Row('Sifat',   s.sifat);
    if (s.isi && s.isi.trim()) {
      body += EP(100);
      body += P(s.isi, {size:24, space:100});
    }
  }

  body += EP(160);
  body += EP(80);

  // ── TANDA TANGAN ──
  body += P(`Sukamaju, ${tglPanjang}`, {align:'right', size:24, space:60});
  body += P(s.jabatan,                {align:'right', bold:true, size:24, space:240});
  body += EP(80);
  body += EP(80);
  body += EP(80);
  body += P(s.nama,                   {align:'right', bold:true, ul:true, size:24, space:60});
  body += P('NIP. ________________________', {align:'right', size:22, color:'888888', space:0});

  // ── XML ──
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
            xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>
${body}
<w:sectPr>
  <w:pgSz w:w="12240" w:h="15840"/>
  <w:pgMar w:top="1440" w:right="1260" w:bottom="1440" w:left="1800" w:header="720" w:footer="720" w:gutter="0"/>
</w:sectPr>
</w:body>
</w:document>`;

  const styXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="120" w:before="0" w:line="276" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
</w:styles>`;

  const ctXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

  const arXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const wrXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  try {
    const zip = new JSZip();
    zip.file('[Content_Types].xml', ctXml);
    zip.file('_rels/.rels', arXml);
    zip.file('word/document.xml', docXml);
    zip.file('word/styles.xml', styXml);
    zip.file('word/_rels/document.xml.rels', wrXml);
    const blob = await zip.generateAsync({
      type:'blob',
      mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href    = url;
    a.download = `${s.nomor.replace(/\//g,'-')}.docx`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url), 3000);
  } catch(e) { showToast('Gagal buat file Word: '+e.message,'error'); }
}

// ─── CHARTS ───────────────────────────────────────────────────
function drawCharts(stats) {
  const wrap = document.getElementById('chart-wrap');
  if (!wrap) return;
  const monthly = stats.monthly || {};
  const now = new Date();
  const months = [];
  for(let i=5;i>=0;i--){
    const d = new Date(now.getFullYear(),now.getMonth()-i,1);
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    months.push({label:MON_SHORT[d.getMonth()], masuk:monthly[k]?.masuk||0, keluar:monthly[k]?.keluar||0});
  }

  // Bar chart
  wrap.innerHTML = `<canvas id="chart-bar" height="170"></canvas>`;
  const canvas = document.getElementById('chart-bar');
  const ctx    = canvas.getContext('2d');
  const dpr    = window.devicePixelRatio||1;
  const W      = Math.min(canvas.parentElement.offsetWidth - 36, 800), H = 170;
  canvas.width  = W*dpr; canvas.height = H*dpr;
  canvas.style.width = W+'px'; canvas.style.height = H+'px';
  ctx.scale(dpr,dpr);

  const padL=30, padR=10, padT=10, padB=34, chartW=W-padL-padR, chartH=H-padT-padB;
  const maxV = Math.max(...months.map(m=>Math.max(m.masuk,m.keluar)),1);
  const slotW = chartW/6, barW = slotW*0.28;

  [.25,.5,.75,1].forEach(f=>{
    const y = padT+chartH-(f*chartH);
    ctx.strokeStyle='#f0f0f0'; ctx.lineWidth=.5;
    ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(W-padR,y); ctx.stroke();
    ctx.fillStyle='#9ca3af'; ctx.font='9px DM Sans,sans-serif'; ctx.textAlign='right';
    ctx.fillText(Math.round(f*maxV), padL-4, y+3);
  });

  months.forEach((m,i)=>{
    const x  = padL + i*slotW + slotW*.12;
    const hM = (m.masuk/maxV)*chartH,  yM = padT+chartH-hM;
    ctx.fillStyle='#6366f1';
    rrect(ctx,x,yM,barW,hM,3);
    const hK = (m.keluar/maxV)*chartH, yK = padT+chartH-hK;
    ctx.fillStyle='#f59e0b';
    rrect(ctx,x+barW+2,yK,barW,hK,3);
    ctx.fillStyle='#9ca3af'; ctx.font='9px DM Sans,sans-serif'; ctx.textAlign='center';
    ctx.fillText(m.label, x+barW+1, H-padB+12);
  });

  // Donut
  const canvas2 = document.getElementById('chart-donut');
  if (!canvas2) return;
  const ctx2 = canvas2.getContext('2d');
  const W2=150, H2=150;
  canvas2.width=W2*dpr; canvas2.height=H2*dpr;
  canvas2.style.width=W2+'px'; canvas2.style.height=H2+'px';
  ctx2.scale(dpr,dpr);
  const cx=W2/2, cy=H2/2, outerR=56, innerR=38;
  const total = Math.max(stats.masuk+stats.keluar,1);
  const masukAngle = (stats.masuk/total)*Math.PI*2;
  ctx2.fillStyle='#6366f1';
  ctx2.beginPath(); ctx2.moveTo(cx,cy);
  ctx2.arc(cx,cy,outerR,-Math.PI/2,-Math.PI/2+masukAngle); ctx2.closePath(); ctx2.fill();
  ctx2.fillStyle='#f59e0b';
  ctx2.beginPath(); ctx2.moveTo(cx,cy);
  ctx2.arc(cx,cy,outerR,-Math.PI/2+masukAngle,-Math.PI/2+Math.PI*2); ctx2.closePath(); ctx2.fill();
  ctx2.fillStyle='#fff'; ctx2.beginPath(); ctx2.arc(cx,cy,innerR,0,Math.PI*2); ctx2.fill();
  ctx2.fillStyle='#111827'; ctx2.font=`700 16px Syne,sans-serif`; ctx2.textAlign='center'; ctx2.textBaseline='middle';
  ctx2.fillText(total, cx, cy-4);
  ctx2.font='9px DM Sans,sans-serif'; ctx2.fillStyle='#9ca3af'; ctx2.fillText('total', cx, cy+9);

  document.getElementById('donut-legend').innerHTML = [
    {c:'#6366f1',l:'Masuk', v:stats.masuk},
    {c:'#f59e0b',l:'Keluar',v:stats.keluar},
  ].map(x=>`<div class="donut-item"><div class="donut-item-left"><div class="donut-dot" style="background:${x.c}"></div>${x.l}</div><div class="donut-item-val">${x.v}</div></div>`).join('');
}

function rrect(ctx,x,y,w,h,r){
  if(h<=0)return;
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h);
  ctx.lineTo(x,y+h); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath(); ctx.fill();
}

// ─── ALERTS & TOASTS ─────────────────────────────────────────
function showAlert(msg,type) {
  const a = document.getElementById('alert-area');
  if (!a) return;
  a.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  setTimeout(()=>{ if(a) a.innerHTML=''; }, 6000);
}

function showToast(msg, type='info') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = msg;
  document.body.appendChild(t);
  setTimeout(()=>t.classList.add('show'), 10);
  setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),300); }, 3500);
}

// ─── EXPORT REKAP ────────────────────────────────────────────
function toggleExportMenu(dropId) {
  const menu = document.getElementById('menu-' + dropId);
  if (!menu) return;
  const isOpen = menu.style.display !== 'none';
  // Tutup semua menu dulu
  document.querySelectorAll('[id^="menu-export-drop"]').forEach(m => m.style.display = 'none');
  if (!isOpen) menu.style.display = 'block';
}
// Klik di luar menu → tutup
document.addEventListener('click', e => {
  if (!e.target.closest('[id^="export-drop"]')) {
    document.querySelectorAll('[id^="menu-export-drop"]').forEach(m => m.style.display = 'none');
  }
});
async function exportData(format) {
  try {
    showToast('Menyiapkan rekap...', 'info');

    // Ambil semua surat (limit besar)
    const result = await API.getSurat({ limit: 9999, page: 1 });
    const surats = result.data || result;

    if (!surats || surats.length === 0) {
      showToast('Tidak ada data surat untuk diekspor', 'error');
      return;
    }

    const user = JSON.parse(localStorage.getItem('sicata_user') || '{}');
    const desa = user.desa || 'Desa';
    const tgl  = new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' });

    if (format === 'csv') {
      exportCSV(surats, desa, tgl);
    } else if (format === 'pdf') {
      exportPrintable(surats, desa, tgl);
    }
  } catch (e) {
    showToast('Gagal export: ' + e.message, 'error');
  }
}

function exportCSV(surats, desa, tgl) {
  // Header CSV
  const headers = [
    'No', 'Nomor Surat', 'Kategori', 'Jenis Surat',
    'Tanggal', 'Dari/Kepada', 'Perihal', 'Sifat', 'Jabatan', 'Nama TTD'
  ];

  const rows = surats.map((s, i) => {
    const tanggal = s.tgl ? new Date(s.tgl).toLocaleDateString('id-ID') : '-';
    const kat     = s.kat === 'masuk' ? 'Surat Masuk' : 'Surat Keluar';
    return [
      i + 1,
      s.nomor        || '-',
      kat,
      s.jenisLabel   || s.jenis || '-',
      tanggal,
      s.tujuan       || '-',
      s.perihal      || '-',
      s.sifat        || '-',
      s.jabatan      || '-',
      s.nama         || '-',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  const csvContent = '\uFEFF' // BOM supaya Excel baca UTF-8 dengan benar
    + `"REKAPITULASI SURAT - ${desa.toUpperCase()}"\n`
    + `"Dicetak tanggal: ${tgl}"\n`
    + `"Total: ${surats.length} surat"\n`
    + '\n'
    + headers.map(h => `"${h}"`).join(',') + '\n'
    + rows.join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `Rekap-Surat-${desa.replace(/\s+/g,'-')}-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
  showToast(`✅ Rekap CSV berhasil didownload (${surats.length} surat)`, 'success');
}

function exportPrintable(surats, desa, tgl) {
  const masuk  = surats.filter(s => s.kat === 'masuk');
  const keluar = surats.filter(s => s.kat === 'keluar');

  const rows = surats.map((s, i) => {
    const tanggal = s.tgl ? new Date(s.tgl).toLocaleDateString('id-ID') : '-';
    const kat     = s.kat === 'masuk'
      ? '<span style="color:#059669;font-weight:600;">↘ Masuk</span>'
      : '<span style="color:#d97706;font-weight:600;">↗ Keluar</span>';
    return `<tr>
      <td style="text-align:center">${i+1}</td>
      <td style="font-family:monospace;font-size:11px">${xe(s.nomor||'-')}</td>
      <td>${kat}</td>
      <td>${xe(s.jenisLabel||'-')}</td>
      <td>${xe(tanggal)}</td>
      <td>${xe(s.tujuan||'-')}</td>
      <td>${xe(s.perihal||'-')}</td>
      <td style="text-align:center">${xe(s.sifat||'-')}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="id"><head>
  <meta charset="UTF-8">
  <title>Rekap Surat - ${desa}</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:12px;margin:20px;color:#111;}
    h2{text-align:center;font-size:16px;margin-bottom:4px;}
    .sub{text-align:center;font-size:11px;color:#555;margin-bottom:16px;}
    .summary{display:flex;gap:20px;margin-bottom:14px;justify-content:center;}
    .sum-box{border:1px solid #ddd;border-radius:6px;padding:8px 20px;text-align:center;}
    .sum-box .num{font-size:22px;font-weight:700;}
    .sum-box .lbl{font-size:10px;color:#666;}
    table{width:100%;border-collapse:collapse;font-size:11px;}
    th{background:#1e3a6e;color:#fff;padding:7px 6px;text-align:left;}
    td{padding:5px 6px;border-bottom:1px solid #eee;}
    tr:nth-child(even){background:#f9fafb;}
    @media print{button{display:none!important;}}
  </style>
  </head><body>
  <h2>REKAPITULASI SURAT</h2>
  <div class="sub">Desa ${desa} &nbsp;|&nbsp; Dicetak: ${tgl}</div>
  <div class="summary">
    <div class="sum-box"><div class="num">${surats.length}</div><div class="lbl">Total Surat</div></div>
    <div class="sum-box"><div class="num" style="color:#059669">${masuk.length}</div><div class="lbl">Surat Masuk</div></div>
    <div class="sum-box"><div class="num" style="color:#d97706">${keluar.length}</div><div class="lbl">Surat Keluar</div></div>
  </div>
  <div style="text-align:right;margin-bottom:8px;">
    <button onclick="window.print()" style="padding:6px 16px;background:#1e3a6e;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;">🖨️ Print / Save PDF</button>
  </div>
  <table>
    <thead><tr>
      <th style="width:30px">No</th>
      <th>Nomor Surat</th>
      <th>Kat</th>
      <th>Jenis</th>
      <th>Tanggal</th>
      <th>Dari/Kepada</th>
      <th>Perihal</th>
      <th>Sifat</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  </body></html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  setTimeout(() => { URL.revokeObjectURL(url); }, 3000);
  showToast('✅ Halaman rekap terbuka — klik Print untuk simpan PDF', 'success');
}

// ─── HELPERS ─────────────────────────────────────────────────
function fmtTgl(str){
  const d=new Date(str);
  return `${d.getDate()} ${MON_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}
function xe(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

window.addEventListener('resize',()=>{
  clearTimeout(window._rt);
  window._rt = setTimeout(async()=>{ try{ const s=await API.getStats(); drawCharts(s); }catch(e){} },200);
});

init();
