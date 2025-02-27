import {GraphicsEngine} from "../AGRE/src/app.js";
import {masterRenderer} from "../AGRE/src/core/renderer.js";
import {Sphere, Plane} from "../AGRE/src/objects/objects.js";
import {communicator} from "./communicator.js";
import {calculateScaledFidelity} from "../AGRE/src/utils/renderProperties.js";
import {
    bindAllControls, bindCameraCallbacks, 
    unbindAllKeyControls, unbindCameraCallbacks, 
    quickReleaseKeys
} from "../AGRE/src/core/listeners.js";
import {FPS} from "../AGRE/src/core/clock.js";
import {toggleTab} from "./tabMenu.js";
import {FindObjectOverlay} from "./overlays/findObjectOverlay.js";
import {CameraOverlay} from "./overlays/cameraOverlay.js";
import {camera, setDraggingSensitivity, setCameraMovementSpeed, setCameraMode} from "../AGRE/src/core/camera.js";


function returnToWorkbench() {
    let serverQuery = communicator.getServerQuery();
    if (serverQuery !== "") {
        serverQuery += "&";
    }
    else {
        serverQuery = "?";
    }
    const projectName = communicator.getProjNameFromUrl();
    window.location.href = "projectWorkbench.html" + serverQuery + `project=${projectName}`;
}

document.getElementById("titleBarReturnButton").addEventListener("pointerdown", returnToWorkbench);

let ge;
let simConfig = {};
let settingsData = {};
let objectHeaders;
let frames = [];
let objectLookup = {};
let cameraOverlay;
let findObjectOverlay;

let delta_t;

function parseFramesString(framesString) {
    const lines = framesString.split("\n");

    let headers = lines[0].split(" "); //first line always contains the object headers
    
    if (headers[0] === "" && headers.length === 1) {
        headers = [];
    }

    const frames = [];

    for (let i = 1; i < lines.length; i++) {
        let frame = [];
        const values = lines[i].trim().split(" ");
        for (let j = 0; j < values.length; j += 6) {
            let object = [];
            for (let k = j; k < j + 6; k++) {
                object.push(parseFloat(values[k]));
            }
            frame.push(object);
        }
        frames.push(frame);
    }

    return {headers, frames};
}


async function loadData() {
    const projectName = communicator.getProjNameFromUrl();
    const simulationName = communicator.getSimNameFromUrl();
    console.log("Opening simulation:", `${projectName}::${simulationName}`);
    
    document.getElementById("titlebar-simulation-name").textContent = `${projectName}::${simulationName}`;

    const projectData = await communicator.getSimulationData(projectName, simulationName);

    if (projectData.status !== "OK") {
        console.error("Failed to load project data:", projectData.message);
        return;
    }

    simConfig = projectData.data.simConfig;
    settingsData = projectData.data.settings;


    //const projectData = await communicator.getSimulationFrames(projectName, simulationName);
    const frameFileStreamResponse = await communicator.streamSimulationFramesFile(projectName, simulationName);

    if (frameFileStreamResponse.status !== "OK") {
        console.error("Failed to stream simulaiton frames:", frameFileStreamResponse.message);
        return;
    }


    const response = parseFramesString(frameFileStreamResponse.frames);

    objectHeaders = response.headers;
    frames = response.frames;

    console.log(simConfig);
    //console.log(frames);

    //frames = projectData.data.frames;

    //console.log(frames);
    let objects = [];
    for (let objectName in simConfig.objects) {
        if (simConfig.objects[objectName].dtype === 0) {
            const obj = simConfig.objects[objectName];

            const colour = obj.colour;

            const radius = obj.radius;
            const fidelity = calculateScaledFidelity(radius);

            objects.push(new Sphere(objectName, ...obj.position, radius, fidelity, colour)); 
        }
        else if (simConfig.objects[objectName].dtype === 1) {
            const obj = simConfig.objects[objectName];

            const colour = obj.colour;

            objects.push(new Plane(objectName, ...obj.position, ...obj.dimentions, ...obj.orientation, colour)); 
        }
    }

    //to prevent setting camera mode from overwriting intial one in setting data
    const initialCameraPose = settingsData.camera.pose;

    ge = new GraphicsEngine(objects);
    ge.start();

    for (const obj of masterRenderer.objects) {
        objectLookup[obj.name] = obj;
    }

    delta_t = simConfig.deltaT;

    updateProgressBar(0, 0); 
    updateTiming(0, (frames.length - 1) * delta_t);


    setDraggingSensitivity(settingsData.camera.sensitivity.draggingSensitivity);
    setCameraMovementSpeed(settingsData.camera.sensitivity.movementSpeed);

    setCameraModeRadio(settingsData.camera.mode);
    
    setCameraMode(settingsData.camera.mode);
    camera.setPose(initialCameraPose);

    setShaderModeRadio(settingsData.shaders.mode);
    masterRenderer.setShaderMode(settingsData.shaders.mode);


    cameraOverlay = new CameraOverlay(ge, settingsData, markUnsavedChanges);
    
    cameraOverlay.bindShowCallback(showCameraConfigMenuOverlay);
    cameraOverlay.bindHideCallback(hideCameraConfigMenuOverlay);

    findObjectOverlay = new FindObjectOverlay();
    findObjectOverlay.bindShowCallback(showFindObjectCallback);
    findObjectOverlay.bindHideCallback(hideFindObjectCallback);

    ge.start();
}


let currentFrame = 0;
let isPaused = true;
let isScrubbing = false;

function displayFrame(frameIndex) {
    const noOfObject = objectHeaders.length;
    const frame = frames[frameIndex];

    for (let i = 0; i < noOfObject; i++) {
        const objectData = frame[i];
        const objectName = objectHeaders[i];

        const object = objectLookup[objectName];
        object.x = objectData[0];
        object.y = objectData[1];
        object.z = objectData[2];
    }

    updateProgressBar(frameIndex / (frames.length - 1) * 100, screenRefreshInterval);
    updateTiming(frameIndex * delta_t, (frames.length - 1) * delta_t);

    masterRenderer.quickInitialise(masterRenderer.objects);
    ge.quickAnimationStart();
}

let speedFactor = 1;
const screenRefreshInterval = 1 / FPS;
let cumlitiveTime = 0;
function playSimulationFrame() {
    if (isPaused) {
        togglePause();
        return;
    }

    const currentTime = performance.now();
    const true_deltaTime = (currentTime - lastTime) / 1000 * speedFactor;
    lastTime = currentTime;

    if (! isScrubbing) {
        cumlitiveTime += true_deltaTime;

        currentFrame = Math.floor(cumlitiveTime / delta_t);

        if (currentFrame >= frames.length) {
            displayFrame(frames.length - 1);

            currentFrame = frames.length;

            pauseSimulation();
            return;
        }

        displayFrame(currentFrame);

        if (! findObjectOverlay.hidden) {
            updateFinderListObjects();
        }
    }

    requestAnimationFrame(playSimulationFrame);
}

let lastTime;
async function startSimulation() {
    if (isPaused) {
        if (currentFrame == frames.length) {
            currentFrame = 0;
            cumlitiveTime = 0;
        }

        isPaused = false;
        togglePause();
        lastTime = performance.now();
        requestAnimationFrame(playSimulationFrame);
    }
}

function pauseSimulation(event) {
    isPaused = true;
    togglePause();
}

function togglePause() {
    if (isPaused) {
        document.getElementById("pauseButton").classList.add("hidden");
        document.getElementById("playButton").classList.remove("hidden");
    } 
    else {
        document.getElementById("pauseButton").classList.remove("hidden");
        document.getElementById("playButton").classList.add("hidden");
    }
}

document.getElementById("playButton").addEventListener("pointerdown", startSimulation);
document.getElementById("pauseButton").addEventListener("pointerdown", pauseSimulation);


function handleStartScrubbing(event) {
    isScrubbing = true;

    unbindCameraCallbacks(ge.canvas);

    handleScrubbing(event);
}
document.getElementById("simulationProgressBar").addEventListener("pointerdown", handleStartScrubbing);

function handleScrubbingMotion(event) {
    if (isScrubbing) {
        handleScrubbing(event);
    }
}
document.addEventListener("pointermove", handleScrubbingMotion);

function handleStopScrubbing(event) {
    isScrubbing = false;

    bindCameraCallbacks(ge.canvas);
}
document.addEventListener("pointerup", handleStopScrubbing);


//ensure progress does not go beyold width of progress bar
function clampProgress(progress) {
    if (progress < 0) {
        return 0;
    }
    if (progress > 1) {
        return 1;
    }

    return progress; 
}

function handleScrubbing(event) {
    const progressBar = document.getElementById("simulationProgressBar");
    const barWidth = progressBar.offsetWidth;
    const clickX = event.clientX - progressBar.offsetLeft;

    //ensure progress does not go beyold width of progress bar
    const progress = clampProgress(clickX / barWidth); 

    currentFrame = Math.floor(progress * (frames.length - 1));
    cumlitiveTime = currentFrame * delta_t;
    displayFrame(currentFrame);
}


function updateProgressBar(progress, progressUpdateInterval) {
    const progressBar = document.getElementById("simulationProgressBar-progress");
    
    progressBar.style.transitionDuration = `${progressUpdateInterval}ms`;
    progressBar.style.width = `${progress}%`;
}

function updateTiming(currentTime, totalTime) {
    const timeEntry = document.getElementById("time-entry");
    const totalTimeEntry = document.getElementById("total-time");
    timeEntry.textContent = `${formatTime(currentTime)}`;
    totalTimeEntry.textContent = ` / ${formatTime(totalTime)}`;
}


function updateTimeEntry() {
    const timeEntry = document.getElementById("time-entry");
    const userInput = timeEntry.textContent.split(":");

    let inputTime_inSecs;
    if (userInput.length === 1) {
        inputTime_inSecs = parseFloat(userInput[0]);
    }
    else if (userInput.length === 2) {
        const [minutes, seconds] = userInput;

        inputTime_inSecs = parseFloat(minutes) * 60 + parseFloat(seconds);
    }
    else {
        displayFrame(currentFrame);
        return;
    }

    if (isNaN(inputTime_inSecs) || inputTime_inSecs > (frames.length - 1) * delta_t) {
        displayFrame(currentFrame);
        return;
    }

    currentFrame = inputTime_inSecs / delta_t;
    displayFrame(currentFrame);
}

function handleTimeEntry(event) {
    if (event.key === "Enter") {
        updateTimeEntry();
    }
}

document.getElementById("time-entry").addEventListener("keypress", handleTimeEntry);
document.getElementById("time-entry").addEventListener("focus", unbindAllKeyControls);
document.getElementById("time-entry").addEventListener(
    "focusout", () => {
        updateTimeEntry(); 
        bindAllControls(ge.canvas);
    }
);

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    
    let formattedSeconds = secs.toString();
    if (secs < 10) {
        formattedSeconds = "0" + formattedSeconds;
    }

    return minutes + ":" + formattedSeconds;
}


function showSpeedMenu() {
    const speedMenu = document.getElementById("speedMenu-overlay");
    const speedButton = document.getElementById("speedButton");
    speedMenu.classList.remove("hidden");
    speedButton.removeEventListener("pointerdown", showSpeedMenu);
    speedButton.addEventListener("pointerdown", hideSpeedMenu);
}

function hideSpeedMenu() {
    const speedMenu = document.getElementById("speedMenu-overlay");
    const speedButton = document.getElementById("speedButton");
    speedMenu.classList.add("hidden");
    speedButton.addEventListener("pointerdown", showSpeedMenu);
    speedButton.removeEventListener("pointerdown", hideSpeedMenu);
}

document.getElementById("speedButton").addEventListener("pointerdown", showSpeedMenu);
document.getElementById("hide-speedMenu-overlay-button").addEventListener("pointerup", hideSpeedMenu);


function validateSpeedInput() {
    const errorMessageDiv = document.getElementById("speedMenu-error-message");
    errorMessageDiv.textContent = ""; //clear prev msgs

    const speed_inp = document.getElementById("speedInput");
    const speed = parseFloat(speed_inp.value);
    if (isNaN(speed) || speed <= 0) {
        errorMessageDiv.textContent = "Speed must be a positive non-zero float";
        return false;
    }

    speedFactor = speed;
    return true;
}

document.getElementById("speedInput").addEventListener("input", validateSpeedInput);

async function saveSimulationSettings() {
    const projectName = communicator.getProjNameFromUrl();
    const simulationName = communicator.getSimNameFromUrl();

    const response = await communicator.updateSimulationSettings(projectName, simulationName, settingsData);

    if (response.status === "OK") {
        clearUnsavedChanges();
    }
}
document.getElementById("saveSimSettingsButton").addEventListener("pointerdown", saveSimulationSettings);

let unsavedChanges = false;
function markUnsavedChanges(priority) {
    if (!unsavedChanges) {
        const badge = document.querySelector("#saveSimSettingsButton .badge");
        badge.classList.remove("hidden", "lowPriority", "highPriority");

        if (priority === "high") {
            badge.classList.add("highPriority");
        }
        else if (priority === "low") {
            badge.classList.add("lowPriority");
        }

        unsavedChanges = priority;
    }
    else if (priority === "high") {
        const badge = document.querySelector("#saveSimSettingsButton .badge");
        badge.classList.remove("hidden", "lowPriority", "highPriority");

        badge.classList.add("highPriority");
        unsavedChanges = priority;
    }
}
function clearUnsavedChanges() {
    if (unsavedChanges !== false) {
        const badge = document.querySelector("#saveSimSettingsButton .badge");
        badge.classList.remove("lowPriority", "highPriority");
        badge.classList.add("hidden");
        unsavedChanges = false;
    }
}

function handleCameraUpdate() {
    settingsData.camera.pose = camera.getPose();
    markUnsavedChanges("low");
}

document.addEventListener("cameraUpdated", handleCameraUpdate);



function setCameraModeRadio(mode) {
    const radio = document.querySelector(`input[name = 'cameraMode'][value = '${mode}']`);
    if (radio) {
        radio.checked = true;
    }
}

document.addEventListener(
    "cameraModeToggled", () => {
        settingsData.camera.mode = cameraMode;
        settingsData.camera.pose = camera.getPose();
        setCameraModeRadio(cameraMode);
    }
);

function setShaderModeRadio(mode) {
    const radio = document.querySelector(`input[name = 'shaderMode'][value = '${mode}']`);
    if (radio) {
        radio.checked = true;
    }
}

document.addEventListener(
    "shaderModeToggled", () => {
        settingsData.shaders.mode = masterRenderer.shader.mode;
        setShaderModeRadio(masterRenderer.shader.mode);
    }
);

function updateShaderMode(event) {
    const shaderMode = event.target.value;
    masterRenderer.setShaderMode(shaderMode);
    settingsData.shaders.mode = shaderMode; 

    markUnsavedChanges("low");
}
document.getElementById("BasicShader-radio").addEventListener("change", updateShaderMode);
document.getElementById("SkeletonShader-radio").addEventListener("change", updateShaderMode);
document.getElementById("PointsShader-radio").addEventListener("change", updateShaderMode);
document.getElementById("LightingShader-radio").addEventListener("change", updateShaderMode);


function workspaceKeyEvents(event) {
    if (event.ctrlKey) {
        if (event.key === "c") {
            copyObject();
        }
        else if (event.key === "v") {
            pasteObject();
        }
    }
    else if (event.key === "Backspace") {
        deleteObject();
    }
}


function showFindObjectCallback() {
    quickReleaseKeys();

    unbindAllKeyControls();
    document.removeEventListener("keydown", workspaceKeyEvents);

    loadObjectsToFinderList();
}

function hideFindObjectCallback() {
    document.addEventListener("keydown", workspaceKeyEvents);
    bindAllControls(ge.canvas);
}


function showCameraConfigMenuOverlay() {
    quickReleaseKeys();

    unbindAllKeyControls();
    document.removeEventListener("keydown", workspaceKeyEvents);
}

function hideCameraConfigMenuOverlay() {
    bindAllControls(ge.canvas);

    document.addEventListener("keydown", workspaceKeyEvents);
}


function updateFinderListObjects() {
    const objectList = document.getElementById("objectsList");

    for (const option of objectList) {
        const name = option.value;
        const object = objectLookup[name];


        let typeName;
        if (object instanceof Sphere) {
            typeName = "particle";
        }
        else if (object instanceof Plane) {
            typeName = "plane";
        }

        let pos = {
            x: Math.round(object.x * 1000) / 1000,
            y: Math.round(object.y * 1000) / 1000,
            z: Math.round(object.z * 1000) / 1000, 
        }

        if (pos.x !== object.x) {
            pos.x += "...";
        }
        if (pos.y !== object.y) {
            pos.y += "...";
        }
        if (pos.z !== object.z) {
            pos.z += "...";
        }

        option.value = name;
        option.textContent = `${typeName}: ${name} {x: ${pos.x}, y: ${pos.y}, z: ${pos.z}}`;
    }
}

function loadObjectsToFinderList() {
    const objectList = document.getElementById("objectsList");
    objectList.replaceChildren();

    const noOfObject = objectHeaders.length;

    for (let i = 0; i < noOfObject; i++) {
        const name = objectHeaders[i];

        const object = objectLookup[name];
    
        const option = document.createElement("option");

        let typeName;
        if (object instanceof Sphere) {
            typeName = "particle";
        }
        else if (object instanceof Plane) {
            typeName = "plane";
        }

        let pos = {
            x: Math.round(object.x * 1000) / 1000,
            y: Math.round(object.y * 1000) / 1000,
            z: Math.round(object.z * 1000) / 1000, 
        }

        if (pos.x !== object.x) {
            pos.x += "...";
        }
        if (pos.y !== object.y) {
            pos.y += "...";
        }
        if (pos.z !== object.z) {
            pos.z += "...";
        }

        option.value = name;
        option.textContent = `${typeName}: ${name} {x: ${pos.x}, y: ${pos.y}, z: ${pos.z}}`;
        objectList.appendChild(option);
    }
}


async function setupPlayer() {
    const response = await communicator.loginFromSessionStorage();
    if (response.status === "ERR") {
        //console.error("Automatic login failed");
        const serverQuery = communicator.getServerQuery();
        location.href = "login.html" + serverQuery;
        return;
    }

    loadData();

    document.getElementById("toolsTab").addEventListener("pointerup", () => toggleTab("tools"));
    document.getElementById("cameraTab").addEventListener("pointerup", () => toggleTab("camera"));
    document.getElementById("shadersTab").addEventListener("pointerup", () => toggleTab("shaders"));
}

setupPlayer();