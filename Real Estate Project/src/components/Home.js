// src/components/Home.js
import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function Home({ onSelect, searchQuery = '' }) {
  const [listings, setListings] = useState([]);

  // Subscribe to all VERIFIED listings
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'listings'), snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const verified = docs.filter(l => l.status === 'VERIFIED');
      setListings(verified);
    });
    return () => unsub();
  }, []);

  // Apply search filter
  const filtered = searchQuery
    ? listings.filter(l => {
        const q = searchQuery.toLowerCase().trim();
        return (
          l.listingID.toString() === q ||
          l.title.toLowerCase().includes(q) ||
          l.address.toLowerCase().includes(q)
        );
      })
    : listings;

  if (filtered.length === 0) {
    return (
      <p className="text-gray-600">
        {searchQuery ? `No results for "${searchQuery}"` : 'No properties available.'}
      </p>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map(l => {
        const isReserved = Boolean(l.buyer);
        return (
          <div
            key={l.id}
            className="relative cursor-pointer overflow-hidden rounded-lg shadow hover:shadow-lg transition"
            onClick={() => !isReserved && onSelect(l)}
          >
            <img
              src={l.tokenURI}
              alt={l.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4 bg-white">
              <h3 className="text-lg font-semibold">{l.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{l.address}</p>
              <div className="flex justify-between items-center">
                <span className="text-green-700 font-bold">{l.price} ETH</span>
                <span className="text-xs text-gray-500">ID: {l.listingID}</span>
              </div>
            </div>

            {isReserved && (
              <div className="absolute inset-0 bg-yellow-200 bg-opacity-80 flex items-center justify-center text-xl font-bold">
                Reserved
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}