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
  const lc       = s => (s || '').toLowerCase()
  const isLender = lc(account) === lc(lender)

  const [listings, setListings] = useState([])
  const [busyMap, setBusyMap]   = useState({})

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

  const setBusy = (id, val) =>
    setBusyMap(m => ({ ...m, [id]: val }))

  const handleFinalize = async l => {
    setBusy(l.id, true)
    try {
      const tx = await escrow.connect(escrow.signer).approveSale(l.listingID)
      await tx.wait()
      await updateDoc(doc(db, 'listings', l.id), {
        status: 'SOLD',
        owner:  lc(l.buyer)
      })
      alert(`✅ Listing #${l.listingID} sold.`)
    } catch (err) {
      console.error(err)
      alert(err.error?.data?.message || err.message)
    }
    setBusy(l.id, false)
  }

  const handleReject = async l => {
    if (!window.confirm('Reject and refund buyer’s earnest?')) return
    setBusy(l.id, true)
    try {
      // 1) On-chain: refund earnest deposit to buyer
      //    → You must have implemented this in your contract
      const tx = await escrow.connect(escrow.signer).rejectSale(l.listingID)
      await tx.wait()

      // 2) Off-chain: reset status so it goes back to VERIFIED
      await updateDoc(doc(db, 'listings', l.id), {
        status: 'VERIFIED',
        buyer:  null
      })

      alert(
        `⛔ Listing #${l.listingID} rejected. ` +
        `Earnest refunded to buyer ${l.buyer}.`
      )
    } catch (err) {
      console.error(err)
      alert(err.error?.data?.message || err.message)
    }
    setBusy(l.id, false)
  }

  if (!account || !lender) {
    return (
      <p className="p-6 text-center text-gray-500">🔄 Checking your role…</p>
    )
  }
  if (!isLender) {
    return (
      <p className="p-6 text-center text-red-600">🚫 You are not the lender.</p>
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
            {/* Image or placeholder */}
            <div className="w-full md:w-1/3 flex-shrink-0">
              {l.photoURL ? (
                <img
                  src={l.photoURL}
                  alt={l.title}
                  className="w-full h-40 object-cover"
                  onError={e => (e.currentTarget.src = '/placeholder.jpg')}
                />
              ) : (
                <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">No Image</span>
                </div>
              )}
            </div>

            {/* Details */}
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
                <span><strong>Buyer:</strong> {l.buyer}</span>
                <span><strong>Status:</strong> {l.status.replace(/_/g, ' ')}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-around p-6 space-x-2">
              <button
                onClick={() => handleFinalize(l)}
                disabled={busy}
                className={`px-4 py-2 rounded text-white ${
                  busy ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {busy ? '⏳' : 'Finalize'}
              </button>
              <button
                onClick={() => handleReject(l)}
                disabled={busy}
                className={`px-4 py-2 rounded text-white ${
                  busy ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {busy ? '⏳' : 'Reject & Refund'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}