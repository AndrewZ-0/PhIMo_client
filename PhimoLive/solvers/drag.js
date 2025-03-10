import {dot, sub, normalise, scale} from "../utils/linearAlgebra.js";

export function applyDrag(particles, i, phyConsts) {
    const speedSquared = dot(particles[i].v, particles[i].v);

    if (speedSquared === 0) {
        return;
    }

    const dragForce = 0.5 * phyConsts.rho * speedSquared * particles[i].Cd * particles[i].A;

    const vn = normalise(particles[i].v); 
    const a = scale(vn, dragForce / particles[i].mass); 

    particles[i].a = sub(particles[i].a, a);
}

