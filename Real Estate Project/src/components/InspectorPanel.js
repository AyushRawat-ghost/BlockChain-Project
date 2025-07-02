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

export default function InspectorPanel({ escrow, account, inspector }) {
  const [listings, setListings] = useState([])
  const [busyMap, setBusyMap]   = useState({})

  const isInspector =
    inspector &&
    account &&
    inspector.toLowerCase() === account.toLowerCase()

  // Subscribe to PROPOSED & PENDING_INSPECTION docs
  useEffect(() => {
    if (!escrow || !isInspector) return

    const q = query(
      collection(db, 'listings'),
      where('status', 'in', ['PROPOSED', 'PENDING_INSPECTION'])
    )
    const unsub = onSnapshot(q, snap =>
      setListings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return unsub
  }, [escrow, isInspector])

  const handleInspect = async listing => {
    const { id: docId, listingID, status } = listing
    setBusyMap(m => ({ ...m, [docId]: true }))

    try {
      if (status === 'PROPOSED') {
        // STEP 1: on-chain updateInspection → PENDING_INSPECTION
        const tx = await escrow
          .connect(escrow.signer)
          .updateInspection(listingID, true)
        await tx.wait()

        await updateDoc(doc(db, 'listings', docId), {
          status: 'PENDING_INSPECTION'
        })
        console.log(`🔄 #${listingID} → PENDING_INSPECTION`)
      } else {
        // STEP 2: just mark as VERIFIED off-chain
        await updateDoc(doc(db, 'listings', docId), {
          status: 'VERIFIED'
        })
        console.log(`✅ #${listingID} → VERIFIED`)
      }
    } catch (err) {
      console.error('Inspection error:', err)
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
    return (
      <p className="p-6 text-center text-gray-500">
        🔌 Connecting to contract…
      </p>
    )
  }

  if (!isInspector) {
    return (
      <p className="p-6 text-center text-red-600">
        🚫 You are not authorized (Inspector only).
      </p>
    )
  }

  if (listings.length === 0) {
    return (
      <p className="p-6 text-center text-gray-500">
        No listings pending inspection.
      </p>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow space-y-4">
      <h2 className="text-2xl font-bold text-center">🕵️ Inspector Panel</h2>

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
          ? '📝 Acknowledge Listing'
          : '✔️ Finalize Verification'

        return (
          <div
            key={l.id}
            className="flex justify-between items-center p-4 border rounded"
          >
            <div>
              <p className="font-semibold">
                #{l.listingID} – {l.title}
              </p>
              <p className="text-sm text-gray-600">Status: {l.status}</p>
            </div>
            <button
              disabled={busy}
              onClick={() => handleInspect(l)}
              className={`px-4 py-2 rounded text-white ${btnColor}`}
            >
              {btnLabel}
            </button>
          </div>
        )
      })}
    </div>
  )
}