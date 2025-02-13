import {camera, toggleCameraMode} from "./camera.js";
import {masterRenderer, orientationRenderer, axisRenderer} from "./renderer.js";
import {raycastMouseCollisionCheck} from "./raycast.js"
import {
    updateMousePosOverlays, removeMousePosOverlays, 
    updateSelectedOverlay, updateSelectionMovementOverlay
} from "./overlays.js";


let moveObjects = false;
export function set_moveObjectsStatus(status) {
    moveObjects = status;
}

export let keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
    space: false, 
    left: false, 
    right: false, 
    up: false, 
    down: false, 
    comma: false, 
    period: false
};

function handleKeyDown(event) {
    switch (event.key.toLowerCase()) {
        case "w":
            keys.w = true;
            break;
        case "a":
            keys.a = true;
            break;
        case "s":
            keys.s = true;
            break;
        case "d":
            keys.d = true;
            break;
        case "shift":
            keys.shift = true;
            break;
        case " ":
            keys.space = true;
            break;
        case "arrowleft":
            keys.left = true;
            break;
        case "arrowright":
            keys.right = true;
            break;
        case "arrowup":
            keys.up = true;
            break;
        case "arrowdown":
            keys.down = true;
            break;
        case ",":
            keys.comma = true;
            break;
        case ".":
            keys.period = true;
            break;
        default:
            break;
    }
}

function handleKeyUp(event) {
    switch (event.key.toLowerCase()) {
        case "w":
            keys.w = false;
            break;
        case "a":
            keys.a = false;
            break;
        case "s":
            keys.s = false;
            break;
        case "d":
            keys.d = false;
            break;
        case "shift":
            keys.shift = false;
            break;
        case " ":
            keys.space = false;
            break;
        case "arrowleft":
            keys.left = false;
            break;
        case "arrowright":
            keys.right = false;
            break;
        case "arrowup":
            keys.up = false;
            break;
        case "arrowdown":
            keys.down = false;
            break;
        case ",":
            keys.comma = false;
            break;
        case ".":
            keys.period = false;
            break;
        case "x":
            toggleSelectionMovement("x");
            break;
        case "y":
            toggleSelectionMovement("y");
            break;
        case "z":
            toggleSelectionMovement("z");
            break;
        case "p":
            masterRenderer.toggleShaderMode();
            break;
        case "c":
            if (!event.ctrlKey) {
                toggleCameraMode();
                masterRenderer.camera = camera; //reset camera pointer for master renderer
                axisRenderer.camera = camera;
                orientationRenderer.camera = camera;
                camera.forceUpdateCamera(masterRenderer.matricies.view);
                camera.forceUpdateCamera(axisRenderer.matricies.view);
                //camera.forceUpdateCamera(orientationRenderer.matricies.view);
            }
            break;
        default:
            break;
    }
}


let lastX;
let lastY;
export let mouseDragging = false;
let clickFlag = true;

function nextMouseOffset(event) {
    const xoffset = lastX - event.clientX;
    const yoffset = lastY - event.clientY;
    lastX = event.clientX;
    lastY = event.clientY;

    return {x: xoffset, y: yoffset};
}

//legacy code
/*
function quickUpdateMouseEvents() {
    if (selectionMovementAxis !== null) {
        masterRenderer.moveSelectedObjectAlong(selectionMovementAxis, lastX, lastY);
    }
}*/

function handleMouseMove(event) {
    if (selectionMovementAxis !== null) {
        //const offset = nextMouseOffset(event);
        masterRenderer.moveSelectedObjectAlong(selectionMovementAxis, event.clientX, event.clientY);

        const movedObject = masterRenderer.objects[masterRenderer.currentSelection];
        const objMovedEvent = new CustomEvent("objectMoved", {detail: movedObject});
        document.dispatchEvent(objMovedEvent);
    }
    else if (mouseDragging) {
        clickFlag = false; //no longer a click

        //get relative change on screen
        const offset = nextMouseOffset(event);

        camera.onPointerDrag(offset);
    }

    updateMousePosOverlays(event.x, event.y);
}

function handleMouseButtonDown(event) {
    if (event.button === 0) {
        mouseDragging = true;
        lastX = event.clientX;
        lastY = event.clientY;
    }
}

export function selectObject(selectedObject) {
    masterRenderer.handleSelection(selectedObject);

    toggleSelectionMovement(null);
    updateSelectedOverlay();

    const objSelectedEvent = new CustomEvent("objectSelected", {detail: masterRenderer.objects[selectedObject]});
    document.dispatchEvent(objSelectedEvent);
}

function handleMouseButtonUp(event) {
    if (event.button === 0) {
        if (clickFlag) {
            const selectedObject = raycastMouseCollisionCheck(event.x, event.y);
            selectObject(selectedObject);
        }
        else {
            clickFlag = true;
        }

        mouseDragging = false;
    }
}

function handleMouseButtonLeave(event) {
    mouseDragging = false;
    clickFlag = true;

    removeMousePosOverlays();
}


export function bindCameraCallbacks(canvas) {
    canvas.addEventListener("pointermove", handleMouseMove);
    canvas.addEventListener("pointerdown", handleMouseButtonDown);
    canvas.addEventListener("pointerup", handleMouseButtonUp);
    canvas.addEventListener("pointerleave", handleMouseButtonLeave);
}

export function unbindCameraCallbacks(canvas) {
    canvas.removeEventListener("pointermove", handleMouseMove);
    canvas.removeEventListener("pointerdown", handleMouseButtonDown);
    canvas.removeEventListener("pointerup", handleMouseButtonUp);
    canvas.removeEventListener("pointerleave", handleMouseButtonLeave);
}

export function bindAllControls(canvas) {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    bindCameraCallbacks(canvas);
}

export function unbindAllKeyControls() {
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keyup", handleKeyUp);
}

export function bindVisabilityChange(lambda) {
    document.addEventListener("visibilitychange", lambda)
}


export let selectionMovementAxis = null;
function toggleSelectionMovement(axis) {
    if (moveObjects) {
        if (masterRenderer.currentSelection !== null) {
            if (selectionMovementAxis === axis) {
                selectionMovementAxis = null;
            }
            else {
                selectionMovementAxis = axis;
            }
            updateSelectionMovementOverlay(selectionMovementAxis);
            axisRenderer.updateFlag = true;
        }
        else if (axis === null) {
            selectionMovementAxis = null;
            updateSelectionMovementOverlay(selectionMovementAxis);
            axisRenderer.updateFlag = true;
        }
    }
}

export function quickReleaseKeys() {
    for (let key in keys) {
        keys[key] = false;
    }
}

