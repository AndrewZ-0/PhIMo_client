import {dot, length, sub, div, add, scale} from "../utils/linearAlgebra.js";



export function handlePOPCollisions(particles, phyConsts) {
    const len = particles.length;
    for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
            const d = sub(particles[j].s, particles[i].s);
            const distance = length(d);

            // Prevent crashing if the centers of both particles are overlapping
            if (distance === 0) {
                break;
            }

            const overlap = (particles[i].radius + particles[j].radius) - distance;
            if (overlap > 0) {
                const du = sub(particles[j].v, particles[i].v);
                const normal = div(d, distance);
                const du_n = dot(du, normal);

                if (du_n < 0) {
                    const k = (1 + phyConsts.e) / (particles[i].mass + particles[j].mass);
                    const dv = scale(normal, k * du_n);

                    particles[i].v = add(particles[i].v, scale(dv, particles[j].mass));
                    particles[j].v = sub(particles[j].v, scale(dv, particles[i].mass));
                }
            }
        }
    }
}

export function handlePlaneCollisions(particles, planes, phyConsts) {
    for (const p of particles) {
        for (const plane of planes) {
            const localPos = sub(p.s, plane.s);
            const h = dot(localPos, plane.normal);

            const abs_h = Math.abs(h);

            if (abs_h > p.radius) {
                continue;
            }

            const xProj = dot(localPos, plane.xUnit);
            const yProj = dot(localPos, plane.yUnit);
            if (Math.abs(xProj) > plane.length / 2 || Math.abs(yProj) > plane.width / 2) {
                continue;
            }

            const penetrationDepth = p.radius - abs_h;

            if (penetrationDepth > 0) {
                const velocityIntoPlane = dot(p.v, plane.normal);
                if ((h > 0 && velocityIntoPlane < 0) || (h < 0 && velocityIntoPlane > 0)) {
                    p.v = sub(p.v, scale(plane.normal, (1 + phyConsts.e) * velocityIntoPlane));
                }
            }
        }
    }
}