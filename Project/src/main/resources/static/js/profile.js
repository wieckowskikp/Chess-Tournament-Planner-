document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (!token) {
        // Redirect to login page if not logged in
        window.location.href = '/login';
        return;
    }
    
    // Load user profile data
    loadUserProfile();
    
    // Load user tournaments
    loadUserTournaments();
    
    // Check for admin role
    checkAdminAccess();
    
    // Set up logout button
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        // Clear auth token
        localStorage.removeItem('authToken');
        // Redirect to home page
        window.location.href = '/';
    });
});

function loadUserProfile() {
    fetch('/api/users/current', {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('authToken')
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load profile');
        }
        return response.json();
    })
    .then(user => {
        // Update UI with user data
        document.getElementById('profileUsername').textContent = user.username;
        document.getElementById('profileEmail').textContent = user.email;
        document.getElementById('profileRating').textContent = user.eloRating;
    })
    .catch(error => {
        console.error('Error loading profile:', error);
        // Show error message
        document.getElementById('profileUsername').textContent = 'Error loading profile';
        document.getElementById('profileEmail').textContent = 'Error loading profile';
        document.getElementById('profileRating').textContent = 'Error loading profile';
    });
}

function loadUserTournaments() {
    fetch('/api/tournaments/player/current', {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('authToken')
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load tournaments');
        }
        return response.json();
    })
    .then(tournaments => {
        const userTournamentsContainer = document.getElementById('userTournaments');
        userTournamentsContainer.innerHTML = '';
        
        if (tournaments.length === 0) {
            userTournamentsContainer.innerHTML = '<p class="text-center">You are not registered in any tournaments.</p>';
            return;
        }
        
        tournaments.forEach(tournament => {
            const tournamentItem = document.createElement('li');
            tournamentItem.className = 'list-group-item';
            
            let statusBadge = '';
            if (tournament.status === 'PENDING') {
                statusBadge = '<span class="badge bg-warning text-dark ms-2">Pending</span>';
            } else if (tournament.status === 'IN_PROGRESS') {
                statusBadge = '<span class="badge bg-success ms-2">In Progress</span>';
            } else if (tournament.status === 'ENDED') {
                statusBadge = '<span class="badge bg-secondary ms-2">Ended</span>';
            }
            
            tournamentItem.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">${tournament.name}${statusBadge}</h5>
                    <small>Round: ${tournament.currentRound}</small>
                </div>
                <p class="mb-1">${tournament.players.length} players</p>
                <a href="/tournaments/${tournament.id}" class="btn btn-sm btn-primary mt-2">View Details</a>
            `;
            
            userTournamentsContainer.appendChild(tournamentItem);
        });
    })
    .catch(error => {
        console.error('Error loading tournaments:', error);
        const userTournamentsContainer = document.getElementById('userTournaments');
        userTournamentsContainer.innerHTML = '<p class="text-center text-danger">Error loading tournaments.</p>';
    });
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