import * as linearAlgebra from "../utils/linearAlgebra.js";
import {
    updateCartesianCameraCoordsOverlays, updateCameraModeOverlay, 
    updateCameraEulerAnglesOverlays, updatePolarCameraPoseOverlays, 
    emptyAllCameraOverlays, updatePolarCartesianCameraOrientationOverlays
} from "./overlays.js";
import {clock} from "./clock.js";
import {keys, mouseDragging} from "./listeners.js";

export let cameraMode = "Y-Polar";

export let cameraMovementSpeed = 6;
export let draggingSensitivity = 0.001;

class Camera {
    constructor() {
        this.fov = 45;
        this.near = 0.01;
        this.far = 100000; 

        this.coords;

        this.changedSinceLastFrame;
    }

    getProjMat(canvas) {
        return linearAlgebra.perspective(
            linearAlgebra.toRadian(this.fov), 
            canvas.clientWidth / canvas.clientHeight, 
            this.near, 
            this.far
        );
    }
}

class CartesianQuaternionCamera extends Camera {
    constructor(init_coords, init_orientation) {
        super();

        this.coords = {
            x: init_coords.x, 
            y: init_coords.y, 
            z: init_coords.z
        };

        //camera local unit vectors
        this.front = {x: 0, y: 0, z: 0};
        this.right = {x: 0, y: 0, z: 0};
        this.up = {x: 0, y: 0, z: 0};

        //gigachad camera orientation quaternion 
        this.orientation = {
            x: init_orientation.x, 
            y: init_orientation.y, 
            z: init_orientation.z, 
            w: init_orientation.w
        }; 

        //initilise direction vects based on initial camera position
        this.updateDirectionVects();
    }

    updateDirectionVects() {
        linearAlgebra.transformQuat(this.front, linearAlgebra.globalFront, this.orientation);
        linearAlgebra.transformQuat(this.right, linearAlgebra.globalRight, this.orientation);
        linearAlgebra.transformQuat(this.up, linearAlgebra.globalUp, this.orientation);
    }

    handleMovements() {
        if (keys.w || keys.s || keys.d || keys.a || keys.space || keys.shift || keys.left || keys.right || keys.up || keys.down || keys.period || keys.comma) {
            linearAlgebra.scaleTranslateVec3(this.coords, this.front, cameraMovementSpeed  * clock.deltaT * (keys.w - keys.s));
            linearAlgebra.scaleTranslateVec3(this.coords, this.right, cameraMovementSpeed  * clock.deltaT * (keys.d - keys.a));
            linearAlgebra.scaleTranslateVec3(this.coords, this.up, cameraMovementSpeed  * clock.deltaT * (keys.space - keys.shift));
            updateCartesianCameraCoordsOverlays();


            linearAlgebra.applyQuat(
                this.orientation, linearAlgebra.getAxisAngle(
                    this.right, cameraMovementSpeed  * clock.deltaT * (keys.up - keys.down) * 0.08
                )
            ); //pitch
            linearAlgebra.applyQuat(
                this.orientation, linearAlgebra.getAxisAngle(
                    this.up, cameraMovementSpeed  * clock.deltaT * (keys.left - keys.right) * 0.08
                )
            ); //yaw
            linearAlgebra.applyQuat(
                this.orientation, linearAlgebra.getAxisAngle(
                    this.front, cameraMovementSpeed  * clock.deltaT * (keys.period - keys.comma) * 0.08
                )
            ); //roll
            linearAlgebra.normaliseQuat(this.orientation);
            this.updateDirectionVects();
            updateCameraEulerAnglesOverlays();

            this.changedSinceLastFrame = true;
        }
    }

    //to help overlay calls from outside camera class - polymorphism IG
    updateAllOverlays() {
        updateCartesianCameraCoordsOverlays();
        updateCameraEulerAnglesOverlays();
    }

    //Beefed up version of euler rotaion approach...
    onPointerDrag(offset) {
        //create a set of axis relative to camera to apply offsets to
        linearAlgebra.applyQuat(this.orientation, linearAlgebra.getAxisAngle(this.up, offset.x * draggingSensitivity));  //yaw
        linearAlgebra.applyQuat(this.orientation, linearAlgebra.getAxisAngle(this.right, offset.y * draggingSensitivity)); //pitch

        linearAlgebra.normaliseQuat(this.orientation);

        //calculate local direction vectors from camera quat
        this.updateDirectionVects();

        //print out as euler angles because my pea sized brain can not understand 4d coordinates without having 17 simultaneous aneurysms
        updateCameraEulerAnglesOverlays();
    }

    updateCamera(viewMatrix) {
        this.changedSinceLastFrame ||= mouseDragging;

        this.handleMovements();
    
        this.getViewMatrix(viewMatrix);
    }

    forceUpdateCamera(viewMatrix) {
        this.updateDirectionVects();
    
        this.getViewMatrix(viewMatrix);

        this.changedSinceLastFrame = true;

        this.updateAllOverlays();
    }

    getViewMatrix(viewMatrix) {
        linearAlgebra.lookAt(viewMatrix, this.coords, this.front, this.up);
    }

    getOrientationViewMatrix(viewMatrix) {
        linearAlgebra.lookAt(viewMatrix, linearAlgebra.globalOrigin, camera.front, camera.up);
    }

    setPose(pose) {
        this.coords = {
            x: pose.coords.x, 
            y: pose.coords.y, 
            z: pose.coords.z
        };

        this.orientation = {
            x: pose.orientation.x, 
            y: pose.orientation.y, 
            z: pose.orientation.z, 
            w: pose.orientation.w
        };

        this.updateAllOverlays();
    }

    getPose() {
        return {coords: camera.coords, orientation: camera.orientation};
    }
}

class CartesianPolarCamera extends Camera {
    constructor(init_coords, init_orientation) {
        super();

        this.coords = {
            x: init_coords.x, 
            y: init_coords.y, 
            z: init_coords.z
        };

        this.orientation = {
            alt: init_orientation.alt, 
            azi: init_orientation.azi
        }; 

        //initilise direction vects based on initial camera position
        this.setDirectionVects();
    }

    setDirectionVects() {
        const basisVecs = linearAlgebra.getBasisHorizontalCoords(this.orientation);
        this.front = basisVecs.front;
        this.right = basisVecs.right;
        this.up = basisVecs.up;
    }

    handleMovements() {
        if (keys.w || keys.s || keys.d || keys.a || keys.space || keys.shift || keys.left || keys.right || keys.up || keys.down) {
            linearAlgebra.scaleTranslateVec3(
                this.coords, 
                linearAlgebra.subVec3(
                    this.front, linearAlgebra.scaleVec3(linearAlgebra.globalUp, linearAlgebra.dotVec3(this.front, linearAlgebra.globalUp))
                ), 
                cameraMovementSpeed  * clock.deltaT * (keys.w - keys.s)
            );
            linearAlgebra.scaleTranslateVec3(
                this.coords, 
                linearAlgebra.subVec3(
                    this.right, linearAlgebra.scaleVec3(linearAlgebra.globalUp, linearAlgebra.dotVec3(this.right, linearAlgebra.globalUp))
                ), 
                cameraMovementSpeed  * clock.deltaT * (keys.d - keys.a)
            );
            linearAlgebra.scaleTranslateVec3(
                this.coords, 
                linearAlgebra.globalUp, 
                cameraMovementSpeed  * clock.deltaT * (keys.space - keys.shift)
            );
            updateCartesianCameraCoordsOverlays();

            this.orientation.azi += cameraMovementSpeed  * clock.deltaT * (keys.left - keys.right) * 0.08;
            this.orientation.alt += cameraMovementSpeed  * clock.deltaT * (keys.up - keys.down) * 0.08;
            this.readjustAngles();

            this.setDirectionVects();

            updatePolarCartesianCameraOrientationOverlays();

            this.changedSinceLastFrame = true;
        }
    }

    //to help overlay calls from outside camera class - polymorphism IG
    updateAllOverlays() {
        updateCartesianCameraCoordsOverlays();
        updatePolarCartesianCameraOrientationOverlays();
    }

    readjustAngles() {
        this.orientation.azi = linearAlgebra.wrapPositive(this.orientation.azi, linearAlgebra.twoPi);
        this.orientation.alt = linearAlgebra.clamp(this.orientation.alt, -linearAlgebra.halfPi, linearAlgebra.halfPi);
    }

    onPointerDrag(offset) {
        //create a set of axis relative to camera to apply offsets to
        this.orientation.azi += offset.x * draggingSensitivity;
        this.orientation.alt += offset.y * draggingSensitivity;
        this.readjustAngles();

        this.setDirectionVects();

        updatePolarCartesianCameraOrientationOverlays();
    }

    updateCamera(viewMatrix) {
        this.changedSinceLastFrame ||= mouseDragging;

        this.handleMovements();
    
        this.getViewMatrix(viewMatrix);
    }

    forceUpdateCamera(viewMatrix) {
        this.setDirectionVects();
    
        this.getViewMatrix(viewMatrix);

        this.changedSinceLastFrame = true;

        this.updateAllOverlays();
    }

    getViewMatrix(viewMatrix) {
        linearAlgebra.lookAt(viewMatrix, this.coords, this.front, this.up);
    }

    getOrientationViewMatrix(viewMatrix) {
        linearAlgebra.lookAt(viewMatrix, linearAlgebra.globalOrigin, camera.front, camera.up);
    }

    setPose(pose) {
        this.coords = {
            x: pose.coords.x, 
            y: pose.coords.y, 
            z: pose.coords.z
        };

        this.orientation = {
            alt: pose.orientation.alt, 
            azi: pose.orientation.azi
        };

        this.updateAllOverlays();
    }

    getPose() {
        return {coords: camera.coords, orientation: camera.orientation};
    }
}



class PolarCamera extends Camera {
    constructor(init_r, init_alt, init_azi, init_origin = {x: 0, y: 0, z: 0}) {
        super();

        this.localOrigin = {
            x: init_origin.x, 
            y: init_origin.y,
            z: init_origin.z
        }

        this.azi_movement_sf = cameraMovementSpeed  * clock.deltaT / 2;
        this.alt_movement_sf = cameraMovementSpeed  * clock.deltaT / 4;

        this.r = init_r; //radial distance
        this.alt = init_alt; //altitude
        this.azi = init_azi; //azimuth

        this.coords;
        this.front;
        this.up = linearAlgebra.globalUp;
    }

    readjustAngles() {
        this.azi = linearAlgebra.wrapPositive(this.azi, linearAlgebra.twoPi);
        this.alt = linearAlgebra.clamp(this.alt, -linearAlgebra.halfPi, linearAlgebra.halfPi);
    }

    updateAllOverlays() {
        updatePolarCameraPoseOverlays();
    }

    updatePosition() {
        this.readjustAngles();

        this.coords = linearAlgebra.coordsfromPolar(this.r, this.alt, this.azi);
        this.front = linearAlgebra.normaliseVec3({
            x: this.localOrigin.x - this.coords.x, 
            y: this.localOrigin.y - this.coords.y, 
            z: this.localOrigin.z - this.coords.z
        });

        this.updateAllOverlays();
    }

    handleMovements() {
        const deltaR = cameraMovementSpeed  * clock.deltaT * (keys.s - keys.w);
        const deltaAzi = this.azi_movement_sf * (keys.d - keys.a);
        const deltaAlt = this.alt_movement_sf * (keys.space - keys.shift);

        if (deltaR || deltaAzi || deltaAlt) {
            this.r += deltaR;
            this.azi += deltaAzi;
            this.alt += deltaAlt;

            this.readjustAngles();
            this.updatePosition();

            this.changedSinceLastFrame = true;
        }
    }

    onPointerDrag(offset) {
        this.alt -= offset.y * draggingSensitivity * 5;
        this.azi += offset.x * draggingSensitivity * 5;

        this.readjustAngles();
        this.updatePosition();

        this.changedSinceLastFrame = true;
    }

    updateCamera(viewMatrix) {
        this.changedSinceLastFrame ||= mouseDragging;

        this.handleMovements();

        this.getViewMatrix(viewMatrix);
    }

    forceUpdateCamera(viewMatrix) {
        this.updatePosition();
        //this.handleMovements();
    
        this.getViewMatrix(viewMatrix);

        this.changedSinceLastFrame = true;
        //masterRenderer.render();
        //axisRenderer.render();
        //this.changedSinceLastFrame = false;
    }

    getViewMatrix(viewMatrix) {
        linearAlgebra.lookAt(viewMatrix, this.coords, this.front, this.up);
    }

    getOrientationViewMatrix(viewMatrix) {
        linearAlgebra.lookAt(viewMatrix, this.localOrigin, this.front, this.up);
    }

    setPose(pose) {
        this.r = pose.r;
        this.azi = pose.azi;
        this.alt = pose.alt;
    }

    getPose() {
        return {r: this.r, alt: this.alt, azi: this.azi};
    }
}

export function toggleCameraMode() {
    //pretty sure the old camera gets garbage collected... 
    //but if there is a memory leak, now you probably know why :)
    if (cameraMode === "CartesianQuaternion") {
        setCameraMode("Y-Polar");
    }
    else if (cameraMode === "Y-Polar") {
        setCameraMode("Y-CartesianPolar");
    }
    else {
        setCameraMode("CartesianQuaternion");
    }

    updateCameraModeOverlay();
    emptyAllCameraOverlays();
}


export function setCameraMode(mode) {
    if (mode !== cameraMode) {
        if (mode === "Y-Polar") {
            cameraMode = mode;

            const r = linearAlgebra.magnitudeVec3(camera.coords);

            camera = new PolarCamera(
                r, 
                Math.asin(camera.coords.y / r), 
                Math.atan2(camera.coords.x, camera.coords.z)
            );
            updateCameraModeOverlay();
            emptyAllCameraOverlays();
        }
        else if (mode === "Y-CartesianPolar") {
            if (cameraMode === "Y-Polar") {
                //flipped since in y-polar, the alt/azi is used for positioning whereas here it is for orient
                const flippedOrientation = {alt: -camera.alt, azi: camera.azi + Math.PI};
                camera = new CartesianPolarCamera(
                    linearAlgebra.coordsfromPolar(camera.r, camera.alt, camera.azi), 
                    flippedOrientation
                );
            }
            else { //if from CartesianQuaternion
                const {alt, azi} = linearAlgebra.polarFromQuatOrientation(camera.orientation);

                camera = new CartesianPolarCamera(
                    camera.coords, 
                    {alt: -alt, azi: azi + Math.PI}
                );
            }

            cameraMode = mode;

            updateCameraModeOverlay();
            emptyAllCameraOverlays();
            camera.updateAllOverlays();
        }
        else if (mode === "CartesianQuaternion") {
            if (cameraMode === "Y-Polar") {
                const coords = linearAlgebra.coordsfromPolar(camera.r, camera.alt, camera.azi);
                const orientation = linearAlgebra.quatOrientationFromPolar(camera.alt, camera.azi);

                camera = new CartesianQuaternionCamera(
                    coords,
                    orientation
                );
            }
            else { //if from cartesianPolar
                const orientation = linearAlgebra.quatOrientationFromPolar(-camera.orientation.alt, camera.orientation.azi + Math.PI);

                camera = new CartesianQuaternionCamera(
                    camera.coords, 
                    orientation
                );
            }

            cameraMode = mode;

            updateCameraModeOverlay();
            emptyAllCameraOverlays();
            camera.updateAllOverlays();
        }
    }
}


export function setDraggingSensitivity(newSensitivity) {
    draggingSensitivity = newSensitivity;
}

export function setCameraMovementSpeed(newSpeed) {
    cameraMovementSpeed = newSpeed;
}


//export let camera = new CartesianCamera({x: 0, y: 0, z: 10}, {x: 0, y: 0, z: 0, w: 1});
export let camera = new PolarCamera(10, 0, 0);
