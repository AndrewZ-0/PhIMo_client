export class RenderObject {
    constructor(name, x, y, z, pitch, yaw, roll) {
        this.name = name;

        this.x = x;
        this.y = y;
        this.z = z;

        this.pitch = pitch;
        this.yaw = yaw;
        this.roll = roll;

        this.shininess = 100.0;

        this.vertices;
        this.indices;

        this.mode;
        this.selected = false;
    }

    //methods to produce deep copies
    getVertexData() {
        return new Float32Array(this.vertices);
    }
    getIndexData() {
        return new Uint16Array(this.indices);
    }

    getPos() {
        return {x: this.x, y: this.y, z: this.z};
    }

    setPos(pos) {
        this.x = pos.x;
        this.y = pos.y;
        this.z = pos.z;
    }

    setMode(mode) {
        this.mode = mode;
    }
}