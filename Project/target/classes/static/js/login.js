document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Hide any previous error
        document.getElementById('loginError').classList.add('d-none');
        
        // Submit login request
        fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Login failed');
            }
            return response.json();
        })
        .then(data => {
            console.log('Login successful:', data);
            
            // Store authentication token
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userId', data.userId || 1); // Default to 1 if userId not provided
            localStorage.setItem('username', data.username);
            
            // Redirect to home page or dashboard
            window.location.href = '/';
        })
        .catch(error => {
            console.error('Login error:', error);
            // Show error message
            document.getElementById('loginError').classList.remove('d-none');
        });
    });
}); 