#version 300 es
precision mediump float; 

flat in vec3 fragColour;   
out vec4 colour;  

uniform bool colourOverride;

const float glowStrength = 0.3;


void main() {
    if (colourOverride) {
        vec3 glowColour = (fragColour) * glowStrength;

        colour = vec4(fragColour + glowColour, 0.6);
    }
    else {
        colour = vec4(fragColour, 1.0);
    }
}