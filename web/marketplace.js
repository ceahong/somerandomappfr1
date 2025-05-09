document.addEventListener('DOMContentLoaded', function() {
    fetchMarketplaceData();
});

// Fetch data from marketplace.json in the root directory
async function fetchMarketplaceData() {
    try {
        const response = await fetch('../marketplace.json');
        const data = await response.json();
        displayMarketplace(data);
    } catch (error) {
        console.error('Error fetching marketplace data:', error);
        document.getElementById('loading').textContent = 'Error loading marketplace data. Please try again later.';
    }
}

// Display marketplace listings
function displayMarketplace(data) {
    const loadingElement = document.getElementById('loading');
    const emptyMessageElement = document.getElementById('empty-message');
    const marketplaceListingsElement = document.getElementById('marketplace-listings');
    
    // Hide loading message
    loadingElement.style.display = 'none';
    
    // Check if marketplace is empty
    const listings = Object.keys(data);
    if (listings.length === 0) {
        emptyMessageElement.style.display = 'block';
        return;
    }
    
    // Sort listings by posted_at timestamp (newest first)
    const sortedListings = listings.sort((a, b) => {
        return data[b].posted_at - data[a].posted_at;
    });
    
    // Generate HTML for each listing
    sortedListings.forEach(id => {
        const listing = data[id];
        const cardElement = createListingCard(id, listing);
        marketplaceListingsElement.appendChild(cardElement);
    });
}

// Format relative time (e.g., "2 hours ago", "5 minutes ago")
function formatRelativeTime(timestamp) {
    const now = Math.floor(Date.now() / 1000);
    const secondsAgo = now - timestamp;
    
    // Less than a minute
    if (secondsAgo < 60) {
        return 'Just now';
    }
    
    // Less than an hour
    if (secondsAgo < 3600) {
        const minutes = Math.floor(secondsAgo / 60);
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (secondsAgo < 86400) {
        const hours = Math.floor(secondsAgo / 3600);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a week
    if (secondsAgo < 604800) {
        const days = Math.floor(secondsAgo / 86400);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    
    // Format as date
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
}

// Create HTML for a listing card
function createListingCard(id, listing) {
    const cardElement = document.createElement('div');
    cardElement.classList.add('marketplace-card');
    
    // Format relative time
    const relativeTime = formatRelativeTime(listing.posted_at);
    
    // Use a local placeholder image
    const placeholderImage = 'placeholder.svg';
    
    // Use the string version of channel ID to ensure precision
    const channelId = listing.channel_id_string || listing.channel_id.toString();
    
    // Use the username if available, otherwise show "Unknown User"
    const username = listing.username || "Unknown User";
    
    console.log(`Creating card for listing ID ${id} with channel ID: "${channelId}"`);
    
    // Create HTML structure with placeholder image initially
    cardElement.innerHTML = `
        <div class="celebrity-image-container">
            <img src="${placeholderImage}" alt="${listing.celebrity_name}" class="celebrity-image">
        </div>
        <div class="card-content">
            <div class="card-header">
                <div class="celebrity-details">
                    <h2>${listing.celebrity_name}</h2>
                    <p>Listed by <span class="username">${username}</span></p>
                </div>
            </div>
            
            <div class="wishlist-section">
                <h3>Wishlist:</h3>
                <ul class="wishlist-items">
                    ${formatWishlist(listing.wishlist)}
                </ul>
            </div>
            
            <div class="claim-section">
                <div class="claim-command">/claim ${id}</div>
            </div>
            
            <div class="timestamp">
                ${relativeTime}
            </div>
        </div>
    `;
    
    // Get the image element
    const imgElement = cardElement.querySelector('.celebrity-image');
    
    // Load the banner image
    loadImageFromBanner(channelId, imgElement, placeholderImage);
    
    return cardElement;
}

// Format wishlist for display
function formatWishlist(wishlist) {
    if (!wishlist || Object.keys(wishlist).length === 0) {
        return '<li class="wishlist-item">No items in wishlist</li>';
    }
    
    return Object.entries(wishlist)
        .map(([channelId, name]) => {
            return `<li class="wishlist-item">${name}</li>`;
        })
        .join('');
}

// Load image URL from banner JSON file
function loadImageFromBanner(channelId, imgElement, fallbackImage) {
    // Only one attempt per image
    if (imgElement.dataset.loaded === 'true') {
        return;
    }
    
    // Mark as loaded to prevent further attempts
    imgElement.dataset.loaded = 'true';
    
    console.log(`Loading banner for channel ID: "${channelId}"`);
    
    // Try each possible path
    const possiblePaths = [
        `banners/${channelId}.json`,       // Local web directory
        `../banners/${channelId}.json`,    // Parent directory
    ];
    
    tryNextPath(0);
    
    // Try each path in sequence
    function tryNextPath(index) {
        if (index >= possiblePaths.length) {
            console.warn(`All paths failed for channel ID ${channelId}`);
            imgElement.src = fallbackImage;
            return;
        }
        
        const path = possiblePaths[index];
        console.log(`Trying path ${index+1}/${possiblePaths.length}: ${path}`);
        
        fetch(path)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Banner not found at ${path}: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.image_url) {
                    console.log(`Success with ${path}! Image URL: ${data.image_url}`);
                    imgElement.src = data.image_url;
                } else {
                    throw new Error('No image_url in data');
                }
            })
            .catch(err => {
                console.warn(`Path ${path} failed: ${err.message}`);
                tryNextPath(index + 1);
            });
    }
}