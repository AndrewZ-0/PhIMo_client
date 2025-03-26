import {clock} from "./core/clock.js";
import {axisViewport} from "./core/axisViewPort.js";
import {masterRenderer, orientationRenderer, axisRenderer} from "./core/renderer.js";
import {camera} from "./core/camera.js";
import {
    updateCameraModeOverlay, updateSensitivityOverlays, 
    updateCameraPerspectiveOverlays, updateFpsOverlay
} from "./core/overlays.js";
import {bindVisabilityChange, bindAllControls, quickReleaseKeys, set_moveObjectsStatus} from "./core/listeners.js";
import {orientationMenu} from "./core/orientationViewPort.js";


export class GraphicsEngine {
    constructor(objects, moveObjects = false) {
        this.canvas = document.getElementById("model-surface");
        this.currentAnimationFrame;
        this.loop;

        this.moveObjects = moveObjects;
        
        set_moveObjectsStatus(moveObjects);


        //get elements from HTML
        this.gl = this.canvas.getContext("webgl2", {antialias: true, preserveDrawingBuffer: true});

        //initialize WebGL
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS);
        this.gl.frontFace(this.gl.CW);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        //compile shaders, buffers and render transform matricies
        masterRenderer.initialise(this.gl, this.canvas, objects);

        updateCameraModeOverlay();
        updateCameraPerspectiveOverlays();
        updateSensitivityOverlays();
        camera.updateAllOverlays();

        masterRenderer.setAllUniformMatricies();

        //listener bindings
        bindAllControls(this.canvas);
        bindVisabilityChange(this.onVisibilityChange);

        this.resizeCanvas(); //resize initially to current screen size
        window.addEventListener("resize", this.resizeCanvas);
    }

    mainloop = () => {
        //update master camera system (update view matrix based on user inputs ince last animation frame)
        camera.updateCamera(masterRenderer.matricies.view);
        //update master renderer (render cycle for the main viewport)
        masterRenderer.render();

        //run updates for axis renderer
        axisViewport.updateView();
        axisRenderer.render();

        //run updates for orientation renderer
        orientationMenu.updateView();
        orientationRenderer.render();

        //update clock (keeping track of fps)
        clock.updateDeltaT();
        updateFpsOverlay();

        //no changes since last frame (resetting update flag to the master renderer)
        camera.changedSinceLastFrame = false;

        //wait until next animation frame is requested to run the mainloop again
        this.currentAnimationFrame = requestAnimationFrame(this.mainloop);
    };

    start = () => {
        //condition here as a quick fix for initial hidden document "inifinity fps issue"
        if (!document.hidden) {
            //forcefully update camera to update view matrix 
            camera.forceUpdateCamera(masterRenderer.matricies.view);
            camera.changedSinceLastFrame = false;

            //start mainloop (with update flag for master renderer set to true: always update for the next frame)
            masterRenderer.updateFlag = true;
            this.currentAnimationFrame = requestAnimationFrame(this.mainloop);
        }
    }

    onVisibilityChange = () => {
        if (document.hidden) {
            //to avoid issues arising from keydown event set to true in listeners when changing page visability (such as exiting clicking off browser tab) causing event to be continually triggered
            quickReleaseKeys();
            //cancel any animation frames already requested
            cancelAnimationFrame(this.currentAnimationFrame);
        } 
        else {
            //first cancel animation frame
            cancelAnimationFrame(this.currentAnimationFrame);

            //then restart camera and then start the mainloop
            camera.forceUpdateCamera(masterRenderer.matricies.view);
            camera.changedSinceLastFrame = false;

            masterRenderer.updateFlag = true;
            this.currentAnimationFrame = requestAnimationFrame(this.mainloop);
        }
    }

    //stop current animation frame and force everything to update before starting a new animation frame
    quickAnimationStart() {
        cancelAnimationFrame(this.currentAnimationFrame);

        this.forceAnimationFrame();
    }

    //force the camera and all renderers to update and then requestion animation frame for mainloop
    forceAnimationFrame() {
        camera.forceUpdateCamera(masterRenderer.matricies.view);
        masterRenderer.render();

        axisViewport.updateView();
        axisRenderer.render();

        orientationMenu.updateView();
        orientationRenderer.render();

        this.currentAnimationFrame = requestAnimationFrame(this.mainloop);
    }

    resizeCanvas() {
        //set the display width to the current canvas (the html element) width
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;

        //if width or height has changed, update viewport
        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;

            //set viewport width and height
            this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

            masterRenderer.setMatricies();
            masterRenderer.setProjUniformMatrix4fv(); 

            //force render to update after resizing
            masterRenderer.updateFlag = true;
        }
    }
}


