<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import '@/assets/wallet.css' // stylesheet terpisah

const route = useRoute()                          
const router = useRouter()   

/* ======= Timers (polling) ======= */
const priceTimer = ref/** @type {number|null} */(null)
const balTimer   = ref/** @type {number|null} */(null)
const tabActive  = ref(true)
function handleVis(){ tabActive.value = !document.hidden }

/* ======= Sidebar (lokal) ======= */
const sidebarOpen = ref(false)
function toggleSidebar(){
  sidebarOpen.value = !sidebarOpen.value
  emit('toggleSidebar', sidebarOpen.value) // tetap inform parent (opsional)
}
function closeSidebar(){ sidebarOpen.value = false }

/* =========================
   Props & Emits (fallback)
   ========================= */
const props = defineProps({
  balance: { type: Number, default: 8 },
  unit:    { type: String, default: 'MATIC' },
  transactions: {
    type: Array,
    default: () => ([
      { id: 1, amount: 100, date: '2025-06-05' },
      { id: 2, amount: 110, date: '2025-06-03' },
      { id: 3, amount: 65,  date: '2025-05-24' },
    ])
  }
})
const emit = defineEmits(['toggleSidebar','topup'])

/* =========================
   MetaMask state
   ========================= */
const hasMM      = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
const account    = ref('')
const chainId    = ref('')
const balanceWei = ref('0x0')
const nativeSym  = ref('POL')
const loading    = ref(false)
const priceUSD   = ref/** @type {number|null} */(null)
const msgErr     = ref('')

/* =========================
   Helpers & Computed
   ========================= */
function fmtDate (iso) {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2,'0')
  const mm = String(d.getMonth()+1).padStart(2,'0')
  const yy = d.getFullYear()
  return `${dd}/${mm}/${yy}`
}
const isPolygon = computed(() => chainId.value?.toLowerCase() === '0x89')

const balanceNative = computed(() => {
  try {
    const wei = BigInt(balanceWei.value || '0x0')
    const int  = wei / 10n**18n
    const frac = wei % 10n**18n
    const fracStr = frac.toString().padStart(18,'0').replace(/0+$/,'').slice(0, 6)
    return fracStr ? `${int}.${fracStr}` : `${int}`
  } catch { return '0' }
})

const bigBalanceText = computed(() => {
  if (hasMM && account.value) return `${balanceNative.value} ${nativeSym.value}`
  return `${props.balance} ${props.unit}`
})

const usdText = computed(() => {
  if (!hasMM || !account.value || priceUSD.value == null) return null
  const n = Number(balanceNative.value || '0') * Number(priceUSD.value)
  if (!isFinite(n)) return null
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
})

/* =========================
   RPC / API
   ========================= */
async function connectAndLoad () {
  if (!hasMM) return
  loading.value = true
  msgErr.value = ''
  try {
    const accs = await window.ethereum.request({ method: 'eth_requestAccounts' })
    account.value = accs?.[0] ?? ''
    chainId.value = await window.ethereum.request({ method: 'eth_chainId' })
    nativeSym.value = isPolygon.value ? 'POL' : 'ETH'

    if (account.value) {
      balanceWei.value = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [account.value, 'latest'],
      })
    }
    await fetchUsdPrice()
  } catch (e) {
    msgErr.value = e?.message ?? 'Gagal memuat data dari MetaMask.'
  } finally {
    loading.value = false
  }
}

async function fetchUsdPrice () {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=polygon-ecosystem-token,matic-network&vs_currencies=usd',
      { cache: 'no-store' }
    )
    const data = await res.json()
    if (data?.['polygon-ecosystem-token']?.usd) {
      priceUSD.value = Number(data['polygon-ecosystem-token'].usd)
      nativeSym.value = 'POL'
    } else if (data?.['matic-network']?.usd) {
      priceUSD.value = Number(data['matic-network'].usd)
      nativeSym.value = 'MATIC'
    } else {
      priceUSD.value = null
    }
  } catch {
    priceUSD.value = null
  }
}

async function switchToPolygon () {
  if (!hasMM) return
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x89' }],
    })
  } catch (err) {
    if (err?.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x89',
          chainName: 'Polygon Mainnet',
          nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
          rpcUrls: ['https://polygon-rpc.com'],
          blockExplorerUrls: ['https://polygonscan.com'],
        }]
      })
    } else {
      msgErr.value = err?.message ?? 'Gagal mengganti jaringan.'
    }
  }
  await connectAndLoad()
}

/* Event listeners MetaMask */
function wireMMEvents () {
  if (!hasMM) return
  window.ethereum.on?.('accountsChanged', () => connectAndLoad())
  window.ethereum.on?.('chainChanged', () => connectAndLoad())
}

/* Mount & polling */
onMounted(async () => {
  wireMMEvents()
  if (hasMM) await connectAndLoad()

  document.addEventListener('visibilitychange', handleVis, { passive: true })

  // Poll harga tiap 60s
  priceTimer.value = window.setInterval(async () => {
    if (!tabActive.value) return
    await fetchUsdPrice()
  }, 60_000)

  // Poll saldo tiap 15s
  balTimer.value = window.setInterval(async () => {
    if (!tabActive.value || !hasMM || !account.value) return
    try {
      balanceWei.value = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [account.value, 'latest'],
      })
    } catch { /* ignore */ }
  }, 15_000)
})

/* Unmount: bersihkan polling */
onUnmounted(() => {
  if (priceTimer.value) clearInterval(priceTimer.value)
  if (balTimer.value)   clearInterval(balTimer.value)
  document.removeEventListener('visibilitychange', handleVis)
})
</script>

<template>
  <main class="wallet-page" tabindex="-1">
    <!-- Topbar -->
    <header class="topbar">
      <button class="hamburger" type="button" aria-label="Toggle sidebar"
              @click="toggleSidebar">
        <span></span><span></span><span></span>
      </button>

      <div class="brand">
        <img src="/logo.png" alt="Brand" />
      </div>

      <h1 class="title">Wallet</h1>
      <div class="actions"></div>
    </header>

    <!-- Sidebar Off-canvas -->
    <transition name="sb">
  <aside v-if="sidebarOpen" class="sb-card" role="dialog" aria-modal="true">
    <nav class="sb-menu">
      <!-- Pakai RouterLink, tutup sidebar saat klik -->
      <RouterLink to="/home" class="sb-item"
                  :class="{ active: route.name === 'home' }"
                  @click="closeSidebar">home</RouterLink>
      <RouterLink to="/profile" class="sb-item"
                  :class="{ active: route.name === 'profile' }"
                  @click="closeSidebar">profile</RouterLink>
      <RouterLink to="/history" class="sb-item"
                  :class="{ active: route.name === 'history' }"
                  @click="closeSidebar">History</RouterLink>
      <RouterLink to="/wallet" class="sb-item"
                  :class="{ active: route.name === 'wallet' }"
                  @click="closeSidebar">wallet</RouterLink>


      <!-- Contoh ke halaman logout/aksi -->
      <RouterLink to="/logout" class="sb-item sb-danger"
                  :class="{ active: route.name === 'logout' }"
                  @click="closeSidebar">logout</RouterLink>
      <!-- Atau jika logout adalah aksi, gunakan @click="handleLogout()" -->
    </nav>
  </aside>
</transition>
    <div v-if="sidebarOpen" class="sb-backdrop" @click="closeSidebar" aria-hidden="true"></div>

    <!-- Content -->
    <section class="container">
      <section class="panel">
        <h2 class="h-sub">My Balance</h2>

        <div class="balance">
          <div>
            <div class="balance-value">{{ bigBalanceText }}</div>
            <div v-if="usdText" class="fiat-line">{{ usdText }}</div>
            <div v-else class="fiat-line muted">USD: N/A</div>
            <div v-if="account" class="addr muted">Account: {{ account.slice(0,6) }}…{{ account.slice(-4) }}</div>
          </div>

          <div class="btns">
            <button class="btn" type="button" @click="emit('topup')">TOP UP</button>
            <button class="btn" type="button" @click="connectAndLoad" :disabled="loading">Refresh</button>
            <button v-if="hasMM && !isPolygon" class="btn ghost" type="button" @click="switchToPolygon">
              Switch to Polygon
            </button>
          </div>
        </div>

        <hr class="sep" />

        <h3 class="h-sub">Transaction</h3>
        <ul class="tx-list" role="list">
          <li v-for="tx in props.transactions" :key="tx.id" class="tx-item">
            <span class="tx-amount">- {{ tx.amount }}</span>
            <span class="tx-date">{{ fmtDate(tx.date) }}</span>
          </li>
        </ul>

        <p v-if="msgErr" class="alert error" style="margin-top:12px;">{{ msgErr }}</p>
      </section>
    </section>
  </main>
</template>
