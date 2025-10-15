<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRoute, RouterLink, useRouter } from 'vue-router'
import { useMetamask } from '@/composables/useMetamask'

/* ====== Route / Sidebar ====== */
const isCollapsed = ref(false)
const route = useRoute()
const router = useRouter()
const isActive = (path) => route.path === path

const sidebarOpen = ref(false)
function closeSidebar() {
  if (window.matchMedia('(max-width: 900px)').matches) {
    sidebarOpen.value = false        // tutup overlay (mobile)
  } else {
    isCollapsed.value = false        // pastikan expand (desktop)
  }
}

function toggleSidebar() {
  if (window.matchMedia('(max-width: 900px)').matches) {
    sidebarOpen.value = !sidebarOpen.value
  } else {
    isCollapsed.value = !isCollapsed.value
  }
}
watch(() => route.fullPath, () => closeSidebar())

/* ====== Wallet ====== */
const { account } = useMetamask()
const shortAddr = (a) => a ? `${a.slice(0,6)}...${a.slice(-4)}` : ''

/* ====== Auth (customer-only) ====== */
const token = () => localStorage.getItem('auth_token') || ''
const isLoggedIn = computed(() => Boolean(token()))
function authHeader () {
  const t = token()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

/* ====== Helper fetch via Vite proxy ====== */
async function fetchJSON(path, options) {
  if (typeof path !== 'string' || !path.startsWith('/api')) {
    throw new Error(`Path harus diawali '/api'. Diterima: ${String(path)}`)
  }
  const res = await fetch(path, { credentials: 'omit', ...(options||{}) })
  const text = await res.text()
  let data = {}
  if (text && text.trim()) { try { data = JSON.parse(text) } catch { data = { message: text } } }
  if (!res.ok) {
    const msg = data?.message || text || `Request gagal (${res.status})`
    throw new Error(msg.toString().slice(0, 300))
  }
  return data
}

/* ====== Events (public) ====== */
const loading = ref(false)
const events  = ref([])   // [{id, title, location, date, desc, image}]
const errorMsg = ref('')

async function fetchEvents() {
  loading.value = true
  errorMsg.value = ''
  try {
    events.value = await fetchJSON('/api/events')
  } catch (e) {
    errorMsg.value = String(e?.message || e)
  } finally { loading.value = false }
}

/* ====== Pembelian (customer) ====== */
const busyBuy = ref(0)

async function buyTicket(ev) {
  if (!account.value) {
    alert('Silakan hubungkan wallet / login terlebih dahulu.')
    router.push({ name: 'login' })
    return
  }
  if (!isLoggedIn.value) {
    alert('Sesi login belum ada. Silakan login ulang.')
    router.push({ name: 'login' })
    return
  }

  busyBuy.value = ev.id
  try {
    const r = await fetchJSON('/api/mint/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({
        quantity: 1,
        tokenId: ev.tokenId || ev.id
      })
    })
    // r = { to, value } — calldata disusun di frontend saat kirim via wallet
    alert('Transaksi siap. Kirim via wallet Anda:\n' + JSON.stringify(r, null, 2))
  } catch (e) {
    alert(String(e?.message || e))
  } finally {
    busyBuy.value = 0
  }
}

/* ====== Lifecycle ====== */
onMounted(async () => {
  await fetchEvents()
})
</script>

<template>
  <div class="page">
    <!-- TOP BAR -->
    <header class="topbar">
      <button class="hamburger" @click="toggleSidebar" aria-label="Toggle Sidebar">
        <span></span><span></span><span></span>
      </button>

      <div class="brand">
        <img src="/logo_with_text.png" alt="Logo" />
      </div>

      <div class="actions">
        <div class="user-pill" v-if="account" :title="account">
          <span class="user-ico">🦊</span>
          <span class="user-text">{{ shortAddr(account) }}</span>
        </div>
        <RouterLink v-else to="/login" class="user-pill ghost" title="Login">
          <span class="user-ico">👤</span>
        </RouterLink>
      </div>
    </header>

    <!-- SIDEBAR -->
    <transition name="sb">
      <aside v-if="sidebarOpen" class="sb-card">
        <nav class="sb-menu">
          <RouterLink class="sb-item" :class="{active: isActive('/home')}" to="/home"         @click="closeSidebar">Home</RouterLink>
          <RouterLink class="sb-item" :class="{active: isActive('/profile')}" to="/profile"   @click="closeSidebar"> 
            <span class="icon">👤</span>
            <span class="label">Account</span>
          </RouterLink>
          <RouterLink class="sb-item" :class="{active: isActive('/wallet')}" to="/wallet"     @click="closeSidebar">wallet</RouterLink>
          <RouterLink class="sb-item" :class="{active: isActive('/transactions')}" to="/transactions" @click="closeSidebar">history</RouterLink>
          <RouterLink class="sb-item sb-danger" to="/logout" @click="closeSidebar">log out</RouterLink>
        </nav>
      </aside>
    </transition>
    <div v-if="sidebarOpen" class="sb-backdrop" @click="closeSidebar" />

    <!-- HERO -->
    <section class="hero">
      <div class="hero-bg"></div>

      <!-- SEARCH PILL -->
      <div class="search">
        <input class="search-input" placeholder="Type here..." />
        <button class="search-btn" aria-label="Search">🔎</button>
      </div>

      <!-- TITLE -->
      <h1 class="hero-title">UPCOMING CONCERTS</h1>
    </section>

    <!-- CONTENT -->
    <main class="container">
      <div v-if="errorMsg" class="alert error">{{ errorMsg }}</div>
      <div v-else-if="loading" class="alert">Loading...</div>

      <div v-else class="cards">
        <article v-for="ev in events" :key="ev.id" class="card">
          <div class="img-wrap">
            <div class="img" :style="{ backgroundImage: `url(${ev.image || '/hero_fallback.jpg'})` }"></div>
            <div class="img-gradient"></div>
            <h3 class="title">{{ (ev.title || '').toUpperCase() }}</h3>
          </div>

          <div class="meta">
            <p><strong>Location:</strong> {{ ev.location }}</p>
            <p><strong>Date:</strong> {{ ev.date }}</p>
          </div>

          <p class="desc">{{ ev.desc }}</p>

          <button
            class="buy"
            :disabled="busyBuy === ev.id"
            @click="buyTicket(ev)"
          >
            {{ busyBuy === ev.id ? 'PROCESSING…' : 'BUY TICKET' }}
          </button>
        </article>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ====== THEME ====== */
:root{
  --bg: #0b0d12;
  --panel: #0f131b;
  --border: #1c2536;
  --text: #f4f6fb;
  --muted: #ccd3e1;
  --brand: #f2c78a;
  --accent: #e34b2b;      /* overlay merah */
  --accent2: #7c0b0b;
  --pill: rgba(255,255,255,.1);
  --yellow: #f7c86a;      /* tombol */
}

/* ====== PAGE ====== */
.page{
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
}

/* ====== TOP BAR ====== */
.topbar{
  height: 72px;
  display: grid;
  grid-template-columns: 64px 1fr 120px;
  align-items: center;
  padding: 0 18px;
  position: relative;
  z-index: 5;
  background: linear-gradient(180deg, rgba(0,0,0,.55), rgba(0,0,0,0));
}
.hamburger{
  width: 44px; height: 44px;
  display:flex; align-items:center; justify-content:center;
  background: var(--pill); border:1px solid var(--border); border-radius:10px;
  cursor:pointer;
}
.hamburger span{ display:block; width:18px; height:2px; background:#fff; margin:2px 0; border-radius:2px; opacity:.9 }
.brand img{ height: 30px; margin-left: 8px; filter: drop-shadow(0 2px 8px rgba(0,0,0,.5)); }
.actions{ display:flex; justify-content:flex-end; }
.user-pill{
  display:inline-flex; align-items:center; gap:8px;
  padding: 8px 12px; border-radius: 12px;
  background: var(--pill); border:1px solid var(--border);
  font-weight: 600; font-size: 13px;
}
.user-pill.ghost{ width:44px; height:44px; justify-content:center; padding:0 }
.user-ico{ font-size: 16px; }
.user-text{ opacity:.95 }

/* ====== SIDEBAR ====== */
.sb-card{
  position: fixed;
  top: 84px;
  left: 20px;
  width: 190px;
  background: var(--brand);
  color: #2b1c08;
  border-radius: 14px;
  box-shadow: 0 18px 40px rgba(0,0,0,.35);
  border: 1px solid rgba(0,0,0,.12);
  padding: 12px 10px;
  z-index: 50;
}
.sb-card a{ color:#2b1c08; text-decoration:none; }
.sb-menu{ display:flex; flex-direction:column; gap:8px; }
.sb-item{
  display:block;
  padding: 8px 10px;
  font-weight: 700;
  text-transform: lowercase;
  letter-spacing: .2px;
  border-radius: 10px;
  transition: background .15s ease, transform .15s ease;
}
.sb-item.active{ background: rgba(0,0,0,.08); }
.sb-item:hover{ background: rgba(0,0,0,.08); transform: translateX(2px); }
.sb-danger{ color:#6b1b12; }
.sb-backdrop{
  position: fixed; inset: 0;
  background: rgba(0,0,0,.25);
  z-index: 40;
}
.sb-enter-from, .sb-leave-to { opacity: 0; transform: translateX(-10px); }
.sb-enter-active, .sb-leave-active { transition: all .15s ease; }
@media (max-width: 720px){
  .sb-card{ left: 12px; width: 210px; top: 76px; }
}

/* ====== HERO ====== */
.hero{
  position: relative;
  min-height: 220px;
  display: grid;
  place-items: center;
  padding: 36px 16px 22px;
}
.hero-bg{
  position:absolute; inset:0;
  background:
    radial-gradient(1200px 400px at 50% 0%, rgba(255,180,86,.25), transparent 60%),
    radial-gradient(1200px 400px at 70% 0%, rgba(255,122,69,.20), transparent 60%),
    url('/hero_fallback.jpg') center/cover no-repeat;
  filter: brightness(.55);
  opacity:.95;
  z-index:0;
}
.search{
  z-index:1;
  display:grid; grid-template-columns: 1fr auto;
  width:min(720px, 88vw);
  background: rgba(255,255,255,.85);
  border-radius: 32px;
  box-shadow: 0 10px 28px rgba(0,0,0,.35);
  overflow:hidden;
}
.search-input{
  border:none; outline:none; padding:16px 18px; font-size:16px; color:#222; background:transparent;
}
.search-input::placeholder{ color:#6b7280 }
.search-btn{ border:none; background:transparent; width:64px; cursor:pointer; font-size:18px; color:#111; }
.hero-title{
  z-index:1;
  margin-top: 22px;
  letter-spacing: .25em;
  font-weight: 800;
  text-align:center;
  font-size: clamp(20px, 3.2vw, 36px);
  color: #f1eee9;
  text-shadow: 0 6px 24px rgba(0,0,0,.6);
}

/* ====== CONTENT ====== */
.container{ max-width: 1200px; margin: 0 auto; padding: 28px 20px 40px; }
.alert{
  background: #111827; border:1px solid var(--border);
  padding:12px 14px; border-radius: 12px; color: var(--text);
}
.alert.error{ background: #3d1a1a; border-color: #5c2a2a }

/* ====== CARDS ====== */
.cards{
  display:grid; gap: 24px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.card{
  background: #160f14;
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: 0 16px 40px rgba(0,0,0,.35);
  overflow: hidden;
  display: grid;
  grid-template-rows: 220px auto auto auto;
  padding-bottom: 18px;
}
.img-wrap{ position:relative; }
.img{
  position:absolute; inset:0;
  background-size: cover; background-position: center;
  filter: saturate(.95);
}
.img-gradient{
  position:absolute; left:0; right:0; bottom:0; height: 60%;
  background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(157,34,21,0.15) 25%, rgba(157,34,21,.5) 60%, rgba(157,34,21,.75) 100%);
}
.title{
  position:absolute; left:0; right:0; bottom: 16px;
  text-align:center;
  color:#fff;
  font-weight: 800;
  letter-spacing: .35em;
  font-size: 20px;
  text-shadow: 0 4px 18px rgba(0,0,0,.6);
}

/* meta & desc */
.meta{ padding: 16px 18px 6px; font-size: 14px; color:#f0f0f0 }
.meta strong{ font-weight: 800 }
.desc{ padding: 0 18px; font-size: 13px; color:#f3e8e6; opacity:.95; min-height: 56px }

/* buy button */
.buy{
  margin: 14px 18px 0;
  padding: 10px 14px;
  background: var(--yellow);
  color: #281c06;
  border: none;
  border-radius: 8px;
  font-weight: 800;
  cursor: pointer;
  transition: transform .15s ease, box-shadow .15s ease;
}
.buy:hover{ transform: translateY(-1px); box-shadow: 0 10px 22px rgba(247, 200, 106, .35) }
.buy:disabled{ opacity:.6; cursor:not-allowed }

/* ====== RESPONSIVE ====== */
@media (max-width: 1100px){
  .cards{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 720px){
  .cards{ grid-template-columns: 1fr; }
  .hero{ min-height: 200px }
  .search{ width: min(640px, 92vw) }
}
</style>
