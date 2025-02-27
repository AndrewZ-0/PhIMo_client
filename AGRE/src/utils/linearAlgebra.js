export const globalOrigin = {x: 0, y: 0, z: 0};
export const globalFront = {x: 0, y: 0, z: -1};
export const globalRight = {x: 1, y: 0, z: 0};
export const globalUp = {x: 0, y: 1, z: 0};

export const identityMatrix = createMat4();
identityMat4(identityMatrix);


//hmm, note to self: might need to move all the trig stuff out of this file. (cause its not linear algebra...)

export const halfPi = Math.PI / 2;
export const twoPi = Math.PI * 2;

//can't believe this is not a built in function..
export function toDegree(radian) {
    return radian * (180 / Math.PI);
}

export function toRadian(degrees) {
    return degrees * (Math.PI / 180);
}

export function wrapPositive(n, m) {
    return (n % m + m) % m;
}

export function wrapSymmetric(n, m) {
    return wrapPositive(n, 2 * m) - m;
}

export function clamp(n, min, max) {
    return Math.max(min, Math.min(n, max));
}

//"borrowed" from Wikipedia
export function pitchFromQuat(q) {
    return Math.atan2(
        2 * (q.w * q.x + q.y * q.z),
        1 - 2 * (q.x * q.x + q.y * q.y)
    );
}

export function yawFromQuat(q) {
    return (
        2 * Math.atan2(
            (1 + 2 * (q.w * q.y - q.x * q.z)) ** 0.5, 
            (1 - 2 * (q.w * q.y - q.x * q.z)) ** 0.5
        ) - halfPi
    );
}

export function rollFromQuat(q) {
    return Math.atan2(
        2 * (q.w * q.z + q.x * q.y), 
        1 - 2 * (q.y * q.y + q.z * q.z)
    );
}

//modified version of the one found on wikipedia (for left orient)
export function quatFromEuler(pitch, yaw, roll) {
    const cy = Math.cos(yaw / 2);
    const sy = Math.sin(yaw / 2);
    const cp = Math.cos(pitch / 2);
    const sp = Math.sin(pitch / 2);
    const cr = Math.cos(roll / 2);
    const sr = Math.sin(roll / 2);

    return {
        x: cr * sp * cy + sr * cp * sy,
        y: cr * cp * sy - sr * sp * cy,
        z: sr * cp * cy - cr * sp * sy,
        w: cr * cp * cy + sr * sp * sy
    };
}


export function scaleQuat(quat, sf) {
    return {
        x: quat.x * sf, 
        y: quat.y * sf, 
        z: quat.z * sf, 
        w: quat.w * sf
    }
}


export function setMat4rotation(matrix, eulerSet) {
    const cy = Math.cos(eulerSet.yaw);
    const sy = Math.sin(eulerSet.yaw);
    const cp = Math.cos(eulerSet.pitch);
    const sp = Math.sin(eulerSet.pitch);
    const cr = Math.cos(eulerSet.roll);
    const sr = Math.sin(eulerSet.roll);

    matrix[0] = cp * cy;                    
    matrix[1] = cp * sy;                     
    matrix[2] = -sp;                      
    matrix[4] = sr * sp * cy - cr * sy;     
    matrix[5] = sr * sp * sy + cr * cy;   
    matrix[6] = sr * cp;                    
    matrix[8] = cr * sp * cy + sr * sy;     
    matrix[9] = cr * sp * sy - sr * cy;  
    matrix[10] = cr * cp;              
}

export function scaleVec3(vec, sf) {
    return {
        x: vec.x * sf, 
        y: vec.y * sf, 
        z: vec.z * sf
    };
}


export function scaleTranslateVec3(vec, unitVec, sf) {
    vec.x += unitVec.x * sf;
    vec.y += unitVec.y * sf;
    vec.z += unitVec.z * sf;
}

export function sumSquaresVec3(vec) {
    return vec.x * vec.x + vec.y * vec.y + vec.z * vec.z;
}

export function magnitudeVec3(vec) {
    return sumSquaresVec3(vec) ** 0.5;
}

export function divVec3(vec, mag) {
    if (mag) {
        return {
            x: vec.x / mag, 
            y: vec.y / mag, 
            z: vec.z / mag
        };
    } 
    else {
        return {x: 0, y: 0, z: 0};
    }
}

export function normaliseVec3(vec) {
    return divVec3(vec, magnitudeVec3(vec));
}

export function crossVec3(a, b) {
    return {
        x: a.y * b.z - a.z * b.y, 
        y: a.z * b.x - a.x * b.z, 
        z: a.x * b.y - a.y * b.x
    };
}

export function dotVec3(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

//modified lookAt function which I "borrowed" from the gl-matrix module
//made it a little bit more readable: despite some negligable performance loss
const EPSILON = 0.000001;
export function lookAt(viewOut, eye, front, up) {
    if (Math.abs(front.x) < EPSILON && Math.abs(front.y) < EPSILON && Math.abs(front.z) < EPSILON) {
        identityMat4(viewOut);
    }
    else {
        const z = divVec3(front, -magnitudeVec3(front));
        const x = normaliseVec3(crossVec3(up, z));
        const y = normaliseVec3(crossVec3(z, x));

        const xw = -dotVec3(x, eye);
        const yw = -dotVec3(y, eye);
        const zw = -dotVec3(z, eye);
    
        viewOut[0] = x.x;
        viewOut[1] = y.x;
        viewOut[2] = z.x;
        viewOut[3] = 0; 
        viewOut[4] = x.y;
        viewOut[5] = y.y;
        viewOut[6] = z.y;
        viewOut[7] = 0;
        viewOut[8] = x.z;
        viewOut[9] = y.z;
        viewOut[10] = z.z;
        viewOut[11] = 0;
        viewOut[12] = xw;
        viewOut[13] = yw;
        viewOut[14] = zw;
        viewOut[15] = 1;
    }
}

export function transformQuat(out, vec, q) {
    //Since crossVec only uses x, y, z passing it a vec4 such as q does not matter
    let uv = crossVec3(q, vec);
    let uuv = crossVec3(q, uv);

    uv = scaleVec3(uv, q.w * 2);

    uuv = scaleVec3(uuv, 2);

    out.x = vec.x + uv.x + uuv.x;
    out.y = vec.y + uv.y + uuv.y;
    out.z = vec.z + uv.z + uuv.z;
}

//note to self for some reason x is the other way round in the calcs
export function getBasisHorizontalCoords(orientation) {
    const s_alt = Math.sin(orientation.alt);
    const c_alt = Math.cos(orientation.alt);
    const s_azi = Math.sin(orientation.azi);
    const c_azi = Math.cos(orientation.azi);

    return {
        front: normaliseVec3({
            x: s_azi * c_alt,  
            y: s_alt,
            z: c_azi * c_alt
        }),
        up: normaliseVec3({
            x: -s_alt * s_azi, 
            y: c_alt, 
            z: -s_alt * c_azi
        }),
        right: normaliseVec3({
            x: -c_azi,
            y: 0,
            z: s_azi
        })
    };
}


export function getAxisAngle(axis, delta) {
    delta /= 2;
    const s = Math.sin(delta);

    return {
        x: s * axis.x, 
        y: s * axis.y, 
        z: s * axis.z, 
        w: Math.cos(delta)
    };
}

//note to self, multiplying two quats is non-commtitive so a*=b is not the ame as a=b*a
export function applyQuat(a, b) {
    a.x = b.x * a.w + b.w * a.x + b.y * a.z - b.z * a.y;
    a.y = b.y * a.w + b.w * a.y + b.z * a.x - b.x * a.z;
    a.z = b.z * a.w + b.w * a.z + b.x * a.y - b.y * a.x;
    a.w = b.w * a.w - b.x * a.x - b.y * a.y - b.z * a.z;
}

export function normaliseQuat(q) {
    const mag = (q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w) ** 0.5;

    q.x /= mag;
    q.y /= mag;
    q.z /= mag;
    q.w /= mag;
}

export function identityMat4(mat) {
    mat[0] = 1;
    mat[1] = 0;
    mat[2] = 0;
    mat[3] = 0;
    mat[4] = 0;
    mat[5] = 1;
    mat[6] = 0;
    mat[7] = 0;
    mat[8] = 0;
    mat[9] = 0;
    mat[10] = 1;
    mat[11] = 0;
    mat[12] = 0;
    mat[13] = 0;
    mat[14] = 0;
    mat[15] = 1;
}

export function createMat4() {
    return [
        0, 0, 0, 1, 
        0, 0, 0, 1,
        0, 0, 0, 1,
        0, 0, 0, 1
    ];
}

export function perspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2);
    const nf = 1 / (near - far);

    return [
        f / aspect, 0, 0, 0, 
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1, 
        0, 0, 2 * far * near * nf, 0
    ];
}


export function translate(mat, vec) {
    mat[12] = mat[0] * vec.x + mat[4] * vec.y + mat[8] * vec.z + mat[12];
    mat[13] = mat[1] * vec.x + mat[5] * vec.y + mat[9] * vec.z + mat[13];
    mat[14] = mat[2] * vec.x + mat[6] * vec.y + mat[10] * vec.z + mat[14];
    mat[15] = mat[3] * vec.x + mat[7] * vec.y + mat[11] * vec.z + mat[15];
}


export function sumSquaresVec2(vec) {
    return vec.x * vec.x + vec.y * vec.y;
}

export function scaleVec2(vec, sf) {
    return {
        x: vec.x * sf, 
        y: vec.y * sf
    };
}

export function addVec2(a, b) {
    return {
        x: a.x + b.x, 
        y: a.y + b.y
    };
}

export function subVec2(a, b) {
    return {
        x: a.x - b.x, 
        y: a.y - b.y
    };
}

export function dotVec2(a, b) {
    return a.x * b.x + a.y * b.y;
}

export function ortho(left, right, bottom, top, near, far) {
    const rl_diff = right - left;
    const tb_diff = top - bottom;
    const fn_diff = far - near;
    const rl_sum = right + left;
    const tb_sum = top + bottom;
    const fn_sum = far + near;

    return [
        2 / rl_diff, 0, 0, 0,
        0, 2 / tb_diff, 0, 0,
        0, 0, -2 / fn_diff, 0,
        -rl_sum / rl_diff, -tb_sum / tb_diff, -fn_sum / fn_diff, 1
    ];
}


export function coordsfromPolar(r, alt, azi) {
    const ca = Math.cos(alt);
    return {
        x: r * ca * Math.sin(azi), 
        y: r * Math.sin(alt), 
        z: r * ca * Math.cos(azi)
    }
}

//derrived this function by modifying and simplifying the standard euler to quat function 
//since polar coord has y-axis fixed, no roll is introduced
export function quatOrientationFromPolar(alt, azi) {
    const halfAlt = -alt / 2;
    const halfAzi = azi / 2;

    const cp = Math.cos(halfAlt);
    const sp = Math.sin(halfAlt);
    const cy = Math.cos(halfAzi);
    const sy = Math.sin(halfAzi);

    return {
        x: sp * cy, 
        y: cp * sy, 
        z: -sp * sy, 
        w: cp * cy
    };
}

export function polarFromQuatOrientation(quat) {
    const front = {x: 0, y: 0, z: 0};
    transformQuat(front, globalFront, quat);

    const alt = Math.asin(-front.y);

    const xzPlane_front = normaliseVec3(subVec3(front, scaleVec3(globalUp, dotVec3(front, globalUp))));

    let azi = Math.acos(-xzPlane_front.z);

    if (xzPlane_front.x > 0) {
        azi = twoPi - azi;
    }

    return {alt, azi};
}


export function toVec3(obj) {
    return [obj.x, obj.y, obj.z];
}


export function invertMat4(a) {
    const a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3];
    const a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7];
    const a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];
    const a30 = a[12],
        a31 = a[13],
        a32 = a[14],
        a33 = a[15];

    const b00 = a00 * a11 - a01 * a10;
    const b01 = a00 * a12 - a02 * a10;
    const b02 = a00 * a13 - a03 * a10;
    const b03 = a01 * a12 - a02 * a11;
    const b04 = a01 * a13 - a03 * a11;
    const b05 = a02 * a13 - a03 * a12;
    const b06 = a20 * a31 - a21 * a30;
    const b07 = a20 * a32 - a22 * a30;
    const b08 = a20 * a33 - a23 * a30;
    const b09 = a21 * a32 - a22 * a31;
    const b10 = a21 * a33 - a23 * a31;
    const b11 = a22 * a33 - a23 * a32;

    //calculate the determinant
    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) {
        return null;
    }
    det = 1 / det;

    return [
        (a11 * b11 - a12 * b10 + a13 * b09) * det, 
        (a02 * b10 - a01 * b11 - a03 * b09) * det, 
        (a31 * b05 - a32 * b04 + a33 * b03) * det, 
        (a22 * b04 - a21 * b05 - a23 * b03) * det, 
        (a12 * b08 - a10 * b11 - a13 * b07) * det, 
        (a00 * b11 - a02 * b08 + a03 * b07) * det, 
        (a32 * b02 - a30 * b05 - a33 * b01) * det, 
        (a20 * b05 - a22 * b02 + a23 * b01) * det, 
        (a10 * b10 - a11 * b08 + a13 * b06) * det, 
        (a01 * b08 - a00 * b10 - a03 * b06) * det, 
        (a30 * b04 - a31 * b02 + a33 * b00) * det, 
        (a21 * b02 - a20 * b04 - a23 * b00) * det, 
        (a11 * b07 - a10 * b09 - a12 * b06) * det,  
        (a00 * b09 - a01 * b07 + a02 * b06) * det, 
        (a31 * b01 - a30 * b03 - a32 * b00) * det, 
        (a20 * b03 - a21 * b01 + a22 * b00) * det
    ];
}

export function transformMat4(a, m) {
    return {
        x: m[0] * a.x + m[4] * a.y + m[8] * a.z + m[12] * a.w, 
        y: m[1] * a.x + m[5] * a.y + m[9] * a.z + m[13] * a.w, 
        z: m[2] * a.x + m[6] * a.y + m[10] * a.z + m[14] * a.w, 
        w: m[3] * a.x + m[7] * a.y + m[11] * a.z + m[15] * a.w
    };  
}

export function addVec3(a, b) {
    return {
        x: a.x + b.x, 
        y: a.y + b.y, 
        z: a.z + b.z
    };
}

export function subVec3(a, b) {
    return {
        x: a.x - b.x, 
        y: a.y - b.y, 
        z: a.z - b.z
    };
}

export function discriminant(a, b, c) {
    return b * b - 4 * a * c;
}

export function standardNormaliseVec3(a) {
    const b = (a[0] ** 2 + a[1] ** 2 + a[2] ** 2) ** 0.5;
    return [
        a[0] / b, 
        a[1] / b,
        a[2] / b
    ];
}





export function applyMat3(mat, vec) {
    return {
        x: mat[0] * vec.x + mat[1] * vec.y + mat[2] * vec.z,
        y: mat[3] * vec.x + mat[4] * vec.y + mat[5] * vec.z,
        z: mat[6] * vec.x + mat[7] * vec.y + mat[8] * vec.z
    };
}


//courtesey of Wikipedia. Again...
//note to self, if I ever need to use the 3d rotation matrix, it is for the love of God, THE FIRST one on Wikipedia
//the second one is improper
export function applyEulerSet(vec, eulerSet) {
    const cp = Math.cos(eulerSet.pitch);
    const sp = Math.sin(eulerSet.pitch);
    const cy = Math.cos(eulerSet.yaw);
    const sy = Math.sin(eulerSet.yaw);
    const cr = Math.cos(eulerSet.roll);
    const sr = Math.sin(eulerSet.roll);

    const rotMat3 = [
        cy * cp, 
        cy * sp * sr - sy * cr,
        cy * sp * cr + sy * sr, 
        sy * cp, 
        sy * sp * sr + cy * cr, 
        sy * sp * cr - cy * sr, 
        -sp, 
        cp * sr, 
        cp * cr
    ];

    return applyMat3(rotMat3, vec)
}


export function hexToVec3(colourHex) {
    const r = parseInt(colourHex.slice(1, 3), 16) / 255;
    const g = parseInt(colourHex.slice(3, 5), 16) / 255;
    const b = parseInt(colourHex.slice(5, 7), 16) / 255;

    return [r, g, b];
}

export function vec3ToHex(colourVec3) {
    const r = Math.round(colourVec3[0] * 255).toString(16).padStart(2, "0");
    const g = Math.round(colourVec3[1] * 255).toString(16).padStart(2, "0");
    const b = Math.round(colourVec3[2] * 255).toString(16).padStart(2, "0");

    return "#" + r + g + b;
}