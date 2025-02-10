#version 300 es
precision mediump float;

flat in vec3 fragColour;
in vec3 fragWorldPos;
in vec3 fragNormal;
flat in mat4 inverseView;

out vec4 fragFinalColour;

uniform vec3 lightPos;
uniform vec3 lightColour;
uniform vec3 lightAmbient;
uniform float lightStrength;
uniform float shininess;

uniform bool colourOverride;

const float glowStrength = 0.4;


void main() {
    //ideally should be a seperate uniform since it is the same for all shader calls, but i'm lazy so your GPU could crash and burn for all I care
    vec3 viewPos = vec3(inverseView * vec4(0.0, 0.0, 0.0, 1.0));

    //from vertex to light/view
    vec3 lightDir = normalize(lightPos - fragWorldPos);
    vec3 viewDir = normalize(viewPos - fragWorldPos);


    if (colourOverride) {
        //fresnel-based glow effect
        float fresnel = pow(dot(viewDir, fragNormal), 2.0);

        vec3 glowColour = (1.0 - fragColour) * glowStrength * fresnel;

        fragFinalColour = vec4(fragColour + glowColour, 0.7);
    }
    else {
        float diffuse = max(dot(fragNormal, lightDir), 0.0);
    
        vec3 reflectDir = reflect(-lightDir, fragNormal);
        float specular = pow(max(dot(viewDir, reflectDir), 0.0), shininess);

        vec3 ambient = lightAmbient * fragColour;
        
        //attenuation factor (inverse square law)
        float dist = length(lightPos - fragWorldPos);
        float attenuation = lightStrength / (dist * dist);
        
        //combine for phong lighting
        vec3 lighting = ambient + (diffuse * fragColour + specular * lightColour) * attenuation;
        fragFinalColour = vec4(lighting, 1.0);
    }
}
