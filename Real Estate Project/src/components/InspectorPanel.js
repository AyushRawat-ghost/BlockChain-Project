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

  const lc        = s => (s || '').toLowerCase()
  const isInspect = lc(account) === lc(inspector)

  useEffect(() => {
    if (!escrow || !isInspect) return
    const q = query(
      collection(db, 'listings'),
      where('status', 'in', ['PROPOSED', 'PENDING_INSPECTION'])
    )
    return onSnapshot(q, snap =>
      setListings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [escrow, isInspect])

  const setBusy = (id, val) =>
    setBusyMap(m => ({ ...m, [id]: val }))

  const handleApprove = async l => {
    setBusy(l.id, true)
    try {
      // on-chain: mark inspection passed
      const tx = await escrow.connect(escrow.signer).updateInspection(l.listingID, true)
      await tx.wait()
      // off-chain: set PENDING_INSPECTION → VERIFIED
      const nextStatus = l.status === 'PROPOSED' ? 'PENDING_INSPECTION' : 'VERIFIED'
      await updateDoc(doc(db, 'listings', l.id), { status: nextStatus })
    } catch (err) {
      console.error(err)
      alert(err.error?.data?.message || err.message)
    }
    setBusy(l.id, false)
  }

  const handleReject = async l => {
    if (!window.confirm('Reject this property?')) return
    setBusy(l.id, true)
    try {
      // on-chain: mark inspection failed
      await escrow.connect(escrow.signer).updateInspection(l.listingID, false)
      // off-chain: record rejection
      await updateDoc(doc(db, 'listings', l.id), { status: 'REJECTED_INSPECTION' })
    } catch (err) {
      console.error(err)
      alert(err.error?.data?.message || err.message)
    }
    setBusy(l.id, false)
  }

  if (!escrow) {
    return <p className="p-6 text-center text-gray-500">🔌 Connecting…</p>
  }
  if (!isInspect) {
    return <p className="p-6 text-center text-red-600">🚫 Not inspector.</p>
  }
  if (!listings.length) {
    return <p className="p-6 text-center text-gray-500">No listings to inspect.</p>
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-3xl font-bold text-center">🕵️ Inspector Panel</h2>

      {listings.map(l => {
        const busy = !!busyMap[l.id]
        return (
          <div
            key={l.id}
            className="flex flex-col md:flex-row bg-white rounded-lg shadow overflow-hidden"
          >
            {/* Image */}
            <div className="w-full md:w-1/3">
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
              <div className="flex flex-wrap gap-4 text-gray-600 text-sm mt-3">
                <span><strong>Status:</strong> {l.status.replace(/_/g,' ')}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-around p-6 space-x-2">
              <button
                onClick={() => handleApprove(l)}
                disabled={busy}
                className={`px-4 py-2 rounded text-white ${
                  busy
                    ? 'bg-gray-400'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {busy ? '⏳' : 'Approve'}
              </button>
              <button
                onClick={() => handleReject(l)}
                disabled={busy}
                className={`px-4 py-2 rounded text-white ${
                  busy
                    ? 'bg-gray-400'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {busy ? '⏳' : 'Reject'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}