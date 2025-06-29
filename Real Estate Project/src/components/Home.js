import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

// Assuming you have a close.svg in your assets folder
import close from '../assets/close.svg'; 

const Home = ({ home, provider, account, escrow, togglePop, loadBlockchainData }) => {
    // States to track approval status for different roles
    const [hasBought, setHasBought] = useState(false);
    const [hasLended, setHasLended] = useState(false);
    const [hasInspected, setHasInspected] = useState(false);
    const [hasSold, setHasSold] = useState(false);

    // States to store addresses of key parties for the specific home
    const [buyerAddress, setBuyerAddress] = useState(null);
    const [lenderAddress, setLenderAddress] = useState(null);
    const [inspectorAddress, setInspectorAddress] = useState(null);
    const [sellerAddress, setSellerAddress] = useState(null);
    const [ownerAddress, setOwnerAddress] = useState(null); // The current owner of the NFT

    // --- Helper function to fetch various details from the Escrow contract ---
    const fetchDetails = async () => {
        if (!escrow || !home.id) return; // Ensure contract and home ID are available

        try {
            // Fetch buyer and their approval status
            const currentBuyer = await escrow.buyer(home.id);
            setBuyerAddress(currentBuyer);
            const approvalBuyer = await escrow.approval(home.id, currentBuyer);
            setHasBought(approvalBuyer);

            // Fetch seller (the original lister) and their approval status
            const currentSeller = await escrow.sellers(home.id); // From the new `sellers` mapping
            setSellerAddress(currentSeller);
            const approvalSeller = await escrow.approval(home.id, currentSeller);
            setHasSold(approvalSeller); // Renamed for clarity in Home component

            // Fetch lender and their approval status
            const currentLender = await escrow.lender(); // Assuming lender is still global
            setLenderAddress(currentLender);
            const approvalLender = await escrow.approval(home.id, currentLender);
            setHasLended(approvalLender);

            // Fetch inspector and inspection status
            const currentInspector = await escrow.inspector(); // Assuming inspector is still global
            setInspectorAddress(currentInspector);
            const inspectionStatus = await escrow.inspectionPassed(home.id);
            setHasInspected(inspectionStatus);
            
            console.log("Fetched Home Details (Escrow):", {
                currentBuyer, currentSeller, currentLender, currentInspector,
                approvalBuyer, approvalSeller, approvalLender, inspectionStatus
            });

        } catch (error) {
            console.error("Error fetching details from Escrow:", error);
        }
    };

    // --- Helper function to fetch the current NFT owner ---
    const fetchOwner = async () => {
        if (!escrow || !home.id) return;

        try {
            // Check if the property is still listed in a way that implies ownership by seller or buyer
            // This logic might need refinement based on your `propertyStatus` enum and how ownership transitions.
            // For now, let's try to get ownerOf from RealEstate directly.
            const owner = await escrow.realEstate().ownerOf(home.id); // Access realEstate via escrow, then ownerOf
            setOwnerAddress(owner);
            console.log("Current NFT Owner:", owner);
        } catch (error) {
            console.error("Error fetching NFT owner:", error);
            setOwnerAddress(null); // Clear owner if error
        }
    };

    // --- Transaction Handlers ---

    const buyHandler = async () => {
        const escrowAmountForHome = await escrow.escrowAmount(home.id);
        const signer = provider.getSigner();

        try {
            // Buyer deposits earnest money
            let transaction = await escrow.connect(signer).depositEarnest(home.id, account, { value: escrowAmountForHome });
            await transaction.wait();
            setMessage("Earnest money deposited successfully!");

            // Buyer approves sale
            transaction = await escrow.connect(signer).approveSale(home.id, account);
            await transaction.wait();
            setMessage("Sale approved by buyer!");

            // Refresh details after transaction
            await fetchDetails();
            await fetchOwner();
            await loadBlockchainData(); // Re-load all blockchain data in App.js to update main list
        } catch (error) {
            console.error("Error in buyHandler:", error);
            alert(`Buy failed: ${error.reason || error.message}`);
        }
    };

    const inspectHandler = async () => {
        const signer = provider.getSigner();
        try {
            // Inspector updates inspection status to true
            const transaction = await escrow.connect(signer).updateInspectionStatus(home.id, true);
            await transaction.wait();
            setMessage("Inspection approved!");
            await fetchDetails();
            await loadBlockchainData();
        } catch (error) {
            console.error("Error in inspectHandler:", error);
            alert(`Inspection approval failed: ${error.reason || error.message}`);
        }
    };

    const lendHandler = async () => {
        const signer = provider.getSigner();
        try {
            // Lender approves sale
            let transaction = await escrow.connect(signer).approveSale(home.id, account);
            await transaction.wait();
            setMessage("Lender approved sale!");

            // Lender sends remaining funds to escrow (purchase price - earnest money)
            const purchasePriceForHome = await escrow.purchasePrice(home.id);
            const escrowAmountForHome = await escrow.escrowAmount(home.id);
            const lendAmount = purchasePriceForHome.sub(escrowAmountForHome);

            await signer.sendTransaction({ to: escrow.address, value: lendAmount, gasLimit: 600000 }); // Increased gasLimit
            setMessage("Funds lended to escrow!");

            await fetchDetails();
            await loadBlockchainData();
        } catch (error) {
            console.error("Error in lendHandler:", error);
            alert(`Lend failed: ${error.reason || error.message}`);
        }
    };

    const sellHandler = async () => {
        const signer = provider.getSigner();
        try {
            // Seller approves sale
            let transaction = await escrow.connect(signer).approveSale(home.id, account);
            await transaction.wait();
            setMessage("Seller approved sale!");

            // Finalize sale (only lender can finalize in your current Escrow.sol, assuming this is seller's "final step")
            // This button might trigger a UI update, but the actual finalize call happens from lender role.
            // If this `sellHandler` is for the seller to finalize, you need to adjust Escrow's finalizeSale modifier.
            // For now, let's assume this is for seller approval only.
            
            // If the seller actually finalizes (modifier change needed in Escrow.sol)
            // transaction = await escrow.connect(signer).finalizeSale(home.id);
            // await transaction.wait();
            // setMessage("Sale finalized!");

            await fetchDetails();
            await loadBlockchainData();
            togglePop(null); // Close popup after sale is complete
        } catch (error) {
            console.error("Error in sellHandler:", error);
            alert(`Sell failed: ${error.reason || error.message}`);
        }
    };

    // UseEffect to fetch details when `home.id`, `provider`, or `escrow` changes
    useEffect(() => {
        if (provider && escrow && home.id) {
            fetchDetails();
            fetchOwner();
        }
    }, [home.id, provider, escrow]); // Dependencies to re-run effect

    // Simple message state for internal Home component messages
    const [message, setMessage] = useState('');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className='bg-white rounded-lg shadow-2xl p-6 relative max-w-4xl w-full flex flex-col md:flex-row gap-6'>
                {/* Close Button */}
                <button onClick={togglePop} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                    <img src={close} alt="Close" className="w-6 h-6" />
                </button>

                {/* Left Section: Image */}
                <div className="md:w-1/2 flex justify-center items-center">
                    <img src={home.image || 'https://placehold.co/600x400/cccccc/333333?text=No+Image'} alt="Home" className="rounded-lg max-h-96 object-contain w-full" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/cccccc/333333?text=Error+Loading'; }} />
                </div>

                {/* Right Section: Details and Actions */}
                <div className="md:w-1/2 space-y-4">
                    <h1 className="text-3xl font-bold text-gray-900">{home.name || 'Property Name N/A'}</h1>
                    <p className="text-gray-700 text-lg">
                        <strong>{home.bedrooms || 'N/A'}</strong> bds |
                        <strong>{home.bathrooms || 'N/A'}</strong> ba |
                        <strong>{home.squareFootage || 'N/A'}</strong> sqft
                    </p>
                    <p className="text-gray-600">{home.address || 'Address not available'}</p>

                    <h2 className="text-4xl font-bold text-blue-700">
                        {home.attributes && home.attributes[0] ? ethers.utils.formatUnits(home.attributes[0].value, 'ether') : 'N/A'} ETH
                    </h2>

                    {/* Display current owner or action buttons */}
                    {ownerAddress && ownerAddress !== ethers.constants.AddressZero ? (
                        <div className='bg-green-100 text-green-800 p-3 rounded-md text-center font-semibold'>
                            Owned by {ownerAddress.slice(0, 6) + '...' + ownerAddress.slice(38, 42)}
                        </div>
                    ) : (
                        <div className="flex flex-col space-y-3 mt-4">
                            {/* Conditional buttons based on connected account role */}
                            {account === inspectorAddress ? (
                                <button className='bg-purple-600 text-white p-3 rounded-md hover:bg-purple-700 transition duration-300' onClick={inspectHandler} disabled={hasInspected}>
                                    {hasInspected ? 'Inspection Approved' : 'Approve Inspection'}
                                </button>
                            ) : account === lenderAddress ? (
                                <button className='bg-indigo-600 text-white p-3 rounded-md hover:bg-indigo-700 transition duration-300' onClick={lendHandler} disabled={hasLended}>
                                    {hasLended ? 'Lending Approved' : 'Approve & Lend'}
                                </button>
                            ) : account === sellerAddress ? (
                                <button className='bg-red-600 text-white p-3 rounded-md hover:bg-red-700 transition duration-300' onClick={sellHandler} disabled={hasSold}>
                                    {hasSold ? 'Sale Approved' : 'Approve & Sell'}
                                </button>
                            ) : ( // Default for buyer
                                <button className='bg-green-600 text-white p-3 rounded-md hover:bg-green-700 transition duration-300' onClick={buyHandler} disabled={hasBought}>
                                    {hasBought ? 'Earnest Deposited' : 'Buy'}
                                </button>
                            )}

                            {/* Contact Agent button (always present) */}
                            <button className='bg-gray-200 text-gray-800 p-3 rounded-md hover:bg-gray-300 transition duration-300'>
                                Contact Agent
                            </button>
                        </div>
                    )}
                    
                    {message && (
                        <div className="bg-blue-100 text-blue-800 p-2 rounded-md text-sm mt-3">
                            {message}
                        </div>
                    )}

                    <hr className="my-4" />

                    <h2 className="text-2xl font-semibold text-gray-800">Overview</h2>
                    <p className="text-gray-700">
                        {home.description || 'No description available.'}
                    </p>

                    <hr className="my-4" />

                    <h2 className="text-2xl font-semibold text-gray-800">Facts and Features</h2>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                        {home.attributes && home.attributes.map((attribute, index) => (
                            <li key={index}><strong>{attribute.trait_type}</strong> : {attribute.value}</li>
                        ))}
                        {/* Display additional off-chain data from Firestore */}
                        {home.propertyType && <li><strong>Property Type</strong> : {home.propertyType}</li>}
                        {home.yearBuilt && <li><strong>Year Built</strong> : {home.yearBuilt}</li>}
                        {home.currentListingStatus && <li><strong>Listing Status</strong> : {home.currentListingStatus}</li>}
                        {home.ownerFirebaseUid && <li><strong>Listed By (Firebase)</strong> : {home.ownerFirebaseUid.slice(0, 8)}...</li>}
                    </ul>
                </div>
            </div >
        </div >
    );
}

export default Home;
