import {communicator} from "./communicator.js";

function togglePasswordVisibility() {
    const passwordField = document.getElementById("password");

    if (document.getElementById("show-password").checked) {
        passwordField.type = "text";
    } 
    else {
        passwordField.type = "password";
    }
}

async function validateForm(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const keepSignedIn = document.getElementById("keep-signed-in").checked;
    const errorMessageDiv = document.getElementById("error-message");

    errorMessageDiv.textContent = ""; //clear prev msgs

    if (!username.trim()) {
        errorMessageDiv.textContent = "Username is required";
        return;
    }
    if (!password.trim()) {
        errorMessageDiv.textContent = "Password is required";
        return;
    }

    else {
        const response = await communicator.loginFromCredentials(username, password, keepSignedIn);
        if (response.status === "OK") {
            window.location.href = "projectDashboard.html";
        }
        else {
            //console.error("Login failed:", response.message);
            errorMessageDiv.textContent = response.message;
        }
    }
}

document.getElementById("show-password").onclick = togglePasswordVisibility;
document.querySelector("form").onsubmit = validateForm;