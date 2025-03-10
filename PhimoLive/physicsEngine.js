import {FPS} from "../AGRE/src/core/clock.js";
import {SolverLinker} from "./solverLinker.js";
import {Particle, Plane} from "./utils/bespokeConstructs.js";

let particles = [];
let planes = [];

const linker = new SolverLinker();


function runLinker(models) {
    const collisions = models.collisions;
    const gravity = models.gravity;
    const eForce = models.eForce;
    const mForce = models.mForce;
    const drag = models.drag;

    linker.clear();

    const solvers = models.solvers;
    if (parseInt(solvers.algorithm) === 0) {
        linker.configureBruteForcer();
    }
    
    switch (parseInt(solvers.intergrator)) {
        case 0:
            linker.configureLeapfrog();
            break;
        case 1:
            linker.configureRungeKutta4();
            break;
        case 2: 
            linker.configureEuler();
            break;
        default:
            linker.configureLeapfrog();
            break;
    }

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
}


export function initialiseEngine(configs) {
    const models = configs.models;

    runLinker(models);
}


export function computeFrame(configs, frames, frameIndex = null, unsavedChanges = false) {
    //console.log(frameIndex, frames.length, unsavedChanges)

    /*
    if (frameIndex !== null && frameIndex < frames.length && !unsavedChanges) {
        return;
    }
    */

    configs.deltaT = 1 / FPS;
    const stepsPerFrame = configs.stepsPerFrame;
    const noOfFrames = configs.noOfFrames;

    const objects = configs.objects;

    particles.length = 0;
    planes.length = 0;

    if (unsavedChanges) {
        const models = configs.models;

        runLinker(models);
    }

    for (const obj of Object.values(objects)) {
        if (obj.dtype === 0) {
            particles.push(new Particle(obj.mass, [...obj.position], [...obj.velocity], obj.radius, obj.charge, obj.dragCoef));
        } 
        else if (obj.dtype === 1) {
            planes.push(new Plane(...obj.dimentions, obj.charge, [...obj.position], [...obj.orientation]));
        }
    }

    const dt = configs.deltaT / stepsPerFrame;

    linker.optimise(particles, planes);

    for (let i = 0; i < stepsPerFrame; i++) {
        linker.updateParticles(particles, planes, dt);
    }

    let i = 0
    for (const obj of Object.values(objects)) {
        if (obj.dtype === 0) {
            obj.position = particles[i].s;
            obj.velocity = particles[i].v;
            i++;
        }
    }

    if (!frameIndex || frameIndex >= frames.length) {
        frames.push([]);
        for (const particle of particles) {
            frames[frames.length - 1].push([...particle.s, ...particle.v]);
        }

        if (frames.length > noOfFrames) {
            frames.shift();
        }
    }
    else if (unsavedChanges) {
        const correctedIndex = Math.min(frameIndex, frames.length - 1);
        frames[correctedIndex].length = 0;
        for (const particle of particles) {
            frames[correctedIndex].push([...particle.s, ...particle.v]);
        }
    }

    unsavedChanges = false;
}