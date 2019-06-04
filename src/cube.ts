import { mat4 } from "lib/gl-matrix";


class App {
    private canvas: HTMLCanvasElement;
    private gl: WebGLRenderingContext;

    private vertexShader: WebGLShader;
    private fragmentShader: WebGLShader;
    private program: WebGLProgram;

    constructor() {
        this.canvas = document.getElementById("game-surface") as HTMLCanvasElement;
        this.gl = this.canvas.getContext("webgl");
        if (!this.gl) { // some browsers
            this.gl = this.canvas.getContext("experimental-webgl");
        }
        this.setClearColor();
        this.clearScreen();

        this.createShaders();
        this.createProgram();
        this.createBuffer();

        this.mainRenderLoop();
    }

    private setClearColor() {
        // setting clear color - does not update screen immediately.
        this.gl.clearColor(.75, .85, .8, 1);
    }

    private clearScreen() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    private createShaders() {

        this.vertexShader = this.addShader(this.vertexShaderSource, this.gl.VERTEX_SHADER);
        this.fragmentShader = this.addShader(this.fragmentShaderSource, this.gl.FRAGMENT_SHADER);
    }

    private addShader(shaderSource: string, type: WebGLRenderingContext["FRAGMENT_SHADER"] | WebGLRenderingContext["VERTEX_SHADER"]) {

        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, shaderSource);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error("Error compiling shader ", this.gl.getShaderInfoLog(shader));
        }

        return shader;
    }

    // create program for the graphics pipeline
    private createProgram() {
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, this.vertexShader);
        this.gl.attachShader(this.program, this.fragmentShader);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error("Could not link program", this.gl.getProgramInfoLog(this.program));
        }

        // in debug mode only
        this.gl.validateProgram(this.program);
        if (!this.gl.getProgramParameter(this.program, this.gl.VALIDATE_STATUS)) {
            console.error("ERROR invalidating program", this.gl.getProgramInfoLog(this.program));
        }
    }

    private createBuffer() {
        const triangleVertices: number[] = [ // counter clockwise vertices
            // x,y, R, G, B
            0, .5, 1, 0, 0,
            - .5, -.5, 0, 1, 0,
            .5, -.5, 0, 0, 1
        ];
        const triangleVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, triangleVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(triangleVertices), this.gl.STATIC_DRAW);

        // bind vertices to vertex shader attribute
        const positionAttributeLocation = this.gl.getAttribLocation(this.program, "vertPosition");
        const colorAttributeLocation = this.gl.getAttribLocation(this.program, "vertColor");

        // Set pointer for position attributes
        this.gl.vertexAttribPointer(
            positionAttributeLocation, // attribute location
            2, // number of elements in each attribute,
            this.gl.FLOAT, // attribute type
            false, // normalized
            5 * Float32Array.BYTES_PER_ELEMENT, // size of individual vertex
            0 // offset from start
        );

        // set pointer for color attributes
        this.gl.vertexAttribPointer(
            colorAttributeLocation, // attribute location
            3, // number of elements in each attribute,
            this.gl.FLOAT, // attribute type
            false, // normalized
            5 * Float32Array.BYTES_PER_ELEMENT, // total size of attribute
            2 * Float32Array.BYTES_PER_ELEMENT // offset from start
        );


        this.gl.enableVertexAttribArray(positionAttributeLocation);
        this.gl.enableVertexAttribArray(colorAttributeLocation);
    }

    private running: boolean = true;

    stop() {
        this.running = false;
    }

    private mainRenderLoop() {
        const loop = () => {

            this.clearScreen();

            this.gl.useProgram(this.program);
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);

            if (this.running) {
                window.requestAnimationFrame(() => loop());
            }
        };
        loop();
    }


    private get vertexShaderSource() {
        return `
        precision mediump float;

        // input
        attribute vec2 vertPosition;
        attribute vec3 vertColor;

        // output
        varying vec3 fragColor;

        void main(){
            fragColor = vertColor;
            // 0.0 = z-index, last one always 1
            gl_Position = vec4(vertPosition, 0.0, 1.0);
        }
        `;
    }

    private get fragmentShaderSource() {
        return `
        precision mediump float;

        // input
        varying vec3 fragColor;

        void main(){
            // only output from fragment shader, color of a specific pixel
            gl_FragColor = vec4(fragColor, 1.0);
        }

        `;
    }
}

new App();