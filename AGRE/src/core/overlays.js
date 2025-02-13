import {camera, cameraMode} from "./camera.js";
import {masterRenderer} from "./renderer.js";
import * as linearAlgebra from "../utils/linearAlgebra.js";
import {clock} from "./clock.js";

//fps stuff
const FPS_updateCycle = 30;

let last_update_frame = 0

export function updateFpsOverlay() {
    last_update_frame++;

    if (last_update_frame === FPS_updateCycle) {
        clock.updateFps();
        //this is an absolutely cursed way of doing fstring
        document.getElementById("fps-overlay").innerText = `FPS: ${clock.current_fps.toFixed(3)}`; 

        last_update_frame = 0;
    }
}

export function updateShaderOverlays() {
    document.getElementById("shaderMode-overlay").innerText = `ShaderMode: ${masterRenderer.shader.name}`;
}

export function updateCameraModeOverlay() {
    document.getElementById("cameraMode-overlay").innerText = `CameraMode: ${cameraMode}`;
    if (cameraMode === "Y-Polar") {
        document.getElementById("x-overlay").innerText = "";
        document.getElementById("y-overlay").innerText = "";
        document.getElementById("z-overlay").innerText = "";
        document.getElementById("pitch-overlay").innerText = "";
        document.getElementById("yaw-overlay").innerText = "";
        document.getElementById("roll-overlay").innerText = "";
    }
    else {
        document.getElementById("r-overlay").innerText = "";
        document.getElementById("altitude-overlay").innerText = "";
        document.getElementById("azimuth-overlay").innerText = "";
    }
}

export function updateCameraPerspectiveOverlays() {
    document.getElementById("fov-overlay").innerText = `FOV: ${camera.fov}`;
    document.getElementById("near-overlay").innerText = `Near: ${camera.near}`;
    document.getElementById("far-overlay").innerText = `Far: ${camera.far}`;
}

export function updateCameraCartesianCoordsOverlays() {
    document.getElementById("x-overlay").innerText = `Camera X: ${camera.coords.x.toFixed(3)}`; 
    document.getElementById("y-overlay").innerText = `Camera Y: ${camera.coords.y.toFixed(3)}`; 
    document.getElementById("z-overlay").innerText = `Camera Z: ${camera.coords.z.toFixed(3)}`; 
}

export function updateCameraPolarCoordsOverlays() {
    document.getElementById("r-overlay").innerText = `R: ${camera.r.toFixed(3)}`; 
    document.getElementById("altitude-overlay").innerText = `Altitude: ${linearAlgebra.toDegree(camera.alt).toFixed(3)}`; 
    document.getElementById("azimuth-overlay").innerText = `Azimuth: ${linearAlgebra.toDegree(camera.azi).toFixed(3)}`; 
}

export function updateCameraEulerAnglesOverlays() {
    document.getElementById("pitch-overlay").innerText = `Pitch: ${
        linearAlgebra.toDegree(linearAlgebra.pitchFromQuat(camera.orientation)).toFixed(3)
    }`; 
    document.getElementById("yaw-overlay").innerText = `Yaw: ${
        linearAlgebra.toDegree(linearAlgebra.yawFromQuat(camera.orientation)).toFixed(3)
    }`; 
    document.getElementById("roll-overlay").innerText = `Roll: ${
        linearAlgebra.toDegree(linearAlgebra.rollFromQuat(camera.orientation)).toFixed(3)
    }`; 
}


export function updateMousePosOverlays(mouseX, mouseY) {
    document.getElementById("mouseX-overlay").innerText = `Mouse X: ${mouseX}`; 
    document.getElementById("mouseY-overlay").innerText = `Mouse Y: ${mouseY}`; 
}

export function removeMousePosOverlays() {
    document.getElementById("mouseX-overlay").innerText = ""; 
    document.getElementById("mouseY-overlay").innerText = ""; 
}

export function updateSelectedOverlay() {
    if (masterRenderer.currentSelection === null) {
        document.getElementById("selection-overlay").innerText = "";
    }
    else {
        const selection = masterRenderer.objects[masterRenderer.currentSelection].name;
        document.getElementById("selection-overlay").innerText = `Selection: ${selection}`;
    }
}

export function updateSelectionMovementOverlay(axis) {
    if (axis === null) {
        document.getElementById("selectionMovement-overlay").innerText = "";
    }
    else {
        document.getElementById("selectionMovement-overlay").innerText = `Movement Axis: ${axis}`;
    }
}
