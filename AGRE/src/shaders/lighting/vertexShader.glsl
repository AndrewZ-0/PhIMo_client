#version 300 es
precision mediump float;

in vec3 vertPos; 
in vec3 vertNormal;
in vec3 vertColour;

flat out vec3 fragColour;
out vec3 fragWorldPos;
out vec3 fragNormal;
flat out mat4 inverseView;

uniform mat4 world;
uniform mat4 view;
uniform mat4 proj;

uniform vec3 lightPos;
uniform vec3 lightColour;
uniform vec3 lightAmbient;
uniform float lightStrength;
uniform float shininess;


void main() {
    //ideally should be a seperate uniform since it is the same for all shader calls, but i'm lazy so your GPU could crash and burn for all I care
    mat3 normalMatrix = transpose(inverse(mat3(world)));
    
    //calculate the world position of the vertex
    vec4 worldPos = world * vec4(vertPos, 1.0);
    
    //pass attrs to fragment shader
    fragColour = vertColour;
    fragWorldPos = vec3(worldPos);
    fragNormal = normalize(normalMatrix * vertNormal);
    inverseView = inverse(view);
    
    //calculate the final vertex position in clip space
    gl_Position = proj * view * worldPos;

}

