// Load tournaments when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadActiveTournaments();
    loadMyTournaments();
    loadCompletedTournaments();
    
    // Check for admin role and show admin link if present
    checkAdminAccess();
});

// Handle tournament creation
document.getElementById('createTournamentBtn').addEventListener('click', async () => {
    // Format dates properly for LocalDateTime
    const startDateStr = document.getElementById('startDate').value;
    const endDateStr = document.getElementById('endDate').value;
    
    const tournamentData = {
        name: document.getElementById('tournamentName').value,
        startDate: startDateStr ? new Date(startDateStr).toISOString() : null,
        endDate: endDateStr ? new Date(endDateStr).toISOString() : null
    };

    try {
        // Default to admin ID 1 if no user ID is saved
        const adminId = getCurrentUserId() || 1;
        
        const response = await fetch('/api/tournaments?adminId=' + adminId, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            },
            body: JSON.stringify(tournamentData)
        });

        if (response.ok) {
            const createdTournament = await response.json();
            console.log('Tournament created successfully:', createdTournament);
            alert('Tournament created successfully!');
            
            // Close the modal
            const modal = document.getElementById('createTournamentModal');
            if (modal) {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                if (modalInstance) {
                    modalInstance.hide();
                }
            }
            
            // Clear the form
            document.getElementById('tournamentName').value = '';
            document.getElementById('startDate').value = '';
            document.getElementById('endDate').value = '';
            
            // Reload all tournament lists
            setTimeout(() => {
                loadActiveTournaments();
                loadMyTournaments();
                loadCompletedTournaments();
            }, 500);
        } else {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            alert('Failed to create tournament. Please check all fields are filled correctly.');
        }
    } catch (error) {
        console.error('Error creating tournament:', error);
        alert('Error creating tournament: ' + error.message);
    }
});

async function loadActiveTournaments() {
    try {
        const response = await fetch('/api/tournaments');
        if (response.ok) {
            const tournaments = await response.json();
            // Include both PENDING and IN_PROGRESS tournaments
            displayTournaments('activeTournamentsList', tournaments.filter(t => 
                t.status === 'IN_PROGRESS' || t.status === 'PENDING'
            ));
            
            // Log all tournaments for debugging
            console.log('All tournaments:', tournaments);
        }
    } catch (error) {
        console.error('Error loading active tournaments:', error);
    }
}

async function loadMyTournaments() {
    try {
        const userId = getCurrentUserId();
        if (!userId) return;
        
        // Get tournaments where the user is a player
        const playerResponse = await fetch('/api/tournaments/player/' + userId);
        let playerTournaments = [];
        if (playerResponse.ok) {
            playerTournaments = await playerResponse.json();
        }
        
        // Get tournaments where the user is an admin
        const adminResponse = await fetch('/api/tournaments/admin/' + userId);
        let adminTournaments = [];
        if (adminResponse.ok) {
            adminTournaments = await adminResponse.json();
        }
        
        // Combine and deduplicate tournaments
        const tournamentMap = new Map();
        [...playerTournaments, ...adminTournaments].forEach(t => {
            tournamentMap.set(t.id, t);
        });
        
        const combinedTournaments = Array.from(tournamentMap.values());
        console.log('My tournaments:', combinedTournaments);
        
        displayTournaments('myTournamentsList', combinedTournaments);
    } catch (error) {
        console.error('Error loading my tournaments:', error);
    }
}

async function loadCompletedTournaments() {
    try {
        const response = await fetch('/api/tournaments');
        if (response.ok) {
            const tournaments = await response.json();
            displayTournaments('completedTournamentsList', tournaments.filter(t => t.status === 'ENDED'));
        }
    } catch (error) {
        console.error('Error loading completed tournaments:', error);
    }
}

function displayTournaments(containerId, tournaments) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    tournaments.forEach(tournament => {
        const item = document.createElement('a');
        item.href = `/tournaments/${tournament.id}`;
        item.className = 'list-group-item list-group-item-action';
        
        const startDate = tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'Not set';
        
        item.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">${tournament.name}</h5>
                <small>${startDate}</small>
            </div>
            <p class="mb-1">Status: ${tournament.status}</p>
            <small>Players: ${tournament.players ? tournament.players.length : 0}</small>
        `;
        container.appendChild(item);
    });

    if (tournaments.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No tournaments found.</div>';
    }
}

// Helper function to get current user ID
function getCurrentUserId() {
    // Check the JWT token or sessionStorage for user ID
    return localStorage.getItem('userId') || 1;
}

// Check if current user has admin access
async function checkAdminAccess() {
    try {
        const response = await fetch('/api/auth/current', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            
            // Check if user has ADMIN role
            if (user.roles && user.roles.includes('ROLE_ADMIN')) {
                // Show the admin link
                document.querySelectorAll('.admin-link').forEach(elem => {
                    elem.style.display = 'block';
                });
            }
        }
    } catch (error) {
        console.error('Error checking admin access:', error);
    }
} 