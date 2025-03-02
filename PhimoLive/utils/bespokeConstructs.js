function applyEulerSet(vec, eulerSet) {
    const cp = Math.cos(eulerSet[0]); //pitch
    const sp = Math.sin(eulerSet[0]);
    const cy = Math.cos(eulerSet[1]); //yaw
    const sy = Math.sin(eulerSet[1]);
    const cr = Math.cos(eulerSet[2]); //roll
    const sr = Math.sin(eulerSet[2]);

    const rotMat3 = [
        [
            cy * cp, 
            cy * sp * sr - sy * cr, 
            cy * sp * cr + sy * sr
        ],
        [
            sy * cp, 
            sy * sp * sr + cy * cr, 
            sy * sp * cr - cy * sr
        ],
        [
            -sp, 
            cp * sr, 
            cp * cr
        ]
    ];

    return applyMat3(rotMat3, vec);
}

function applyMat3(mat3, vec) {
    return [
        mat3[0][0] * vec[0] + mat3[0][1] * vec[1] + mat3[0][2] * vec[2],
        mat3[1][0] * vec[0] + mat3[1][1] * vec[1] + mat3[1][2] * vec[2],
        mat3[2][0] * vec[0] + mat3[2][1] * vec[1] + mat3[2][2] * vec[2]
    ];
}


export class Particle {
    constructor(mass, s, v, radius = 1.0, charge = 0.0, Cd = 0.0) {
        this.mass = mass;
        this.radius = radius;
        this.charge = charge;
        this.Cd = Cd;
        this.s = s;
        this.v = v;
        this.a = [0, 0, 0];
        this.A = this.calculateCrossSectionalArea();
    }

    calculateCrossSectionalArea() {
        return Math.PI * this.radius * this.radius;
    }
}

export class Plane {
    constructor(length, width, charge, s, orientations) {
        this.length = length;
        this.width = width;
        this.charge = charge;
        this.s = s;

        this.normal = applyEulerSet([0, 1, 0], orientations);
        this.xUnit = applyEulerSet([1, 0, 0], orientations);
        this.yUnit = applyEulerSet([0, 0, 1], orientations);

        this.A = this.calculateArea();
        this.sigma = this.calculateChargeDensity();
    }

    calculateChargeDensity() {
        return this.charge / this.A;
    }

    calculateArea() {
        return this.length * this.width;
    }
}
