import {clock} from "../AGRE/src/core/clock.js";
import {SolverLinker} from "./solverLinker.js";
import {Particle, Plane} from "./utils/bespokeConstructs.js";


let particles = [];
let planes = [];

const linker = new SolverLinker();

export function computeFrame(configs, frames) {
    const deltaT = clock.deltaT;
    const stepsPerFrame = configs.noOfFrames

    const models = configs.models;

    const collisions = models.collisions;
    const gravity = models.gravity;
    const eForce = models.eForce;
    const mForce = models.mForce;
    const drag = models.drag;

    const objects = configs.objects;

    particles.length = 0;
    planes.length = 0;
    linker.clear();

    if (collisions.compute) {
        linker.linkCollision(collisions.e);
    }
    if (gravity.compute) {
        linker.linkGravity(gravity.G, [gravity.g.x, gravity.g.y, gravity.g.z]);
    }
    if (eForce.compute) {
        linker.linkEForce(eForce.E0, [eForce.E.x, eForce.E.y, eForce.E.z]);
    }
    if (mForce.compute) {
        linker.linkMForce(mForce.M0, [mForce.B.x, mForce.B.y, mForce.B.z]);
    }
    if (drag.compute) {
        linker.linkDrag(drag.rho);
    }

    for (const obj in objects) {
        if (obj.dtype === 0) {
            particles.push(new Particle(mass, obj.position, obj.velocity, obj.radius, obj.charge, obj.dragCoef));
        } 
        else if (obj.dtype === 1) {
            planes.push(new Plane(obj.dimentions[0], obj.dimentions[1], obj.charge, obj.position, obj.orientation));
        }
    }

    const dt = deltaT / stepsPerFrame;

    linker.optimise(particles, planes);

    for (let i = 0; i < stepsPerFrame; i++) {
        linker.updateParticles(particles, planes, dt);
    }

    let i = 0;
    for (const objectName of configs.objects) {
        configs.objects[objectName] = particles.position[i];
        i++;
    }

    frames.push()
}