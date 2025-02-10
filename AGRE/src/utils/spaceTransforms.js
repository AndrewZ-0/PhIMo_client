import * as linearAlgebra from "./linearAlgebra.js";

export function getNormalisedDeviceCoords(canvas, mouseX, mouseY) {
    const clientRect = canvas.getBoundingClientRect();

    return {
        x: 2 * (mouseX - clientRect.left) / clientRect.width - 1, 
        y: 1 - 2 * (mouseY - clientRect.top) / clientRect.height
    };
}

export function getRayFromNDC(x, y, projMat, viewMat) {
    const invertedProjectionMatrix = linearAlgebra.invertMat4(projMat);
    
    const rayClip = {x, y, z: -1, w: 1}; //clip space
    const rayEye = linearAlgebra.transformMat4(rayClip, invertedProjectionMatrix);

    rayEye.z = -1;
    rayEye.w = 0;

    const invertedViewMatrix = linearAlgebra.invertMat4(viewMat);
    const rayWorld = linearAlgebra.transformMat4(rayEye, invertedViewMatrix);

    const rayDir = linearAlgebra.normaliseVec3(rayWorld);
    
    return rayDir;
}

