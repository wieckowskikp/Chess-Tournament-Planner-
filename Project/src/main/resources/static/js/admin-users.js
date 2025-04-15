// Global variables
let users = [];
let currentPage = 1;
const usersPerPage = 10;

document.addEventListener('DOMContentLoaded', () => {
    // Initial load
    loadAllUsers();
    
    // Set up event listeners
    document.getElementById('searchButton').addEventListener('click', searchUsers);
    document.getElementById('userSearchInput').addEventListener('keyup', e => {
        if (e.key === 'Enter') searchUsers();
    });
    document.getElementById('saveEloBtn').addEventListener('click', updatePlayerElo);
});

async function loadAllUsers() {
    try {
        const response = await fetch('/api/auth/admin/users', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            }
        });
        
        if (response.ok) {
            users = await response.json();
            displayUsers(users);
        } else {
            showError('Failed to load users');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Error loading users: ' + error.message);
    }
}

function searchUsers() {
    const searchTerm = document.getElementById('userSearchInput').value.toLowerCase();
    
    if (!searchTerm) {
        displayUsers(users); // Show all users if search is empty
        return;
    }
    
    const filtered = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm) || 
        user.email.toLowerCase().includes(searchTerm)
    );
    
    displayUsers(filtered);
}

function displayUsers(usersToDisplay) {
    const tableBody = document.getElementById('usersTableBody');
    tableBody.innerHTML = '';
    
    if (!usersToDisplay || usersToDisplay.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No users found</td>
            </tr>
        `;
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(usersToDisplay.length / usersPerPage);
    const startIndex = (currentPage - 1) * usersPerPage;
    const paginatedUsers = usersToDisplay.slice(startIndex, startIndex + usersPerPage);
    
    // Create table rows
    paginatedUsers.forEach(user => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.eloRating}</td>
            <td>${formatRoles(user.roles)}</td>
            <td>
                <button class="btn btn-sm btn-primary edit-elo" 
                    data-user-id="${user.id}" 
                    data-username="${user.username}"
                    data-elo="${user.eloRating}">
                    Edit ELO
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Set up edit ELO button event listeners
    document.querySelectorAll('.edit-elo').forEach(button => {
        button.addEventListener('click', () => {
            openEditEloModal(
                button.getAttribute('data-user-id'),
                button.getAttribute('data-username'),
                button.getAttribute('data-elo')
            );
        });
    });
    
    // Update pagination controls
    updatePagination(usersToDisplay.length, totalPages);
}

function formatRoles(roles) {
    if (!roles || roles.length === 0) return 'No roles';
    
    return roles.map(role => {
        // Format role name (e.g., 'ROLE_ADMIN' -> 'Admin')
        return role.replace('ROLE_', '').toLowerCase()
            .replace(/\b\w/g, char => char.toUpperCase());
    }).join(', ');
}

function updatePagination(totalItems, totalPages) {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Users pagination');
    
    const ul = document.createElement('ul');
    ul.className = 'pagination';
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Previous">
            <span aria-hidden="true">&laquo;</span>
        </a>
    `;
    prevLi.addEventListener('click', e => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            searchUsers();
        }
    });
    ul.appendChild(prevLi);
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', e => {
            e.preventDefault();
            currentPage = i;
            searchUsers();
        });
        ul.appendChild(li);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Next">
            <span aria-hidden="true">&raquo;</span>
        </a>
    `;
    nextLi.addEventListener('click', e => {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            searchUsers();
        }
    });
    ul.appendChild(nextLi);
    
    nav.appendChild(ul);
    paginationContainer.appendChild(nav);
}

function openEditEloModal(userId, username, currentElo) {
    document.getElementById('eloModalPlayerName').textContent = username;
    document.getElementById('eloRatingInput').value = currentElo;
    document.getElementById('saveEloBtn').setAttribute('data-user-id', userId);
    
    const modal = new bootstrap.Modal(document.getElementById('editEloModal'));
    modal.show();
}

async function updatePlayerElo() {
    const userId = document.getElementById('saveEloBtn').getAttribute('data-user-id');
    const newElo = document.getElementById('eloRatingInput').value;
    
    if (!userId || !newElo) {
        alert('Missing information');
        return;
    }
    
    try {
        const response = await fetch(`/api/auth/${userId}/elo`, {
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
            
            // Update the local users array with the new ELO rating
            const userIndex = users.findIndex(u => u.id.toString() === userId);
            if (userIndex >= 0) {
                users[userIndex].eloRating = parseInt(newElo);
                displayUsers(users);
            }
            
            showSuccess('Player ELO updated successfully!');
        } else {
            const error = await response.text();
            showError('Failed to update ELO: ' + error);
        }
    } catch (error) {
        showError('Error updating ELO: ' + error.message);
    }
}

function showError(message) {
    alert(message); // Replace with a more sophisticated error handling if needed
}

function showSuccess(message) {
    alert(message); // Replace with a more sophisticated success handling if needed
} 