import {RenderObject} from "./objectAbstract.js";

export class Line extends RenderObject {
    constructor(name, x, y, z, dir, colour) {
        super(name, x, y, z, 0, 0, 0);

        this.dir = dir; //[dx, dy, dz] dir vec
        this.colour = colour;
        this.length = 100000; //arbitrary length in each direction
        //im tired of people trying to reach the end of the axis. so have fun (*cough *cough Mr King *cough *cough Moses)
    }

    getVertecies() {
        //calc two points in the dir vec from the origin, at +/- length / 2
        const a = {
            x: this.x - this.length / 2 * this.dir[0], 
            y: this.y - this.length / 2 * this.dir[1], 
            z: this.z - this.length / 2 * this.dir[2]
        };

        const b = {
            x: this.x + this.length / 2 * this.dir[0], 
            y: this.y + this.length / 2 * this.dir[1], 
            z: this.z + this.length / 2 * this.dir[2]
        };

        return {a, b};
    }

    generate(normalsFlag) {
        this.vertices = [];
        this.indices = [];

        const {a, b} = this.getVertecies();

        this.vertices.push(a.x, a.y, a.z, ...this.colour);
        this.vertices.push(b.x, b.y, b.z, ...this.colour);

        this.indices.push(0, 1);
    }
}
