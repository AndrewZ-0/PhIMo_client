import {RenderObject} from "./objectAbstract.js";
import * as linearAlgebra from "../utils/linearAlgebra.js";

export class Plane extends RenderObject {
    constructor(name, x, y, z, length, width, pitch, yaw, roll, colour) {
        super(name, x, y, z, pitch, yaw, roll);

        this.length = length;
        this.width = width;
        this.colour = colour;

        this.upwardsNormal = {x: 0, y: 1, z: 0}; //upwards normal
        this.downwardsNormal = {x: 0, y: -1, z: 0}; //downwards normal (since face culling is turned on, both sides need to be rendered)
        this.unitX = {x: 1, y: 0, z: 0};
        this.unitZ = {x: 0, y: 0, z: 1};
    }

    generate(normalsFlag) {
        this.vertices = [];
        this.indices = [];

        const halfLength = this.length / 2;
        const halfWidth = this.width / 2;

        const positions = [
            [-halfLength, 0, -halfWidth], 
            [halfLength, 0, -halfWidth],
            [halfLength, 0, halfWidth],
            [-halfLength, 0, halfWidth]
        ];

        for (const pos of positions) {
            if (normalsFlag) {
                this.vertices.push(
                    ...pos, 
                    this.upwardsNormal.x, this.upwardsNormal.y, this.upwardsNormal.z, 
                    ...this.colour
                );
            } 
            else {
                this.vertices.push(...pos, ...this.colour);
            }
        }

        for (const pos of positions) {
            if (normalsFlag) {
                this.vertices.push(
                    ...pos, 
                    this.downwardsNormal.x, this.downwardsNormal.y, this.downwardsNormal.z, 
                    ...this.colour
                );
            } 
            else {
                this.vertices.push(...pos, ...this.colour);
            }
        }

        //upwards
        this.indices.push(0, 1, 3);
        this.indices.push(1, 2, 3);
        
        //downwards
        this.indices.push(7, 5, 4);
        this.indices.push(7, 6, 5);
        
    }

    getRotatedNormal() {
        return linearAlgebra.applyEulerSet(this.upwardsNormal, this);
    }

    getRotatedUnitX() {
        return linearAlgebra.applyEulerSet(this.unitX, this);
    }

    getRotatedUnitZ() {
        return linearAlgebra.applyEulerSet(this.unitZ, this);
    }
}
