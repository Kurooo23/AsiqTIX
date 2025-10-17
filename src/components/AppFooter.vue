<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import '@/assets/footer.css'

/* Sembunyikan footer di halaman login */
const route = useRoute()
const hidden = computed(() => (route.name === 'login' || route.path === '/login'))

/* Data kontak (ubah jika perlu) */
const year = new Date().getFullYear()
const brand = 'AsiqIt'

const offices = [
  {
    city: 'JAKARTA',
    email: 'asiqit.jkt@gmail.com',
    tel: '(021) 5587 8801',
    telHref: '+622155878801',
    addr1: 'Jl. Sudirman No. 102, Setiabudi,',
    addr2: 'Jakarta Selatan 12920',
  },
  {
    city: 'BALIKPAPAN',
    email: 'asiqit.bpn@gmail.com',
    tel: '(0542) 738 802',
    telHref: '+62542738802',
    addr1: 'Jl. Jendral Sudirman No. 88,',
    addr2: 'Klandasan Ilir, Balikpapan',
    addr3: 'Kota 76113',
  },
  {
    city: 'SOLO',
    email: 'asiqit.solo@gmail.com',
    tel: '(0271) 868 210',
    telHref: '+62271868210',
    addr1: 'Jl. Slamet Riyadi No. 45,',
    addr2: 'Laweyan, Surakarta 57141',
  },
]
</script>

<template>
  <footer v-if="!hidden" class="site-footer" role="contentinfo">
    <div class="footer-inner">
      <!-- Brand / Contact us / Sosial -->
      <section class="brand-cell">
        <h2 class="footer-title">Contact us</h2>

        <nav class="socials" aria-label="social links">
          <a href="#" aria-label="Instagram" class="ico">
            <!-- Instagram -->
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.9.2 2.4.4.6.2 1 .4 1.5.8.4.3.7.8.8 1.5.2.5.3 1.2.4 2.4.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.9-.4 2.4-.2.6-.4 1-.8 1.5-.3.4-.8.7-1.5.8-.5.2-1.2.3-2.4.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.2-2.4-.4-.6-.2-1-.4-1.5-.8-.4-.3-.7-.8-.8-1.5-.2-.5-.3-1.2-.4-2.4C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.9.4-2.4.2-.6.4-1 .8-1.5.3-.4.8-.7 1.5-.8.5-.2 1.2-.3 2.4-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.8.4-1.1.7-.3.3-.5.6-.7 1.1-.2.4-.3 1-.4 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.8.7 1.1.3.3.6.5 1.1.7.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.8-.4 1.1-.7.3-.3.5-.6.7-1.1.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.8-.7-1.1-.3-.3-.6-.5-1.1-.7-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1Zm0 3.4a6.6 6.6 0 1 1 0 13.2 6.6 6.6 0 0 1 0-13.2Zm0 2a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2Zm5-2.2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z"/>
            </svg>
          </a>
          <a href="#" aria-label="Facebook" class="ico">
            <!-- Facebook -->
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M13.5 22v-8h2.7l.4-3h-3.1V8.6c0-.9.2-1.6 1.6-1.6h1.7V4.3c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2V11H8.3v3h2.9v8h2.3Z"/>
            </svg>
          </a>
          <a href="#" aria-label="YouTube" class="ico">
            <!-- YouTube -->
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M23 7.6a4 4 0 0 0-.7-2.1 2.9 2.9 0 0 0-2.1-.8C17.8 4.4 12 4.4 12 4.4s-5.8 0-8.2.3c-.8 0-1.5.3-2.1.8a4 4 0 0 0-.7 2.1A37 37 0 0 0 0 12a37 37 0 0 0 1 4.4c.1.8.3 1.5.8 2.1.5.5 1.2.8 2 .8 2.4.3 8.2.3 8.2.3s5.8 0 8.2-.3c.8 0 1.5-.3 2.1-.8.5-.6.7-1.3.8-2.1.3-1.5.4-3 .4-4.4s0-2.9-.3-4.4ZM9.6 15.3V8.7l6.1 3.3-6.1 3.3Z"/>
            </svg>
          </a>
        </nav>

        <small class="copy">© {{ year }} {{ brand }}. All rights reserved.</small>
      </section>

      <!-- Kantor -->
      <section
        v-for="(o, i) in offices"
        :key="i"
        class="office-cell"
      >
        <h3 class="city">{{ o.city }}</h3>
        <a class="email" :href="`mailto:${o.email}`">{{ o.email }}</a>
        <a class="tel" :href="`tel:${o.telHref}`">{{ o.tel }}</a>
        <address class="addr">
          <span>{{ o.addr1 }}</span>
          <span>{{ o.addr2 }}</span>
          <span v-if="o.addr3">{{ o.addr3 }}</span>
        </address>
      </section>
    </div>
  </footer>
</template>
