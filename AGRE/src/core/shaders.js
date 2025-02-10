class Shader {
    constructor(gl, vsURL, fsURL) {
        this.gl = gl;
        this.vertexShader;
        this.fragmentShader;
        this.program;
        this.normalsFlag = false;
        this.createShaderSet(vsURL, fsURL);
    }

    loadShaderFile(url) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.send(null);
        return xhr.responseText;
    }

    createShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        return shader;
    }

    createShaderSet(vsURL, fsURL) {
        const vertexShaderSource = this.loadShaderFile(vsURL);
        const fragmentShaderSource = this.loadShaderFile(fsURL);

        this.vertexShader = this.createShader(vertexShaderSource, this.gl.VERTEX_SHADER);
        this.fragmentShader = this.createShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);
    }
}

export class BasicShader extends Shader {
    constructor(gl) {
        super(gl, "AGRE/src/shaders/basic/vertexShader.glsl", "AGRE/src/shaders/basic/fragmentShader.glsl");
        this.name = "basic";
        this.preferredMode = gl.TRIANGLES;
    }

    shaderDrawElements(indicesLength, mode) {
        this.gl.drawElements(mode, indicesLength, this.gl.UNSIGNED_SHORT, 0);
    }
}

export class SkeletonShader extends Shader {
    constructor(gl) {
        super(gl, "AGRE/src/shaders/basic/vertexShader.glsl", "AGRE/src/shaders/basic/fragmentShader.glsl");
        this.name = "skeleton";
        this.preferredMode = gl.LINES;
    }

    shaderDrawElements(indicesLength, mode) {
        this.gl.drawElements(mode, indicesLength, this.gl.UNSIGNED_SHORT, 0);
    }
}

export class PointsShader extends Shader {
    constructor(gl) {
        super(gl, "AGRE/src/shaders/basic/vertexShader.glsl", "AGRE/src/shaders/basic/fragmentShader.glsl");
        this.name = "points";
        this.preferredMode = gl.POINTS;
    }

    shaderDrawElements(indicesLength, mode) {
        this.gl.drawElements(mode, indicesLength, this.gl.UNSIGNED_SHORT, 0);
    }
}

export class LightingShader extends Shader {
    constructor(gl) {
        super(gl, "AGRE/src/shaders/lighting/vertexShader.glsl", "AGRE/src/shaders/lighting/fragmentShader.glsl");
        this.name = "lighting";
        this.normalsFlag = true;
        this.preferredMode = gl.TRIANGLES;
    }

    shaderDrawElements(indicesLength, mode) {
        this.gl.drawElements(mode, indicesLength, this.gl.UNSIGNED_SHORT, 0);
        //const error = this.gl.getError();

        /*
        if (error !== this.gl.NO_ERROR) {
            console.error(error);
            //console.log(indicesLength);
            //console.log(this.gl.getBufferParameter(this.gl.ARRAY_BUFFER, this.gl.BUFFER_SIZE));
        }*/
    }
}
