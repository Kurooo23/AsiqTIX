<script setup>
import '@/assets/account.css' // stylesheet yang berisi rules untuk .profile-page
import { ref, computed } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useConfirmLogout } from '@/composables/useConfirmLogout'
import { useMetamask } from '@/composables/useMetamask'
import profileSvgRaw from '@/assets/profile.svg?raw'

/* Router + active state */
const router = useRouter()
const route  = useRoute()
const isActive = (path) => route.path === path

/* Wallet (MetaMask) */
const { account } = useMetamask()
const walletAddress = computed(() => account.value || '')
const short = (a) => (a ? `${a.slice(0,6)}...${a.slice(-4)}` : '')

async function copyAddr () {
  if (!walletAddress.value) return
  await navigator.clipboard.writeText(walletAddress.value)
  alert('Wallet address copied!')
}

/* Konfirmasi logout */
const { confirmLogout } = useConfirmLogout()
async function onLogout () {
  await confirmLogout({ redirectTo: '/login' })
}

/* --- DATA DEMO --- */
const user = ref({ name: 'Your Name', avatarUrl: '' })
const purchases = ref([
  { id: 1, concert: 'Hindia in Balikpapan', date: '05/06/2025', price: '100 MATIC', status: 'Successful' },
  { id: 2, concert: 'MLTR',                  date: '03/06/2025', price: '110 MATIC', status: 'Successful' },
  { id: 3, concert: 'KLA Project',           date: '24/05/2025', price: '65 MATIC',  status: 'Successful' },
])
const wallet = ref({ balance: 8, symbol: 'MATIC' })

/* Avatar render: foto user jika ada; jika tidak pakai SVG raw */
const hasPhoto = computed(() => !!user.value.avatarUrl)
const profileSvg = computed(() => profileSvgRaw)

function openDetail(row) { alert(`Detail transaksi: ${row.concert} (${row.date})`) }
function topUp() { alert('Top up wallet…') }
</script>

<template>
  <!-- Root class khusus halaman PROFILE -->
  <div class="profile-page">
    <aside class="mini-sidebar">
      <div class="ticket-badge" aria-hidden="true"><span>🎟️</span></div>
      <nav class="mini-nav">
        <RouterLink :class="{ active: isActive('/home') }" to="/home">Home</RouterLink>
        <RouterLink :class="{ active: isActive('/profile') }" to="/profile">profile</RouterLink>
        <RouterLink :class="{ active: isActive('/wallet') }" to="/wallet">wallet</RouterLink>
        <RouterLink :class="{ active: isActive('/transactions') }" to="/transactions">history</RouterLink>
        <button class="link-btn" @click="onLogout">log out</button>
      </nav>
    </aside>

    <main class="content">
      <header class="header">
        <img class="brand-ticket" src="/logo_with_text.png" alt="logo" />
        <h1>Account</h1>
      </header>

      <section class="grid">
        <!-- Profile card -->
        <div class="profile-card">
          <div class="avatar">
            <img v-if="hasPhoto" :src="user.avatarUrl" alt="Profile" class="avatar-img" />
            <div v-else class="avatar-svg" v-html="profileSvg" />
          </div>
          <div class="profile-meta">
            <h3>{{ user.name }}</h3>
            <p class="addr" :title="walletAddress || ''">
              {{ short(walletAddress) || 'Not connected' }}
            </p>
          </div>
        </div>

        <!-- Purchase History -->
        <div class="history-card">
          <h2>Purchase History</h2>
          <div class="table">
            <div class="thead">
              <div>Concert(s)</div>
              <div>Payment Date</div>
              <div>Price</div>
              <div>Status</div>
              <div></div>
            </div>
            <div v-for="row in purchases" :key="row.id" class="trow">
              <div class="c1">{{ row.concert }}</div>
              <div class="c2">{{ row.date }}</div>
              <div class="c3">{{ row.price }}</div>
              <div class="c4">{{ row.status }}</div>
              <div class="c5">
                <button class="detail-btn" @click="openDetail(row)">DETAIL</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Wallet Card -->
        <div class="wallet-card">
          <h3>My Wallet</h3>
          <div class="amount">{{ wallet.balance }} {{ wallet.symbol }}</div>
          <p class="acc">
            account number:
            <span :title="walletAddress">{{ short(walletAddress) || '-' }}</span>
            <button class="copy" :disabled="!walletAddress" @click="copyAddr">COPY</button>
          </p>
          <button class="topup" @click="topUp">TOP UP</button>
        </div>
      </section>
    </main>
  </div>
</template>