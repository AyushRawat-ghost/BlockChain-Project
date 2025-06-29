import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  serverTimestamp // For consistent timestamps
} from 'firebase/firestore';

// Components
import Navigation from './components/Navigation';
import Search from './components/Search'; // Assuming you have a Search component, keep it
import Home from './components/Home';     // Keep the Home component for individual property view

// ABIs - Ensure these JSON files are in your project
import RealEstate from './abis/RealEstate.json'
import Escrow from './abis/Escrow.json'

// Config - Ensure this JSON file is in your project with network addresses
import config from './config.json';

// Global variables provided by the Canvas environment (handle safely for local dev)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  // Your specific Firebase project configuration
  apiKey: "AIzaSyBFTBjHUsnr-FXn6ObX7LaPV3e8UNhxDFM",
  authDomain: "real-estate-94f69.firebaseapp.com",
  projectId: "real-estate-94f69",
  storageBucket: "real-estate-94f69.firebasestorage.app",
  messagingSenderId: "502462149190",
  appId: "1:502462149190:web:88972ff1e5067ab4f19047",
  measurementId: "G-87BNBJ7T5P"
};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

function App() {
  // --- Blockchain-related states ---
  const [provider, setProvider] = useState(null);
  const [escrow, setEscrow] = useState(null);
  const [account, setAccount] = useState(null);
  const [homes, setHomes] = useState([]); // Combined blockchain + Firestore data for display
  const [home, setHome] = useState({});   // Selected home for detailed view in Home component
  const [toggle, setToggle] = useState(false); // Toggle for Home component popup

  // --- Firebase-related states ---
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null); // Firebase Auth UID for current user
  const [isAuthReady, setIsAuthReady] = useState(false); // Tracks if Firebase Auth is initialized

  // --- States for the Property Management Form (Off-chain details) ---
  const [propertyName, setPropertyName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyDescription, setPropertyDescription] = useState('');
  const [propertyBedrooms, setPropertyBedrooms] = useState('');
  const [propertyBathrooms, setPropertyBathrooms] = useState('');
  const [propertySqFt, setPropertySqFt] = useState('');
  const [propertyYearBuilt, setPropertyYearBuilt] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' }); // For form success/error messages
  const [editingPropertyId, setEditingPropertyId] = useState(null); // Firestore Doc ID of property being edited
  const [showPropertyForm, setShowPropertyForm] = useState(false); // Controls visibility of the property form

  // --- Firebase Initialization and Authentication (Runs once on component mount) ---
  useEffect(() => {
    const initFirebase = async () => {
      try {
        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const authInstance = getAuth(app);
        setDb(firestore);
        setAuth(authInstance);

        // Sign in with custom token if available (Canvas environment) or anonymously
        if (initialAuthToken) {
          await signInWithCustomToken(authInstance, initialAuthToken);
        } else {
          await signInAnonymously(authInstance);
        }

        // Listen for Firebase Auth state changes to get the user ID
        onAuthStateChanged(authInstance, (user) => {
          if (user) {
            setUserId(user.uid);
            console.log("Firebase User ID:", user.uid);
          } else {
            setUserId(null);
            console.log("Firebase: No user signed in.");
          }
          setIsAuthReady(true); // Firebase Auth state has been checked
        });

      } catch (error) {
        console.error("Firebase initialization or authentication error:", error);
        setMessage({ text: `Firebase Auth Error: ${error.message}`, type: 'error' });
      }
    };

    // Only initialize Firebase if configuration is valid
    if (Object.keys(firebaseConfig).length > 0 && firebaseConfig.apiKey) {
      initFirebase();
    } else {
      console.warn("Firebase config is empty or invalid. Skipping Firebase initialization. Check your App.js firebaseConfig.");
      setIsAuthReady(true); // Mark ready to avoid blocking blockchain data if Firebase isn't critical path
    }
  }, []); // Empty dependency array ensures this runs only once

  // --- Load Blockchain Data and Combine with Firestore Data (Runs when Firebase & MetaMask are ready) ---
  const loadBlockchainData = async () => {
    // Check if MetaMask or a similar Web3 provider is available
    if (!window.ethereum) {
      console.error("MetaMask or similar Web3 provider not detected. Please install it.");
      setMessage({ text: "Please install MetaMask or a compatible wallet to use this DApp.", type: 'error' });
      return;
    }
    // Ensure Firestore (db) and Firebase Auth (isAuthReady) are initialized and ready
    if (!db || !isAuthReady) {
      console.log("Firestore or Auth not ready, delaying loadBlockchainData...");
      return;
    }

    try {
      const providerInstance = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(providerInstance);

      // Request user's accounts to establish connection
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const currentAccount = ethers.utils.getAddress(accounts[0]); // Normalize address
      setAccount(currentAccount);

      const network = await providerInstance.getNetwork(); // Get current network info

      // Check if your contracts are configured for the current network
      if (!config[network.chainId]) {
        console.error(`ERROR: No contract configuration found for chain ID: ${network.chainId}.`);
        setMessage({ text: `Unsupported network. Please switch to a network with deployed contracts (e.g., Sepolia, Hardhat local) and update config.json. Current Chain ID: ${network.chainId}`, type: 'error' });
        return;
      }

      const realEstateAddress = config[network.chainId].realEstate.address;
      const escrowAddress = config[network.chainId].escrow.address;

      // Instantiate contract objects
      const realEstate = new ethers.Contract(realEstateAddress, RealEstate.abi, providerInstance);
      const escrowInstance = new ethers.Contract(escrowAddress, Escrow.abi, providerInstance);
      setEscrow(escrowInstance);

      // --- Real-time Firestore Listener for Property Details ---
      // This listener fetches off-chain property data and merges it with on-chain NFT data.
      const propertiesCollectionRef = collection(db, `artifacts/${appId}/public/data/properties`);
      const q = query(propertiesCollectionRef, orderBy("timestamp", "desc")); // Order by timestamp for display

      const unsubscribeFirestore = onSnapshot(q, async (snapshot) => {
        const firestoreProperties = {};
        snapshot.forEach(doc => {
          const data = doc.data();
          // Store Firestore data using `nftId` as key, and also keep `firestoreDocId`
          firestoreProperties[data.nftId] = { ...data, firestoreDocId: doc.id };
        });
        console.log("Fetched Real-time Firestore Properties:", firestoreProperties);

        // --- Fetch On-chain NFT Data ---
        const totalSupply = await realEstate.totalSupply();
        const combinedHomes = [];

        for (let i = 1; i <= totalSupply; i++) {
          const uri = await realEstate.tokenURI(i);
          const onChainMetadata = { id: i }; // Basic metadata from blockchain (NFT ID)

          // Fetch IPFS metadata (image, attributes like price)
          if (uri && (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('ipfs://'))) {
              let fetchUri = uri;
              if (uri.startsWith('ipfs://')) {
                  fetchUri = `https://ipfs.io/ipfs/${uri.substring(7)}`; // Use public IPFS gateway
              }
              try {
                  const response = await fetch(fetchUri);
                  if (response.ok) {
                      const metadata = await response.json();
                      Object.assign(onChainMetadata, metadata); // Merge IPFS metadata
                  } else {
                      console.warn(`Failed to fetch metadata for token ID ${i} from ${fetchUri}: ${response.status} ${response.statusText}`);
                  }
              } catch (fetchError) {
                  console.warn(`Error fetching metadata for token ID ${i} from ${fetchUri}:`, fetchError);
              }
          } else {
              console.warn(`Invalid URI format for token ID ${i}: ${uri}`);
          }

          // Combine on-chain metadata with off-chain Firestore data
          const firestoreData = firestoreProperties[onChainMetadata.id.toString()] || {};
          
          const combinedHome = {
            ...onChainMetadata, 
            ...firestoreData,   // Firestore data (name, address, description, etc.) overrides/enhances IPFS data
            id: i, // Ensure blockchain NFT ID is consistent
            contractAddress: realEstateAddress 
          };

          combinedHomes.push(combinedHome);
        }
        setHomes(combinedHomes); 
        console.log("Combined Homes data loaded:", combinedHomes);
      }, (error) => {
        console.error("Error fetching Firestore properties in real-time:", error);
        setMessage({ text: `Error loading properties: ${error.message}`, type: 'error' });
      });

      // --- Event Listeners for MetaMask Account/Network Changes ---
      window.ethereum.on('accountsChanged', async (newAccounts) => {
        if (newAccounts.length > 0) {
          const newAccount = ethers.utils.getAddress(newAccounts[0]);
          setAccount(newAccount);
          loadBlockchainData(); // Re-load data on account change
        } else {
          // If no accounts are connected (e.g., user disconnected)
          setAccount(null);
          setProvider(null);
          setEscrow(null);
          setHomes([]);
          setMessage({ text: "Wallet disconnected. Please connect to continue.", type: 'warning' });
        }
      });

      window.ethereum.on('chainChanged', (chainId) => {
        console.log("Network changed to chain ID:", chainId, ". Reloading page...");
        window.location.reload(); // Reload page on network change for full re-initialization
      });

      return () => unsubscribeFirestore(); // Cleanup Firestore snapshot listener on unmount
    } catch (error) {
      console.error("Critical Error in loadBlockchainData:", error);
      // Detailed error logging for debugging
      if (error.message) console.error("Error message:", error.message);
      if (error.code) console.error("Error code:", error.code);
      if (error.data) console.error("Error data:", error.data);
      setMessage({ text: `Blockchain Load Error: ${error.reason || error.message || "Unknown error"}`, type: 'error' });
    }
  };

  // Call `loadBlockchainData` when Firebase is ready AND `window.ethereum` is detected
  useEffect(() => {
    // Only proceed if Firebase is ready and Ethereum provider is detected
    if (db && isAuthReady && window.ethereum) { 
      loadBlockchainData();
    }
  }, [db, isAuthReady, window.ethereum]); 

  // --- Toggle for the Home property detail popup ---
  const togglePop = (home) => {
    setHome(home);
    setToggle(!toggle);
  };

  // --- Property Form Management (Clear, Add/Update) ---
  const clearForm = () => {
    setPropertyName('');
    setPropertyAddress('');
    setPropertyDescription('');
    setPropertyBedrooms('');
    setPropertyBathrooms('');
    setPropertySqFt('');
    setPropertyYearBuilt('');
    setPropertyType('');
    setEditingPropertyId(null); // Clear editing state
    setMessage({ text: '', type: '' }); // Clear messages
    setShowPropertyForm(false); // Hide the form after clearing/cancelling
  };

  const handleAddOrUpdateProperty = async () => {
    // Basic form validation
    if (!propertyName.trim() || !propertyAddress.trim() || !propertyDescription.trim()) {
      setMessage({ text: "Please fill in all mandatory fields (Name, Address, Description).", type: 'error' });
      return;
    }

    // Wallet and contract checks
    if (!account) {
      setMessage({ text: "Please connect your wallet to add/update properties.", type: 'error' });
      return;
    }
    if (!escrow) {
      setMessage({ text: "Escrow contract not loaded. Please ensure blockchain connection.", type: 'error' });
      return;
    }
    if (!provider) {
        setMessage({ text: "Ethereum provider not initialized.", type: 'error' });
        return;
    }

    try {
      // Data object for Firestore
      const propertyData = {
        name: propertyName.trim(),
        address: propertyAddress.trim(),
        description: propertyDescription.trim(),
        bedrooms: propertyBedrooms ? Number(propertyBedrooms) : null,
        bathrooms: propertyBathrooms ? Number(propertyBathrooms) : null,
        squareFootage: propertySqFt ? Number(propertySqFt) : null,
        yearBuilt: propertyYearBuilt ? Number(propertyYearBuilt) : null,
        propertyType: propertyType.trim(),
        ownerFirebaseUid: userId, // Link to Firebase authenticated user
        currentListingStatus: "PROPOSED", // Initial status (will be updated by on-chain events)
        timestamp: editingPropertyId ? (homes.find(p => p.firestoreDocId === editingPropertyId)?.timestamp || serverTimestamp()) : serverTimestamp(), 
        lastUpdatedAt: serverTimestamp() 
      };

      if (editingPropertyId) {
        // --- UPDATE EXISTING PROPERTY DETAILS IN FIRESTORE ---
        const propertyDocRef = doc(db, `artifacts/${appId}/public/data/properties`, editingPropertyId);
        await updateDoc(propertyDocRef, propertyData);
        setMessage({ text: "Property details updated successfully (off-chain)!", type: 'success' });
      } else {
        // --- PROPOSE NEW PROPERTY (ON-CHAIN & OFF-CHAIN) ---
        // 1. Propose listing on the blockchain to get an NFT ID
        // In a real application, TOKEN_URI and PURCHASE_PRICE would come from user inputs
        // or a process involving IPFS upload for the metadata.
        const DUMMY_TOKEN_URI = `https://ipfs.io/ipfs/Qmabcdefg` + Math.random().toString(36).substring(2, 7); // Generates a unique dummy URI
        const DUMMY_PURCHASE_PRICE = ethers.utils.parseEther("100"); // Example: 100 ETH

        const signer = provider.getSigner(); // Get the signer for the transaction
        
        // Call `proposeListing` on your Escrow contract
        const proposeTx = await escrow.connect(signer).proposeListing(DUMMY_TOKEN_URI, DUMMY_PURCHASE_PRICE);
        const receipt = await proposeTx.wait(); // Wait for the transaction to be mined
        
        // Extract the `listingID` (which will be the NFT ID) from the emitted event
        const event = receipt.events?.find(e => e.event === 'ProposedListing');
        if (!event) {
          throw new Error("ProposedListing event not found in transaction receipt. Check Escrow.sol events.");
        }
        const newListingID = event.args.listingID;
        console.log("New NFT ID from blockchain (proposed listing):", newListingID.toString());

        // 2. Add property details to Firestore, using the new NFT ID as the Firestore document ID
        // This links the off-chain data directly to the on-chain NFT.
        const propertyDocRef = doc(db, `artifacts/${appId}/public/data/properties`, newListingID.toString());
        await setDoc(propertyDocRef, { 
            ...propertyData, 
            nftId: newListingID.toString(), // Store the NFT ID from blockchain
            // Include dummy IPFS-like data for initial display if not yet minted/verified
            image: "https://placehold.co/400x300/cccccc/333333?text=Proposed", 
            attributes: [{ trait_type: "Price", value: DUMMY_PURCHASE_PRICE.toString() }]
        });
        
        console.log(`Firestore document created for NFT ID: ${newListingID.toString()}`);
        setMessage({ text: "Property proposed on-chain and details saved off-chain successfully!", type: 'success' });
      }
      clearForm(); // Clear form and hide it after success
    } catch (e) {
      console.error("Error during property add/update or blockchain transaction:", e);
      // More user-friendly error messages for common blockchain issues
      if (e.code === 4001) { // User rejected transaction
        setMessage({ text: "Transaction rejected by user in MetaMask.", type: 'error' });
      } else if (e.message && (e.message.includes("network_error") || e.code === "NETWORK_ERROR")) {
        setMessage({ text: "Network error: Check your MetaMask connection and network.", type: 'error' });
      } else if (e.reason) { // Ethers.js provides `e.reason` for revert messages
        setMessage({ text: `Transaction failed: ${e.reason}`, type: 'error' });
      } else {
        setMessage({ text: `An unexpected error occurred: ${e.message || e.toString()}`, type: 'error' });
      }
    }
  };

  // --- Edit Property (Populates form for editing) ---
  const handleEdit = (homeToEdit) => { 
    setShowPropertyForm(true); // Show the form
    setEditingPropertyId(homeToEdit.firestoreDocId); // Set ID for update
    // Populate form fields with existing data
    setPropertyName(homeToEdit.name || '');
    setPropertyAddress(homeToEdit.address || '');
    setPropertyDescription(homeToEdit.description || '');
    setPropertyBedrooms(homeToEdit.bedrooms || '');
    setPropertyBathrooms(homeToEdit.bathrooms || '');
    setPropertySqFt(homeToEdit.squareFootage || '');
    setPropertyYearBuilt(homeToEdit.yearBuilt || '');
    setPropertyType(homeToEdit.propertyType || '');
    setMessage({ text: '', type: '' }); // Clear old messages
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top to see form
  };

  // --- Delete Property (Firestore only for now) ---
  const handleDelete = async (firestoreDocId) => { 
    if (!window.confirm("Are you sure you want to delete this property? This will only remove it from the database, not un-mint the NFT if it's already on-chain.")) {
      return;
    }
    // IMPORTANT: In a production dApp, if the NFT is already minted, you would first
    // implement on-chain cancellation/burning logic in your smart contract,
    // and then update/delete the Firestore entry after a successful on-chain transaction.
    // For this example, we are just deleting the Firestore entry directly.

    try {
      const propertyDocRef = doc(db, `artifacts/${appId}/public/data/properties`, firestoreDocId);
      await deleteDoc(propertyDocRef);
      setMessage({ text: "Property deleted successfully from database!", type: 'success' });
    } catch (e) {
      console.error("Error deleting property:", e);
      setMessage({ text: `Error deleting property: ${e.message}`, type: 'error' });
    }
  };

  // --- Helper for Message Box Styling ---
  const getMessageBoxClass = (type) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      {/* Display Firebase User ID (useful for debugging multi-user scenarios) */}
      {userId && (
        <div className="p-2 bg-gray-800 text-white text-xs text-center font-mono">
          Firebase User ID: {userId}
        </div>
      )}
      {/* Display Connected Wallet Address */}
      {account && (
        <div className="p-2 bg-gray-700 text-white text-xs text-center font-mono">
          Wallet: {account.slice(0, 6) + '...' + account.slice(38, 42)}
        </div>
      )}

      {/* Navigation Component: Pass account, setAccount, and the function to show the form */}
      <Navigation 
        account={account} 
        setAccount={setAccount} 
        onSellClick={() => { 
          setShowPropertyForm(true); 
          clearForm(); // Clear form if user clicks "List Property" from fresh
        }} 
      />
      
      {/* Search Component (Placeholder) */}
      <Search />

      <div className='p-8'> {/* Overall padding for the main content area */}
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Homes For You</h3>
        <hr className="mb-6" />

        {/* Authentication Status Display */}
        <div 
          className={`text-center mb-4 p-2 rounded-md ${
            isAuthReady && userId ? 'bg-green-100 text-green-800' : 
            isAuthReady && !userId ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
          }`}
        >
          {isAuthReady && userId ? 'Firebase: Signed in' : 
           isAuthReady && !userId ? 'Firebase: Not signed in, attempting anonymous...' :
           'Firebase: Initializing...'
          }
        </div>

        {/* Message Box for Success/Error/Warning */}
        {message.text && (
          <div className={`mt-4 p-3 rounded-md text-center ${getMessageBoxClass(message.type)}`}>
            {message.text}
          </div>
        )}

        {/* Property Input/Edit Form - Conditionally Rendered */}
        {showPropertyForm && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">{editingPropertyId ? 'Edit Property Details (Off-chain)' : 'Propose New Property (On-chain & Off-chain)'}</h2>
              <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Property Name" 
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Property Address" 
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                  />
                  <textarea 
                    placeholder="Description" 
                    rows="3" 
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={propertyDescription}
                    onChange={(e) => setPropertyDescription(e.target.value)}
                  ></textarea>
                  <input 
                    type="number" 
                    placeholder="Bedrooms" 
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={propertyBedrooms}
                    onChange={(e) => setPropertyBedrooms(e.target.value)}
                  />
                  <input 
                    type="number" 
                    placeholder="Bathrooms" 
                    step="0.5"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={propertyBathrooms}
                    onChange={(e) => setPropertyBathrooms(e.target.value)}
                  />
                  <input 
                    type="number" 
                    placeholder="Square Footage" 
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={propertySqFt}
                    onChange={(e) => setPropertySqFt(e.target.value)}
                  />
                  <input 
                    type="number" 
                    placeholder="Year Built" 
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={propertyYearBuilt}
                    onChange={(e) => setPropertyYearBuilt(e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Property Type (e.g., House, Condo)" 
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                  />
                  
                  <button 
                    onClick={handleAddOrUpdateProperty} 
                    className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition duration-300"
                  >
                    {editingPropertyId ? 'Update Property Details' : 'Propose New Property (On-chain & Off-chain)'}
                  </button>
                  <button 
                    onClick={clearForm} // This also hides the form
                    className="w-full bg-gray-400 text-white p-3 rounded-md hover:bg-gray-500 transition duration-300 mt-2"
                  >
                    Cancel
                  </button>
              </div>
          </div>
        )}

        {/* Properties List Display */}
        <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">Available Properties:</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'> {/* Responsive grid */}
          {homes.length > 0 ? (
            homes.map((home, index) => (
              <div className='card bg-white rounded-lg shadow-md overflow-hidden cursor-pointer' key={index} onClick={() => togglePop(home)}>
                <div className='card__image h-48 w-full object-cover'>
                  {/* Display property image (from IPFS metadata or placeholder) */}
                  <img src={home.image || 'https://placehold.co/400x300/cccccc/333333?text=No+Image'} alt="Home" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300/cccccc/333333?text=Error+Loading'; }} />
                </div>
                <div className='card__info p-4'>
                  {/* Property Name (from Firestore) */}
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{home.name || 'Property Name N/A'}</h3>
                  {/* Property Address (from Firestore) */}
                  <p className="text-gray-600 text-sm mb-2">{home.address || 'Address not available'}</p>
                  
                  {/* Price (from IPFS metadata's attributes) */}
                  <h4 className="text-xl font-bold text-blue-700 mb-2">
                    {home.attributes && home.attributes[0] ? ethers.utils.formatUnits(home.attributes[0].value, 'ether') : 'N/A'} ETH
                  </h4>

                  {/* Detailed features (from Firestore and IPFS metadata) */}
                  <p className="text-gray-700 text-sm">
                    <strong>{home.bedrooms || 'N/A'}</strong> bds |
                    <strong>{home.bathrooms || 'N/A'}</strong> ba |
                    <strong>{home.squareFootage || 'N/A'}</strong> sqft
                  </p>
                  <p className="text-gray-700 text-sm">Type: {home.propertyType || 'N/A'}</p>
                  <p className="text-gray-700 text-sm">Year Built: {home.yearBuilt || 'N/A'}</p>
                  <p className="text-gray-500 text-xs mt-2">Status: {home.currentListingStatus || 'N/A'}</p>
                  <p className="text-gray-500 text-xs">NFT ID: {home.id || 'N/A'}</p>
                  <p className="text-gray-500 text-xs">Firebase Doc ID: {home.firestoreDocId || 'N/A'}</p> 

                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEdit(home); }} // Stop propagation to prevent pop-up
                      className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition duration-300 text-sm flex-1"
                    >
                      Edit Details
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(home.firestoreDocId); }} // Use Firestore Doc ID for deletion
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300 text-sm flex-1"
                    >
                      Delete Property
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center w-full text-gray-600 col-span-full">
              {account ? 'Loading homes or no homes available. Click "List Property" to propose one!' : 'Connect your wallet to see and add properties!'}
              {!window.ethereum && <p className="text-red-500 mt-2">Please install MetaMask to interact with this application.</p>}
            </p>
          )}
        </div>
      </div>

      {toggle && (
        <Home
          home={home}
          provider={provider}
          account={account}
          escrow={escrow}
          togglePop={togglePop}
          loadBlockchainData={loadBlockchainData} // Pass this to Home for refreshing data after transactions
        />
      )}
    </div>
  );
}

export default App;
