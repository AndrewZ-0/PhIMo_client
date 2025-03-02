import {sub, add, scale, div} from "../utils/linearAlgebra.js";

export function applyGravity(particles, i, j, invSquare, d, phyConsts) {
    const a = scale(invSquare, phyConsts.G * particles[i].mass * particles[j].mass);

    particles[i].a = add(particles[i].a, div(a, particles[i].mass));
    particles[j].a = sub(particles[j].a, div(a, particles[j].mass));
}

export function applyUniformGravity(particles, i, phyConsts) {
    particles[i].a = add(particles[i].a, phyConsts.g);
}
