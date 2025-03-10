export function rungeKutta4_updateParticles(computeForces, applyCollisions, particles, planes, dt) {
    const len = particles.length;

    const k1 = new Array(len);
    const k2 = new Array(len);
    const k3 = new Array(len);
    const k4 = new Array(len);

    for (let i = 0; i < len; i++) {
        k1[i] = {s: [0, 0, 0], v: [0, 0, 0], a: [...particles[i].a]};
        k2[i] = {s: [0, 0, 0], v: [0, 0, 0], a: [...particles[i].a]};
        k3[i] = {s: [0, 0, 0], v: [0, 0, 0], a: [...particles[i].a]};
        k4[i] = {s: [0, 0, 0], v: [0, 0, 0], a: [...particles[i].a]};
    }

    computeForces(k1, planes);
    for (let i = 0; i < len; i++) {
        for (let j = 0; j < 3; j++) {
            k1[i].s[j] = particles[i].v[j];
            k1[i].v[j] = particles[i].a[j];
        }
    }

    for (let i = 0; i < len; i++) {
        for (let j = 0; j < 3; j++) {
            k2[i].s[j] = particles[i].s[j] + k1[i].s[j] * (dt / 2);
            k2[i].v[j] = particles[i].v[j] + k1[i].v[j] * (dt / 2);
        }
    }
    computeForces(k2, planes);
    for (let i = 0; i < len; i++) {
        for (let j = 0; j < 3; j++) {
            k2[i].v[j] = k2[i].a[j];
        }
    }

    for (let i = 0; i < len; i++) {
        for (let j = 0; j < 3; j++) {
            k3[i].s[j] = particles[i].s[j] + k2[i].s[j] * (dt / 2);
            k3[i].v[j] = particles[i].v[j] + k2[i].v[j] * (dt / 2);
        }
    }
    computeForces(k3, planes);
    for (let i = 0; i < len; i++) {
        for (let j = 0; j < 3; j++) {
            k3[i].v[j] = k3[i].a[j];
        }
    }

    for (let i = 0; i < len; i++) {
        for (let j = 0; j < 3; j++) {
            k4[i].s[j] = particles[i].s[j] + k3[i].s[j] * dt;
            k4[i].v[j] = particles[i].v[j] + k3[i].v[j] * dt;
        }
    }
    computeForces(k4, planes);
    for (let i = 0; i < len; i++) {
        for (let j = 0; j < 3; j++) {
            k4[i].v[j] = k4[i].a[j];
        }
    }

    for (let i = 0; i < len; i++) {
        for (let j = 0; j < 3; j++) {
            particles[i].s[j] += (dt / 6) * (k1[i].s[j] + 2 * k2[i].s[j] + 2 * k3[i].s[j] + k4[i].s[j]);
            particles[i].v[j] += (dt / 6) * (k1[i].v[j] + 2 * k2[i].v[j] + 2 * k3[i].v[j] + k4[i].v[j]);
        }
    }

    applyCollisions(particles, planes);
}
