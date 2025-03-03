import {Constants} from "./constants.js";
import {bruteForceComputePOPForces, bruteForceComputePlaneForces} from "./algorithms/bruteForcer.js";
import {leapFrog_updateParticles} from "./intergrators/leapFrog.js";
import * as physics from "./physics.js";

function noOpComputePOPForces(applyPOPForces, particles) {}
function noOpComputePlaneForces(applyPlaneForces, particles, planes) {}

export class SolverLinker {
    constructor() {
        this.computePOPForces = noOpComputePOPForces;
        this.computePlaneForces = noOpComputePlaneForces;

        this.activePOPCollisionSolvers = [];
        this.activePlaneCollisionSolvers = [];
        this.activePOPSolvers = [];
        this.activePlaneSolvers = [];
        this.activeGlobalForces = [];

        this.phyConsts = new Constants();
    }

    updateParticles(particles, planes, dt) {
        leapFrog_updateParticles(
            (particles, planes) => {
                this.computeForces(particles, planes)
            },
            (particles, planes) => {
                this.applyCollisions(particles, planes)
            },
            particles, planes, dt
        );
    }

    linkCollision(e) {
        this.activePlaneCollisionSolvers.push(physics.handlePlaneCollisions);
        this.activePOPCollisionSolvers.push(physics.handlePOPCollisions);
        this.phyConsts.sete(e);
    }

    linkGravity(G, g) {
        this.activePOPSolvers.push(physics.applyGravity);
        this.phyConsts.setG(G);

        this.activeGlobalForces.push(physics.applyUniformGravity);
        this.phyConsts.setg(g);
    }

    linkEForce(E0, E) {
        this.activePOPSolvers.push(physics.applyPOPElectricForce);
        this.activePlaneSolvers.push(physics.applyPlaneElectricForce);
        this.phyConsts.setE0(E0);

        this.activeGlobalForces.push(physics.applyUniformElectricForce);
        this.phyConsts.setE(E);
    }

    linkMForce(M0, B) {
        this.activePOPSolvers.push(physics.applyMagneticForce);
        this.phyConsts.setM0(M0);

        this.activeGlobalForces.push(physics.applyUniformMagneticForce);
        this.phyConsts.setB(B);
    }

    linkDrag(rho) {
        this.activeGlobalForces.push(physics.applyDrag);
        this.phyConsts.setRho(rho);
    }

    clear() {
        this.activePOPCollisionSolvers.length = 0;
        this.activePlaneCollisionSolvers.length = 0;
        this.activePOPSolvers.length = 0;
        this.activePlaneSolvers.length = 0;
        this.activeGlobalForces.length = 0;
    }

    applyPOPForces(particles, i, j, invSquare, d) {
        for (const forceFunction of this.activePOPSolvers) {
            forceFunction(particles, i, j, invSquare, d, this.phyConsts);
        }
    }

    applyPlaneForces(particles, planes, i, j) {
        for (const forceFunction of this.activePlaneSolvers) {
            forceFunction(particles, planes, i, j, this.phyConsts);
        }
    }

    applyCollisions(particles, planes) {
        for (const collisionFunction of this.activePOPCollisionSolvers) {
            collisionFunction(particles, this.phyConsts);
        }

        for (const collisionFunction of this.activePlaneCollisionSolvers) {
            collisionFunction(particles, planes, this.phyConsts);
        }
    }

    applyGlobalForces(particles, i) {
        for (const forceFunction of this.activeGlobalForces) {
            forceFunction(particles, i, this.phyConsts);
        }
    }

    computeForces(particles, planes) {
        for (const p of particles) {
            p.a[0] = 0;
            p.a[1] = 0;
            p.a[2] = 0;
        }

        for (let i = 0; i < particles.length; i++) {
            this.applyGlobalForces(particles, i);
        }

        this.computePOPForces(
            (particles, i, j, invSquare, d) => {
                this.applyPOPForces(particles, i, j, invSquare, d);
            }, 
            particles
        );

        this.computePlaneForces(
            (particles, planes, i, j) => {
                this.applyPlaneForces(particles, planes, i, j);
            }, 
            particles, planes
        );
    }

    optimise(particles, planes) {
        if (particles.length === 0) {
            this.activePOPSolvers.length = 0;
            this.activePOPCollisionSolvers.length = 0;
            this.computePOPForces = noOpComputePOPForces;
        } 
        else {
            this.computePOPForces = bruteForceComputePOPForces;
        }

        if (planes.length === 0) {
            this.activePlaneSolvers.length = 0;
            this.activePlaneCollisionSolvers.length = 0;
            this.computePlaneForces = noOpComputePlaneForces;
        } 
        else {
            this.computePlaneForces = bruteForceComputePlaneForces;
        }

        if (this.phyConsts.g[0] === 0 && this.phyConsts.g[1] === 0 && this.phyConsts.g[2] === 0) {
            this.removeActiveGlobalFunction(this.activeGlobalForces, physics.applyUniformGravity);
        }

        if (this.phyConsts.E[0] === 0 && this.phyConsts.E[1] === 0 && this.phyConsts.E[2] === 0) {
            this.removeActiveGlobalFunction(this.activeGlobalForces, physics.applyUniformElectricForce);
        }

        if (this.phyConsts.B[0] === 0 && this.phyConsts.B[1] === 0 && this.phyConsts.B[2] === 0) {
            this.removeActiveGlobalFunction(this.activeGlobalForces, physics.applyUniformMagneticForce);
        }
    }

    removeActiveGlobalFunction(functionList, functionToRemove) {
        const index = functionList.indexOf(functionToRemove);
        if (index !== -1) {
            functionList.splice(index, 1);
        }
    }
}
