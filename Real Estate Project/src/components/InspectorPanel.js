// src/components/InspectorPanel.js

import React, { useEffect, useState } from 'react'
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

export default function InspectorPanel({ escrow, account, inspector }) {
  const [listings, setListings] = useState([])
  const [busyMap, setBusyMap]   = useState({})

  // check inspector role safely
  const lc        = s => (s || '').toLowerCase()
  const isInspect = lc(account) === lc(inspector)

  // subscribe to PROPOSED & PENDING_INSPECTION
  useEffect(() => {
    if (!escrow || !isInspect) return

    const q = query(
      collection(db, 'listings'),
      where('status', 'in', ['PROPOSED', 'PENDING_INSPECTION'])
    )
    const unsub = onSnapshot(q, snap =>
      setListings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return unsub
  }, [escrow, isInspect])

  const handleInspect = async listing => {
    const { id: docId, listingID, status } = listing
    setBusyMap(m => ({ ...m, [docId]: true }))

    try {
      if (status === 'PROPOSED') {
        // on-chain updateInspection → PENDING_INSPECTION
        const tx = await escrow.connect(escrow.signer).updateInspection(listingID, true)
        await tx.wait()
        await updateDoc(doc(db, 'listings', docId), {
          status: 'PENDING_INSPECTION'
        })
      } else {
        // off-chain only → VERIFIED
        await updateDoc(doc(db, 'listings', docId), {
          status: 'VERIFIED'
        })
      }
    } catch (err) {
      console.error(err)
      alert(err.error?.data?.message || err.message)
    } finally {
      setBusyMap(m => {
        const next = { ...m }
        delete next[docId]
        return next
      })
    }
  }

  if (!escrow) {
    return <p className="p-6 text-center text-gray-500">🔌 Connecting to contract…</p>
  }

  if (!isInspect) {
    return <p className="p-6 text-center text-red-600">🚫 You are not the inspector.</p>
  }

  if (!listings.length) {
    return <p className="p-6 text-center text-gray-500">No listings to inspect.</p>
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-3xl font-bold text-center">🕵️ Inspector Panel</h2>
      {listings.map(l => {
        const busy      = !!busyMap[l.id]
        const isProposed = l.status === 'PROPOSED'
        const btnColor   = busy
          ? 'bg-gray-400'
          : isProposed
          ? 'bg-yellow-600 hover:bg-yellow-700'
          : 'bg-green-600 hover:bg-green-700'
        const btnLabel = busy
          ? '⏳ Processing…'
          : isProposed
          ? '📝 Acknowledge'
          : '✔️ Finalize'

        return (
          <div
            key={l.id}
            className="flex flex-col md:flex-row bg-white rounded-lg shadow overflow-hidden"
          >
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

              <div className="flex flex-wrap gap-4 text-gray-600 text-sm mt-3">
                <span>
                  <strong>Owner:</strong> {l.owner}
                </span>
                <span>
                  <strong>Buyer:</strong> {l.buyer || '–'}
                </span>
                <span>
                  <strong>Price:</strong> {l.price} ETH
                </span>
                <span>
                  <strong>Status:</strong> {l.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex items-center justify-center p-6">
              <button
                onClick={() => handleInspect(l)}
                disabled={busy}
                className={`px-6 py-2 text-white font-medium rounded ${btnColor}`}
              >
                {btnLabel}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}