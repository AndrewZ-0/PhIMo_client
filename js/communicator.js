class Communicator {
    constructor() {
        this.ip = "https://phimo.ddns.net:1234";

        //changed the way the communicator handles certificates. Communicator now stores certificate locally.
        //communicator relys on session storage to maintain cert across pages
        this.certificate = null; 
    }

    async loginFromSessionStorage() {
        const certificate = sessionStorage.getItem("certificate");

        if (certificate) {
            //check if certificate is currupted/not accepted by server (is server clears db for instance)
            const response = await this.validateCertificate(certificate);

            if (response.staus === "ERR") {
                return response; //cert invalid or cannot connect to server
            }

            this.certificate = certificate;
            return {status: "OK"}; //cert valid
        }
        else {
            //if no certificate is found
            return {status: "ERR", message: "No certificate found"};
        }
    }

    async loginFromCookies() {
        const response = await this.getCertificateFromCookies();
    
        if (response.status !== "OK") {
            return {status: "ERR", message: response.message};
        }

        const certificate = response.certificate;
    
        if (certificate) {
            //check if certificate is valid
            const response = await communicator.validateCertificate(certificate);

            if (response.status === "OK") {
                sessionStorage.setItem("certificate", certificate);
                this.certificate = certificate;
                return {status: "OK", certFound: true};
            }
            else {
                //cert invalid or cannot connect to server
                return {status: "ERR", certFound: true, message: `invalid certificate: ${response.message}`};
            }
        }
        else {
            return {status: "OK", certFound: false};
        }
    }

    async loginFromCredentials(username, password, keepSignedIn) {
        const response = await this.submitData("login", {username, password, keepSignedIn});

        if (response.status === "OK") {
            sessionStorage.setItem("certificate", response.certificate);
            this.certificate = response.certificate;

            return {status: "OK"};
        }

        //failed to log in
        return response;
    }

    async connect() {
        try {
            const response = await fetch(`${this.ip}/connect`);
            if (response.ok) {
                //console.log("Connected to server");
                return true;
            } 
            else {
                console.error("Failed to connect to server");
                return false;
            }
        } 
        catch (error) {
            console.error("Error connecting to server:", error);
            return false;
        }
    }

    async submitData(typeOfFetch, data, addCertificate = false) {
        const connected = await this.connect();

        if (!connected) {
            return {status: "ERR", message: "Failed to connect to server"};
        }

        let headers = {
            "Content-Type": "application/json"
        };

        if (addCertificate) {
            headers.certificate = this.certificate;
        }

        const response = await fetch(`${this.ip}/${typeOfFetch}`, {
            method: "POST",
            headers: headers,
            credentials: "include", //different system to cert
            body: JSON.stringify(data)
        });

        return await response.json();
    }

    async fetchData(typeOfFetch, data, addCertificate = false) {
        const connected = await this.connect();

        if (!connected) {
            return {status: "ERR", message: "Failed to connect to server"};
        }

        let headers = {
            "Content-Type": "application/json",
            ...data
        };

        if (addCertificate) {
            headers.certificate = this.certificate;
        }
        
        const response = await fetch(`${this.ip}/${typeOfFetch}`, {
            method: "GET",
            headers: headers,
            credentials: "include"  //different system to cert
        });

        return await response.json();
    }

    async signup(username, password, email) {
        return await this.submitData("signup", {username, password, email});
    }

    async validateEmail(email) {
        return await this.submitData("validate_email", {email});
    }

    async validateUsername(username) {
        return await this.submitData("validate_username", {username});
    }

    async validatePassword(password) {
        return await this.submitData("validate_password", {password});
    }

    async validateCertificate(certificate) {
        return await this.submitData("validate_certificate", {certificate});
    }

    async create_project(projectName, filePath) {
        return await this.submitData("create_project", {projectName, filePath}, true);
    }

    async delete_project(projectName) {
        return await this.submitData("delete_project", {projectName}, true);
    }

    async rename_project(oldProjectName, newProjectName) {
        return await this.submitData("rename_project", {oldProjectName, newProjectName}, true);
    }

    async logout() {
        this.certificate = null;
        sessionStorage.removeItem("certificate");
        //decided to keep the server side cookie clearing request till last 
        //It makes most sense that if users want to log out, the communicator will clear out as much as it can (locally)
        return await this.submitData("logout", {});
    }

    async listProjects() {
        return await this.fetchData("listProjects", {}, true);
    }

    async getProjectData(projectName) {
        return await this.fetchData("get_projectData", {projectName}, true);
    }

    async updateAccessProjectTime(projectName) {
        return await this.submitData("update_accessProjectTime", {projectName}, true);
    }

    async updateAccessSimulationTime(projectName, simulationName) {
        return await this.submitData("update_accessSimulationTime", {projectName, simulationName}, true);
    }

    async getSimConfig(projectName) {
        return await this.fetchData("get_simConfig", {projectName}, true);
    }

    async getSettings(projectName) {
        return await this.fetchData("get_settings", {projectName}, true);
    }

    async getCertificateFromCookies() {
        return await this.fetchData("get_certificateCookie", {});
    }

    async updateProjectData(projectName, simConfig, settingsData, screenshot) {
        return await this.submitData("update_projectData", {projectName, simConfig, settingsData, screenshot}, true);
    }

    //can't use a standardised fetch request since data is not a json
    async getProjectScreenshot(projectName) {
        const connected = await this.connect();

        if (!connected) {
            return {status: "ERR", message: "Failed to connect to server"};
        }

        const headers = {
            "Content-Type": "application/json",
            certificate: this.certificate, 
            projectName
        };
        
        const response = await fetch(`${this.ip}/get_projectScreenshot`, {
            method: "GET",
            headers: headers,
            credentials: "include"  //different system to cert
        });

        if (!response.status) { //dumb solution to an even dumber problem
            return {status: "ERR", message: "Failed to fetch project screenshot"};
        }

        const blob = await response.blob();
        return {status: "OK", image: URL.createObjectURL(blob)};
    }

    async list_project_simulations(projectName) {
        return await this.fetchData("list_project_simulations", {projectName}, true);
    }

    async deleteSimulation(projectName, simulationName) {
        return await this.submitData("delete_simulation", {projectName, simulationName}, true);
    }

    async renameSimulation(projectName, oldSimulationName, newSimulationName) {
        return await this.submitData("rename_simulation", {projectName, oldSimulationName, newSimulationName}, true);
    }

    async startComputing(projectName, simulationName) {
        return await this.submitData("compute_simulation", {projectName, simulationName}, true);
    }

    async stopComputing(projectName, simulationName, workerId) {
        return await this.submitData("stop_computing_simulation", {projectName, simulationName, workerId}, true);
    }

    async getComputingProgress(workerId) {
        return await this.fetchData("get_simComputing_progress", {workerId}, true);
    }

    async getSimulationData(projectName, simulationName) {
        return await this.fetchData("get_simulationData", {projectName, simulationName}, true)
    }

    async listSolvers() {
        return await this.fetchData("list_solvers", {}, true)
    }

    async streamSimulationFramesFile(projectName, simulationName) {
        const connected = await this.connect();

        if (!connected) {
            return {status: "ERR", message: "Failed to connect to server"};
        }

        const headers = {
            "Content-Type": "application/json",
            certificate: this.certificate, 
            projectName, simulationName
        };
        
        const response = await fetch(`${this.ip}/stream_simulationFramesFile`, {
            method: "GET",
            headers: headers,
            credentials: "include"  //different system to cert
        });

        //if response is a json, it is an error message
        if (response.headers.get("Content-Type").includes("application/json")) {
            return await response.json();
        }

        //if the response is OK, the data should be a text stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let frames = "";

        while (!done) {
            const {done: streamDone, value: chunk} = await reader.read();
            done = streamDone;

            frames += decoder.decode(chunk, {stream: true});
        }

        return {status: "OK", frames};
    }

    getProjNameFromUrl() {
        return new URLSearchParams(window.location.search).get("project");
    }

    getSimNameFromUrl() {
        return new URLSearchParams(window.location.search).get("simulation");
    }
}

export const communicator = new Communicator();
