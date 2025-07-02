// src/components/PropertyDetail.js

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
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

export default function PropertyDetail({ escrow, account }) {
  const { listingID } = useParams()
  const [listing, setListing] = useState(null)
  const [busy, setBusy] = useState(false)

  // Fetch listing by listingID from Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'listings'),
      where('listingID', '==', listingID)
    )
    const unsub = onSnapshot(q, snap => {
      if (snap.docs.length > 0) {
        setListing({ id: snap.docs[0].id, ...snap.docs[0].data() })
      }
    })
    return unsub
  }, [listingID])

  const handleBuy = async () => {
    if (!escrow || !account || !listing) {
      return alert('⚠️ Wallet or contract not ready.')
    }

    setBusy(true)
    try {
      const value = ethers.utils.parseEther(listing.price.toString())
      const tx = await escrow
        .connect(escrow.signer)
        .depositEarnest(listingID, { value })
      await tx.wait()

      await updateDoc(doc(db, 'listings', listing.id), {
        status: 'EARNEST_PAID'
      })

      alert('✅ You have deposited earnest. Await lender approval.')
    } catch (err) {
      console.error('Purchase failed', err)
      alert(err.error?.data?.message || err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!listing) {
    return (
      <div className="p-6 text-center text-gray-600">
        Loading property…
      </div>
    )
  }

  const isOwner =
    account && listing.owner?.toLowerCase() === account.toLowerCase()

  return (
    <main className="px-6 py-8 max-w-3xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold">{listing.title}</h2>
      <p className="text-gray-600">{listing.address}</p>

      <div className="h-60 bg-gray-200 flex items-center justify-center">
        <span className="text-gray-500">Image Preview</span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-lg">
        <div>
          <strong>Area:</strong> {listing.area} sq ft
        </div>
        <div>
          <strong>Price:</strong> {listing.price} ETH
        </div>
        <div>
          <strong>Bedrooms:</strong> {listing.bedrooms}
        </div>
        <div>
          <strong>Bathrooms:</strong> {listing.bathrooms}
        </div>
      </div>

      <div>
        <h3 className="font-semibold">Description</h3>
        <p className="text-gray-700 mt-1">{listing.description}</p>
      </div>

      <div className="pt-4 border-t">
        {isOwner ? (
          <button
            disabled
            className="w-full py-2 bg-gray-400 text-white rounded"
          >
            You listed this property
          </button>
        ) : (
          <button
            onClick={handleBuy}
            disabled={busy}
            className={`w-full py-2 text-white rounded ${
              busy ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {busy ? '⏳ Processing…' : 'Buy Property'}
          </button>
        )}
      </div>
    </main>
  )
}