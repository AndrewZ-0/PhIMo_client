export const FPS = 60; //annoyingly, webgl does not support changing fps so I'm kinda stuck with this now

class Clock {
    constructor() {
        this.deltaT = 1 / FPS;
        this.last_t = window.performance.now();
        this.current_fps;
    }

    updateFps() {
        this.current_fps = 1 / this.deltaT;
        //console.log(this.last_t);
    }

    updateDeltaT() {
        const new_t = window.performance.now();
        this.deltaT = (new_t - this.last_t) / 1000;  //since performance.now() gives time in miliseocnds
        this.last_t = new_t;
    }
}

export const clock = new Clock();