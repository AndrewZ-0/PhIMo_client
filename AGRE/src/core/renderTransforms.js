export function initUniforms(gl, program) {
    const colourOverrideUniform = gl.getUniformLocation(program, "colourOverride");

    gl.uniform1i(colourOverrideUniform, false);

    return {
        world: gl.getUniformLocation(program, "world"), 
        view: gl.getUniformLocation(program, "view"), 
        proj: gl.getUniformLocation(program, "proj"), 
        colourOverride: colourOverrideUniform, 
    };
}


const lightPosition = [0, 10, 0]; 
const lightColour = [1, 1, 1];
const lightAmbient = [0.1, 0.1, 0.1];
const lightStrength = 1000;

export function initLightingUniforms(gl, program) {
    const lightPositionUniformLoc = gl.getUniformLocation(program, "lightPos");
    const lightColourUniformLoc = gl.getUniformLocation(program, "lightColour");
    const lightAmbientUniformLoc = gl.getUniformLocation(program, "lightAmbient");
    const lightStrengthUniformLoc = gl.getUniformLocation(program, "lightStrength");
    const shininessUniformLoc = gl.getUniformLocation(program, "shininess");

    gl.uniform3fv(lightPositionUniformLoc, lightPosition);
    gl.uniform3fv(lightColourUniformLoc, lightColour);
    gl.uniform3fv(lightAmbientUniformLoc, lightAmbient);
    gl.uniform1f(lightStrengthUniformLoc, lightStrength);

    return {
        pos: lightPositionUniformLoc, 
        colour: lightColourUniformLoc,
        ambient: lightAmbientUniformLoc, 
        strength: lightStrengthUniformLoc, 
        shininess: shininessUniformLoc
    }
}