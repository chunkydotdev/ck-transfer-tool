// CryptoKitties contract address
const CK_CONTRACT_ADDRESS = '0x06012c8cf97BEaD5deAe237070F9587f8E7A266d';

// Contract ABI - we only need the transfer function
const CK_ABI = [{
    "constant": false,
    "inputs": [{
        "name": "_to",
        "type": "address"
    }, {
        "name": "_tokenId",
        "type": "uint256"
    }],
    "name": "transfer",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
}];

let web3;
let contract;
let userAddress;

// DOM Elements
const connectWalletBtn = document.getElementById('connect-wallet');
const transferBtn = document.getElementById('transfer');
const walletStatus = document.getElementById('wallet-status');
const kittyIdsInput = document.getElementById('kitty-ids');
const recipientInput = document.getElementById('recipient');
const statusDiv = document.getElementById('status');
const fetchCode = document.getElementById('fetch-code');
const generateScriptBtn = document.getElementById('generate-script');
const authToken = document.getElementById('auth-token');
const authWallet = document.getElementById('auth-wallet');
const fetchKittyIdsBtn = document.getElementById('fetch-kitty-ids');
const fetchSpinner = document.getElementById('fetch-spinner');

// Initialize Web3 and contract
async function init() {
    const provider = window.ethereum || window.web3?.currentProvider;
    
    if (provider) {
        try {
            web3 = new Web3(provider);
            
            if (window.ethereum) {
                await window.ethereum.enable();
            }
            
            const accounts = await web3.eth.getAccounts();
            userAddress = accounts[0];
            
            if (!userAddress) {
                throw new Error('No accounts found');
            }
            
            contract = new web3.eth.Contract(CK_ABI, CK_CONTRACT_ADDRESS);
            
            walletStatus.textContent = `Connected: ${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
            connectWalletBtn.textContent = 'Wallet Connected';
            connectWalletBtn.disabled = true;
            transferBtn.disabled = false;
            
            if (window.ethereum) {
                window.ethereum.on('accountsChanged', function (accounts) {
                    userAddress = accounts[0];
                    walletStatus.textContent = `Connected: ${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
                });
            }
        } catch (error) {
            showStatus('Error connecting to wallet: ' + error.message, 'error');
        }
    } else {
        showStatus('Please install Dapper wallet to use this application', 'error');
    }
}

// Transfer kitties
async function transferKitties() {
    // Split by both commas and newlines, then clean up the results
    const kittyIds = kittyIdsInput.value
        .split(/[,\n]/)  // Split by both commas and newlines
        .map(id => id.trim())  // Remove whitespace
        .filter(id => id);  // Remove empty entries
    
    const recipient = recipientInput.value.trim();
    
    if (!kittyIds.length) {
        showStatus('Please enter at least one kitty ID', 'error');
        return;
    }
    
    if (!web3.utils.isAddress(recipient)) {
        showStatus('Please enter a valid recipient address', 'error');
        return;
    }
    
    transferBtn.disabled = true;
    showStatus(`Starting transfers for ${kittyIds.length} kitties...`, 'success');
    
    let successCount = 0;
    let failCount = 0;
    let failedKitties = [];
    
    // Send all transactions immediately
    kittyIds.forEach(kittyId => {
        const txData = contract.methods.transfer(recipient, kittyId).encodeABI();
        
        // Send transaction without waiting
        web3.eth.sendTransaction({
            from: userAddress,
            to: CK_CONTRACT_ADDRESS,
            data: txData
        }).then(tx => {
            successCount++;
            showStatus(`Successfully transferred kitty #${kittyId}`, 'success');
            updateFinalStatus();
        }).catch(error => {
            failCount++;
            failedKitties.push(kittyId);
            showStatus(`Error transferring kitty #${kittyId}: ${error.message}`, 'error');
            updateFinalStatus();
        });
    });
    
    function updateFinalStatus() {
        const totalProcessed = successCount + failCount;
        if (totalProcessed === kittyIds.length) {
            if (successCount > 0) {
                showStatus(`Transfer complete. ${successCount} successful, ${failCount} failed.`, 'success');
            } else {
                showStatus(`All transfers failed. Please try again.`, 'error');
            }
            
            // Update failed kitties section if there are any failures
            if (failedKitties.length > 0) {
                const failedKittiesInput = document.getElementById('failed-kitties');
                failedKittiesInput.value = failedKitties.join(', ');
                document.getElementById('failed-transfers').style.display = 'block';
            }
            
            transferBtn.disabled = false;
        }
    }
}

// Helper function to show status messages
function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type;
}

// Event listeners
connectWalletBtn.addEventListener('click', init);
transferBtn.addEventListener('click', transferKitties);
document.getElementById('retry-failed').addEventListener('click', () => {
    const failedKittiesInput = document.getElementById('failed-kitties');
    kittyIdsInput.value = failedKittiesInput.value;
    failedKittiesInput.value = '';
    document.getElementById('failed-transfers').style.display = 'none';
    transferKitties();
});

if (fetchKittyIdsBtn) {
    fetchKittyIdsBtn.addEventListener('click', async () => {
        const wallet = authWallet.value.trim();
        const token = authToken.value.trim();
        if (!wallet || !token) {
            showStatus('Please enter both wallet address and authorization token.', 'error');
            return;
        }
        // Show spinner and disable button
        if (fetchSpinner) fetchSpinner.style.display = 'inline-block';
        fetchKittyIdsBtn.disabled = true;
        showStatus('Fetching kitty IDs...', 'success');
        try {
            const limit = 20;
            let offset = 0;
            let allIds = [];
            // Fetch first page to get total
            const firstResponse = await fetch(`https://api.cryptokitties.co/v3/kitties?include=other&orderBy=age&orderDirection=asc&offset=${offset}&limit=${limit}&owner_wallet_address=${wallet}`, {
                headers: {
                    'accept': '*/*',
                    'accept-language': 'en-US,en;q=0.9',
                    'authorization': token,
                    'if-none-match': 'W/"f474-kXsYFO5VU/etBpgG5EnGyP/47LE"',
                    'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-site',
                    'Referer': 'https://www.cryptokitties.co/',
                    'Referrer-Policy': 'strict-origin-when-cross-origin'
                }
            });
            if (!firstResponse.ok) throw new Error('Failed to fetch kitties');
            const firstData = await firstResponse.json();
            allIds.push(...(firstData.kitties || []).map(kitty => kitty.id));
            const total = firstData.total || allIds.length;
            const requests = [];
            for (let nextOffset = limit; nextOffset < total; nextOffset += limit) {
                requests.push(
                    fetch(`https://api.cryptokitties.co/v3/kitties?include=other&orderBy=age&orderDirection=asc&offset=${nextOffset}&limit=${limit}&owner_wallet_address=${wallet}`, {
                        headers: {
                            'accept': '*/*',
                            'accept-language': 'en-US,en;q=0.9',
                            'authorization': token,
                            'if-none-match': 'W/"f474-kXsYFO5VU/etBpgG5EnGyP/47LE"',
                            'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
                            'sec-ch-ua-mobile': '?0',
                            'sec-ch-ua-platform': '"macOS"',
                            'sec-fetch-dest': 'empty',
                            'sec-fetch-mode': 'cors',
                            'sec-fetch-site': 'same-site',
                            'Referer': 'https://www.cryptokitties.co/',
                            'Referrer-Policy': 'strict-origin-when-cross-origin'
                        }
                    })
                );
            }
            // Fetch all remaining pages in parallel
            const responses = await Promise.all(requests);
            for (const resp of responses) {
                if (resp.ok) {
                    const data = await resp.json();
                    allIds.push(...(data.kitties || []).map(kitty => kitty.id));
                }
            }
            if (allIds.length) {
                kittyIdsInput.value = allIds.join(', ');
                showStatus(`Fetched ${allIds.length} kitty IDs and filled in the input.`, 'success');
            } else {
                showStatus('No kitties found for this wallet.', 'error');
            }
        } catch (err) {
            showStatus('Error fetching kitty IDs: ' + err.message, 'error');
        } finally {
            // Hide spinner and enable button
            if (fetchSpinner) fetchSpinner.style.display = 'none';
            fetchKittyIdsBtn.disabled = false;
        }
    });
} 