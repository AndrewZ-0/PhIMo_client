#version 300 es
precision mediump float;

in vec3 vertPos; 
in vec3 vertColour; 
flat out vec3 fragColour; 

uniform mat4 world;
uniform mat4 view;
uniform mat4 proj; 

void main() {
    vec4 worldPos = world * vec4(vertPos, 1.0);
    fragColour = vertColour;

    gl_Position = proj * view * worldPos;
    gl_PointSize = 3.0;
}
