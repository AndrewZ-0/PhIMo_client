


export function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function add(a, b) {
    return [
        a[0] + b[0], 
        a[1] + b[1], 
        a[2] + b[2]
    ];
}

export function sub(a, b) {
    return [
        a[0] - b[0], 
        a[1] - b[1], 
        a[2] - b[2]
    ];
}

export function div(vec, k) {
    return [
        vec[0] / k, 
        vec[1] / k, 
        vec[2] / k
    ]
}

export function length(vec) {
    return dot(vec, vec) ** 0.5;
}

export function normalise(vec) {
    return div(vec, length(vec));
}

export function scale(vec, k) {
    return [
        vec[0] * k, 
        vec[1] * k, 
        vec[2] * k
    ];
}

export function cross(a, b) {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ];
}