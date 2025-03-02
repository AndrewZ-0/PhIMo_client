import {sub, add, scale, div, cross} from "../utils/linearAlgebra.js";

export function applyMagneticForce(particles, i, j, invSquare, d, phyConsts) {
    const alpha = scale(invSquare, phyConsts.km * particles[i].charge * particles[j].charge);

    particles[i].a = sub(particles[i].a, div(cross(particles[i].v, cross(particles[j].v, alpha)), particles[i].mass));
    particles[j].a = add(particles[j].a, div(cross(particles[j].v, cross(particles[i].v, alpha)), particles[j].mass));
}

export function applyUniformMagneticForce(particles, i, phyConsts) {
    particles[i].a = add(particles[i].a, div(cross(particles[i].v, phyConsts.B), particles[i].mass));
}