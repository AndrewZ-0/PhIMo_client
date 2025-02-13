import {GraphicsEngine} from "../AGRE/src/app.js";
import {masterRenderer} from "../AGRE/src/core/renderer.js";
import {Sphere, Plane} from "../AGRE/src/objects/objects.js";
import {communicator} from "./communicator.js";
import {calculateScaledFidelity} from "../AGRE/src/utils/renderProperties.js";
import {bindAllControls, bindCameraCallbacks, unbindAllKeyControls, unbindCameraCallbacks} from "../AGRE/src/core/listeners.js";
import {FPS} from "../AGRE/src/core/clock.js";


function returnToWorkbench() {
    const projectName = communicator.getProjNameFromUrl();
    window.location.href = `projectWorkbench.html?project=${projectName}`;
}

document.getElementById("titleBarReturnButton").addEventListener("pointerdown", returnToWorkbench);

let ge;
let simConfig = {};
let objectHeaders;
let frames = [];
let objectLookup = {};

let delta_t;

function parseFramesString(framesString) {
    const lines = framesString.trim().split("\n");

    const headers = lines[0].split(" "); //first line always contains the object headers

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

    ge = new GraphicsEngine(objects);
    ge.start();

    for (const obj of masterRenderer.objects) {
        objectLookup[obj.name] = obj;
    }

    delta_t = simConfig.deltaT;

    updateProgressBar(0, 0); 
    updateTiming(0, (frames.length - 1) * delta_t);
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

async function setupPlayer() {
    const response = await communicator.loginFromSessionStorage();
    if (response.status === "ERR") {
        //console.error("Automatic login failed");
        location.href = "login.html";
        return;
    }

    loadData();
}

setupPlayer();