import {RenderObject} from "./objectAbstract.js";

export class Sphere extends RenderObject {
    constructor(name, x, y, z, radius, fidelity, colour) {
        super(name, x, y, z, 0, 0, 0);

        this.radius = radius;
        this.fidelity = fidelity;
        this.colour = colour;
    }

    generate(normalsFlag) {
        this.vertices = [];
        this.indices = [];

        //y-oriented 3d polar sphere
        for (let latNumber = 0; latNumber <= this.fidelity; latNumber++) {
            const theta = latNumber * Math.PI / this.fidelity; //latitude angle
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            for (let longNumber = 0; longNumber <= this.fidelity; longNumber++) {
                const phi = longNumber * 2 * Math.PI / this.fidelity; //longitude angle
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);

                const xPos = this.radius * cosPhi * sinTheta;
                const yPos = this.radius * cosTheta;
                const zPos = this.radius * sinPhi * sinTheta;

                if (normalsFlag) {
                    let normal = [];
                    for (let i = 0; i < 3; i++) {
                        normal[i] = [xPos, yPos, zPos][i] / this.radius;
                    }
                    this.vertices.push(xPos, yPos, zPos, ...normal, ...this.colour);
                }
                else {
                    this.vertices.push(xPos, yPos, zPos, ...this.colour);
                }
            }
        }

        for (let latNumber = 0; latNumber < this.fidelity; latNumber++) {
            for (let longNumber = 0; longNumber < this.fidelity; longNumber++) {
                const first = (latNumber * (this.fidelity + 1)) + longNumber;
                const second = first + this.fidelity + 1;

                //two triangles per quad
                this.indices.push(first, second, first + 1);
                this.indices.push(second, second + 1, first + 1);
            }
        }
    }

    getBoundingSphereRadius() {
        return this.radius;
    }
}
