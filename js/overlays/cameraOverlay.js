import {OverlayEditMenu} from "./overlay.js";
import {axisRenderer, masterRenderer} from "../../AGRE/src/core/renderer.js";
import * as linearAlgebra from "../../AGRE/src/utils/linearAlgebra.js";
import {
    camera, setCameraMode, 
    setDraggingSensitivity, setCameraMovementSpeed, setCameraRotationSpeed, 
    setCameraNear, setCameraFar, setCameraFov
} from "../../AGRE/src/core/camera.js";
import {updateSensitivityOverlays, updateCameraPerspectiveOverlays} from "../../AGRE/src/core/overlays.js";

const overlayMenu = document.getElementById("cameraConfigMenu-overlay");

const posGroup = document.getElementById("camera-position-group");
const orientGroup = document.getElementById("camera-orientation-group");
const polarOrientGroup = document.getElementById("camera-polarOrientation-group");
const radiusGroup = document.getElementById("camera-radius-group");
const altGroup = document.getElementById("camera-alt-group");
const aziGroup = document.getElementById("camera-azi-group");

const draggingSensitivity_input = document.getElementById("camera-draggingSensitivity");
const movementSpeed_input = document.getElementById("camera-movementSpeed");
const rotationSpeed_input = document.getElementById("camera-rotationSpeed");
const near_input = document.getElementById("camera-near");
const far_input = document.getElementById("camera-far");
const fov_input = document.getElementById("camera-fov");

const radius_input = document.getElementById("camera-radius");
const alt_input = document.getElementById("camera-alt");
const azi_input = document.getElementById("camera-azi");

const altOrient_input = document.getElementById("camera-orient-alt");
const aziOrient_input = document.getElementById("camera-orient-azi");

const position_input = {
    x: document.getElementById("camera-position-x"), 
    y: document.getElementById("camera-position-y"), 
    z: document.getElementById("camera-position-z")
};

const eulerOrient_input = {
    pitch: document.getElementById("camera-orientation-pitch"), 
    yaw: document.getElementById("camera-orientation-yaw"), 
    roll: document.getElementById("camera-orientation-roll")
};

const errorMessageDiv = document.getElementById("cameraConfigMenu-error-message");

const openMenu_button = document.getElementById("cameraConfig-menuButton");
const hideMenu_button = document.getElementById("hide-cameraConfigMenu-overlay-button");
const configCamera_button = document.getElementById("cameraConfig-configure-button");

const yPolar_radio = document.getElementById("Y-Polar-radio");
const yCartPolar_radio = document.getElementById("Y-CartesianPolar-radio");
const cartQuat_radio = document.getElementById("CartesianQuaternion-radio");

const axes = ["x", "y", "z"];

export class CameraOverlay extends OverlayEditMenu {
    constructor(ge, settingsData, markUnsavedChanges) {
        super();

        this.ge = ge;
        this.settingsData = settingsData;
        this.markUnsavedChanges = markUnsavedChanges.bind(this);

        this.bindPermanantEvents();
    }

    show() {
        super.show();

        overlayMenu.classList.remove("hidden");

        document.addEventListener("keydown", this.keyEvents);

        this.fillCameraConfigMenu();
    }

    hide() {
        super.hide();
        
        errorMessageDiv.textContent = ""; //clear prev msgs

        overlayMenu.classList.add("hidden");
        document.removeEventListener("keydown", this.keyEvents);
    }

    fillCameraConfigMenu() {
        const cameraData = this.settingsData.camera;
        if (cameraData.mode === "Y-Polar") {
            posGroup.classList.add("hidden");
            orientGroup.classList.add("hidden");
            polarOrientGroup.classList.add("hidden");
            radiusGroup.classList.remove("hidden");
            altGroup.classList.remove("hidden");
            aziGroup.classList.remove("hidden");
    
            radius_input.value = cameraData.pose.r;
            alt_input.value = linearAlgebra.toDegree(cameraData.pose.alt);
            azi_input.value = linearAlgebra.toDegree(cameraData.pose.azi);
        }
        else {
            posGroup.classList.remove("hidden");
            radiusGroup.classList.add("hidden");
            altGroup.classList.add("hidden");
            aziGroup.classList.add("hidden");
    
            for (const axis of axes) {
                position_input[axis].value = cameraData.pose.coords[axis];
            }
    
            if (cameraData.mode === "Y-CartesianPolar") {
                polarOrientGroup.classList.remove("hidden");
                orientGroup.classList.add("hidden");
    
                altOrient_input.value = linearAlgebra.toDegree(cameraData.pose.orientation.alt);
                aziOrient_input.value = linearAlgebra.toDegree(cameraData.pose.orientation.azi);
            }
            else {
                polarOrientGroup.classList.add("hidden");
                orientGroup.classList.remove("hidden");
    
                const poseEuler = {
                    pitch: linearAlgebra.toDegree(linearAlgebra.pitchFromQuat(cameraData.pose.orientation)),
                    yaw: linearAlgebra.toDegree(linearAlgebra.yawFromQuat(cameraData.pose.orientation)),
                    roll: linearAlgebra.toDegree(linearAlgebra.rollFromQuat(cameraData.pose.orientation))
                }
    
                const orientations = ["pitch", "yaw", "roll"];
                for (const orient of orientations) {
                    eulerOrient_input[orient].value = poseEuler[orient];
                }
            }
        }
    
        draggingSensitivity_input.value = this.settingsData.camera.sensitivity.draggingSensitivity;
        movementSpeed_input.value = this.settingsData.camera.sensitivity.movementSpeed;
        rotationSpeed_input.value = this.settingsData.camera.sensitivity.rotationSpeed;
        near_input.value = this.settingsData.camera.projection.near;
        far_input.value = this.settingsData.camera.projection.far;
        fov_input.value = this.settingsData.camera.projection.fov;
    }

    submit() {
        super.submit();

        if (! this.validateCameraConfigMenu()) {
            return;
        }
    
        if (this.settingsData.camera.mode === "Y-Polar") {
            this.settingsData.camera.pose = {
                r: parseFloat(radius_input.value), 
                alt: linearAlgebra.clamp(
                    linearAlgebra.toRadian(parseFloat(alt_input.value)), 
                    -linearAlgebra.halfPi, linearAlgebra.halfPi
                ),
                azi: linearAlgebra.wrapPositive(
                    linearAlgebra.toRadian(parseFloat(azi_input.value)), 
                    linearAlgebra.twoPi
                )
            };
        }
        else {
            const newCoords = {
                x: parseFloat(position_input.x.value), 
                y: parseFloat(position_input.y.value), 
                z: parseFloat(position_input.z.value)
            };
    
            let newOrientation;
            if (this.settingsData.camera.mode === "Y-CartesianPolar") {
                newOrientation = {
                    alt: linearAlgebra.toRadian(parseFloat(altOrient_input.value)), 
                    azi: linearAlgebra.wrapPositive(linearAlgebra.toRadian(parseFloat(aziOrient_input.value)), linearAlgebra.twoPi)
                };
            }
            else {
                newOrientation = linearAlgebra.quatFromEuler(
                    linearAlgebra.toRadian(parseFloat(eulerOrient_input.pitch.value)), 
                    linearAlgebra.toRadian(parseFloat(eulerOrient_input.yaw.value)),
                    linearAlgebra.toRadian(parseFloat(eulerOrient_input.roll.value))
                );
            }
    
            this.settingsData.camera.pose = {
                coords: newCoords, 
                orientation: newOrientation
            };
        }
    
        camera.setPose(this.settingsData.camera.pose);
    
        const newCameraSensitivity = parseFloat(draggingSensitivity_input.value);
        setDraggingSensitivity(newCameraSensitivity);
        this.settingsData.camera.sensitivity.draggingSensitivity = newCameraSensitivity;
    
        const newCameraMovementSpeed = parseFloat(movementSpeed_input.value);
        setCameraMovementSpeed(newCameraMovementSpeed);
        this.settingsData.camera.sensitivity.movementSpeed = newCameraMovementSpeed;

        const newCameraRotationSpeed = parseFloat(rotationSpeed_input.value);
        setCameraRotationSpeed(newCameraRotationSpeed);
        this.settingsData.camera.sensitivity.rotationSpeed = newCameraRotationSpeed;
    
        const newCameraNear = parseFloat(near_input.value);
        setCameraNear(newCameraNear);
        this.settingsData.camera.projection.near = newCameraNear;
    
        const newCameraFar = parseFloat(far_input.value);
        setCameraFar(newCameraFar);
        this.settingsData.camera.projection.far = newCameraFar;
    
        const newCameraFov = parseFloat(fov_input.value);
        setCameraFov(newCameraFov);
        this.settingsData.camera.projection.fov = newCameraFov;
    
        masterRenderer.setMatricies();
        masterRenderer.setProjUniformMatrix4fv(); 

        axisRenderer.setMatricies();
        axisRenderer.setProjUniformMatrix4fv(); 
    
        updateSensitivityOverlays();
        updateCameraPerspectiveOverlays();
    
        this.ge.quickAnimationStart();
    
        this.markUnsavedChanges("low");
        this.hide();
    }

    validateCameraConfigMenu() {
        errorMessageDiv.textContent = ""; //clear prev msgs
    
        if (this.settingsData.camera.mode === "Y-Polar") {
            const radius = parseFloat(radius_input.value);
            if (isNaN(radius)) {
                errorMessageDiv.textContent = "Radius must be a float";
                return false;
            }
    
            const alt = parseFloat(alt_input.value);
            if (isNaN(alt) || alt < -90 || alt > 90) {
                errorMessageDiv.textContent = "Altitude must be a float between -90 and 90 degrees";
                return false;
            }
    
            const azi = parseFloat(azi_input.value);
            if (isNaN(azi)) {
                errorMessageDiv.textContent = "Azimuth must be a float";
                return false;
            }
        }
        else {
            for (const axis of axes) {
                const pos = parseFloat(position_input[axis].value);
                if (isNaN(pos)) {
                    errorMessageDiv.textContent = `Position (${axis}) must be a float`;
                    return false;
                }
            }
    
            if (this.settingsData.camera.mode === "Y-CartesianPolar") {
                const alt = parseFloat(altOrient_input.value);
                if (isNaN(alt) || alt < -90 || alt > 90) {
                    errorMessageDiv.textContent = "Orientation Altitude must be a float between -90 and 90 degrees";
                    return false;
                }
    
                const azi = parseFloat(aziOrient_input.value);
                if (isNaN(azi)) {
                    errorMessageDiv.textContent = "Orientation Azimuth must be a float";
                    return false;
                }
            }
            else {
                const orientations = ["pitch", "yaw", "roll"];
                for (const orient of orientations) {
                    const val = parseFloat(eulerOrient_input[orient].value);
                    if (isNaN(val)) {
                        errorMessageDiv.textContent = `${orient} must be a float`;
                        return false;
                    }
                }
            }
        }
    
        const dragSense = parseFloat(draggingSensitivity_input.value);
        if (isNaN(dragSense) || dragSense <= 0) {
            errorMessageDiv.textContent = "Camera Dragging Sensitivity must be a non-zero positive float";
            return false;
        }
    
        const movSpeed = parseFloat(movementSpeed_input.value);
        if (isNaN(movSpeed) || movSpeed <= 0) {
            errorMessageDiv.textContent = "Camera Movement Speed must be a non-zero positive float";
            return false;
        }

        const rotSpeed = parseFloat(rotationSpeed_input.value);
        if (isNaN(rotSpeed) || rotSpeed <= 0) {
            errorMessageDiv.textContent = "Camera Rotation Speed must be a non-zero positive float";
            return false;
        }
    
        const near = parseFloat(near_input.value);
        if (isNaN(near) || near <= 0) {
            errorMessageDiv.textContent = "Camera Projection Near must be a non-zero positive float";
            return false;
        }
    
        const far = parseFloat(far_input.value);
        if (isNaN(far) || far <= 0) {
            errorMessageDiv.textContent = "Camera Projection Far must be a non-zero positive float";
            return false;
        }
    
        const fov = parseFloat(fov_input.value);
        if (isNaN(fov) || fov <= 0) {
            errorMessageDiv.textContent = "Camera Projection Field Of View must be a non-zero positive float";
            return false;
        }
    
        return true;
    }

    keyEvents(event) {
        if (event.key === "Escape") {
            this.hide();
        }
        else if (event.key === "Enter") {
            this.submit();
        }
    }

    updateCameraMode(event) {
        const cameraMode = event.target.value;
        setCameraMode(cameraMode);
        this.settingsData.camera.mode = cameraMode; 
    
        this.settingsData.camera.pose = camera.getPose();
    
        this.ge.quickAnimationStart();
    }

    bindPermanantEvents() {
        super.bindPermanantEvents();

        openMenu_button.addEventListener("pointerup", this.show);
        hideMenu_button.addEventListener("pointerdown", this.hide);
        overlayMenu.addEventListener("pointerup", (event) => {
            if (event.target === overlayMenu) {
                this.hide(); 
            }
        });
        configCamera_button.addEventListener("pointerup", this.submit);

        for (const element of document.getElementsByClassName("cam-input")) {
            element.addEventListener("input", this.validateCameraConfigMenu.bind(this));
        }

        yPolar_radio.addEventListener("change", this.updateCameraMode.bind(this));
        yCartPolar_radio.addEventListener("change", this.updateCameraMode.bind(this));
        cartQuat_radio.addEventListener("change", this.updateCameraMode.bind(this));
    }
}
