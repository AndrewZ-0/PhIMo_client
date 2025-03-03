import {clock} from "../AGRE/src/core/clock.js";
import {SolverLinker} from "./solverLinker.js";
import {Particle, Plane} from "./utils/bespokeConstructs.js";


let particles = [];
let planes = [];

const linker = new SolverLinker();

export function computeFrame(configs, headers, frames, frameIndex = null) {
    const deltaT = clock.deltaT;
    const stepsPerFrame = configs.stepsPerFrame;
    const noOfFrames = configs.noOfFrames;

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

    for (const obj of Object.values(objects)) {
        if (obj.dtype === 0) {
            particles.push(new Particle(obj.mass, [...obj.position], [...obj.velocity], obj.radius, obj.charge, obj.dragCoef));
        } 
        else if (obj.dtype === 1) {
            planes.push(new Plane(...obj.dimentions, obj.charge, [...obj.position], [...obj.orientation]));
        }
    }

    const dt = deltaT / stepsPerFrame;

    linker.optimise(particles, planes);
    
    headers.length = 0;
    for (const [objName, obj] of Object.entries(objects)) {
        if (obj.dtype === 0) {
            headers.push(objName);
        }
    }

    for (let i = 0; i < stepsPerFrame; i++) {
        linker.updateParticles(particles, planes, dt);
    }

    if (!frameIndex || frameIndex > frames.length - 1) {
        frames.push([]);
        for (const particle of particles) {
            frames[frames.length - 1].push([...particle.s, ...particle.v]);
        }

        if (frames.length > noOfFrames) {
            frames.shift();
        }
    }
    else {
        frames[frameIndex] = [];
        for (const particle of particles) {
            frames[frameIndex].push([...particle.s, ...particle.v]);
        }
    }
}