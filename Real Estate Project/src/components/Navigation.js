import React from 'react';

export default function Navigation({
  account,
  onSellClick,
  selectedProperty,
  onBack,
}) {
  const display = account
    ? `${account.slice(0,6)}…${account.slice(-4)}`
    : 'Not connected';

  return (
    <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        {selectedProperty ? (
          <>
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800"
              aria-label="Back"
            >
              ←
            </button>
            <div className="flex flex-col">
              <span className="font-semibold text-lg">
                {selectedProperty.title}
              </span>
              <span className="text-sm text-gray-500">
                {selectedProperty.address}
              </span>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Web3 RealEstate</h1>
            <button
              onClick={onSellClick}
              className="ml-4 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              List Property
            </button>
          </>
        )}
      </div>
      <span className="text-sm text-gray-700">{display}</span>
    </nav>
  );
}