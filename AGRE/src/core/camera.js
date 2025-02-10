import * as linearAlgebra from "../utils/linearAlgebra.js";
import {
    updateCameraCartesianCoordsOverlays, updateCameraModeOverlay, 
    updateCameraEulerAnglesOverlays, updateCameraPolarCoordsOverlays
} from "./overlays.js";
import {clock} from "./clock.js";
import {keys, mouseDragging} from "./listeners.js";
import {masterRenderer, axisRenderer} from "./renderer.js";


export let cameraMode = "Y-Polar";


class Camera {
    constructor() {
        this.fov = 45;
        this.near = 0.01;
        this.far = 100000; 

        this.cameraSpeed = 6;

        this.sensitivity = 0.001;

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


class QuaternionCamera extends Camera {
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
            linearAlgebra.scaleTranslateVec3(this.coords, this.front, this.cameraSpeed * clock.deltaT * (keys.w - keys.s));
            linearAlgebra.scaleTranslateVec3(this.coords, this.right, this.cameraSpeed * clock.deltaT * (keys.d - keys.a));
            linearAlgebra.scaleTranslateVec3(this.coords, this.up, this.cameraSpeed * clock.deltaT * (keys.space - keys.shift));
            updateCameraCartesianCoordsOverlays();


            linearAlgebra.applyQuat(
                this.orientation, linearAlgebra.getAxisAngle(
                    this.right, this.cameraSpeed * clock.deltaT * (keys.up - keys.down) * 0.08
                )
            ); //pitch
            linearAlgebra.applyQuat(
                this.orientation, linearAlgebra.getAxisAngle(
                    this.up, this.cameraSpeed * clock.deltaT * (keys.left - keys.right) * 0.08
                )
            ); //yaw
            linearAlgebra.applyQuat(
                this.orientation, linearAlgebra.getAxisAngle(
                    this.front, this.cameraSpeed * clock.deltaT * (keys.period - keys.comma) * 0.08
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
        updateCameraCartesianCoordsOverlays();
        updateCameraEulerAnglesOverlays();
    }

    //Beefed up version of euler rotaion approach...
    onMouseMove(offset) {
        //create a set of axis relative to camera to apply offsets to
        linearAlgebra.applyQuat(this.orientation, linearAlgebra.getAxisAngle(this.up, offset.x * this.sensitivity));  //yaw
        linearAlgebra.applyQuat(this.orientation, linearAlgebra.getAxisAngle(this.right, offset.y * this.sensitivity)); //pitch

        linearAlgebra.normaliseQuat(this.orientation);

        //calculate local direction vectors from camera quat
        this.updateDirectionVects();

        //print out as euler angles because my pea sized brain can not understand 4d coordinates without having 17 simultaneous aneurysms
        updateCameraEulerAnglesOverlays();
    }

    updateCamera(viewMatrix) {
        this.changedSinceLastFrame = mouseDragging;

        this.handleMovements();
    
        this.getViewMatrix(viewMatrix);
    }

    forceUpdateCamera(viewMatrix) {
        //this.handleMovements();
    
        this.getViewMatrix(viewMatrix);

        this.changedSinceLastFrame = true;
        masterRenderer.render();
        axisRenderer.render();
    }

    getViewMatrix(viewMatrix) {
        linearAlgebra.lookAt(viewMatrix, this.coords, this.front, this.up);
    }

    getOrientationViewMatrix(viewMatrix) {
        linearAlgebra.lookAt(viewMatrix, linearAlgebra.globalOrigin, camera.front, camera.up);
    }
}

class CartesianCamera extends QuaternionCamera {
    constructor(init_coords, init_orientation) {
        super(init_coords, init_orientation);
    }

    updateDirectionVects() {
        super.updateDirectionVects();

        this.up = {x: 0, y: 1, z: 0};
    }

    handleMovements() {
        if (keys.w || keys.s || keys.d || keys.a || keys.space || keys.shift || keys.left || keys.right || keys.up || keys.down) {
            linearAlgebra.scaleTranslateVec3(this.coords, linearAlgebra.crossVec3(this.up, this.right), this.cameraSpeed * clock.deltaT * (keys.w - keys.s));
            linearAlgebra.scaleTranslateVec3(this.coords, this.right, this.cameraSpeed * clock.deltaT * (keys.d - keys.a));
            linearAlgebra.scaleTranslateVec3(this.coords, this.up, this.cameraSpeed * clock.deltaT * (keys.space - keys.shift));
            updateCameraCartesianCoordsOverlays();

            linearAlgebra.applyQuat(
                this.orientation, linearAlgebra.getAxisAngle(
                    this.right, this.cameraSpeed * clock.deltaT * (keys.up - keys.down) * 0.08
                )
            ); //pitch
            linearAlgebra.applyQuat(
                this.orientation, linearAlgebra.getAxisAngle(
                    this.up, this.cameraSpeed * clock.deltaT * (keys.left - keys.right) * 0.08
                )
            ); //yaw

            linearAlgebra.normaliseQuat(this.orientation);
            this.updateDirectionVects();
            updateCameraEulerAnglesOverlays();

            this.changedSinceLastFrame = true;
        }
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

        this.sensitivity = 0.005;
        this.azi_movement_sf = this.cameraSpeed * clock.deltaT / 2;
        this.alt_movement_sf = this.cameraSpeed * clock.deltaT / 4;

        this.r = init_r; //radial distance
        this.alt = init_alt; //altitude
        this.azi = init_azi; //azimuth

        this.coords;
        this.front;
        this.up = linearAlgebra.globalUp;

        //this.updatePosition();
    }

    readjustAngles() {
        if (this.azi < -Math.PI) {
            this.azi = Math.PI;
        }
        else if (this.azi > Math.PI) {
            this.azi = -Math.PI;
        }

        if (this.alt < -linearAlgebra.halfPi) {
            this.alt = -linearAlgebra.halfPi;
        }
        else if (this.alt > linearAlgebra.halfPi) {
            this.alt = linearAlgebra.halfPi;
        }
    }

    updateAllOverlays() {
        updateCameraPolarCoordsOverlays();
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
        const deltaR = this.cameraSpeed * clock.deltaT * (keys.s - keys.w);
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

    onMouseMove(offset) {
        this.alt -= offset.y * this.sensitivity;
        this.azi += offset.x * this.sensitivity;

        this.readjustAngles();
        this.updatePosition();

        this.changedSinceLastFrame = true;
    }

    updateCamera(viewMatrix) {
        this.changedSinceLastFrame = mouseDragging;

        this.handleMovements();

        this.getViewMatrix(viewMatrix);
    }

    forceUpdateCamera(viewMatrix) {
        this.updatePosition();
        //this.handleMovements();
    
        this.getViewMatrix(viewMatrix);

        this.changedSinceLastFrame = true;
        masterRenderer.render();
        axisRenderer.render();
    }

    getViewMatrix(viewMatrix) {
        linearAlgebra.lookAt(viewMatrix, this.coords, this.front, this.up);
    }

    getOrientationViewMatrix(viewMatrix) {
        linearAlgebra.lookAt(viewMatrix, this.localOrigin, this.front, this.up);
    }
}


export function toggleCameraMode() {
    //pretty sure the old camera gets garbage collected... 
    //but if there is a memory leak, now you probably know why :)
    if (cameraMode === "Quaternion") {
        cameraMode = "Y-Polar";

        const r = linearAlgebra.magnitudeVec3(camera.coords);
        camera = new PolarCamera(
            r, 
            Math.asin(camera.coords.y / r), 
            Math.atan2(camera.coords.x, camera.coords.z)
        );
    }
    else if (cameraMode === "Y-Polar") {
        cameraMode = "Y-Cartesian";

        camera = new CartesianCamera(
            linearAlgebra.coordsfromPolar(camera.r, camera.alt, camera.azi), 
            linearAlgebra.quatOrientationFromPolar(camera.alt, camera.azi)
        );
    }
    else {
        cameraMode = "Quaternion";

        camera = new QuaternionCamera(
            camera.coords, 
            camera.orientation
        );
        camera.updateAllOverlays();
    }

    updateCameraModeOverlay();
}


//export let camera = new CartesianCamera({x: 0, y: 0, z: 6}, {x: 0, y: 0, z: 0, w: 1});
export let camera = new PolarCamera(6, 0, 0);
