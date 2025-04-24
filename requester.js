// Sample data for active and past requests
const requests = {
    active: [
        {
            id: 1234,
            item: "Wireless Headphones",
            pickup: "Model Town Market",
            delivery: "NIT Jalandhar Boys Hostel",
            budget: 2500,
            status: "In Progress",
            eta: "Today, 7:30 PM"
        }
    ],
    past: [
        {
            id: 1235,
            item: "Smart Watch",
            pickup: "City Centre Mall",
            delivery: "NIT Jalandhar Girls Hostel",
            budget: 15000,
            completionDate: "Yesterday, 4:30 PM",
            rating: "⭐⭐⭐⭐⭐"
        }
    ]
};

// Initialize map and tracking variables
let map;
let truckMarker;
let routeCoordinates = [];
let currentRouteIndex = 0;
let startTime;
let totalDistance = 0;
let currentSpeed = 0;
let estimatedTimeRemaining = 0;
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

// Custom truck icon
const truckIcon = L.divIcon({
    html: '🚚',
    className: 'truck-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

// Initialize map
function initMap() {
    map = L.map('map').setView([31.3260, 75.5762], 12); // Zoomed out a bit
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

// Form submission handler
document.getElementById('newRequestForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = {
        item: document.getElementById('item').value,
        pickup: document.getElementById('pickup').value,
        delivery: document.getElementById('delivery').value,
        budget: document.getElementById('budget').value,
        deadline: document.getElementById('deadline').value,
        description: document.getElementById('description').value
    };

    // In a real app, this would send data to a backend
    console.log('New request submitted:', formData);
    
    // Show success notification
    showNotification('Request published successfully!', 'success');
    
    // Reset form
    this.reset();
});

// Track delivery request
function trackRequest(requestId) {
    const modal = document.getElementById('mapModal');
    modal.style.display = 'block';
    
    // Initialize map immediately
    if (!map) {
        initMap();
    }
    
    // Reset tracking state
    currentRouteIndex = 0;
    routeCoordinates = [];
    startTime = Date.now();
    totalDistance = 0;
    currentSpeed = 0;
    estimatedTimeRemaining = 0;
    
    // Reset all status steps
    document.querySelectorAll('.status-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Clear existing markers and routes
    if (map) {
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker || layer instanceof L.Routing.Control) {
                map.removeLayer(layer);
            }
        });
    }
    
    // Simulate delivery route immediately
    simulateDeliveryRoute(requestId);
}

// Simulate delivery route
function simulateDeliveryRoute(requestId) {
    // Sample coordinates with greater distance
    const pickupCoords = [31.3256, 75.5792]; // Model Town Market
    const deliveryCoords = [31.3959, 75.5358]; // NIT Jalandhar Boys Hostel
    
    // Add markers immediately
    L.marker(pickupCoords).addTo(map).bindPopup('📍 Pickup Location');
    L.marker(deliveryCoords).addTo(map).bindPopup('🏁 Delivery Location');
    
    // Create routing control
    const routingControl = L.Routing.control({
        waypoints: [
            L.latLng(pickupCoords[0], pickupCoords[1]),
            L.latLng(deliveryCoords[0], deliveryCoords[1])
        ],
        routeWhileDragging: false,
        showAlternatives: false,
        fitSelectedRoutes: true,
        lineOptions: {
            styles: [{ color: '#ff0000', weight: 4, opacity: 0.8 }]
        }
    }).addTo(map);
    
    // Start truck movement when route is found
    routingControl.on('routesfound', function(e) {
        const route = e.routes[0];
        routeCoordinates = route.coordinates;
        totalDistance = route.summary.totalDistance / 1000;
        
        // Add a small delay before starting the animation
        setTimeout(() => {
            startTruckMovement();
            startDeliveryProgress();
        }, 1000); // 1 second delay before starting
    });
}

// Start delivery progress
function startDeliveryProgress() {
    const steps = document.querySelectorAll('.status-step');
    let currentStep = 0;
    
    // Show first step immediately
    steps[0].classList.add('active');
    
    // Calculate intervals based on route length
    const totalSteps = steps.length;
    const routeLength = routeCoordinates.length;
    
    // Update steps as truck moves with longer intervals
    const progressInterval = setInterval(() => {
        if (currentStep < totalSteps - 1) {
            currentStep++;
            steps[currentStep].classList.add('active');
        } else {
            clearInterval(progressInterval);
        }
    }, 8000); // Increased to 8 seconds per step
}

// Start truck movement
function startTruckMovement() {
    if (routeCoordinates.length === 0) return;
    
    // Create truck marker at start
    truckMarker = L.marker(routeCoordinates[0], { icon: truckIcon }).addTo(map);
    
    // Start movement
    moveTruck(0);
}

// Move truck along route
function moveTruck(index) {
    if (index >= routeCoordinates.length) {
        // Delivery completed
        showNotification('🎉 Delivery completed successfully!', 'success');
        return;
    }
    
    const currentPos = routeCoordinates[index];
    const nextPos = routeCoordinates[index + 1];
    
    if (nextPos) {
        // Calculate rotation angle
        const angle = Math.atan2(nextPos[1] - currentPos[1], nextPos[0] - currentPos[0]) * 180 / Math.PI;
        truckMarker.getElement().style.transform = `rotate(${angle}deg)`;
    }
    
    // Move truck
    truckMarker.setLatLng(currentPos);
    currentRouteIndex = index;
    
    // Update metrics
    updateDeliveryMetrics();
    
    // Continue movement with increased delay
    setTimeout(() => {
        moveTruck(index + 1);
    }, 100); // Increased to 100ms for slower movement
}

// Function to get coordinates for locations
function getLocationCoordinates(location) {
    // Sample coordinates for different locations
    const locations = {
        'Model Town Market': [31.3256, 75.5792],
        'City Centre Mall': [31.3267, 75.5789],
        'Lajpat Nagar Market': [31.3278, 75.5778],
        'Guru Nanak Market': [31.3289, 75.5767],
        'NIT Jalandhar Boys Hostel': [31.3959, 75.5358],
        'NIT Jalandhar Girls Hostel': [31.3960, 75.5359],
        'NIT Jalandhar Campus': [31.3961, 75.5360]
    };
    
    return locations[location] || [31.3959, 75.5358]; // Default to NIT coordinates
}

// Update delivery metrics
function updateDeliveryMetrics() {
    const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
    const progress = currentRouteIndex / routeCoordinates.length;
    
    // Calculate ETA only
    const remainingDistance = totalDistance * (1 - progress);
    const currentSpeed = (totalDistance / elapsedTime) * 3600; // km/h
    const estimatedTimeRemaining = remainingDistance / currentSpeed; // hours
    
    // Update the metrics display
    const metricsContainer = document.getElementById('deliveryMetrics');
    if (metricsContainer) {
        metricsContainer.innerHTML = `
            <div class="metric">
                <div class="metric-label">ETA</div>
                <div class="metric-value">${formatTime(estimatedTimeRemaining)}</div>
            </div>
        `;
    }
}

// Format time
function formatTime(hours) {
    if (hours < 1) {
        const minutes = Math.round(hours * 60);
        return `${minutes} min`;
    }
    const wholeHours = Math.floor(hours);
    const remainingMinutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours} hr ${remainingMinutes} min`;
}

// Simulate delivery progress
function simulateDeliveryProgress() {
    const steps = document.querySelectorAll('.status-step');
    let currentStep = 0;
    
    // Add initial delay before starting
    setTimeout(() => {
        const interval = setInterval(() => {
            if (currentStep < steps.length - 1) {
                steps[currentStep].classList.add('active');
                const stepText = steps[currentStep].querySelector('.step-text').textContent;
                showNotification(`Delivery Status: ${stepText}`, 'success');
                currentStep++;
            } else {
                clearInterval(interval);
            }
        }, 5000);
    }, 1000);
}

// Close modal
document.querySelector('.close').addEventListener('click', function() {
    const modal = document.getElementById('mapModal');
    modal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('mapModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Make modal draggable
function makeDraggable() {
    const modalContent = document.querySelector('.modal-content');
    const modalHeader = document.querySelector('.modal-header');

    if (modalHeader) {
        modalHeader.addEventListener('mousedown', function(e) {
            if (e.target === modalHeader || e.target.parentNode === modalHeader) {
                isDragging = true;
                initialX = e.clientX - modalContent.offsetLeft;
                initialY = e.clientY - modalContent.offsetTop;
            }
        });
    }

    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            e.preventDefault();
            const modalContent = document.querySelector('.modal-content');
            
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            // Keep the modal within the window bounds
            const rect = modalContent.getBoundingClientRect();
            const maxX = window.innerWidth - rect.width;
            const maxY = window.innerHeight - rect.height;
            
            currentX = Math.min(Math.max(currentX, 0), maxX);
            currentY = Math.min(Math.max(currentY, 0), maxY);

            modalContent.style.left = currentX + 'px';
            modalContent.style.top = currentY + 'px';
            modalContent.style.transform = 'none';
        }
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add emojis to request cards
    document.querySelectorAll('.request-title').forEach(title => {
        const emoji = getEmojiForRequest(title.textContent);
        title.innerHTML = `${emoji} ${title.textContent}`;
    });
    
    // Make modal draggable
    makeDraggable();
    
    // Initialize close button
    const closeButton = document.querySelector('.close');
    if (closeButton) {
        closeButton.onclick = function() {
            const modal = document.getElementById('mapModal');
            if (modal) {
                modal.style.display = 'none';
                // Reset the map and tracking state
                if (map) {
                    map.eachLayer((layer) => {
                        if (layer instanceof L.Marker || layer instanceof L.Routing.Control) {
                            map.removeLayer(layer);
                        }
                    });
                }
                currentRouteIndex = 0;
                routeCoordinates = [];
            }
        };
    }
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('mapModal');
        if (event.target === modal) {
            modal.style.display = 'none';
            // Reset the map and tracking state
            if (map) {
                map.eachLayer((layer) => {
                    if (layer instanceof L.Marker || layer instanceof L.Routing.Control) {
                        map.removeLayer(layer);
                    }
                });
            }
            currentRouteIndex = 0;
            routeCoordinates = [];
        }
    };
});

// Get emoji for request type
function getEmojiForRequest(title) {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('grocery')) return '🛒';
    if (titleLower.includes('food')) return '🍽️';
    if (titleLower.includes('package')) return '📦';
    return '📝';
}

// Function to show notifications
function showNotification(message, type = 'success') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Create notification content
    const content = document.createElement('div');
    content.className = 'notification-content';
    
    // Add icon based on type
    const icon = document.createElement('span');
    icon.className = 'notification-icon';
    icon.textContent = type === 'success' ? '✓' : '⚠';
    
    // Add message
    const messageSpan = document.createElement('span');
    messageSpan.className = 'notification-message';
    messageSpan.textContent = message;
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification-close';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => notification.remove();
    
    // Assemble notification
    content.appendChild(icon);
    content.appendChild(messageSpan);
    notification.appendChild(content);
    notification.appendChild(closeBtn);
    
    // Add to document
    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    const timeout = setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);

    // Clear timeout if notification is manually closed
    closeBtn.onclick = () => {
        clearTimeout(timeout);
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    };
}

// Function to update the request display
function updateRequestDisplay() {
    // In a real app, this would update the UI with the latest data
    console.log('Updating request display...');
}

// Function to cancel a request
function cancelRequest(requestId) {
    if (confirm('Are you sure you want to cancel this request?')) {
        const request = requests.active.find(r => r.id === requestId);
        if (request) {
            // In a real app, this would update the backend
            requests.active = requests.active.filter(r => r.id !== requestId);
            showNotification('Request cancelled successfully', 'success');
            updateRequestDisplay();
        }
    }
}

// Function to review a completed delivery
function reviewDelivery(requestId) {
    const request = requests.past.find(r => r.id === requestId);
    if (request) {
        // In a real app, this would show a review modal
        showNotification('Review form loaded', 'success');
    }
}

// Add close button functionality
const closeBtn = document.querySelector('.close');
if (closeBtn) {
    closeBtn.onclick = function() {
        document.getElementById('mapModal').style.display = 'none';
    };
} 