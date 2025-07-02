// src/components/Home.js

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'

export default function Home() {
  const [listings, setListings] = useState([])

  useEffect(() => {
    // Only show properties the inspector has VERIFIED
    const q = query(
      collection(db, 'listings'),
      where('status', '==', 'VERIFIED')
    )
    const unsub = onSnapshot(q, snapshot => {
      const docs = snapshot.docs.map(doc => ({
        id:        doc.id,
        listingID: doc.data().listingID,
        title:     doc.data().title,
        address:   doc.data().address,
        price:     doc.data().price,
        owner:     doc.data().owner
      }))
      setListings(docs)
    })
    return unsub
  }, [])

  return (
    <main className="px-6 py-8 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Available Properties</h2>
      {listings.length === 0 && (
        <p className="text-center text-gray-500">
          No properties verified yet.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map(l => (
          <Link
            key={l.id}
            to={`/property/${l.listingID}`}
            className="block border rounded overflow-hidden hover:shadow-lg transition"
          >
            <div className="h-40 bg-gray-200 flex items-center justify-center">
              {/* Placeholder image */}
              <span className="text-gray-500">Image</span>
            </div>
            <div className="p-4">
              <h3 className="text-xl font-semibold">#{l.listingID} – {l.title}</h3>
              <p className="text-gray-600">{l.address}</p>
              <p className="mt-2 text-lg font-bold">{l.price} ETH</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}