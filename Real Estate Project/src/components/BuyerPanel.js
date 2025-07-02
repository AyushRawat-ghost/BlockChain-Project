import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { db } from '../firebase'
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc
} from 'firebase/firestore'

export default function BuyerPanel({ escrow, account }) {
  const [listings, setListings] = useState([])
  const [busyMap, setBusyMap]   = useState({})

  // Subscribe to all VERIFIED listings
  useEffect(() => {
    if (!escrow) return
    const q = query(
      collection(db, 'listings'),
      where('status', '==', 'VERIFIED')
    )
    const unsub = onSnapshot(q, snap =>
      setListings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return unsub
  }, [escrow])

  const handleDeposit = async listing => {
    const { id: docId, listingID, price, owner } = listing
    const lowerAcc = account.toLowerCase()
    if (owner.toLowerCase() === lowerAcc) {
      return alert('⚠️ You cannot buy your own listing.')
    }

    setBusyMap(m => ({ ...m, [docId]: true }))

    try {
      // 1) on-chain deposit earnest
      const value = ethers.utils.parseEther(price.toString())
      const tx = await escrow
        .connect(escrow.signer)
        .depositEarnest(listingID, { value })
      await tx.wait()

      // 2) off-chain: mark EARNEST_PAID + record buyer
      await updateDoc(doc(db, 'listings', docId), {
        status: 'EARNEST_PAID',
        buyer:  lowerAcc
      })

      alert('✅ Earnest deposited! Awaiting lender approval.')
    } catch (err) {
      console.error('Deposit error:', err)
      alert(err.error?.data?.message || err.message)
    } finally {
      setBusyMap(m => {
        const nxt = { ...m }
        delete nxt[docId]
        return nxt
      })
    }
  }

  if (!escrow) {
    return <p className="p-6 text-center text-gray-500">🔌 Connecting to contract…</p>
  }

  if (!listings.length) {
    return <p className="p-6 text-center text-gray-500">No properties available to buy.</p>
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow space-y-4">
      <h2 className="text-2xl font-bold text-center">💰 Buyer Panel</h2>

      {listings.map(l => {
        const busy   = !!busyMap[l.id]
        const isOwner = l.owner.toLowerCase() === account.toLowerCase()

        return (
          <div
            key={l.id}
            className="flex justify-between items-center p-4 border rounded hover:shadow transition"
          >
            <div>
              <p className="font-semibold">#{l.listingID} – {l.title}</p>
              <p className="text-sm text-gray-600">Price: {l.price} ETH</p>
              <p className="text-sm text-gray-600">Status: {l.status}</p>
            </div>
            <button
              onClick={() => handleDeposit(l)}
              disabled={busy || isOwner}
              className={`px-4 py-2 rounded text-white ${
                busy
                  ? 'bg-gray-400'
                  : isOwner
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isOwner
                ? 'Your Listing'
                : busy
                ? '⏳ Processing…'
                : 'Deposit Earnest'}
            </button>
          </div>
        )
      })}
    </div>
  )
}