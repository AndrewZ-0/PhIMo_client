import {OverlayMenu} from "./overlay.js";
import {communicator} from "../communicator.js";

export class SimulationOverlay extends OverlayMenu {
    constructor(projectData, saveProjectData) {
        super();

        this.projectData = projectData;
        this.saveProjectData = saveProjectData.bind(this);

        this.currentActiveWorkerId = null;
        this.currentComputingSimulationName = null;
        
        this.progressUpdateInterval;
        this.currentProgressTimeout;
        this.lastProgress;
        this.start_t;

        this.updateComputingProgress = this.updateComputingProgress.bind(this);
        this.stopComputingSimulation = this.stopComputingSimulation.bind(this);
        this.deleteSimulation = this.deleteSimulation.bind(this);
        this.renameSimulation = this.renameSimulation.bind(this);

        this.bindPermanantEvents();
    }

    show() {
        super.show();

        document.getElementById("playSimulationMenu-overlay").classList.remove("hidden");
        this.loadSimulations();
        document.addEventListener("keydown", this.keyEvents);
        this.validateSimilationConfigEntries();
    }

    hide() {
        super.hide();

        const errorMessageDiv = document.getElementById("simulationMenu-error-message");
        errorMessageDiv.textContent = ""; //clear prev msgs

        document.getElementById("playSimulationMenu-overlay").classList.add("hidden");
        document.removeEventListener("keydown", this.keyEvents);
    }

    updateSimulationButtons() {
        const simulationList = document.getElementById("simulationList");
    
        const openSimulationButton = document.getElementById("openSimulation");
        const deleteSimulationButton = document.getElementById("deleteSimulation");
        const renameSimulationButton = document.getElementById("renameSimulation");
    
        if (simulationList.value !== "") {
            openSimulationButton.disabled = false;
            deleteSimulationButton.disabled = false;
            renameSimulationButton.disabled = false;
    
            openSimulationButton.addEventListener("pointerdown", this.openSimulation);
            deleteSimulationButton.addEventListener("pointerdown", this.deleteSimulation);
            renameSimulationButton.addEventListener("pointerdown", this.renameSimulation);
        }
        else {
            openSimulationButton.disabled = true;
            deleteSimulationButton.disabled = true;
            renameSimulationButton.disabled = true;
    
            openSimulationButton.removeEventListener("pointerdown", this.openSimulation);
            deleteSimulationButton.removeEventListener("pointerdown", this.deleteSimulation);
            renameSimulationButton.removeEventListener("pointerdown", this.renameSimulation);
        }
    }

    async openSimulation() {
        const simulationList = document.getElementById("simulationList");
        const selectedSimulation = simulationList.value;
        const projectName = communicator.getProjNameFromUrl();
    
        let serverQuery = communicator.getServerQuery();
        if (serverQuery !== "") {
            serverQuery += "&";
        }
        else {
            serverQuery = "?";
        }
    
        await communicator.updateAccessSimulationTime(projectName, selectedSimulation);
        window.location.href = "simulationPlayer.html" + serverQuery + `project=${projectName}&simulation=${selectedSimulation}`;
    }

    async loadSimulations() {
        const projectName = communicator.getProjNameFromUrl();
        const response = await communicator.list_project_simulations(projectName);
    
        if (response.status !== "OK") {
            const errorMessageDiv = document.getElementById("simulationMenu-error-message");
            errorMessageDiv.textContent = `Failed to load simulations: ${response.message}`;
            return;
        }
    
        const simulationList = document.getElementById("simulationList");
        simulationList.replaceChildren();
    
        for (const simulation of response.data) {
            const option = document.createElement("option");
            option.value = simulation;
            option.textContent = simulation;
            simulationList.appendChild(option);
        }
    
        this.updateSimulationButtons();
    }

    async deleteSimulation() {
        const simulationList = document.getElementById("simulationList");
        const selectedSimulation = simulationList.value;
        const projectName = communicator.getProjNameFromUrl();
    
        const response = await communicator.deleteSimulation(projectName, selectedSimulation);
    
        if (response.status !== "OK") {
            const errorMessageDiv = document.getElementById("simulationMenu-error-message");
            errorMessageDiv.textContent = `Failed to delete simulation: ${response.message}`;
            return;
        }
    
        this.loadSimulations();
    }

    async renameSimulation() {
        const simulationList = document.getElementById("simulationList");
        const selectedSimulation = simulationList.value;
        const newSimulationName = prompt("Enter new simulation name:");
        const projectName = communicator.getProjNameFromUrl();
    
        const response = await communicator.renameSimulation(projectName, selectedSimulation, newSimulationName);
    
        if (response.status !== "OK") {
            const errorMessageDiv = document.getElementById("simulationMenu-error-message");
            errorMessageDiv.textContent = `Failed to rename simulation: ${response.message}`;
            return;
        }
    
        this.loadSimulations();
    }
    
    async updateComputingProgress() {
        const response = await communicator.getComputingProgress(this.currentActiveWorkerId);
    
        if (response.status !== "OK") {
            const errorMessageDiv = document.getElementById("simulationMenu-error-message");
            errorMessageDiv.textContent = `Failed to get simulation computing progress: ${response.message}`;
            return;
        }
    
        const progress = response.progress;
    
        if (progress === "COMPUTATION COMPLETE") {
            document.getElementById("computeProgress").classList.add("hidden");
            document.getElementById("stopComputingButton").classList.add("hidden");
            document.getElementById("computeNewSimulationButton").classList.remove("hidden");
            document.getElementById("simulationConfigs").classList.remove("hidden");
            this.currentActiveWorkerId = null;
            this.currentComputingSimulationName = null;
    
            document.getElementById("computeProgressBar-progress").style.width = "0%";
    
            this.loadSimulations();   
        } 
        else {
            const progressBar = document.getElementById("computeProgressBar-progress");
            
            const deltaProgress = progress - this.lastProgress;
    
            this.lastProgress = progress;
    
            const expectedComputeTime = (1 - progress) / deltaProgress * this.progressUpdateInterval;
            const days = Math.floor(expectedComputeTime / 86400000);
            const hours = Math.floor((expectedComputeTime % 86400000) / 3600000);
            const minutes = Math.floor((expectedComputeTime % 3600000) / 60000);
            const seconds = Math.floor((expectedComputeTime % 60000) / 1000);
    
            const totalTimeEstimate = (Date.now() - this.start_t) / progress;
    
            let waitTimeText = "Approx wait time: ";
            if (days > 0) {
                waitTimeText += `${days}d ${hours}h ${minutes}m `;
            }
            else if (hours > 0) { 
                waitTimeText += `${hours}h ${minutes}m `;
            }
            else if (minutes > 0) {
                waitTimeText += `${minutes}m `;
            }
            waitTimeText += `${seconds}s`;
    
            document.getElementById("compute-approximateWaitTime").textContent = waitTimeText;
    
    
            this.progressUpdateInterval = totalTimeEstimate / Math.cbrt(totalTimeEstimate);
            this.progressUpdateInterval = Math.round(this.progressUpdateInterval);
    
            progressBar.style.transitionDuration = `${this.progressUpdateInterval}ms`;
    
            const progressPercentage = progress * 100;
    
            document.getElementById("computeProgressText").textContent = `${progressPercentage.toFixed(2)}%`;
    
            progressBar.style.width = `${progressPercentage}%`;
    
            this.currentProgressTimeout = setTimeout(this.updateComputingProgress, this.progressUpdateInterval);
        }
    }
    
    async stopComputingSimulation() {
        const errorMessageDiv = document.getElementById("simulationMenu-error-message");
        errorMessageDiv.textContent = ""; //clear prev msgs
    
        const projectName = communicator.getProjNameFromUrl();
    
        const response = await communicator.stopComputing(
            projectName, this.currentComputingSimulationName, this.currentActiveWorkerId
        );
    
        if (response.status !== "OK") {
            errorMessageDiv.textContent = `Failed to stop Computing: ${response.message}`;
            return;
        }
    
        this.currentComputingSimulationName = null;
    
        clearTimeout(this.currentProgressTimeout);
    
        document.getElementById("computeProgress").classList.add("hidden");
        document.getElementById("stopComputingButton").classList.add("hidden");
        document.getElementById("computeNewSimulationButton").classList.remove("hidden");
        document.getElementById("simulationConfigs").classList.remove("hidden");
    
        if (this.currentActiveWorkerId) {
            this.currentActiveWorkerId = null;
            this.loadSimulations();
        }
    }

    validateSimilationConfigEntries() {
        const errorMessageDiv = document.getElementById("simulationMenu-error-message");
        errorMessageDiv.textContent = ""; //clear prev msgs
    
        const deltaT_inp = document.getElementById("deltaT");
        const deltaT = parseFloat(deltaT_inp.value);
        if (isNaN(deltaT) || deltaT <= 0) {
            errorMessageDiv.textContent = "Delta time must be a positive non-zero float";
            return false;
        }
    
        const noOfFrames_inp = document.getElementById("noOfFrames");
        const noOfFrames = parseInt(noOfFrames_inp.value);
        if (isNaN(noOfFrames) || noOfFrames <= 0) {
            errorMessageDiv.textContent = "Number of frames must be a positive non-zero integer";
            return false;
        }
    
        const stepsPerFrame_inp = document.getElementById("stepsPerFrame");
        const stepsPerFrame = parseInt(stepsPerFrame_inp.value);
        if (isNaN(stepsPerFrame) || stepsPerFrame <= 0) {
            errorMessageDiv.textContent = "Number of steps per frame must be a positive non-zero integer";
            return false;
        }
    
        return true;
    }

    async createAndComputeNewSimulation() {
        const errorMessageDiv = document.getElementById("simulationMenu-error-message");
        if (! this.validateSimilationConfigEntries()) {
            return;
        }
    
        const projectName = communicator.getProjNameFromUrl();
    
        this.projectData.deltaT = parseFloat(document.getElementById("deltaT").value);
        this.projectData.noOfFrames = parseInt(document.getElementById("noOfFrames").value);
        this.projectData.stepsPerFrame = parseInt(document.getElementById("stepsPerFrame").value);
    
        this.saveProjectData();
    
        const newSimulationName = prompt("Enter new simulation name:");
    
        if (newSimulationName === "") {
            errorMessageDiv.textContent = "No name provided for new simulation.";
            return;
        }
        if (newSimulationName === null) {
            return; //exited prompt
        }
    
        const response = await communicator.startComputing(projectName, newSimulationName);
    
        if (response.status !== "OK") {
            errorMessageDiv.textContent = `Failed to start computing simulation: ${response.message}`;
            return;
        }
    
        this.currentComputingSimulationName = newSimulationName;
        this.currentActiveWorkerId = response.workerId;
    
        document.getElementById("computeProgressBar-progress").style.width = "0%";
    
        document.getElementById("computeProgress").classList.remove("hidden");
        document.getElementById("stopComputingButton").classList.remove("hidden");
        document.getElementById("computeNewSimulationButton").classList.add("hidden");
        document.getElementById("simulationConfigs").classList.add("hidden");
        
        this.progressUpdateInterval = 150;
        this.lastProgress = 0;
        this.start_t = Date.now();
        this.currentProgressTimeout = setTimeout(this.updateComputingProgress, this.progressUpdateInterval);
    }

    keyEvents(event) {
        if (event.key === "Escape") {
            const simulationList = document.getElementById("simulationList");
            if (simulationList.value !== "") {
                simulationList.value = "";
                this.updateSimulationButtons();
            }
            else {
                this.hide();
            }
        }
    }

    bindPermanantEvents() {
        super.bindPermanantEvents();

        document.getElementById("playButton").addEventListener("pointerdown", this.show.bind(this));
        document.getElementById("hide-playSimulationMenu-overlay-button").addEventListener("pointerup", this.hide.bind(this));
        document.getElementById("simulationList").addEventListener("change", this.updateSimulationButtons.bind(this));
        document.getElementById("stopComputingButton").addEventListener("pointerdown", this.stopComputingSimulation.bind(this));

        document.getElementById("deltaT").addEventListener("input", this.validateSimilationConfigEntries.bind(this));
        document.getElementById("noOfFrames").addEventListener("input", this.validateSimilationConfigEntries.bind(this));
        document.getElementById("stepsPerFrame").addEventListener("input", this.validateSimilationConfigEntries.bind(this));

        document.getElementById("computeNewSimulationButton").addEventListener("pointerdown", this.createAndComputeNewSimulation.bind(this));
    }
}

