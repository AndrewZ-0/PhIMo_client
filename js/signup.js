import {communicator} from "./communicator.js";

async function handleSignup(event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password1 = document.getElementById("password1").value.trim();
    const password2 = document.getElementById("password2").value.trim();
    const email = document.getElementById("email").value.trim();
    const errorMessageDiv = document.getElementById("error-message");

    errorMessageDiv.textContent = "";

    if (!email) {
        errorMessageDiv.textContent = "Email is required";
        return;
    }
    const emailResponse = await communicator.validateEmail(email);
    if (emailResponse.status !== "OK") {
        //console.error("Email validation failed:", emailResponse.message);
        errorMessageDiv.textContent = emailResponse.message;  
        return;
    }

    if (!username) {
        errorMessageDiv.textContent = "Username is required";
        return;
    }
    const usernameResponse = await communicator.validateUsername(username);
    if (usernameResponse.status !== "OK") {
        errorMessageDiv.textContent = usernameResponse.message;
        return;  
    }

    if (!password1) {
        errorMessageDiv.textContent = "Password is required";
        return;
    }
    if (password1 !== password2) {
        errorMessageDiv.textContent = "Passwords do not match";
        return;
    }
    const passwordResponse = await communicator.validatePassword(password1);
    if (passwordResponse.status !== "OK") {
        errorMessageDiv.textContent = passwordResponse.message; 
        return; 
    }

    const signupResponse = await communicator.signup(username, password1, email);
    if (signupResponse.status === "OK") {
        await communicator.logout();
        window.location.href = "login.html";
    } 
    else {
        //console.error("Signup failed:", signupResponse.message);
        errorMessageDiv.textContent = signupResponse.message;
    }
}

document.querySelector("form").onsubmit = handleSignup;
