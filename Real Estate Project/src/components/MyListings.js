// src/components/MyListings.js

import React, { useState, useEffect } from 'react'
import { db } from '../firebase'
import {
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore'
import { Link } from 'react-router-dom'

export default function MyListings({ account }) {
  const [myProps, setMyProps] = useState([])

  useEffect(() => {
    if (!account) return
    const q = query(
      collection(db, 'listings'),
      where('owner', '==', account.toLowerCase())
    )
    const unsub = onSnapshot(q, snap =>
      setMyProps(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return unsub
  }, [account])

  return (
    <main className="px-6 py-8 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">My Listings</h2>
      {myProps.length === 0 && (
        <p className="text-gray-500 text-center">
          You have no active listings.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {myProps.map(l => (
          <Link
            key={l.id}
            to={`/property/${l.listingID}`}
            className="block border rounded overflow-hidden hover:shadow-lg transition p-4"
          >
            <h3 className="text-xl font-semibold">#{l.listingID} – {l.title}</h3>
            <p className="text-gray-600">Status: {l.status}</p>
            <p className="mt-2 text-lg font-bold">{l.price} ETH</p>
          </Link>
        ))}
      </div>
    </main>
  )
}