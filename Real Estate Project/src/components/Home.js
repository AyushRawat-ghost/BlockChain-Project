// src/components/Home.js

import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { db } from '../firebase'
import {
  collection,
  onSnapshot,
  updateDoc,
  doc
} from 'firebase/firestore'
import { Link } from 'react-router-dom'

export default function Home({ escrow, account }) {
  const [listings, setListings] = useState([])
  const [busyMap, setBusyMap]   = useState({})

  // load all listings
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'listings'),
      snap =>
        setListings(
          snap.docs.map(d => ({ id: d.id, ...d.data() }))
        ),
      err => console.error(err)
    )
    return unsub
  }, [])

  // deposit earnest and mark reserved
  const handleReserve = async listing => {
    const { id: docId, listingID, price } = listing
    if (!escrow || !account) return

    setBusyMap(m => ({ ...m, [docId]: true }))
    try {
      const value = ethers.utils.parseEther(price.toString())
      const tx = await escrow
        .connect(escrow.signer)
        .depositEarnest(listingID, { value })
      await tx.wait()

      // off-chain state
      await updateDoc(doc(db, 'listings', docId), {
        status: 'EARNEST_PAID',
        buyer:  account.toLowerCase()
      })
    } catch (err) {
      console.error(err)
      alert(err.error?.data?.message || err.message)
    } finally {
      setBusyMap(m => {
        const nxt = { ...m }
        delete nxt[docId]
        return nxt
      })
    }
  }

  // filter out sold
  const available = listings.filter(l => l.status !== 'SOLD')

  if (!available.length) {
    return (
      <div className="p-6 text-center text-gray-500">
        No properties available right now.
      </div>
    )
  }

  return (
    <main className="px-6 py-8 max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center">
        Available Properties
      </h1>

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {available.map(l => {
          const busy   = !!busyMap[l.id]
          const isOwner = l.owner?.toLowerCase() === account?.toLowerCase()
          const isBuyer = l.buyer?.toLowerCase() === account?.toLowerCase()

          return (
            <div
              key={l.id}
              className="bg-white rounded-lg shadow hover:shadow-lg overflow-hidden flex flex-col"
            >
              <Link to={`/property/${l.listingID}`} className="flex-1">
                <div className="h-40 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">Image</span>
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-1">
                    {l.title}
                  </h2>
                  <p className="text-gray-600 mb-2">
                    {l.address}
                  </p>
                  <p className="text-gray-700 mb-3">
                    {l.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">
                      {l.price} ETH
                    </span>
                    <span className="text-sm text-gray-500">
                      {l.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </Link>

              {/* Action */}
              <div className="p-4">
                {l.status === 'VERIFIED' && !isOwner && (
                  <button
                    onClick={() => handleReserve(l)}
                    disabled={busy}
                    className={`w-full py-2 text-white rounded ${
                      busy
                        ? 'bg-gray-400'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {busy ? '⏳ Reserving…' : 'Buy Property'}
                  </button>
                )}

                {l.status === 'EARNEST_PAID' && (
                  <button
                    disabled
                    className="w-full py-2 bg-yellow-400 text-white rounded cursor-not-allowed"
                  >
                    Reserved
                  </button>
                )}

                {isOwner && (
                  <button
                    disabled
                    className="w-full py-2 bg-gray-500 text-white rounded cursor-not-allowed"
                  >
                    Your Listing
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}