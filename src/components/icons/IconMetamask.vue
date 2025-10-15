<script setup>
import { computed } from 'vue'
import iconJpg from '@/assets/metamask.svg' // ganti ke nama file Anda jika berbeda

const props = defineProps({
  /** Ukuran ikon (px atau string CSS) */
  size: { type: [Number, String], default: 22 },
  /** Sudut membulat seperti “emoji look” */
  rounded: { type: Boolean, default: true },
  /** Override sumber gambar bila mau (opsional) */
  src: { type: String, default: '' },
  alt: { type: String, default: 'MetaMask' }
})

const px = computed(() =>
  typeof props.size === 'number' ? `${props.size}px` : String(props.size)
)

const resolvedSrc = computed(() => props.src || iconJpg)
</script>

<template>
  <img
    :src="resolvedSrc"
    :alt="alt"
    :width="px"
    :height="px"
    :class="['mm-icon', { rounded }]"
  />
</template>

<style scoped>
.mm-icon {
  display: inline-block;
  object-fit: contain;
  /* bayangan halus supaya “rasa emoji” */
  filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.25));
}
.rounded { border-radius: 4px; }
</style>
