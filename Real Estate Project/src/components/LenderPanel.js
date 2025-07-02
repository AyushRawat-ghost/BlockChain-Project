// src/components/LenderPanel.js

import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc
} from 'firebase/firestore'
import { db } from '../firebase'
import { FaBed, FaBath, FaRulerCombined } from 'react-icons/fa'

export default function LenderPanel({ escrow, account, lender }) {
  // safe lowercase helper
  const lc = str => (typeof str === 'string' ? str.toLowerCase() : '')

  // only true when account matches lender
  const isLender = lc(account) === lc(lender)

  const [listings, setListings] = useState([])
  const [busyMap, setBusyMap]   = useState({})

  // subscribe to listings where earnest has been paid
  useEffect(() => {
    if (!escrow || !isLender) return

    const q = query(
      collection(db, 'listings'),
      where('status', '==', 'EARNEST_PAID')
    )
    const unsub = onSnapshot(q, snap =>
      setListings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return unsub
  }, [escrow, isLender])

  const handleApproveAndFinalize = async listing => {
    const { id: docId, listingID, buyer } = listing
    const buyerLc = lc(buyer)
    if (!buyerLc) {
      return alert('⚠️ Buyer address missing—cannot finalize.')
    }

    setBusyMap(m => ({ ...m, [docId]: true }))
    try {
      // 1) on-chain: approve sale
      const tx = await escrow
        .connect(escrow.signer)
        .approveSale(listingID)
      await tx.wait()

      // 2) off-chain: mark sold & transfer ownership
      await updateDoc(doc(db, 'listings', docId), {
        status: 'SOLD',
        owner:  buyerLc
      })
      alert(`✅ Listing #${listingID} sold to ${buyerLc}`)
    } catch (err) {
      console.error('Finalize error:', err)
      alert(err.error?.data?.message || err.message)
    } finally {
      setBusyMap(m => {
        const next = { ...m }
        delete next[docId]
        return next
      })
    }
  }

  if (!account || !lender) {
    return (
      <p className="p-6 text-center text-gray-500">
        🔄 Checking your role…
      </p>
    )
  }

  if (!isLender) {
    return (
      <p className="p-6 text-center text-red-600">
        🚫 You are not the lender.
      </p>
    )
  }

  if (!listings.length) {
    return (
      <p className="p-6 text-center text-gray-500">
        No listings awaiting lender approval.
      </p>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-3xl font-bold text-center">💼 Lender Panel</h2>

      {listings.map(l => {
        const busy = !!busyMap[l.id]
        return (
          <div
            key={l.id}
            className="flex flex-col md:flex-row bg-white rounded-lg shadow overflow-hidden"
          >
            {/* Property Details */}
            <div className="flex-1 p-6 space-y-2">
              <h3 className="text-2xl font-semibold">
                #{l.listingID} – {l.title}
              </h3>
              <p className="text-gray-600">{l.address}</p>

              <div className="flex flex-wrap gap-4 text-gray-600 text-sm">
                <span className="flex items-center space-x-1">
                  <FaRulerCombined /><span>{l.area} sqft</span>
                </span>
                <span className="flex items-center space-x-1">
                  <FaBed /><span>{l.bedrooms} bd</span>
                </span>
                <span className="flex items-center space-x-1">
                  <FaBath /><span>{l.bathrooms} ba</span>
                </span>
              </div>

              <p className="text-gray-700 mt-2">{l.description}</p>

              <div className="flex flex-wrap gap-6 text-gray-600 text-sm mt-3">
                <div>
                  <strong>Owner:</strong> {l.owner}
                </div>
                <div>
                  <strong>Buyer:</strong> {l.buyer || '–'}
                </div>
                <div>
                  <strong>Price:</strong> {l.price} ETH
                </div>
                <div>
                  <strong>Status:</strong> {l.status.replace(/_/g, ' ')}
                </div>
              </div>
            </div>

            {/* Approve & Finalize Button */}
            <div className="flex items-center justify-center p-6">
              <button
                onClick={() => handleApproveAndFinalize(l)}
                disabled={busy}
                className={`px-6 py-2 rounded-full text-white font-medium ${
                  busy
                    ? 'bg-gray-400'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {busy ? '⏳ Processing…' : '✅ Approve & Finalize'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}