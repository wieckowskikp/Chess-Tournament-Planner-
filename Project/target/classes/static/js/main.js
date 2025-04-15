document.addEventListener('DOMContentLoaded', function() {
    // Load active tournaments
    loadActiveTournaments();
    
    // Check auth status and update UI
    checkAuthStatus();
    
    // Check for admin role
    checkAdminAccess();
});

function loadActiveTournaments() {
    fetch('/api/tournaments')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load tournaments');
            }
            return response.json();
        })
        .then(tournaments => {
            const activeTournamentsContainer = document.getElementById('activeTournaments');
            activeTournamentsContainer.innerHTML = '';
            
            if (tournaments.length === 0) {
                activeTournamentsContainer.innerHTML = '<p class="text-center">No active tournaments found.</p>';
                return;
            }
            
            tournaments.forEach(tournament => {
                const tournamentItem = document.createElement('a');
                tournamentItem.href = `/tournaments/${tournament.id}`;
                tournamentItem.className = 'list-group-item list-group-item-action';
                
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
                        <small>${tournament.players.length} players</small>
                    </div>
                    <p class="mb-1">Round: ${tournament.currentRound}</p>
                `;
                
                activeTournamentsContainer.appendChild(tournamentItem);
            });
        })
        .catch(error => {
            console.error('Error loading tournaments:', error);
            const activeTournamentsContainer = document.getElementById('activeTournaments');
            activeTournamentsContainer.innerHTML = '<p class="text-center text-danger">Error loading tournaments.</p>';
        });
}

function checkAuthStatus() {
    // Get the auth section in the navbar
    const authSection = document.getElementById('authSection');
    
    // Check if user is logged in (this is a simplified check)
    const token = localStorage.getItem('authToken');
    
    if (token) {
        // User is logged in, show logout button
        authSection.innerHTML = '<a class="nav-link" href="#" id="logoutBtn">Logout</a>';
        
        // Add event listener to logout button
        document.getElementById('logoutBtn').addEventListener('click', function(e) {
            e.preventDefault();
            // Clear auth token and user data
            localStorage.removeItem('authToken');
            localStorage.removeItem('userId');
            // Redirect to home page
            window.location.href = '/';
        });
    } else {
        // User is not logged in, show login and register links
        authSection.innerHTML = `
            <a class="nav-link" href="/login">Login</a>
            <a class="nav-link" href="/register">Register</a>
        `;
    }
}

// Check if current user has admin access
async function checkAdminAccess() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            return; // Not logged in, don't check
        }
        
        const response = await fetch('/api/auth/current', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            console.log('User roles:', user.roles); // Log user roles
            
            // Check if user has ADMIN role
            if (user.roles && user.roles.includes('ROLE_ADMIN')) {
                // Show the admin link
                document.querySelectorAll('.admin-link').forEach(elem => {
                    elem.style.display = 'block';
                });
            } else {
                console.log('User is not an admin'); // Log if user is not an admin
            }
        } else {
            console.error('Failed to fetch user roles:', await response.text());
        }
    } catch (error) {
        console.error('Error checking admin access:', error);
    }
}