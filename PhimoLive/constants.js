export class Constants {
    constructor() {
        //universal
        this.G = 0;   
        this.E0 = 0;  
        this.ke = 0;  
        this.M0 = 0;  
        this.km = 0;

        //global constants
        this.e = 0;   
        this.rho = 0; 
        this.g = [0, 0, 0]; 
        this.E = [0, 0, 0]; 
        this.B = [0, 0, 0];

        this.inv4Pi = 1 / (4 * Math.PI);
    }

    setG(G) {
        this.G = G;
    }

    setg(g) {
        this.g = [...g];
    }

    setE0(E0) {
        this.E0 = E0;
        this.ke = this.inv4Pi / E0;
    }

    setE(E) {
        this.E = [...E];
    }

    setM0(M0) {
        this.M0 = M0;
        this.km = M0 * this.inv4Pi;
    }

    setB(B) {
        this.B = [...B];
    }

    sete(e) {
        this.e = e;
    }

    setRho(rho) {
        this.rho = rho;
    }
}