<script setup>
import '@/assets/home.css'                 // <-- pakai CSS dari assets
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, RouterLink, useRouter } from 'vue-router'
import { useMetamask } from '@/composables/useMetamask'

/* ====== Route / Sidebar ====== */
const route = useRoute()
const router = useRouter()
const isActive = (path) => route.path === path

const sidebarOpen = ref(false)
function toggleSidebar() { sidebarOpen.value = !sidebarOpen.value }
function closeSidebar() { sidebarOpen.value = false }
watch(() => route.fullPath, () => closeSidebar())

/* ====== Wallet ====== */
const { account } = useMetamask()
const shortAddr = (a) => (a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '')

/* ====== Auth (customer-only) ====== */
const token = () => localStorage.getItem('auth_token') || ''
const isLoggedIn = computed(() => Boolean(token()))
function authHeader(){ const t=token(); return t ? { Authorization: `Bearer ${t}` } : {} }

/* ====== Helper fetch via Vite proxy ====== */
async function fetchJSON(path, options){
  if (!String(path).startsWith('/api')) throw new Error("Path harus diawali '/api'")
  const res = await fetch(path, { credentials:'omit', ...(options||{}) })
  const text = await res.text()
  let data = {}
  if (text?.trim()) { try{ data = JSON.parse(text) } catch { data = { message: text } } }
  if (!res.ok) throw new Error((data?.message || text || `Request gagal (${res.status})`).toString().slice(0,300))
  return data
}

/* ====== Events (public) ====== */
const loading = ref(false)
const events  = ref([])
const errorMsg = ref('')

async function fetchEvents(){
  loading.value = true; errorMsg.value = ''
  try { events.value = await fetchJSON('/api/events') }
  catch(e){ errorMsg.value = String(e?.message || e) }
  finally { loading.value = false }
}

/* ====== Pembelian (customer) ====== */
const busyBuy = ref(0)
async function buyTicket(ev){
  if (!account.value || !isLoggedIn.value) return router.push({ name: 'login' })
  busyBuy.value = ev.id
  try{
    const r = await fetchJSON('/api/mint/prepare', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', ...authHeader() },
      body: JSON.stringify({ quantity:1, tokenId: ev.tokenId || ev.id })
    })
    alert('Transaksi siap:\n' + JSON.stringify(r, null, 2))
  }catch(e){ alert(String(e?.message || e)) }
  finally{ busyBuy.value = 0 }
}

/* ====== Lifecycle ====== */
onMounted(fetchEvents)
</script>

<template>
  <!-- GUNAKAN namespace .home-page agar tidak konflik -->
  <div class="home-page" @keyup.esc="closeSidebar" tabindex="0">
    <!-- TOP BAR -->
    <header class="topbar">
      <button type="button" class="hamburger" @click.stop="toggleSidebar" aria-label="Toggle Sidebar">
        <span></span><span></span><span></span>
      </button>

      <div class="brand">
        <img src="/logo_with_text.png" alt="Logo" />
      </div>

      <div class="actions">
        <RouterLink v-if="account" class="user-pill" :title="account" :to="{ name: 'profile' }">
          <span class="user-ico">🦊</span>
          <span class="user-text">{{ shortAddr(account) }}</span>
        </RouterLink>
        <RouterLink v-else to="/login" class="user-pill ghost" title="Login">
          <span class="user-ico">👤</span>
        </RouterLink>
      </div>
    </header>

    <!-- SIDEBAR -->
    <transition name="sb">
      <aside v-if="sidebarOpen" class="sb-card" @click.stop>
        <nav class="sb-menu">
          <RouterLink class="sb-item" :class="{active: isActive('/home')}" to="/home" @click="closeSidebar">Home</RouterLink>
          <RouterLink class="sb-item" :class="{active: isActive('/profile')}" to="/profile" @click="closeSidebar">Profile</RouterLink>
          <RouterLink class="sb-item" :class="{active: isActive('/wallet')}" to="/wallet" @click="closeSidebar">Wallet</RouterLink>
          <RouterLink class="sb-item" :class="{active: isActive('/transactions')}" to="/transactions" @click="closeSidebar">History</RouterLink>
          <RouterLink class="sb-item sb-danger" to="/logout" @click="closeSidebar">Log out</RouterLink>
        </nav>
      </aside>
    </transition>
    <div v-if="sidebarOpen" class="sb-backdrop" @click="closeSidebar" />

    <!-- HERO -->
    <section class="hero">
      <div class="hero-bg"></div>

      <div class="search">
        <input class="search-input" placeholder="Type here..." />
        <button class="search-btn" aria-label="Search">🔎</button>
      </div>

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

          <button class="buy" :disabled="busyBuy === ev.id" @click="buyTicket(ev)">
            {{ busyBuy === ev.id ? 'PROCESSING…' : 'BUY TICKET' }}
          </button>
        </article>
      </div>
    </main>
  </div>
</template>