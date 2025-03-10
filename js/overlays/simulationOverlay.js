import {OverlayEditMenu} from "./overlay.js";
import {communicator} from "../communicator.js";

const overlayMenu = document.getElementById("playSimulationMenu-overlay");

const openMenu_button = document.getElementById("playButton");
const hideMenu_button = document.getElementById("hide-playSimulationMenu-overlay-button");

const physicsEngine_select = document.getElementById("selectPhysicsEngine");

const startPhimoLive_button = document.getElementById("startPhimoLive");
const stopPhimoLive_button = document.getElementById("stopPhimoLive");

const phimoCloud_menu = document.getElementById("phimoCloud-menu");
const phimoLive_menu = document.getElementById("phimoLive-menu");

const simulationList = document.getElementById("simulationList");
    
const openSimulationButton = document.getElementById("openSimulation");
const deleteSimulationButton = document.getElementById("deleteSimulation");
const renameSimulationButton = document.getElementById("renameSimulation");

const computeProgress_group = document.getElementById("computeProgress");

const compute_progressBar = document.getElementById("computeProgressBar-progress");
const approximateWaitTime_label = document.getElementById("compute-approximateWaitTime");
const computeProgress_text = document.getElementById("computeProgressText");

const stopComputing_button = document.getElementById("stopComputingButton");
const computeNewSimulation_button = document.getElementById("computeNewSimulationButton");

const simulationConfigs_group = document.getElementById("phimoCloud-simulationConfigs");
const deltaT_input = document.getElementById("deltaT");
const noOfFrames_input = document.getElementById("noOfFrames");
const stepsPerFrame_input = document.getElementById("stepsPerFrame");

const noOfFrames_live_input = document.getElementById("noOfFrames-inBuffer");
const stepsPerFrame_live_input = document.getElementById("stepsPerFrame-live");

const errorMessageDiv = document.getElementById("simulationMenu-error-message");


export class SimulationOverlay extends OverlayEditMenu {
    constructor(projectData, saveProjectData, startPhimoLiveCallback, stopPhimoLiveCallback, reconfigureBuffer) {
        super();

        this.projectData = projectData;
        this.saveProjectData = saveProjectData.bind(this);
        this.startPhimoLiveCallback = startPhimoLiveCallback.bind(this);
        this.stopPhimoLiveCallback = stopPhimoLiveCallback.bind(this);
        this.reconfigureBuffer = reconfigureBuffer.bind(this);

        this.phimoLive_running = false;

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

        this.configurePhysicsEngineMenu();
    }

    show() {
        super.show();

        overlayMenu.classList.remove("hidden");
        this.loadSimulations();
        document.addEventListener("keydown", this.keyEvents);

        if (this.phimoLive_running) {
            this.validateLiveSimConfigEntries();
        }
        else {
            this.validateCloudSimConfigEntries();
        }
    }

    hide() {
        super.hide();

        errorMessageDiv.textContent = ""; //clear prev msgs

        overlayMenu.classList.add("hidden");

        document.removeEventListener("keydown", this.keyEvents);
    }

    validateLiveSimConfigEntries() {
        errorMessageDiv.textContent = ""; //clear prev msgs
    
        const noOfFrames = parseInt(noOfFrames_live_input.value);
        if (isNaN(noOfFrames) || noOfFrames <= 0) {
            errorMessageDiv.textContent = "Number of frames must be a positive non-zero integer";
            return false;
        }
    
        const stepsPerFrame = parseInt(stepsPerFrame_live_input.value);
        if (isNaN(stepsPerFrame) || stepsPerFrame <= 0) {
            errorMessageDiv.textContent = "Number of steps per frame must be a positive non-zero integer";
            return false;
        }
    
        return true;
    }

    startPhimoLive() {
        if (! this.validateLiveSimConfigEntries()) {
            return;
        }

        this.projectData.noOfFrames = parseInt(noOfFrames_live_input.value);
        this.projectData.stepsPerFrame = parseInt(stepsPerFrame_live_input.value);

        startPhimoLive_button.classList.add("hidden");
        stopPhimoLive_button.classList.remove("hidden");
        this.phimoLive_running = true;

        this.hide();
        this.startPhimoLiveCallback();
    }

    stopPhimoLive() {
        stopPhimoLive_button.classList.add("hidden");
        startPhimoLive_button.classList.remove("hidden");
        this.phimoLive_running = false;
        this.stopPhimoLiveCallback();
    }

    configurePhysicsEngineMenu() {
        if (physicsEngine_select.value === "phimoCloud") {
            phimoLive_menu.classList.add("hidden");
            phimoCloud_menu.classList.remove("hidden");

            if (this.phimoLive_running) {
                this.stopPhimoLive();
            }
        }
        else {
            if (this.currentActiveWorkerId !== null) {
                const response = confirm("You have a simulating being computed. If you leave now, the simulation currently being computed will be terminated. Are you sure you want to switch engines?");

                if (! response) {
                    return;
                }

                this.stopComputingSimulation();
            }

            phimoCloud_menu.classList.add("hidden");
            phimoLive_menu.classList.remove("hidden");
        }
    }

    updateSimulationButtons() {
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
            errorMessageDiv.textContent = `Failed to load simulations: ${response.message}`;
            return;
        }
    
        simulationList.replaceChildren();
    
        for (const simulation of response.data) {
            if (simulation[0] !== this.currentComputingSimulationName) {
                const option = document.createElement("option");
                option.value = simulation;
                option.textContent = simulation;
                simulationList.appendChild(option);
            }
        }
    
        this.updateSimulationButtons();
    }

    async deleteSimulation() {
        const selectedSimulation = simulationList.value;
        const projectName = communicator.getProjNameFromUrl();
    
        const response = await communicator.deleteSimulation(projectName, selectedSimulation);
    
        if (response.status !== "OK") {
            errorMessageDiv.textContent = `Failed to delete simulation: ${response.message}`;
            return;
        }
    
        this.loadSimulations();
    }

    async renameSimulation() {
        const selectedSimulation = simulationList.value;
        const newSimulationName = prompt("Enter new simulation name:");
        const projectName = communicator.getProjNameFromUrl();
    
        const response = await communicator.renameSimulation(projectName, selectedSimulation, newSimulationName);
    
        if (response.status !== "OK") {
            errorMessageDiv.textContent = `Failed to rename simulation: ${response.message}`;
            return;
        }
    
        this.loadSimulations();
    }
    
    async updateComputingProgress() {
        const response = await communicator.getComputingProgress(this.currentActiveWorkerId);
    
        if (response.status !== "OK") {
            errorMessageDiv.textContent = `Failed to get simulation computing progress: ${response.message}`;
            return;
        }
    
        const progress = response.progress;
    
        if (progress === "COMPUTATION COMPLETE") {
            computeProgress_group.classList.add("hidden");
            stopComputing_button.classList.add("hidden");
            computeNewSimulation_button.classList.remove("hidden");
            simulationConfigs_group.classList.remove("hidden");
            this.currentActiveWorkerId = null;
            this.currentComputingSimulationName = null;
    
            compute_progressBar.style.width = "0%";
    
            this.loadSimulations();   
        } 
        else {            
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
    
            approximateWaitTime_label.textContent = waitTimeText;
    
            this.progressUpdateInterval = totalTimeEstimate / Math.cbrt(totalTimeEstimate);
            this.progressUpdateInterval = Math.round(this.progressUpdateInterval);
    
            compute_progressBar.style.transitionDuration = `${this.progressUpdateInterval}ms`;
    
            const progressPercentage = progress * 100;
    
            computeProgress_text.textContent = `${progressPercentage.toFixed(2)}%`;
    
            compute_progressBar.style.width = `${progressPercentage}%`;
    
            this.currentProgressTimeout = setTimeout(this.updateComputingProgress, this.progressUpdateInterval);
        }
    }
    
    async stopComputingSimulation() {
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
    
        computeProgress_group.classList.add("hidden");
        stopComputing_button.classList.add("hidden");
        computeNewSimulation_button.classList.remove("hidden");
        simulationConfigs_group.classList.remove("hidden");
    
        if (this.currentActiveWorkerId) {
            this.currentActiveWorkerId = null;
            this.loadSimulations();
        }
    }

    validateCloudSimConfigEntries() {
        errorMessageDiv.textContent = ""; //clear prev msgs
    
        const deltaT = parseFloat(deltaT_input.value);
        if (isNaN(deltaT) || deltaT <= 0) {
            errorMessageDiv.textContent = "Delta time must be a positive non-zero float";
            return false;
        }
    
        const noOfFrames = parseInt(noOfFrames_input.value);
        if (isNaN(noOfFrames) || noOfFrames <= 0) {
            errorMessageDiv.textContent = "Number of frames must be a positive non-zero integer";
            return false;
        }
    
        const stepsPerFrame = parseInt(stepsPerFrame_input.value);
        if (isNaN(stepsPerFrame) || stepsPerFrame <= 0) {
            errorMessageDiv.textContent = "Number of steps per frame must be a positive non-zero integer";
            return false;
        }
    
        return true;
    }

    async computeNewSimulation() {
        if (! this.validateCloudSimConfigEntries()) {
            return;
        }
    
        const projectName = communicator.getProjNameFromUrl();
    
        this.projectData.deltaT = parseFloat(deltaT_input.value);
        this.projectData.noOfFrames = parseInt(noOfFrames_input.value);
        this.projectData.stepsPerFrame = parseInt(stepsPerFrame_input.value);
    
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
    
        compute_progressBar.style.width = "0%";
    
        computeProgress_group.classList.remove("hidden");
        stopComputing_button.classList.remove("hidden");
        computeNewSimulation_button.classList.add("hidden");
        simulationConfigs_group.classList.add("hidden");
        
        this.progressUpdateInterval = 50;
        this.lastProgress = 0;
        this.start_t = Date.now();
        this.currentProgressTimeout = setTimeout(this.updateComputingProgress, this.progressUpdateInterval);
    }

    keyEvents(event) {
        if (event.key === "Escape") {
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

        openMenu_button.addEventListener("pointerup", this.show);
        hideMenu_button.addEventListener("pointerup", this.hide);
        overlayMenu.addEventListener("pointerup", (event) => {
            if (event.target === overlayMenu) {
                this.hide(); 
            }
        });

        simulationList.addEventListener("change", this.updateSimulationButtons.bind(this));
        stopComputing_button.addEventListener("pointerdown", this.stopComputingSimulation.bind(this));

        deltaT_input.addEventListener("input", this.validateCloudSimConfigEntries.bind(this));
        noOfFrames_input.addEventListener("input", this.validateCloudSimConfigEntries.bind(this));
        stepsPerFrame_input.addEventListener("input", this.validateCloudSimConfigEntries.bind(this));

        noOfFrames_live_input.addEventListener("input", () => {
            if (this.validateLiveSimConfigEntries()) {
                this.projectData.noOfFrames = parseInt(noOfFrames_live_input.value);
                this.reconfigureBuffer();
            }
        });
        stepsPerFrame_live_input.addEventListener("input", () => {
            if (this.validateLiveSimConfigEntries()) {
                this.projectData.noOfFrames = parseInt(stepsPerFrame_live_input.value);
            }
        });

        computeNewSimulation_button.addEventListener("pointerdown", this.computeNewSimulation.bind(this));

        startPhimoLive_button.addEventListener("pointerup", this.startPhimoLive.bind(this));
        stopPhimoLive_button.addEventListener("pointerup", this.stopPhimoLive.bind(this));

        physicsEngine_select.addEventListener("change", this.configurePhysicsEngineMenu.bind(this));
    }
}

