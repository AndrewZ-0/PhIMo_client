import {updateShaderOverlays} from "./overlays.js";
import {initBuffers} from "./buffers.js"; //, setAttrPointers, setLightingAttrPointers
import {initUniforms, initLightingUniforms} from "./renderTransforms.js";
import {BasicShader, SkeletonShader, PointsShader, LightingShader} from "./shaders.js";
import * as linearAlgebra from "../utils/linearAlgebra.js";
import * as spaceTransforms from "../utils/spaceTransforms.js";
import {axisViewport} from "./axisViewPort.js";

class Renderer {
    constructor() {
        this.standardUniformLocs = null;
        this.lightingUniforms = null;
        this.matricies = null;

        this.gl;
        this.canvas;
        this.camera;
        this.objects;
        this.shader;
        this.program;

        this.updateFlag = false;
    }

    initialise(gl, canvas, camera, objects) {
        this.gl = gl;
        this.canvas = canvas;
        this.camera = camera;
        this.objects = objects;

        this.program = this.gl.createProgram();

        this.updateFlag = true;
    }

    quickInitialise(objects) {
        this.objects = objects;

        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].generate(this.shader.normalsFlag);
            if (! this.objects[i].selected) {
                this.objects[i].setMode(this.shader.preferredMode);
            }
        }

        this.buffers = initBuffers(this.gl, this.objects);
    }

    initialiseShaderEnvironment() {
        this.attachShader();

        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].generate(this.shader.normalsFlag);
            if (! this.objects[i].selected) {
                this.objects[i].setMode(this.shader.preferredMode);
            }
        }

        this.buffers = initBuffers(this.gl, this.objects);
        //this.configureBuffer();

        //use shader program
        this.gl.useProgram(this.program);
        this.setUniforms();

        this.setMatricies();
    }

    /*
    configureBuffer() {
        setAttrPointers(this.gl, this.buffers, this.positionAttrLoc, this.colourAttrLoc);
    }*/

    setWorldUniformMatrix4fv() {
        this.gl.uniformMatrix4fv(this.standardUniformLocs.world, false, this.matricies.world);
    }
    setViewUniformMatrix4fv() {
        this.gl.uniformMatrix4fv(this.standardUniformLocs.view, false, this.matricies.view);
    }
    setProjUniformMatrix4fv() {
        this.gl.uniformMatrix4fv(this.standardUniformLocs.proj, false, this.matricies.proj);
    }

    setAllUniformMatrixies() {
        this.setWorldUniformMatrix4fv();
        this.setViewUniformMatrix4fv();
        this.setProjUniformMatrix4fv();
    }

    setMatricies() {
        this.matricies = {
            world: linearAlgebra.createMat4(), 
            view: linearAlgebra.createMat4(), 
            proj: linearAlgebra.createMat4()
        };
    
        linearAlgebra.identityMat4(this.matricies.world);
        linearAlgebra.lookAt(this.matricies.view, {x: 0, y: 0, z: -8}, linearAlgebra.globalOrigin, linearAlgebra.globalUp);
    
        this.matricies.proj = this.camera.getProjMat(this.canvas);
    }

    setUniforms() {
        this.standardUniformLocs = initUniforms(this.gl, this.program);
    }

    attachShader() {
        this.gl.attachShader(this.program, this.shader.vertexShader);
        this.gl.attachShader(this.program, this.shader.fragmentShader);
        this.gl.linkProgram(this.program);

        this.program.vShader = this.shader.vertexShader;
        this.program.fShader = this.shader.fragmentShader;

        //get init attr locs
        this.positionAttrLoc = this.gl.getAttribLocation(this.program, "vertPos");
        this.colourAttrLoc = this.gl.getAttribLocation(this.program, "vertColour");
    }

    shaderDrawElements(indicesLength, mode) {
        //this.setAllUniformMatrixies();
        this.setWorldUniformMatrix4fv();
        this.setViewUniformMatrix4fv();
        this.shader.shaderDrawElements(indicesLength, mode);
    }

    handleAttribsAndObjUniforms(object) {
        const attrLen = 6 * Float32Array.BYTES_PER_ELEMENT;

        this.gl.vertexAttribPointer(this.positionAttrLoc, 3, this.gl.FLOAT, false, attrLen, 0);
        this.gl.vertexAttribPointer(this.colourAttrLoc, 3, this.gl.FLOAT, false, attrLen, 3 * Float32Array.BYTES_PER_ELEMENT);

        this.gl.enableVertexAttribArray(this.positionAttrLoc);
        this.gl.enableVertexAttribArray(this.colourAttrLoc);
    }

    frameObjectSetUp(object, buffer) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer.vertexBufferObject);

        this.handleAttribsAndObjUniforms(object);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer.indexBufferObject);

        linearAlgebra.translate(this.matricies.world, object);
        linearAlgebra.setMat4rotation(this.matricies.world, object);
    }

    frameObjectCleanUp() {
        linearAlgebra.identityMat4(this.matricies.world);
    }

    render() {
        this.updateFlag = this.updateFlag || this.camera.changedSinceLastFrame;

        if (this.updateFlag) {
            this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT);
        
            //render each shape
            for (let i = 0; i < this.objects.length; i++) {
                this.frameObjectSetUp(this.objects[i], this.buffers[i]);

                this.shaderDrawElements(this.buffers[i].indexCount, this.objects[i].mode);
                
                this.frameObjectCleanUp();
            }

            this.updateFlag = false;
        }
    }
}


class AdvancedRenderer extends Renderer {
    constructor() {
        super();

        this.currentSelection = null;
    }

    initialise(gl, canvas, camera, objects, type = "basic") {
        super.initialise(gl, canvas, camera, objects);

        switch (type) {
            case "basic":
                this.shader = new BasicShader(this.gl);
                break;
            case "skeleton":
                this.shader = new SkeletonShader(this.gl);
                break;
            case "points":
                this.shader = new PointsShader(this.gl);
                break;
            case "lighting":
                this.shader = new LightingShader(this.gl);
                break;
        }

        this.initialiseShaderEnvironment();

        updateShaderOverlays();
    }

    attachShader() {
        super.attachShader();

        if (this.shader.normalsFlag) {
            this.normalAttrLoc = this.gl.getAttribLocation(this.program, "vertNormal");
        }
        else {
            this.normalAttrLoc = null; //reset
        }
    }

    nukeShader() {
        this.gl.detachShader(this.program, this.shader.vertexShader);
        this.gl.deleteShader(this.shader.vertexShader);
        this.gl.detachShader(this.program, this.shader.fragmentShader);
        this.gl.deleteShader(this.shader.fragmentShader);

        this.program.vShader = null;
        this.program.fShader = null;
    }

    /*
    configureBuffer() {
        if (this.shader.normalsFlag) {
            setLightingAttrPointers(this.gl, this.buffers, this.positionAttrLoc, this.normalAttrLoc, this.colourAttrLoc);
        }
        else {
            setAttrPointers(this.gl, this.buffers, this.positionAttrLoc, this.colourAttrLoc);
        }
    }*/

    setUniforms() {
        this.standardUniformLocs = initUniforms(this.gl, this.program);

        if (this.shader.normalsFlag) {
            this.lightingUniforms = initLightingUniforms(this.gl, this.program);
        }
    }

    setViewPositionUniform(viewPos) {
        if (this.shader.normalsFlag) {
            this.gl.uniform3fv(this.lightingUniforms.viewPos, viewPos);
        }
    }

    
    setShininessUniform(shininess) {
        this.gl.uniform1f(this.lightingUniforms.shininess, shininess);
    }

    setColourOverrideUniform(state) {
        this.gl.uniform1i(this.standardUniformLocs.colourOverride, state);
    }

    toggleShaderMode() {
        this.nukeShader();
        if (this.shader instanceof BasicShader) {
            this.shader = new SkeletonShader(this.gl);
        }
        else if(this.shader instanceof SkeletonShader) {
            this.shader = new PointsShader(this.gl);
        }
        else if(this.shader instanceof PointsShader) {
            this.shader = new LightingShader(this.gl);
        }
        else if(this.shader instanceof LightingShader) {
            this.shader = new BasicShader(this.gl);
        }

        this.initialiseShaderEnvironment();

        updateShaderOverlays();

        this.setAllUniformMatrixies();

        this.updateFlag = true;
    }

    handleAttribsAndObjUniforms(object) {
        if (this.shader.normalsFlag) {
            const attrLen = 9 * Float32Array.BYTES_PER_ELEMENT;

            this.gl.vertexAttribPointer(this.positionAttrLoc, 3, this.gl.FLOAT, false, attrLen, 0);
            this.gl.vertexAttribPointer(this.normalAttrLoc, 3, this.gl.FLOAT, false, attrLen, 3 * Float32Array.BYTES_PER_ELEMENT);
            this.gl.vertexAttribPointer(this.colourAttrLoc, 3, this.gl.FLOAT, false, attrLen, 6 * Float32Array.BYTES_PER_ELEMENT);
            
            this.gl.enableVertexAttribArray(this.positionAttrLoc);
            this.gl.enableVertexAttribArray(this.normalAttrLoc);
            this.gl.enableVertexAttribArray(this.colourAttrLoc);

            this.setShininessUniform(object.shininess);
        }
        else {
            const attrLen = 6 * Float32Array.BYTES_PER_ELEMENT;

            this.gl.vertexAttribPointer(this.positionAttrLoc, 3, this.gl.FLOAT, false, attrLen, 0);
            this.gl.vertexAttribPointer(this.colourAttrLoc, 3, this.gl.FLOAT, false, attrLen, 3 * Float32Array.BYTES_PER_ELEMENT);

            this.gl.enableVertexAttribArray(this.positionAttrLoc);
            this.gl.enableVertexAttribArray(this.colourAttrLoc);
        }
    
    }


    deselectObject(i) {
        this.objects[i].selected = false;
        this.objects[i].setMode(this.shader.preferredMode);
    }

    selectObject(i) {
        this.objects[i].selected = true;
        this.objects[i].setMode(this.gl.LINES);
    }

    handleSelection(i) {
        this.updateFlag = true;
        if (i === null) {
            if (this.currentSelection !== null) {
                this.deselectObject(this.currentSelection);
                this.currentSelection = null;
            }
            else {
                this.updateFlag = false;
                return null; //if nothing had been selected and nothing is selected, then nothing needs to be updated
            }
        }
        else {
            if (this.objects[i].selected) {
                this.deselectObject(i);
                this.currentSelection = null;
            }
            else {
                if (this.currentSelection !== null && this.currentSelection !== i) {
                    this.deselectObject(this.currentSelection);
                }
                this.selectObject(i);
                this.currentSelection = i;
            }
        } 

        this.buffers = initBuffers(this.gl, this.objects);
        //this.configureBuffer();
    }

    moveSelectedObjectAlong(axis, pointerX, pointerY) {
        if (axisViewport.activeAxis !== null) {
            const object = this.objects[this.currentSelection];

            const {a: A, b: B} = axisViewport.activeAxis.getVertecies();
            const O = this.camera.coords;
            const OA = linearAlgebra.subVec3(A, O);
            const AB = linearAlgebra.subVec3(B, A);

            const n = this.camera.front;
            const a = linearAlgebra.normaliseVec3(AB);
            const a_proj = linearAlgebra.normaliseVec3(linearAlgebra.subVec3(a, linearAlgebra.scaleVec3(n, linearAlgebra.dotVec3(a, n))));

            const {x, y} = spaceTransforms.getNormalisedDeviceCoords(masterRenderer.canvas, pointerX, pointerY);
            const c = spaceTransforms.getRayFromNDC(x, y, masterRenderer.matricies.proj, masterRenderer.matricies.view);

            const mu = linearAlgebra.dotVec3(OA, n) / (linearAlgebra.dotVec3(c, n)); //mu for poi between c and plane (A)
            const P = linearAlgebra.addVec3(O, linearAlgebra.scaleVec3(c, mu));

            const AP = linearAlgebra.subVec3(P, A);

            const OP_prime = linearAlgebra.addVec3(OA, linearAlgebra.scaleVec3(a_proj, linearAlgebra.dotVec3(AP, a_proj)));

            const norm_OP_prime = linearAlgebra.normaliseVec3(OP_prime);

            let s;
            if (axis === "x") {
                s = (OA.x * a.z - OA.z * a.x) / (norm_OP_prime.x * a.z - norm_OP_prime.z * a.x);
            }
            else if (axis === "z") {
                s = (OA.x * a.z - OA.z * a.x) / (norm_OP_prime.x * a.z - norm_OP_prime.z * a.x);
            }
            else if (axis === "y") {
                s = (OA.y * a.z - OA.z * a.y) / (norm_OP_prime.y * a.z - norm_OP_prime.z * a.y);
            }


            if (!isNaN(s)) {
                const p_doublePrime = linearAlgebra.addVec3(O, linearAlgebra.scaleVec3(norm_OP_prime, s));
        
                object[axis] = p_doublePrime[axis];


                //console.log((OA.x * a.z - OA.z * a.x) / (norm_OP_prime.x * a.z - norm_OP_prime.z * a.x), (OA.x * a.z - OA.y * a.x) / (norm_OP_prime.x * a.y - norm_OP_prime.y * a.x), (OA.y * a.z - OA.z * a.y) / (norm_OP_prime.y * a.z - norm_OP_prime.z * a.y));

                this.updateFlag = true;
                this.render();
            }
        }
    }
    

        

    renderSelected() {
        this.frameObjectSetUp(this.objects[this.currentSelection], this.buffers[this.currentSelection]);

        this.setColourOverrideUniform(1);
        this.gl.depthMask(false);

        this.shaderDrawElements(this.buffers[this.currentSelection].indexCount, this.gl.TRIANGLES);

        this.gl.depthMask(true);
        
        this.gl.disable(this.gl.DEPTH_TEST);
        this.shaderDrawElements(this.buffers[this.currentSelection].indexCount, this.gl.LINES);

        this.gl.enable(this.gl.DEPTH_TEST);
        this.setColourOverrideUniform(0);

        this.frameObjectCleanUp();
    }

    render() {
        this.updateFlag = this.updateFlag || this.camera.changedSinceLastFrame;

        if (this.updateFlag) {
            this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT);
        
            //render each shape
            for (let i = 0; i < this.objects.length; i++) {
                this.frameObjectSetUp(this.objects[i], this.buffers[i]);

                if (!this.objects[i].selected) {
                    this.shaderDrawElements(this.buffers[i].indexCount, this.objects[i].mode);
                }

                this.frameObjectCleanUp();
            }

            //----------------------------------------------------------------------------------------------------

            if (this.currentSelection !== null) {
                this.renderSelected();
            }
            //----------------------------------------------------------------------------------------------------

            this.updateFlag = false;
        }
    }
}


class BasicRenderer extends Renderer {
    constructor() {
        super();
    }

    initialise(gl, canvas, camera, shader, objects) {
        super.initialise(gl, canvas, camera, objects);

        this.shader = shader;

        this.initialiseShaderEnvironment();
        this.updateFlag = true;
    }
}

export const masterRenderer = new AdvancedRenderer();
export const orientationRenderer = new BasicRenderer();
export const axisRenderer = new BasicRenderer();