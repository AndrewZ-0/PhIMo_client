import {dot, sub, div} from "../utils/linearAlgebra.js";

export function bruteForceComputePOPForces(applyPOPForces, particles) {
    const len = particles.length;
    for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
            const d = sub(particles[j].s, particles[i].s);

            const r_squared = dot(d, d);
            const r = r_squared ** 0.5;

            if (r < 1e-100) {
                continue;
            }

            const invSquare = div(d, (r_squared * r));
            applyPOPForces(particles, i, j, invSquare, d);
        }
    }
}

export function bruteForceComputePlaneForces(applyPlaneForces, particles, planes) {
    const particles_len = particles.length;
    const planes_len = planes.length;
    for (let i = 0; i < particles_len; i++) {
        const p = particles[i];
        for (let j = 0; j < planes_len; j++) {
            const localPos = sub(p.s, planes[j]);

            const r = dot(localPos, planes[j].normal);
            if (r < 0) continue;

            const xProj = dot(localPos, planes[j].xUnit);
            const yProj = dot(localPos, planes[j].yUnit);
            if (Math.abs(xProj) > planes[j].length / 2 || Math.abs(yProj) > planes[j].width / 2) {
                continue;
            }

            applyPlaneForces(particles, planes, i, j);
        }
    }
}
