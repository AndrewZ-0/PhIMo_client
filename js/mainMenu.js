import {communicator} from "./communicator.js";

async function handleLogin() {
    const response = await communicator.loginFromCookies();

    const serverQuery = communicator.getServerQuery();
    
    if (response.status === "OK" && response.certFound) {
        window.location.href = "projectDashboard.html" + serverQuery;
    }
    else {
        window.location.href = "login.html" + serverQuery;
    }
}

document.getElementById("loginButton").onclick = handleLogin;


function handleSignup() {
    const serverQuery = communicator.getServerQuery();
    location.href = "signup.html" + serverQuery;
}

document.getElementById("signupButton").onclick = handleSignup;