import {Particle} from "../utils/bespokeConstructs.js";

/*
export function rungeKutta4_updateParticles(computeForces, applyCollisions, particles, planes, dt) {
    const len = particles.length;

    const halfDt = dt / 2;
    const sixthDt = dt / 6;

    const k1 = new Array(len);
    const k2 = new Array(len);
    const k3 = new Array(len);
    const k4 = new Array(len);

    for (let i = 0; i < len; i++) {
        const p = particles[i];
        k1[i] = new Particle(p.mass, [...p.s], [...p.v], p.radius, p.charge, p.dragCoef);
        k2[i] = new Particle(p.mass, [...p.s], [...p.v], p.radius, p.charge, p.dragCoef);
        k3[i] = new Particle(p.mass, [...p.s], [...p.v], p.radius, p.charge, p.dragCoef);
        k4[i] = new Particle(p.mass, [...p.s], [...p.v], p.radius, p.charge, p.dragCoef);
    }

    for (let i = 0; i < len; i++) {
        const p = particles[i];
        const k1p = k1[i];
        k1p.s[0] = p.v[0];
        k1p.s[1] = p.v[1];
        k1p.s[2] = p.v[2];
        k1p.v[0] = p.a[0];
        k1p.v[1] = p.a[1];
        k1p.v[2] = p.a[2];
    }
    computeForces(k1, planes);

    for (let i = 0; i < len; i++) {
        const p = particles[i];
        const k1p = k1[i];
        const k2p = k2[i];
        k2p.s[0] = p.s[0] + k1p.s[0] * halfDt;
        k2p.s[1] = p.s[1] + k1p.s[1] * halfDt;
        k2p.s[2] = p.s[2] + k1p.s[2] * halfDt;
        k2p.v[0] = p.v[0] + k1p.v[0] * halfDt;
        k2p.v[1] = p.v[1] + k1p.v[1] * halfDt;
        k2p.v[2] = p.v[2] + k1p.v[2] * halfDt;
    }
    computeForces(k2, planes);
    for (let i = 0; i < len; i++) {
        const k2p = k2[i];
        k2p.v[0] = k2p.a[0];
        k2p.v[1] = k2p.a[1];
        k2p.v[2] = k2p.a[2];
    }

    for (let i = 0; i < len; i++) {
        const p = particles[i];
        const k2p = k2[i];
        const k3p = k3[i];
        k3p.s[0] = p.s[0] + k2p.s[0] * halfDt;
        k3p.s[1] = p.s[1] + k2p.s[1] * halfDt;
        k3p.s[2] = p.s[2] + k2p.s[2] * halfDt;
        k3p.v[0] = p.v[0] + k2p.v[0] * halfDt;
        k3p.v[1] = p.v[1] + k2p.v[1] * halfDt;
        k3p.v[2] = p.v[2] + k2p.v[2] * halfDt;
    }
    computeForces(k3, planes);
    for (let i = 0; i < len; i++) {
        const k3p = k3[i];
        k3p.v[0] = k3p.a[0];
        k3p.v[1] = k3p.a[1];
        k3p.v[2] = k3p.v[2];
    }

    for (let i = 0; i < len; i++) {
        const p = particles[i];
        const k3p = k3[i];
        const k4p = k4[i];
        k4p.s[0] = p.s[0] + k3p.s[0] * dt;
        k4p.s[1] = p.s[1] + k3p.s[1] * dt;
        k4p.s[2] = p.s[2] + k3p.s[2] * dt;
        k4p.v[0] = p.v[0] + k3p.v[0] * dt;
        k4p.v[1] = p.v[1] + k3p.v[1] * dt;
        k4p.v[2] = p.v[2] + k3p.v[2] * dt;
    }
    computeForces(k4, planes);
    for (let i = 0; i < len; i++) {
        const k4p = k4[i];
        k4p.v[0] = k4p.a[0];
        k4p.v[1] = k4p.a[1];
        k4p.v[2] = k4p.a[2];
    }
        

    for (let i = 0; i < len; i++) {
        const p = particles[i];
        const k1p = k1[i];
        const k2p = k2[i];
        const k3p = k3[i];
        const k4p = k4[i];
        
        p.s[0] += (k1p.s[0] + 2 * k2p.s[0] + 2 * k3p.s[0] + k4p.s[0]) * sixthDt;
        p.s[1] += (k1p.s[1] + 2 * k2p.s[1] + 2 * k3p.s[1] + k4p.s[1]) * sixthDt;
        p.s[2] += (k1p.s[2] + 2 * k2p.s[2] + 2 * k3p.s[2] + k4p.s[2]) * sixthDt;

        p.v[0] += (k1p.v[0] + 2 * k2p.v[0] + 2 * k3p.v[0] + k4p.v[0]) * sixthDt;
        p.v[1] += (k1p.v[1] + 2 * k2p.v[1] + 2 * k3p.v[1] + k4p.v[1]) * sixthDt;
        p.v[2] += (k1p.v[2] + 2 * k2p.v[2] + 2 * k3p.v[2] + k4p.v[2]) * sixthDt;
    }

    

    /*
    for (let i = 0; i < len; i++) {
        const p = particles[i];
        const k1p = k1[i];
        
        p.s[0] += (k1p.s[0]) * dt;
        p.s[1] += (k1p.s[1]) * dt;
        p.s[2] += (k1p.s[2]) * dt;

        p.v[0] += (k1p.v[0]) * dt;
        p.v[1] += (k1p.v[1]) * dt;
        p.v[2] += (k1p.v[2]) * dt;
    }

    applyCollisions(particles, planes);
}
*/

export function rungeKutta4_updateParticles(computeForces, applyCollisions, particles, planes, dt) {
    const len = particles.length;

    const k1 = [];

    for (const p of particles) {
        k1.push(new Particle(p.mass, [...p.s], [...p.v], p.radius, p.charge, p.dragCoef));
    }

    for (const k1p of k1) {
        k1p.s[0] += k1p.v[0] * dt;
        k1p.s[1] += k1p.v[1] * dt;
        k1p.s[2] += k1p.v[2] * dt;

        k1p.v[0] += k1p.a[0] * dt;
        k1p.v[1] += k1p.a[1] * dt;
        k1p.v[2] += k1p.a[2] * dt;
    }

    computeForces(k1, planes);
    //computeForces(particles, planes);


    for (let i = 0; i < len; i++) {
        const p = particles[i];
        const k1p = k1[i];
        
        p.s[0] = k1p.s[0];
        p.s[1] = k1p.s[1];
        p.s[2] = k1p.s[2];

        p.v[0] = k1p.v[0];
        p.v[1] = k1p.v[1];
        p.v[2] = k1p.v[2];
    }

    applyCollisions(particles, planes);
}
