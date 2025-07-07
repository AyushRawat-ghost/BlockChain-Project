// src/components/SellerPanel.js

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


export default function SellerPanel({ escrow, account }) {
  const [listings, setListings] = useState([])
  const [busyMap, setBusyMap]   = useState({})

  // Subscribe to listings with status "APPROVAL_GRANTED"
  useEffect(() => {
    if (!escrow) return
    const q = query(
      collection(db, 'listings'),
      where('status', '==', 'APPROVAL_GRANTED')
    )
    const unsub = onSnapshot(q, snap => {
      setListings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [escrow])

  const handleFinalize = async listing => {
    const { id: docId, listingID, owner } = listing
    if (owner.toLowerCase() !== account?.toLowerCase()) {
      return alert('Only the seller can finalize this sale.')
    }
    setBusyMap(m => ({ ...m, [docId]: true }))

    try {
      const tx = await escrow.connect(escrow.signer)
                        .finalizeSale(listingID)
      await tx.wait()

      await updateDoc(doc(db, 'listings', docId), {
        status: 'SOLD'
      })
      alert('Sale finalized! Congratulations.')
    } catch (err) {
      console.error(err)
      alert(err.error?.data?.message || err.message)
    } finally {
      setBusyMap(m => { const n = { ...m }; delete n[docId]; return n })
    }
  }

  if (!escrow) {
    return <p className="p-6 text-center">🔄 Connecting to contract…</p>
  }

  if (listings.length === 0) {
    return <p className="p-6 text-center">No sales ready to finalize.</p>
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow space-y-4">
      <h2 className="text-2xl font-bold text-center">🏷️ Seller Panel</h2>
      {listings.map(l => {
        const busy = busyMap[l.id]
        const isOwner = l.owner.toLowerCase() === account?.toLowerCase()
        return (
          <div
            key={l.id}
            className="flex justify-between items-center p-4 border rounded"
          >
            <div>
              <p className="font-semibold">#{l.listingID} – {l.title}</p>
              <p className="text-sm text-gray-600">
                Status: {l.status}
              </p>
            </div>
            <button
              onClick={() => handleFinalize(l)}
              disabled={busy || !isOwner}
              className={`px-4 py-2 rounded text-white ${
                busy
                  ? 'bg-gray-400'
                  : !isOwner
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isOwner
                ? busy
                  ? '⏳ Finalizing…'
                  : 'Finalize Sale'
                : 'Not Yours'}
            </button>
          </div>
        )
      })}
    </div>
  )
}