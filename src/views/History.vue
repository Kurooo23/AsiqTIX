<script setup>
import { ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import '@/assets/history.css'

const route = useRoute()
const sidebarOpen = ref(false)
const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value)
const closeSidebar  = () => (sidebarOpen.value = false)
watch(() => route.fullPath, closeSidebar)

const histories = ref([
  { id: 1, title: 'Hindia in Balikpapan', date: '05/06/25', booking: '03552316685ffXDE', price: '100 POL', status: 'Successful' },
  { id: 2, title: 'MLTR',                date: '03/12/2018', booking: '035333188FFgjiH00', price: '110 POL', status: 'Successful' },
  { id: 3, title: 'KLA PROJECT',         date: '20/09/2016', booking: '035322688FFHjH00', price: '65 POL',  status: 'Successful' },
])

function downloadTicket(row){
  alert(`Downloading ticket:\n${row.title}\nBooking: ${row.booking}`)
}
</script>

<template>
  <main class="history-page" tabindex="-1">
    <header class="topbar">
      <div class="brand"><img src="/logo.png" alt="brand" /></div>
      <h1 class="title">Purchase History</h1>
      <button class="hamburger" aria-label="Toggle menu" @click="toggleSidebar">
        <span></span><span></span><span></span>
      </button>
    </header>

    <!-- Sidebar: pojok kanan-atas di desktop, off-canvas kanan saat mobile -->
    <transition name="sb">
      <aside v-if="sidebarOpen" class="sb-card sb-topright" role="dialog" aria-modal="true" @click.stop>
        <nav class="sb-menu">
          <RouterLink class="sb-item"        to="/home"    @click="closeSidebar">Home</RouterLink>
          <RouterLink class="sb-item"        to="/profile" @click="closeSidebar">Profile</RouterLink>
          <RouterLink class="sb-item"        to="/wallet"  @click="closeSidebar">Wallet</RouterLink>
          <RouterLink class="sb-item active" to="/history" @click="closeSidebar">History</RouterLink>
          <RouterLink class="sb-item sb-danger" to="/logout" @click="closeSidebar">Log out</RouterLink>
        </nav>
      </aside>
    </transition>
    <div v-if="sidebarOpen" class="sb-backdrop" @click="closeSidebar" />

    <section class="wrap">
      <h2 class="section-title">Concert(s)</h2>
      <ul class="list" role="list">
        <li v-for="row in histories" :key="row.id" class="item">
          <div class="header-line">
            <h3 class="event">{{ row.title }}</h3>
            <button class="btn" @click="downloadTicket(row)">DOWNLOAD TICKET</button>
          </div>
          <div class="meta">
            <p><strong>Date:</strong> {{ row.date }}</p>
            <p><strong>Booking number:</strong> {{ row.booking }}</p>
            <p><strong>Price:</strong> {{ row.price }}</p>
            <p><strong>Status:</strong> {{ row.status }}</p>
          </div>
        </li>
      </ul>
    </section>
  </main>
</template>
