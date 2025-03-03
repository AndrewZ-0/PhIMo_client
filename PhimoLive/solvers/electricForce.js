import {sub, add, scale, div} from "../utils/linearAlgebra.js";

export function applyPOPElectricForce(particles, i, j, invSquare, d, phyConsts) {
    const a = scale(invSquare, phyConsts.ke * particles[i].charge * particles[j].charge);

    particles[i].a = sub(particles[i].a, div(a, particles[i].mass));
    particles[j].a = add(particles[j].a, div(a, particles[j].mass));
}

export function applyPlaneElectricForce(particles, planes, i, j, phyConsts) {
    const E = 0.5 * planes[j].sigma / phyConsts.E0;
    const a = scale(planes[j].normal, particles[i].charge * E);

    particles[i].a = add(particles[i].a, div(a, particles[i].mass));
}

export function applyUniformElectricForce(particles, i, phyConsts) {
    particles[i].a = add(particles[i].a, phyConsts.E);
}
