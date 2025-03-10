
export function leapfrog_updateParticles(computeForces, applyCollisions, particles, planes, dt) {
    const halfDt = dt / 2;

    for (const p of particles) {
        p.v[0] += p.a[0] * halfDt;
        p.v[1] += p.a[1] * halfDt;
        p.v[2] += p.a[2] * halfDt;

        p.s[0] += p.v[0] * dt;
        p.s[1] += p.v[1] * dt;
        p.s[2] += p.v[2] * dt;
    }

    computeForces(particles, planes);

    for (const p of particles) {
        p.v[0] += p.a[0] * halfDt;
        p.v[1] += p.a[1] * halfDt;
        p.v[2] += p.a[2] * halfDt;
    }

    applyCollisions(particles, planes);
}
