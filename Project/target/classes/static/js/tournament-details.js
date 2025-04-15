let tournament = null;
let currentMatchId = null;

document.addEventListener('DOMContentLoaded', () => {
    const tournamentId = getTournamentIdFromUrl();
    loadTournamentDetails(tournamentId);
    setupEventListeners(tournamentId);
    
    // Check for admin role and show admin link if present
    checkAdminAccess();
});

function setupEventListeners(tournamentId) {
    document.getElementById('startTournamentBtn')?.addEventListener('click', () => startTournament(tournamentId));
    document.getElementById('generatePairingsBtn')?.addEventListener('click', () => generateNextRound(tournamentId));
    document.getElementById('endTournamentBtn')?.addEventListener('click', () => endTournament(tournamentId));
    document.getElementById('saveResultBtn')?.addEventListener('click', saveMatchResult);
    document.getElementById('saveEloBtn')?.addEventListener('click', updatePlayerElo);
    document.getElementById('playerSearch')?.addEventListener('input', debounce(searchPlayers, 300));
}

async function loadTournamentDetails(tournamentId) {
    try {
        const response = await fetch(`/api/tournaments/${tournamentId}`);
        if (response.ok) {
            tournament = await response.json();
            console.log('Tournament details:', tournament);
            displayTournamentInfo();
            loadCurrentRoundMatches();
            loadTournamentHistory();
            loadStandings();
            loadPlayers();
            updateAdminControls();
        } else {
            console.error('Failed to load tournament:', await response.text());
        }
    } catch (error) {
        console.error('Error loading tournament details:', error);
    }
}

function displayTournamentInfo() {
    document.getElementById('tournamentName').textContent = tournament.name;
    document.getElementById('tournamentStatus').textContent = tournament.status;
    document.getElementById('startDate').textContent = tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'Not set';
    document.getElementById('endDate').textContent = tournament.endDate ? new Date(tournament.endDate).toLocaleDateString() : 'Not set';
    document.getElementById('adminName').textContent = tournament.admin ? tournament.admin.username : 'Unknown';
}

async function loadCurrentRoundMatches() {
    try {
        const response = await fetch(`/api/tournaments/${tournament.id}/matches`);
        if (response.ok) {
            const matches = await response.json();
            console.log('Matches:', matches);
            // If no matches or current round is zero, show message
            if (matches.length === 0 || tournament.currentRound === 0) {
                const container = document.getElementById('currentRoundMatches');
                container.innerHTML = '<div class="alert alert-info">No matches in this round yet.</div>';
                return;
            }
            
            const currentRound = Math.max(...matches.map(m => m.roundNumber), 0);
            const currentMatches = matches.filter(m => m.roundNumber === currentRound);
            displayMatches(currentMatches);
        } else {
            console.error('Failed to load matches:', await response.text());
        }
    } catch (error) {
        console.error('Error loading matches:', error);
    }
}

function displayMatches(matches) {
    const container = document.getElementById('currentRoundMatches');
    container.innerHTML = '';

    if (matches.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No matches in this round yet.</div>';
        return;
    }

    matches.forEach(match => {
        const item = document.createElement('div');
        item.className = 'list-group-item';
        
        // Check for bye
        const isBye = match.player1.id === match.player2.id;
        
        if (isBye) {
            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="fw-bold">${match.player1.username}</span>
                        <span class="badge bg-secondary ms-2">BYE</span>
                    </div>
                    <div>
                        <span class="badge bg-success">Win (1.0)</span>
                    </div>
                </div>
            `;
        } else {
            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="fw-bold">${match.player1.username}</span>
                        vs
                        <span class="fw-bold">${match.player2.username}</span>
                    </div>
                    <div>
                        ${getMatchResultDisplay(match)}
                        ${isAdmin() ? `<button class="btn btn-sm btn-primary update-result" data-match-id="${match.id}">
                            Update Result
                        </button>` : ''}
                    </div>
                </div>
            `;
        }
        
        container.appendChild(item);

        // Add event listener for update result button
        const updateBtn = item.querySelector('.update-result');
        if (updateBtn) {
            updateBtn.addEventListener('click', () => openUpdateResultModal(match));
        }
    });
}

async function loadTournamentHistory() {
    try {
        const response = await fetch(`/api/tournaments/${tournament.id}/matches`);
        if (response.ok) {
            const matches = await response.json();
            if (matches.length === 0) {
                document.getElementById('tournamentHistory').innerHTML = 
                    '<div class="alert alert-info">No match history available yet.</div>';
                return;
            }
            
            // Group matches by round
            const roundsMap = new Map();
            matches.forEach(match => {
                if (!roundsMap.has(match.roundNumber)) {
                    roundsMap.set(match.roundNumber, []);
                }
                roundsMap.get(match.roundNumber).push(match);
            });
            
            // Sort rounds in descending order (newest first)
            const rounds = Array.from(roundsMap.keys()).sort((a, b) => b - a);
            
            displayRoundTabs(rounds, roundsMap);
        } else {
            console.error('Failed to load matches:', await response.text());
        }
    } catch (error) {
        console.error('Error loading tournament history:', error);
    }
}

function displayRoundTabs(rounds, roundsMap) {
    const tabsContainer = document.getElementById('roundTabs');
    const tabContentContainer = document.getElementById('roundTabContent');
    
    tabsContainer.innerHTML = '';
    tabContentContainer.innerHTML = '';
    
    rounds.forEach((round, index) => {
        // Create tab
        const tabItem = document.createElement('li');
        tabItem.className = 'nav-item';
        tabItem.innerHTML = `
            <button class="nav-link ${index === 0 ? 'active' : ''}" 
                id="round-${round}-tab" 
                data-bs-toggle="tab" 
                data-bs-target="#round-${round}" 
                type="button" 
                role="tab">
                Round ${round}
            </button>
        `;
        tabsContainer.appendChild(tabItem);
        
        // Create tab content
        const tabContent = document.createElement('div');
        tabContent.className = `tab-pane fade ${index === 0 ? 'show active' : ''}`;
        tabContent.id = `round-${round}`;
        tabContent.setAttribute('role', 'tabpanel');
        
        // Create table for matches in this round
        const table = document.createElement('table');
        table.className = 'table table-striped';
        
        // Table header
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Player 1</th>
                    <th>Result</th>
                    <th>Player 2</th>
                    <th>ELO Change</th>
                </tr>
            </thead>
            <tbody>
                ${roundsMap.get(round).map(match => {
                    let resultDisplay = 'Not Played';
                    let resultClass = '';
                    
                    if (match.result === 'PLAYER1_WIN') {
                        resultDisplay = 'Player 1 Wins';
                        resultClass = 'text-success fw-bold';
                    } else if (match.result === 'PLAYER2_WIN') {
                        resultDisplay = 'Player 2 Wins';
                        resultClass = 'text-success fw-bold';
                    } else if (match.result === 'DRAW') {
                        resultDisplay = 'Draw';
                        resultClass = 'text-primary fw-bold';
                    }
                    
                    // Check if it's a bye
                    if (match.player1.id === match.player2.id) {
                        return `
                            <tr>
                                <td>${match.player1.username}</td>
                                <td class="text-center"><span class="badge bg-secondary">BYE</span></td>
                                <td>-</td>
                                <td>+1 point</td>
                            </tr>
                        `;
                    }
                    
                    return `
                        <tr>
                            <td>${match.player1.username} (${match.player1.eloRating})</td>
                            <td class="text-center ${resultClass}">${resultDisplay}</td>
                            <td>${match.player2.username} (${match.player2.eloRating})</td>
                            <td>${match.result === 'NOT_PLAYED' ? '-' : formatScores(match)}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        `;
        
        tabContent.appendChild(table);
        tabContentContainer.appendChild(tabContent);
    });
}

function formatScores(match) {
    if (!match.player1Score && !match.player2Score) return '-';
    
    if (match.result === 'PLAYER1_WIN') {
        return `+${match.player1Score} / -${match.player2Score}`;
    } else if (match.result === 'PLAYER2_WIN') {
        return `-${match.player1Score} / +${match.player2Score}`;
    } else if (match.result === 'DRAW') {
        return `+${match.player1Score} / +${match.player2Score}`;
    }
    
    return '-';
}

async function loadStandings() {
    try {
        const response = await fetch(`/api/tournaments/${tournament.id}/standings`);
        if (response.ok) {
            const standings = await response.json();
            console.log('Standings:', standings);
            displayStandings(standings);
        } else {
            // Fall back to manual calculation if endpoint fails
            console.log('Falling back to manual standings calculation');
            const matchesResponse = await fetch(`/api/tournaments/${tournament.id}/matches`);
            if (matchesResponse.ok) {
                const matches = await matchesResponse.json();
                const standings = calculateStandings(matches);
                displayStandings(standings);
            }
        }
    } catch (error) {
        console.error('Error loading standings:', error);
    }
}

function calculateStandings(matches) {
    const standings = new Map();

    // Initialize standings for all players
    tournament.players.forEach(player => {
        standings.set(player.id, {
            player: player,
            score: 0,
            matches: 0
        });
    });

    // Calculate scores
    matches.forEach(match => {
        if (match.result === 'NOT_PLAYED') return;

        const player1Standing = standings.get(match.player1.id);
        const player2Standing = standings.get(match.player2.id);

        if (!player1Standing || !player2Standing) return;

        player1Standing.matches++;
        player2Standing.matches++;

        if (match.player1Score) player1Standing.score += match.player1Score;
        if (match.player2Score) player2Standing.score += match.player2Score;
    });

    // Convert to array and sort
    return Array.from(standings.values())
        .sort((a, b) => b.score - a.score || b.player.eloRating - a.player.eloRating);
}

function displayStandings(standings) {
    const container = document.getElementById('standings');
    container.innerHTML = '';

    if (!standings || standings.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No standings available yet.</div>';
        return;
    }

    // Add a winner banner if tournament is ended
    if (tournament.status === 'ENDED' && standings.length > 0) {
        const winner = standings[0].player;
        const winnerBanner = document.createElement('div');
        winnerBanner.className = 'alert alert-success text-center mb-3';
        winnerBanner.innerHTML = `
            <h4>Tournament Winner</h4>
            <h3>${winner.username}</h3>
            <p>Final Score: ${standings[0].score}</p>
        `;
        container.appendChild(winnerBanner);
    }

    // Display standings table
    const table = document.createElement('table');
    table.className = 'table table-striped';
    
    // Table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Score</th>
            <th>Rating</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Table body
    const tbody = document.createElement('tbody');
    standings.forEach((standing, index) => {
        const player = standing.player;
        const row = document.createElement('tr');
        
        // Highlight winner row if tournament is ended
        if (tournament.status === 'ENDED' && index === 0) {
            row.className = 'table-success';
        }
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${player.username}</td>
            <td>${standing.score}</td>
            <td>${player.eloRating}</td>
        `;
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
}

function loadPlayers() {
    if (!tournament || !tournament.players) {
        const container = document.getElementById('playersList');
        container.innerHTML = '<div class="alert alert-info">No players in this tournament.</div>';
        return;
    }
    
    displayPlayers();
}

function displayPlayers() {
    const container = document.getElementById('playersList');
    container.innerHTML = '';

    if (!tournament.players || tournament.players.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No players in this tournament.</div>';
        return;
    }

    // Create a table for players
    const table = document.createElement('table');
    table.className = 'table table-hover';
    
    // Table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Player</th>
            <th>ELO Rating</th>
            ${isAdmin() ? '<th>Actions</th>' : ''}
        </tr>
    `;
    table.appendChild(thead);
    
    // Table body
    const tbody = document.createElement('tbody');
    tournament.players.forEach(player => {
        const row = document.createElement('tr');
        
        if (isAdmin()) {
            row.innerHTML = `
                <td>${player.username}</td>
                <td>${player.eloRating}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-elo" data-player-id="${player.id}" 
                        data-player-name="${player.username}" data-player-elo="${player.eloRating}">
                        Edit ELO
                    </button>
                </td>
            `;
        } else {
            row.innerHTML = `
                <td>${player.username}</td>
                <td>${player.eloRating}</td>
            `;
        }
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
    
    // Add event listeners for edit ELO buttons
    if (isAdmin()) {
        document.querySelectorAll('.edit-elo').forEach(button => {
            button.addEventListener('click', () => openEditEloModal(
                button.getAttribute('data-player-id'),
                button.getAttribute('data-player-name'),
                button.getAttribute('data-player-elo')
            ));
        });
    }
}

function updateAdminControls() {
    // Show admin controls if current user is the tournament admin
    const adminControls = document.getElementById('adminControls');
    const adminPlayerControls = document.getElementById('adminPlayerControls');

    if (isAdmin()) {
        adminControls.style.display = 'block';
        adminPlayerControls.style.display = 'block';
        
        // Disable "Start Tournament" button if tournament is already started
        if (tournament.status !== 'PENDING') {
            document.getElementById('startTournamentBtn').disabled = true;
        }
        
        // Disable "Generate Next Round" button if tournament is not in progress
        if (tournament.status !== 'IN_PROGRESS') {
            document.getElementById('generatePairingsBtn').disabled = true;
        }
        
        // Disable "End Tournament" button if tournament is not in progress
        if (tournament.status !== 'IN_PROGRESS') {
            document.getElementById('endTournamentBtn').disabled = true;
        }
    }
}

async function startTournament(tournamentId) {
    try {
        const response = await fetch(`/api/tournaments/${tournamentId}/start`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            }
        });

        if (response.ok) {
            alert('Tournament started successfully!');
            loadTournamentDetails(tournamentId);
        } else {
            const error = await response.text();
            alert('Failed to start tournament: ' + error);
        }
    } catch (error) {
        alert('Error starting tournament: ' + error.message);
    }
}

async function generateNextRound(tournamentId) {
    try {
        const response = await fetch(`/api/tournaments/${tournamentId}/generate-round`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            }
        });

        if (response.ok) {
            alert('New round generated successfully!');
            loadTournamentDetails(tournamentId);
        } else {
            const error = await response.text();
            alert('Failed to generate round: ' + error);
        }
    } catch (error) {
        alert('Error generating round: ' + error.message);
    }
}

function openUpdateResultModal(match) {
    currentMatchId = match.id;
    
    // Set match players in the modal
    const matchPlayersElem = document.getElementById('matchPlayers');
    matchPlayersElem.innerHTML = `
        <p><strong>Player 1:</strong> ${match.player1.username}</p>
        <p><strong>Player 2:</strong> ${match.player2.username}</p>
    `;
    
    // Reset radio buttons
    document.querySelectorAll('input[name="result"]').forEach(radio => {
        radio.checked = false;
    });
    
    // Select current result if set
    if (match.result === 'PLAYER1_WIN') {
        document.getElementById('player1Win').checked = true;
    } else if (match.result === 'PLAYER2_WIN') {
        document.getElementById('player2Win').checked = true;
    } else if (match.result === 'DRAW') {
        document.getElementById('draw').checked = true;
    }
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('updateResultModal'));
    modal.show();
}

async function saveMatchResult() {
    if (!currentMatchId) return;
    
    const selectedResult = document.querySelector('input[name="result"]:checked')?.value;
    if (!selectedResult) {
        alert('Please select a result');
        return;
    }
    
    try {
        const response = await fetch(`/api/tournaments/matches/${currentMatchId}/result`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            },
            body: JSON.stringify({ result: selectedResult })
        });
        
        if (response.ok) {
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('updateResultModal')).hide();
            
            // Reload match data
            loadTournamentDetails(tournament.id);
            
            alert('Match result updated successfully!');
        } else {
            const error = await response.text();
            alert('Failed to update result: ' + error);
        }
    } catch (error) {
        alert('Error updating result: ' + error.message);
    }
}

async function searchPlayers(event) {
    const searchTerm = event.target.value.trim();
    if (searchTerm.length < 2) {
        document.getElementById('searchResults').innerHTML = '';
        return;
    }
    
    try {
        // Ideally this would search users by username, but we'll use a simple endpoint for now
        const response = await fetch(`/api/auth/search?username=${searchTerm}`);
        
        if (response.ok) {
            const players = await response.json();
            displaySearchResults(players);
        } else {
            document.getElementById('searchResults').innerHTML = '<div class="alert alert-danger">Error searching players</div>';
        }
    } catch (error) {
        console.error('Error searching players:', error);
        document.getElementById('searchResults').innerHTML = '<div class="alert alert-danger">Error searching players</div>';
    }
}

function displaySearchResults(players) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';
    
    if (!players || players.length === 0) {
        resultsContainer.innerHTML = '<div class="alert alert-info">No players found</div>';
        return;
    }
    
    players.forEach(player => {
        // Don't show players already in the tournament
        if (tournament.players.some(p => p.id === player.id)) return;
        
        const item = document.createElement('div');
        item.className = 'list-group-item';
        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>${player.username} (ELO: ${player.eloRating})</div>
                <button class="btn btn-sm btn-primary add-player" data-player-id="${player.id}">Add</button>
            </div>
        `;
        
        // Add click event for the Add button
        item.querySelector('.add-player').addEventListener('click', () => addPlayerToTournament(player.id));
        
        resultsContainer.appendChild(item);
    });
}

async function addPlayerToTournament(playerId) {
    try {
        const response = await fetch(`/api/tournaments/${tournament.id}/players/${playerId}`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            }
        });
        
        if (response.ok) {
            alert('Player added successfully!');
            bootstrap.Modal.getInstance(document.getElementById('addPlayerModal')).hide();
            
            // Clear search and results
            document.getElementById('playerSearch').value = '';
            document.getElementById('searchResults').innerHTML = '';
            
            // Reload tournament data
            loadTournamentDetails(tournament.id);
        } else {
            const errorText = await response.text();
            console.error('Failed to add player:', errorText);
            alert('Failed to add player: ' + (errorText || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error adding player:', error);
        alert('Error adding player: ' + error.message);
    }
}

function getTournamentIdFromUrl() {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1];
}

function isAdmin() {
    // For testing, allow everyone to be admin
    return true;
    // In production, check if current user is the tournament admin
    //return localStorage.getItem('userId') == tournament?.admin?.id;
}

function getCurrentUserId() {
    return localStorage.getItem('userId') || null;
}

function getMatchResultDisplay(match) {
    if (match.result === 'NOT_PLAYED') {
        return '<span class="badge bg-secondary">Not Played</span>';
    } else if (match.result === 'PLAYER1_WIN') {
        return `<span class="badge bg-success">Player 1 Wins (${match.player1Score} - ${match.player2Score})</span>`;
    } else if (match.result === 'PLAYER2_WIN') {
        return `<span class="badge bg-success">Player 2 Wins (${match.player1Score} - ${match.player2Score})</span>`;
    } else if (match.result === 'DRAW') {
        return `<span class="badge bg-primary">Draw (${match.player1Score} - ${match.player2Score})</span>`;
    }
    return '';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function endTournament(tournamentId) {
    if (!confirm('Are you sure you want to end this tournament? This will finalize all results and update player ratings.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/tournaments/${tournamentId}/end`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            }
        });

        if (response.ok) {
            alert('Tournament ended successfully!');
            loadTournamentDetails(tournamentId);
        } else {
            const error = await response.text();
            alert('Failed to end tournament: ' + error);
        }
    } catch (error) {
        alert('Error ending tournament: ' + error.message);
    }
}

function openEditEloModal(playerId, playerName, currentElo) {
    // Set player information in the modal
    document.getElementById('eloModalPlayerName').textContent = playerName;
    document.getElementById('eloRatingInput').value = currentElo;
    
    // Set player ID in the save button
    document.getElementById('saveEloBtn').setAttribute('data-player-id', playerId);
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('editEloModal'));
    modal.show();
}

async function updatePlayerElo() {
    const playerId = document.getElementById('saveEloBtn').getAttribute('data-player-id');
    const newElo = document.getElementById('eloRatingInput').value;
    
    if (!playerId || !newElo) {
        alert('Missing information');
        return;
    }
    
    try {
        const response = await fetch(`/api/auth/${playerId}/elo`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            },
            body: JSON.stringify({ eloRating: parseInt(newElo) })
        });
        
        if (response.ok) {
            // Close the modal
            bootstrap.Modal.getInstance(document.getElementById('editEloModal')).hide();
            
            // Reload tournament data
            loadTournamentDetails(tournament.id);
            
            alert('Player ELO updated successfully!');
        } else {
            const error = await response.text();
            alert('Failed to update ELO: ' + error);
        }
    } catch (error) {
        alert('Error updating ELO: ' + error.message);
    }
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