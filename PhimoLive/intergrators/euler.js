
export function euler_updateParticles(computeForces, applyCollisions, particles, planes, dt) {
    computeForces(particles, planes);
    applyCollisions(particles, planes);

    for (const p of particles) {
        p.v[0] += p.a[0] * dt;
        p.v[1] += p.a[1] * dt;
        p.v[2] += p.a[2] * dt;

        p.s[0] += p.v[0] * dt;
        p.s[1] += p.v[1] * dt;
        p.s[2] += p.v[2] * dt;
    }
}