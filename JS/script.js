// Code by Get Code Snippets - https://getcodesnippets.com/ 

// Function to switch between forms
function switchForm(formId) {
    $(".form-tab-nav").removeClass("active");
    $(".form-tab-nav[data-id='" + formId + "']").addClass("active");
    $(".form-tab-content").removeClass("active");
    $("#" + formId).addClass("active");
    if (formId === "signup") {
        $(".form-title").html("<h2>Sign Up</h2>");
    } else {
        $(".form-title").html("<h2>Sign In</h2>");
    }
}

// Switch form tabs
jQuery(".form-tab-nav").on("click", function () {
    var dataId = $(this).data("id");
    switchForm(dataId);
});

// Switch to signup from link in login form
jQuery(".switch-to-signup").on("click", function () {
    switchForm("signup");
});

// Handle Login Form Submission
jQuery("#loginForm").on("submit", function (e) {
    e.preventDefault();
    
    var username = $("#loginUsername").val().trim();
    var password = $("#loginPassword").val();
    
    // Validation
    if (!username) {
        alert("Please enter your username or email");
        $("#loginUsername").focus();
        return false;
    }
    
    if (!password) {
        alert("Please enter your password");
        $("#loginPassword").focus();
        return false;
    }
    
    if (password.length < 6) {
        alert("Password must be at least 6 characters long");
        $("#loginPassword").focus();
        return false;
    }
    
    // Send data to server
    $.ajax({
        url: 'https://web-production-aa38e.up.railway.app/login',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            username: username,
            password: password
        }),
        success: function(response) {
            if (response.success) {
                alert(response.message);
                // Store user info in localStorage
                localStorage.setItem('userId', response.user.id);
                localStorage.setItem('username', response.user.username);
                // Clear form
                $("#loginForm")[0].reset();
                // Redirect to chat page (you can change this URL)
                window.location.href = 'chat.html';
            } else {
                alert(response.message);
            }
        },
        error: function(xhr) {
            var errorMessage = "Login failed";
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            } else if (xhr.status === 0) {
                errorMessage = "Cannot connect to server. Make sure Flask server is running.";
            }
            alert(errorMessage);
        }
    });
    
    return false;
});

// Handle Register Form Submission
jQuery("#registerForm").on("submit", function (e) {
    e.preventDefault();
    
    var username = $("#registerUsername").val().trim();
    var password = $("#registerPassword").val();
    var confirmPassword = $("#confirmPassword").val();
    
    // Validation
    if (!username) {
        alert("Please enter your username or email");
        $("#registerUsername").focus();
        return false;
    }
    
    // Email validation (basic)
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(username) && username.length < 3) {
        alert("Please enter a valid email address or username (at least 3 characters)");
        $("#registerUsername").focus();
        return false;
    }
    
    if (!password) {
        alert("Please enter your password");
        $("#registerPassword").focus();
        return false;
    }
    
    if (password.length < 6) {
        alert("Password must be at least 6 characters long");
        $("#registerPassword").focus();
        return false;
    }
    
    if (password !== confirmPassword) {
        alert("Passwords do not match");
        $("#confirmPassword").focus();
        return false;
    }
    
    // Send data to server
    $.ajax({
        url: 'https://web-production-aa38e.up.railway.app/register',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            username: username,
            password: password
        }),
        success: function(response) {
            if (response.success) {
                alert(response.message);
                // Clear form
                $("#registerForm")[0].reset();
                // Switch to login form
                switchForm("signin");
            } else {
                alert(response.message);
            }
        },
        error: function(xhr) {
            var errorMessage = "Registration failed";
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            } else if (xhr.status === 0) {
                errorMessage = "Cannot connect to server. Make sure Flask server is running.";
            }
            alert(errorMessage);
        }
    });
    
    return false;
});