import {axisRenderer, masterRenderer} from "./renderer.js";
import {SkeletonShader} from "./shaders.js";
import {Line} from "../objects/objects.js";
import {camera} from "./camera.js";
import {selectionMovementAxis} from "./listeners.js";


const globalAxis = [
    new Line("Xavier", 0, 0, 0, [1, 0, 0], [1.0, 0.0, 0.0]), //red
    new Line("Yves", 0, 0, 0, [0, 1, 0], [0.0, 1.0, 0.0]), //green
    new Line("Zachery", 0, 0, 0, [0, 0, 1], [0.0, 0.0, 1.0]),  //blue
];

const objectAxis = {
    x: new Line("Xavier2", 0, 0, 0, [1, 0, 0], [1.0, 1.0, 1.0]), 
    y: new Line("Yves2", 0, 0, 0, [0, 1, 0], [1.0, 1.0, 1.0]), 
    z: new Line("Zachery2", 0, 0, 0, [0, 0, 1], [1.0, 1.0, 1.0]), 
};

let allAxis = [];
for (let axis of globalAxis) {
    allAxis.push(axis);
}

class AxisViewport {
    constructor() {
        this.canvas = document.getElementById("axisViewport-surface");
        
        //get elements from HTML
        this.gl = this.canvas.getContext("webgl2", {antialias: true, preserveDrawingBuffer: true});

        //initialize WebGL
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.frontFace(this.gl.CW);
        this.gl.cullFace(this.gl.BACK);

        this.activeAxis = null;

        axisRenderer.initialise(this.gl, this.canvas, camera, new SkeletonShader(this.gl), allAxis);

        axisRenderer.setAllUniformMatrixies();

        this.resizeCanvas();
        window.addEventListener("resize", () => this.resizeCanvas());
    }

    updateView() {
        let requestQuickInitialise = false;

        if (selectionMovementAxis !== null) {
            //console.log("render the local axis that matches the selection movement axis var!");

            if (this.activeAxis !== selectionMovementAxis) {
                if (this.activeAxis !== null) {
                    allAxis.splice(3, 1);
                }

                if (selectionMovementAxis === "x") {
                    this.activeAxis = objectAxis.x;
                }
                else if (selectionMovementAxis === "y") {
                    this.activeAxis = objectAxis.y;
                }
                else if (selectionMovementAxis === "z") {
                    this.activeAxis = objectAxis.z;
                }

                //wierd bug that I don't really know how to fix
                const pos = masterRenderer.objects[masterRenderer.currentSelection].getPos();
                this.activeAxis.setPos({x: pos.x / 2, y: pos.y / 2, z: pos.z / 2});

                allAxis.push(this.activeAxis);
                requestQuickInitialise = true;
                //axisRenderer.setAllUniformMatrixies();
            }

        }
        else {
            if (this.activeAxis !== null) {
                allAxis.splice(3, 1);
                this.activeAxis = null;

                requestQuickInitialise = true;
                //axisRenderer.setAllUniformMatrixies();
            }
        }

        //to make the global axis dynamic (axis tries its best to not run out)
        if (masterRenderer.updateFlag || camera.changedSinceLastFrame) {
            globalAxis[0].x = camera.coords.x;
            globalAxis[1].y = camera.coords.y;
            globalAxis[2].z = camera.coords.z;

            requestQuickInitialise = true;
        }

        if (requestQuickInitialise) {
            axisRenderer.quickInitialise(allAxis);
        }

        camera.getViewMatrix(axisRenderer.matricies.view);
    }

    resizeCanvas() {
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;

        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;

            this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

            axisRenderer.setMatricies();
            axisRenderer.setProjUniformMatrix4fv();

            axisRenderer.updateFlag = true;
        }
    }

    cleanup() {
        this.gl.getExtension("WEBGL_lose_context").loseContext();
    }
}

export const axisViewport = new AxisViewport();
