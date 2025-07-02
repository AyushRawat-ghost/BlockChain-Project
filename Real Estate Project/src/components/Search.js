// src/components/Search.js

import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../firebase'
import { collection, onSnapshot } from 'firebase/firestore'

export default function Search() {
  const [listings, setListings] = useState([])
  const [query, setQuery]       = useState('')

  // 1) Subscribe to all listings in Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'listings'),
      snapshot => {
        const docs = snapshot.docs.map(d => ({
          id:        d.id,
          listingID: d.data().listingID,
          title:     d.data().title,
          address:   d.data().address,
          price:     d.data().price,
          status:    d.data().status
        }))
        setListings(docs)
      },
      err => {
        console.error('🚨 Failed to fetch listings:', err)
      }
    )
    return unsub
  }, [])

  // 2) Filter client-side by title or address (case-insensitive)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return listings.filter(
      l =>
        l.title.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q)
    )
  }, [listings, query])

  return (
    <main className="px-6 py-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🔍 Search Properties</h2>

      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by title or address…"
          className="w-full p-3 border rounded shadow-sm focus:outline-none focus:ring"
        />
      </div>

      {query && filtered.length === 0 && (
        <p className="text-center text-gray-500">
          No properties found for “{query}”.
        </p>
      )}

      <ul className="space-y-4">
        {filtered.map(l => (
          <li
            key={l.id}
            className="flex justify-between items-center p-4 border rounded hover:shadow"
          >
            <div>
              <Link
                to={`/property/${l.listingID}`}
                className="text-lg font-semibold text-blue-600 hover:underline"
              >
                #{l.listingID} – {l.title}
              </Link>
              <p className="text-sm text-gray-600">{l.address}</p>
              <p className="text-sm text-gray-600">
                Price: {l.price} ETH · Status: {l.status}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}