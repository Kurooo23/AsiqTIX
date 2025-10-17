<script setup>
import '@/assets/account.css'
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useConfirmLogout } from '@/composables/useConfirmLogout'
import { useMetamask } from '@/composables/useMetamask'
import profileSvgRaw from '@/assets/profile.svg?raw'

/* ------- Route & nav state ------- */
const route = useRoute()
const router = useRouter()
const isActive = (path) => route.path === path

/* ------- Drawer sidebar (kanan) ------- */
const sidebarOpen = ref(false)
const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value)
const closeSidebar  = () => (sidebarOpen.value = false)
watch(() => route.fullPath, closeSidebar)

const onEsc = (e) => { if (e.key === 'Escape') closeSidebar() }
onMounted(() => window.addEventListener('keydown', onEsc))
onBeforeUnmount(() => window.removeEventListener('keydown', onEsc))

/* ------- Wallet (MetaMask) ------- */
const { account } = useMetamask()
const walletAddress = computed(() => account.value || '')
const short = (a) => (a ? `${a.slice(0,6)}...${a.slice(-4)}` : '')
const copyAddr = async () => {
  if (!walletAddress.value) return
  await navigator.clipboard.writeText(walletAddress.value)
  alert('Wallet address copied!')
}

/* ------- Logout confirm ------- */
const { confirmLogout } = useConfirmLogout()
const onLogout = async () => { await confirmLogout({ redirectTo: '/login' }) }

/* ------- Demo data UI ------- */
const user = ref({ name: 'Your Name', avatarUrl: '' })
const purchases = ref([
  { id: 1, concert: 'Hindia in Balikpapan', date: '05/06/2025', price: '100 MATIC', status: 'Successful' },
  { id: 2, concert: 'MLTR',                  date: '03/06/2025', price: '110 MATIC', status: 'Successful' },
  { id: 3, concert: 'KLA Project',           date: '24/05/2025', price: '65 MATIC',  status: 'Successful' },
])
const wallet = ref({ balance: 8, symbol: 'MATIC' })

/* ------- Avatar (fallback SVG) ------- */
const hasPhoto = computed(() => !!user.value.avatarUrl)
const profileSvg = computed(() => profileSvgRaw)

/* ------- UI actions ------- */
const openDetail = (row) => alert(`Detail transaksi: ${row.concert} (${row.date})`)

/* =========================
   TOP UP (MetaMask Buy)
   ========================= */
const BUY_URL = 'https://app.metamask.io/buy?metamaskEntry=ext_buy_sell_button&chainId=137&metametricsId=0x1d179a3676bba5dc16132d5626f1a7a0186c84eae60d6a5945ba734692e270cc&metricsEnabled=true&marketingEnabled=true'
const BUY_URL_FALLBACK = 'https://metamask.app.link/buy?chainId=137'

function isMobile(){
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}
function hasMetaMask(){
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
}
async function ensurePolygon(){
  try{
    const chainId = await window.ethereum.request({ method: 'eth_chainId' })
    if (chainId?.toLowerCase() === '0x89') return
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x89' }], // Polygon mainnet
    })
  }catch(e){
    // User cancel / network not added — we still proceed to the buy page.
  }
}
async function topUp(){
  // Desktop + extension available → try switch to Polygon, then open Buy
  if (hasMetaMask() && !isMobile()){
    try { await ensurePolygon() } catch {}
    window.open(BUY_URL, '_blank', 'noopener,noreferrer')
    return
  }
  // Mobile / no extension → open deep-link fallback
  window.open(BUY_URL_FALLBACK, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <div class="profile-page">
    <!-- Header (ikon hamburger di kanan atas) -->
    <div class="content">
      <div class="header">
        <button
          class="hamburger"
          :aria-expanded="String(sidebarOpen)"
          aria-controls="sidebar-drawer"
          aria-label="Open sidebar"
          @click="toggleSidebar"
        >
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>

    <!-- Drawer Sidebar (kanan) -->
    <div
      id="sidebar-drawer"
      class="drawer"
      :class="{ 'is-open': sidebarOpen }"
      role="dialog"
      aria-modal="true"
    >
      <div class="drawer-backdrop" @click="closeSidebar"></div>

      <nav class="drawer-panel" @click.stop>
        <div class="ticket-badge" aria-hidden="true"><span>🎟️</span></div>
        <div class="mini-nav">
          <RouterLink :class="{ active: isActive('/home') }" to="/home" @click="closeSidebar">home</RouterLink>
          <RouterLink :class="{ active: isActive('/profile') }" to="/profile" @click="closeSidebar">profile</RouterLink>
          <RouterLink :class="{ active: isActive('/wallet') }" to="/wallet" @click="closeSidebar">wallet</RouterLink>
          <RouterLink :class="{ active: isActive('/history') }" to="/history" @click="closeSidebar">history</RouterLink>
          <button class="link-btn" @click="onLogout">log out</button>
        </div>
      </nav>
    </div>

    <!-- GRID KONTEN -->
    <div class="grid">
      <!-- Kartu Profil -->
      <section class="profile-card">
        <div class="avatar">
          <img v-if="hasPhoto" :src="user.avatarUrl" alt="Profile" class="avatar-img" />
          <div v-else class="avatar-svg" v-html="profileSvg" />
        </div>
        <div class="profile-meta">
          <h3>{{ user.name }}</h3>
          <p class="addr" :title="walletAddress || ''">{{ short(walletAddress) || '–' }}</p>
        </div>
      </section>

      <!-- Riwayat Pembelian -->
      <section class="history-card">
        <h2>Purchase History</h2>

        <div class="thead">
          <div>Concert(s)</div>
          <div>Payment Date</div>
          <div>Price</div>
          <div>Status</div>
          <div></div>
        </div>

        <div class="table">
          <div class="trow" v-for="row in purchases" :key="row.id">
            <div data-col="Concert(s)">{{ row.concert }}</div>
            <div data-col="Payment Date">{{ row.date }}</div>
            <div data-col="Price">{{ row.price }}</div>
            <div data-col="Status">{{ row.status }}</div>
            <div><button class="detail-btn" @click="openDetail(row)">DETAIL</button></div>
          </div>
        </div>
      </section>

      <!-- Wallet -->
      <section class="wallet-card">
        <h3>My Wallet</h3>
        <div class="amount">{{ wallet.balance }} {{ wallet.symbol }}</div>
        <p class="acc">
          account number:
          <span :title="walletAddress">{{ short(walletAddress) || '-' }}</span>
          <button class="copy" :disabled="!walletAddress" @click="copyAddr">COPY</button>
        </p>
        <button class="topup" @click="topUp">TOP UP</button>
      </section>
    </div>
  </div>
</template>
