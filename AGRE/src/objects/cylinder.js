import {RenderObject} from "./objectAbstract.js"

export class Cylinder extends RenderObject {
    constructor(name, x, y, z, pitch, yaw, roll, radius, height, fidelity, colour) {
        super(name, x, y, z, pitch, yaw, roll); 

        this.radius = radius;
        this.height = height;
        this.fidelity = fidelity;
        this.colour = colour;
    }

    generate(normalsFlag) {
        this.vertices = [];
        this.indices = [];

        const {radius, height, fidelity} = this;


        //vertecies
        for (let i = 0; i <= fidelity; i++) {
            const theta = i * 2 * Math.PI / fidelity; 
            const cosTheta = Math.cos(theta);
            const sinTheta = Math.sin(theta);

            //top & bottom circular surfaces (using unit circle thingy)
            const topVertex = [radius * cosTheta, height / 2, radius * sinTheta];
            const bottomVertex = [radius * cosTheta, -height / 2, radius * sinTheta];

            this.vertices.push(...topVertex, ...this.colour);
            this.vertices.push(...bottomVertex, ...this.colour);
        }

        //indicies
        //curved surface quads
        for (let i = 0; i < fidelity; i++) {
            const top1 = i * 2;
            const top2 = (i + 1) * 2; 
            const bottom1 = i * 2 + 1; 
            const bottom2 = (i + 1) * 2 + 1;

            this.indices.push(top1, bottom1, top2); 
            this.indices.push(top2, bottom1, bottom2);
        }

        //top & bottom faces (radial triangle pattern)
        const topCenterIndex = this.vertices.length / 6; 
        this.vertices.push(0, height / 2, 0, ...this.colour); 

        for (let i = 0; i < fidelity; i++) {
            const first = i * 2; 
            const second = (i + 1) * 2; 
            
            this.indices.push(topCenterIndex, first, second);
        }

        const bottomCenterIndex = this.vertices.length / 6;
        this.vertices.push(0, -height / 2, 0, ...this.colour); 

        for (let i = 0; i < fidelity; i++) {
            const first = i * 2 + 1;
            const second = (i + 1) * 2 + 1;
            
            this.indices.push(bottomCenterIndex, second, first);
        }
    }
}
