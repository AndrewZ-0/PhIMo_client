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

        masterRenderer.setAllUniformMatrixies();

        //listener bindings
        bindAllControls(this.canvas);
        bindVisabilityChange(this.onVisibilityChange);

        this.resizeCanvas();
        window.addEventListener("resize", () => this.resizeCanvas());
    }

    mainloop = () => {
        camera.updateCamera(masterRenderer.matricies.view);
        masterRenderer.render();

        axisViewport.updateView();
        axisRenderer.render();

        orientationMenu.updateView();
        orientationRenderer.render();

        clock.updateDeltaT();
        updateFpsOverlay();

        camera.changedSinceLastFrame = false;

        this.currentAnimationFrame = requestAnimationFrame(this.mainloop);
    };

    start = () => {
        //condition here as a quick fix for initial hidden document "inifinity fps issue"
        if (!document.hidden) {
            camera.forceUpdateCamera(masterRenderer.matricies.view);
            camera.changedSinceLastFrame = false;

            masterRenderer.updateFlag = true;
            this.currentAnimationFrame = requestAnimationFrame(this.mainloop);
        }
    }

    onVisibilityChange = () => {
        if (document.hidden) {
            quickReleaseKeys();
            cancelAnimationFrame(this.currentAnimationFrame);
        } 
        else {
            cancelAnimationFrame(this.currentAnimationFrame);

            camera.forceUpdateCamera(masterRenderer.matricies.view);
            camera.changedSinceLastFrame = false;

            masterRenderer.updateFlag = true;
            this.currentAnimationFrame = requestAnimationFrame(this.mainloop);
        }
    }

    quickAnimationStart() {
        cancelAnimationFrame(this.currentAnimationFrame);

        this.forceAnimationFrame();
    }

    forceAnimationFrame() {
        camera.forceUpdateCamera(masterRenderer.matricies.view);
        masterRenderer.render();

        axisViewport.updateView();
        axisRenderer.render();
        //camera.forceUpdateCamera(axisRenderer.matricies.view);

        orientationMenu.updateView();
        orientationRenderer.render();

        //this.updateFlag = true;
        //camera.forceUpdateCamera(orientationRenderer.matricies.view);
        this.currentAnimationFrame = requestAnimationFrame(this.mainloop);
    }

    resizeCanvas() {
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;

        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;

            this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

            masterRenderer.setMatricies();
            masterRenderer.setProjUniformMatrix4fv(); 

            masterRenderer.updateFlag = true;
        }
    }


    /*
    cleanup() { //call lose context from axis view port and orientaion view port
        cancelAnimationFrame(this.currentAnimationFrame);

        this.gl.getExtension("WEBGL_lose_context").loseContext();
        axisViewport.cleanup();
        orientationMenu.cleanup();
    }*/
}


