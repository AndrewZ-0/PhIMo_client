import {masterRenderer} from "../AGRE/src/core/renderer.js";
import {bindCameraCallbacks, unbindCameraCallbacks, unbindAllKeyControls} from "../AGRE/src/core/listeners.js";
import {FPS} from "../AGRE/src/core/clock.js";
import {bindAllControls} from "../AGRE/src/core/listeners.js";


const pauseButton = document.getElementById("player-pauseButton");
const playButton = document.getElementById("player-playButton");

const simulationProgressBar = document.getElementById("simulationProgressBar");
const simulationProgressBar_progress = document.getElementById("simulationProgressBar-progress");

const timeEntry = document.getElementById("time-entry");
const totalTimeEntry = document.getElementById("total-time");

const screenRefreshInterval = 1 / FPS;

export class Player {
    constructor(ge, simConfig, settingsData, objectHeaders, frames, objectLookup, speedFactor, updateFinderListObjects, live = false) {
        this.objectHeaders = objectHeaders;
        this.frames = frames;
        this.objectLookup = objectLookup;

        this.ge = ge;
        this.simConfig = simConfig;
        this.settingsData = settingsData;

        this.currentFrame = 0;
        this.isPaused = true;
        this.isScrubbing = false;

        this.speedFactor = speedFactor;
        this.cumlitiveTime = 0;
        this.cumlitiveStart = 0;

        this.overflowTime = 0;

        this.lastTime;

        this.updateFinderListObjects = updateFinderListObjects.bind(this);

        this.updateProgressBar(0, 0); 
        this.updateTiming(0, (this.frames.length - 1) * this.simConfig.deltaT);

        this.bindEvents();

        this.live = live;
        this.updateFrameCallback;
        this.unsavedChanges = false;
    }

    //set the position of each of each object in the renderer to their position at the given frame index
    updateRender(frameIndex) {
        const noOfObject = this.objectHeaders.length;
        const frame = this.frames[frameIndex];
    
        for (let i = 0; i < noOfObject; i++) {
            const objectData = frame[i];
            const objectName = this.objectHeaders[i];
    
            const object = this.objectLookup[objectName];
            object.x = objectData[0];
            object.y = objectData[1];
            object.z = objectData[2];
        }

        //tell renderer to rerender the scene for the update object positions
        masterRenderer.quickInitialise(masterRenderer.objects);
        this.ge.quickAnimationStart();
    }

    //update render to given frame index and set progress bar/time entry to the current frame/time of the player
    //display now perameter is used if no animation is required for the progress bar (jump immediately to the frame index)
    displayFrame(frameIndex, displayNow = false) {
        this.updateRender(frameIndex);

        if (displayNow) {
            this.updateProgressBar(frameIndex / (this.frames.length - 1) * 100, 0);
        }
        else {
            this.updateProgressBar(frameIndex / (this.frames.length - 1) * 100, screenRefreshInterval);
        }

        this.updateTiming(frameIndex * this.simConfig.deltaT, (this.frames.length - 1) * this.simConfig.deltaT);
    }

    playSimulationFrame() {
        if (this.isPaused) {
            this.togglePause();
            return;
        }
    
        //calculate how long it has been since last play simulation frame call
        const currentTime = performance.now();
        const player_deltaTime = (currentTime - this.lastTime) / 1000 * this.speedFactor;
        this.lastTime = currentTime;
    
        if (! this.isScrubbing) {
            //a tally of the time played by the player
            this.cumlitiveTime += player_deltaTime;

            const lastFrame = this.currentFrame;
    
            //the current fame as tracked by the progress bar (for the live engine, cumlitive start is used to keep track of the start of the buffer)
            //at this point, currentFrame can overflow if using the live engine (meaning that it can produce frame counts greater than the length of the buffer)
            //the overflow mechanic is used to keep track of the number of computes required in rolling buffer mode
            this.currentFrame = Math.floor((this.cumlitiveTime - this.cumlitiveStart) / this.simConfig.deltaT);

            //if player is running from the live engine 
            //overwrites/appends frames to the frame buffer with new frames computed by the live engine
            if (this.updateFrameCallback) { 
                if (this.currentFrame < this.simConfig.noOfFrames) {
                    for (let i = lastFrame; i <= this.currentFrame; i++) {
                        this.updateFrameCallback(i, this.unsavedChanges);
                    }
                }
                else { //rolling buffer mode (the frame buffer is full, therefore requiring the oldest frame(s) to be deleted before new frames could be computed)
                    for (let i = lastFrame; i <= this.simConfig.noOfFrames; i++) {
                        this.updateFrameCallback(i, this.unsavedChanges);
                    }

                    //how many frames currentFrame has tracked which has overflow the frame buffer 
                    const currentOverflow = this.currentFrame - this.simConfig.noOfFrames;
                    //how many frames have been overflow since the last overflow call (negative if scrubbed, thus doesn't execute following for loop)
                    const deltaOverflow = currentOverflow - this.overflowTime;

                    //tells live engine to compute the overflown frames
                    for (let i = 0; i < deltaOverflow; i++) {
                        this.updateFrameCallback(this.simConfig.noOfFrames, this.unsavedChanges);
                    }

                    this.overflowTime = currentOverflow;
                }
            }
    
            //if current frame has overflown the buffer, readjust the value of current frame to the size of the buffer
            //if used for replay, this allows the player to be paused
            //if used for live, this allows the most recently computed frame (the frame at the end of the buffer) to be played without pausing
            if (this.currentFrame >= this.frames.length - 1) {
                this.currentFrame = this.frames.length - 1;
    
                if (!this.live) {
                    this.displayFrame(this.currentFrame);

                    this.pauseSimulation();
                    return;
                }
            }
    
            this.displayFrame(this.currentFrame);
    
            this.updateFinderListObjects(this.objectLookup);
        }
    
        //use the animation frame system to sync the player updates with the renderer
        requestAnimationFrame(this.playSimulationFrame.bind(this));
    }

    bindUpdateFrame(updateFrameCallback) {
        this.updateFrameCallback = updateFrameCallback.bind(this);
    }

    startSimulation() {
        if (this.isPaused) {
            //if player has reached end of frame buffer for replay mode, reset progress to start
            if (!this.live && this.currentFrame == this.frames.length - 1) {
                this.currentFrame = 0;
                this.cumlitiveTime = 0;
                this.cumlitiveStart = 0;
                this.overflowTime = 0;
            }

            this.isPaused = false;
            this.togglePause();
            this.lastTime = performance.now();
            requestAnimationFrame(this.playSimulationFrame.bind(this));
        }
    }

    pauseSimulation(event) {
        this.isPaused = true;
        this.togglePause();
    }

    togglePause() {
        if (this.isPaused) {
            pauseButton.classList.add("hidden");
            playButton.classList.remove("hidden");
        } 
        else {
            pauseButton.classList.remove("hidden");
            playButton.classList.add("hidden");
        }
    }

    handleStartScrubbing(event) {
        this.isScrubbing = true;
    
        unbindCameraCallbacks(this.ge.canvas);
    
        this.handleScrubbing(event);
    }
    
    handleScrubbingMotion(event) {
        if (this.isScrubbing) {
            this.handleScrubbing(event);
        }
    }
    
    handleStopScrubbing(event) {
        this.isScrubbing = false;
    
        bindCameraCallbacks(this.ge.canvas);
    }

    //ensure progress does not go beyold width of progress bar
    clampProgress(progress) {
        if (progress < 0) {
            return 0;
        }
        if (progress > 1) {
            return 1;
        }

        return progress; 
    }

    async handleScrubbing(event) {
        const barWidth = simulationProgressBar.offsetWidth;
        const clickX = event.clientX - simulationProgressBar.offsetLeft;
    
        //ensure progress does not go beyond width of progress bar
        const progress = this.clampProgress(clickX / barWidth); 
    
        this.currentFrame = Math.floor(progress * (this.frames.length - 1));
        this.cumlitiveTime = this.currentFrame * this.simConfig.deltaT;

        //for phimo live
        //since scrubbing is bounded by the progress bar, only frames within the frame buffer can be scrubbed to
        //meaning that all frames which the user scrubbed to are already computed, in which case 
        if (this.updateFrameCallback) {
            let i = 0
            for (const obj of Object.values(this.simConfig.objects)) {
                if (obj.dtype === 0) {
                    const frameObj = this.frames[this.currentFrame][i];
                    obj.position = [frameObj[0], frameObj[1], frameObj[2]];
                    obj.velocity = [frameObj[3], frameObj[4], frameObj[5]];
                    i++;
                }
            }

            this.updateFrameCallback(this.currentFrame, true);
        }

        this.displayFrame(this.currentFrame, true);
    }

    updateProgressBar(progress, progressUpdateInterval) {
        simulationProgressBar_progress.style.transitionDuration = `${progressUpdateInterval}ms`;
        simulationProgressBar_progress.style.width = `${progress}%`;
    }
    
    updateTiming(currentTime, totalTime) {
        timeEntry.textContent = `${this.formatTime(currentTime)}`;
        totalTimeEntry.textContent = ` / ${this.formatTime(totalTime)}`;
    }

    updateTimeEntry() {
        const userInput = timeEntry.textContent.split(":");
    
        let inputTime_inSecs;
        if (userInput.length === 1) {
            inputTime_inSecs = userInput[0] * 1;
        }
        else if (userInput.length === 2) {
            const [minutes, seconds] = userInput;
    
            inputTime_inSecs = minutes * 60 + seconds * 1;
        }
        else {
            this.displayFrame(this.currentFrame);
            return;
        }

        if (isNaN(inputTime_inSecs) || inputTime_inSecs > (this.frames.length - 1) * this.simConfig.deltaT || inputTime_inSecs < 0 || inputTime_inSecs - inputTime_inSecs.toFixed(2) !== 0) {
            this.displayFrame(this.currentFrame);
            return;
        }
    
        this.currentFrame = Math.round(inputTime_inSecs / this.simConfig.deltaT);
        this.displayFrame(this.currentFrame);
    }
    
    handleTimeEntry(event) {
        if (event.key === "Enter") {
            this.updateTimeEntry();
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(2);
        
        let formattedSeconds = secs.toString();
        if (secs < 10) {
            formattedSeconds = "0" + formattedSeconds;
        }
    
        return minutes + ":" + formattedSeconds;
    }

    setSpeedFactor(speedFactor) {
        this.speedFactor = speedFactor;
    }

    bindEvents() {
        playButton.addEventListener("pointerdown", this.startSimulation.bind(this));
        pauseButton.addEventListener("pointerdown", this.pauseSimulation.bind(this));

        simulationProgressBar.addEventListener("pointerdown", this.handleStartScrubbing.bind(this));

        document.addEventListener("pointermove", this.handleScrubbingMotion.bind(this));
        document.addEventListener("pointerup", this.handleStopScrubbing.bind(this));

        timeEntry.addEventListener("keypress", this.handleTimeEntry.bind(this));
        timeEntry.addEventListener("focus", unbindAllKeyControls);
        timeEntry.addEventListener(
            "focusout", () => {
                this.updateTimeEntry(); 
                bindAllControls(this.ge.canvas);
            }
        );
    }
};