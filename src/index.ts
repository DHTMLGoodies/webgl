

class App {
    private canvas: HTMLCanvasElement;
    private gl: WebGLRenderingContext;

    constructor() {
        this.canvas = document.getElementById("game-surface") as HTMLCanvasElement;
        this.gl = this.canvas.getContext("webgl");
        if (!this.gl) { // some browsers
            this.gl = this.canvas.getContext("experimental-webgl");
        }
        this.setClearColor();
        this.clearScreen();
    }

    private setClearColor() {
        // setting clear color - does not update screen immediately.
        this.gl.clearColor(.75, .85, .8, 1);

    }

    private clearScreen() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
}

new App();