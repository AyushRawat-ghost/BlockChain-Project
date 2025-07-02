// src/components/PropertyDetail.js

import React, { useEffect, useState } from 'react'
import { useParams }               from 'react-router-dom'
import { ethers }                  from 'ethers'
import { db }                      from '../firebase'
import {
  collection,
  onSnapshot,
  updateDoc,
  doc
} from 'firebase/firestore'

export default function PropertyDetail({ escrow, account }) {
  const { listingID } = useParams()
  const [listing, setListing] = useState(null)
  const [status, setStatus]   = useState('loading')
  const [busy, setBusy]       = useState(false)

  useEffect(() => {
    setStatus('loading')
    const unsub = onSnapshot(
      collection(db, 'listings'),
      snap => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        const found = all.find(item => item.listingID?.toString() === listingID)
        if (found) {
          setListing(found)
          setStatus('loaded')
        } else if (snap.docs.length) {
          setStatus('notfound')
        }
      },
      err => {
        console.error(err)
        setStatus('error')
      }
    )
    return unsub
  }, [listingID])

  if (status === 'loading') {
    return <p className="p-6 text-center text-gray-500">Loading property…</p>
  }
  if (status === 'notfound') {
    return <p className="p-6 text-center text-red-600">Property not found.</p>
  }
  if (status === 'error') {
    return <p className="p-6 text-center text-red-600">Error loading property.</p>
  }

  const {
    id: docId,
    title,
    address,
    description,
    area,
    bedrooms,
    bathrooms,
    price,
    owner,
    buyer,
    status: propStatus,
    photoURL
  } = listing

  const lc      = s => (s || '').toLowerCase()
  const isOwner = lc(owner) === lc(account)
  const isBuyer = lc(buyer) === lc(account)

  const handleReserve = async () => {
    setBusy(true)
    try {
      const value = ethers.utils.parseEther(price.toString())
      const tx = await escrow
        .connect(escrow.signer)
        .depositEarnest(parseInt(listingID), { value })
      await tx.wait()
      await updateDoc(doc(db, 'listings', docId), {
        status: 'EARNEST_PAID',
        buyer:  lc(account)
      })
      setListing(prev => ({ ...prev, status: 'EARNEST_PAID', buyer: lc(account) }))
    } catch (err) {
      console.error(err)
      alert(err.error?.data?.message || err.message)
    }
    setBusy(false)
  }

  let actionButton = null
  if (propStatus === 'VERIFIED' && !isOwner) {
    actionButton = (
      <button
        onClick={handleReserve}
        disabled={busy}
        className={`w-full py-2 rounded text-white ${
          busy ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {busy ? '⏳ Reserving…' : 'Buy Property'}
      </button>
    )
  } else if (propStatus === 'EARNEST_PAID') {
    actionButton = (
      <button disabled className="w-full py-2 bg-yellow-400 text-white rounded">
        {isBuyer ? 'You Reserved' : 'Reserved'}
      </button>
    )
  } else if (propStatus === 'SOLD') {
    actionButton = (
      <button disabled className="w-full py-2 bg-gray-500 text-white rounded">
        Sold
      </button>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow space-y-4">
      {/* Image or placeholder */}
      {photoURL ? (
        <img
          src={photoURL}
          alt={title}
          className="w-full h-60 object-cover rounded"
          onError={e => (e.currentTarget.src = '/placeholder.jpg')}
        />
      ) : (
        <div className="w-full h-60 bg-gray-200 rounded flex items-center justify-center">
          <span className="text-gray-500">No Image Available</span>
        </div>
      )}

      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-gray-600">{address}</p>

      <div className="flex flex-wrap gap-6 text-gray-600 text-sm">
        <span>Area: {area} sqft</span>
        <span>Bedrooms: {bedrooms}</span>
        <span>Bathrooms: {bathrooms}</span>
      </div>

      <p className="text-gray-700">{description}</p>

      <div className="text-gray-600 text-sm space-y-1">
        <p>Owner: {owner}</p>
        {buyer && <p>Buyer: {buyer}</p>}
        <p>Price: {price} ETH</p>
        <p>Status: {propStatus.replace(/_/g, ' ')}</p>
      </div>

      <div className="pt-4">{actionButton}</div>
    </div>
  )
}