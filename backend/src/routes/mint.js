// src/routes/mint.js
import express from 'express'
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js'
import { CONTRACT_ADDRESS, NFT_ABI, mintCustodial, redeemFromVault } from '../lib/viem.js'
import { ethers } from 'ethers'

const router = express.Router()

function getUnitPriceWei() {
  const v = process.env.FIXED_PRICE_WEI
  if (v) return BigInt(v)
  // default 0 for dev
  return 0n
}

// PUBLIC price
router.get('/price', async (_req, res) => {
  try {
    const priceWei = getUnitPriceWei()
    return res.json({ priceWei: priceWei.toString() })
  } catch (e) {
    return res.status(500).json({ message: e?.message || 'Gagal mengambil harga' })
  }
})

// POST /api/mint/prepare (non-custodial, user will send the tx)
router.post('/prepare', requireAuth, async (req, res) => {
  try {
    const { quantity = 1, tokenId = 1 } = req.body || {}
    const unit = getUnitPriceWei()
    const total = unit * BigInt(quantity)

    // Encode calldata for a simple mint function if your contract supports it.
    // Replace 'mintToVault' with your non-custodial mint function name if different.
    const iface = new ethers.Interface(NFT_ABI)
    const data = iface.encodeFunctionData('mintToVault', [req.user.address, BigInt(tokenId), BigInt(quantity), ''])

    return res.json({
      to: CONTRACT_ADDRESS,
      value: total.toString(),
      data,
    })
  } catch (e) {
    return res.status(500).json({ message: e?.message || 'Gagal menyiapkan transaksi' })
  }
})

// Admin airdrop (custodial pattern)
router.post('/airdrop', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { to, tokenId = 1, quantity = 1, orderId = '' } = req.body || {}
    if (!to) return res.status(400).json({ message: 'to required' })
    const txHash = await mintCustodial({ buyerAddress: to, tokenId, qty: quantity, orderId })
    return res.json({ txHash })
  } catch (e) {
    return res.status(500).json({ message: e?.message || 'Gagal airdrop/admin-mint' })
  }
})

// Admin withdraw placeholder (needs ADMIN_PRIVATE_KEY & ABI support)
router.post('/withdraw', requireAuth, requireAdmin, async (_req, res) => {
  return res.status(501).json({ message: 'Not implemented. Add withdraw() in ABI & viem.js when ready.' })
})

export default router
