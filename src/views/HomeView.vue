<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, RouterLink, useRouter } from 'vue-router'
import { useMetamask } from '@/composables/useMetamask'

import imgFeast from '@/assets/Feast_Foto.jpg'
import imgSO7 from '@/assets/SO7.jpeg'
import imgGigi from '@/assets/Band-Gigi-2018.jpg'


/* Route & sidebar */
const route = useRoute()
const router = useRouter()
const isActive = (p) => route.path === p
const sidebarOpen = ref(false)
const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value)
const closeSidebar  = () => (sidebarOpen.value = false)
watch(() => route.fullPath, closeSidebar)

/* Wallet */
const { account } = useMetamask()
const shortAddr = (a) => (a ? `${a.slice(0,6)}...${a.slice(-4)}` : '')

/* Dummy events (ganti dengan API kamu) */
const loading = ref(false)
const events = ref([])
const errorMsg = ref('')
onMounted(async () => {
  loading.value = true
  try {
    events.value = [
      { id: 1, title: 'FEAST',       location: 'Donna, Balikpapan',            date: '2025-11-10', desc: 'Tur album terbaru.', image: imgFeast },
      { id: 2, title: 'SHEILA ON 7', location: 'Kotaraya Hall, Yogyakarta',    date: '2025-11-20', desc: 'Setlist klasik.',    image: imgSO7 },
      { id: 3, title: 'GIGI',        location: 'Manakala Hall, Bandung',       date: '2026-01-26', desc: 'Format full band.',  image: imgGigi },
    ]
  } finally { loading.value = false }
})

/* Buy */
const busyBuy = ref(0)
function buyTicket(ev){ alert(`Beli: ${ev.title}`) }
</script>

<template>
  <!-- Namespaced: .home-page -->
  <div
    class="home-page"
    :style="{ '--hero-img': 'url(/src/assets/home_background.png)' }"
    @keyup.esc="closeSidebar"
    tabindex="0"
  >
    <!-- ===== HEADER (bar hitam + search) ===== -->
    <header class="topbar">
      <button class="hamburger" @click.stop="toggleSidebar" aria-label="Toggle Sidebar">
        <span></span><span></span><span></span>
      </button>

      <div class="brand">
        <img src="/logo.png" alt="Logo" />
      </div>

      <!-- Search di header -->
      <div class="search search--top">
        <input class="search-input" placeholder="Type here..." />
        <button class="search-btn" aria-label="Search">🔎</button>
      </div>

      <div class="actions">
        <RouterLink
          v-if="account"
          class="user-pill"
          :title="account"
          :to="{ name: 'profile' }"
        >
          <span class="user-ico">🦊</span>
          <span class="user-text">{{ shortAddr(account) }}</span>
        </RouterLink>
        <RouterLink v-else to="/login" class="user-pill ghost" title="Login">
          <span class="user-ico">👤</span>
        </RouterLink>
      </div>
    </header>

    <!-- Sidebar mini -->
    <transition name="sb">
      <aside v-if="sidebarOpen" class="sb-card" @click.stop>
        <nav class="sb-menu">
          <RouterLink class="sb-item" :class="{active: isActive('/home')}" to="/home" @click="closeSidebar">Home</RouterLink>
          <RouterLink class="sb-item" :class="{active: isActive('/profile')}" to="/profile" @click="closeSidebar">Profile</RouterLink>
          <RouterLink class="sb-item" :class="{active: isActive('/wallet')}" to="/wallet" @click="closeSidebar">Wallet</RouterLink>
          <RouterLink class="sb-item" :class="{active: isActive('/history')}" to="/history" @click="closeSidebar">History</RouterLink>
          <RouterLink class="sb-item sb-danger" to="/logout" @click="closeSidebar">Log out</RouterLink>
        </nav>
      </aside>
    </transition>
    <div v-if="sidebarOpen" class="sb-backdrop" @click="closeSidebar" />

    <!-- ===== HERO (tanpa search) ===== -->
    <section class="hero">
      <div class="hero-bg"></div>
      <h1 class="hero-title">UPCOMING CONCERTS</h1>
    </section>

    <!-- ===== CONTENT ===== -->
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

<style src="@/assets/home.css"></style>
