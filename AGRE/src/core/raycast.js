import {masterRenderer} from "./renderer.js";
import * as linearAlgebra from "../utils/linearAlgebra.js";
import * as spaceTransforms from "../utils/spaceTransforms.js";
import {Sphere, Plane} from "../objects/objects.js";
import {camera} from "./camera.js";


//gigachad vector intersection function: 
//returns null if no intersection, otherwise returns distance to intersection (min dist for bounding sphere)
function getIntersection(object, rayOrigin, rayDir) {
    if (object instanceof Sphere) {
        const r = object.radius;
        
        const h = linearAlgebra.subVec3(object, rayOrigin); //from camera to sphere origin

        const b = 2 * linearAlgebra.dotVec3(rayDir, h);
        const c = linearAlgebra.dotVec3(h, h) - r * r;

        if (b < c ** 0.5) {
            return null;
        }

        const discriminant = b * b - 4 * c;

        const i1 = (-b - (discriminant ** 0.5)) / 2;
        const i2 = (-b + (discriminant ** 0.5)) / 2;

        const i1b = i1 < 0;
        const i2b = i1 < 0;

        if (i1b) {
            if (i2b) {
                return -Math.max(i1, i2);
            }
            return -i1;
        }
        else if (i2b) {
            return -i2;
        }
        return null;
    
        //return linearAlgebra.magnitudeVec3(h) - object.getBoundingSphereRadius();
    }
    else if (object instanceof Plane) {
        const n = object.getRotatedNormal();
        const h = linearAlgebra.subVec3(object, rayOrigin);

        const lambda = linearAlgebra.dotVec3(h, n) / linearAlgebra.dotVec3(rayDir, n);

        //direction check
        if (lambda <= 0) {
            return null;
        }

        const poi = linearAlgebra.addVec3(rayOrigin, linearAlgebra.scaleVec3(rayDir, lambda));

        //convert to coord sys relative to plane point
        const local_poi = linearAlgebra.subVec3(poi, object);
        
        const sx = Math.abs(linearAlgebra.dotVec3(local_poi, object.getRotatedUnitX()));
        const sz = Math.abs(linearAlgebra.dotVec3(local_poi, object.getRotatedUnitZ()));

        //within bounds of plane check
        if (sx > object.length / 2 || sz > object.width / 2) {
            return null;
        }

        return linearAlgebra.magnitudeVec3(linearAlgebra.subVec3(poi, rayOrigin));
    }
}

export function raycastMouseCollisionCheck(mouseX, mouseY) {
    const {x, y} = spaceTransforms.getNormalisedDeviceCoords(masterRenderer.canvas, mouseX, mouseY);
    const rayDir = spaceTransforms.getRayFromNDC(x, y, masterRenderer.matricies.proj, masterRenderer.matricies.view); 
    const rayOrigin = camera.coords;

    //console.log(rayDir);

    let selectedObject = null;
    let minDistance = Infinity;

    for (let i = 0; i < masterRenderer.objects.length; i++) {
        const currentMinDistance = getIntersection(masterRenderer.objects[i], rayOrigin, rayDir);
        if (currentMinDistance && currentMinDistance < minDistance) {
            selectedObject = masterRenderer.objects[i];
            minDistance = currentMinDistance;
        }
    }

    let i = null;
    if (selectedObject) {
        const name = selectedObject.name;
        //console.log(`Selected object: ${name}`);

        i = masterRenderer.objects.indexOf(selectedObject);
    } 
    /*
    else {
        console.log('No object selected');
    }
    */

    return i;
}

