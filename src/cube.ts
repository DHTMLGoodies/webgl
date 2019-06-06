import { mat4, glMatrix } from "gl-matrix";

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

    private worldMatrix: Float32Array;
    private worldAttributeLocation: WebGLUniformLocation;

    private createBuffer() {
        const triangleVertices: number[] = [ // counter clockwise vertices
            // x,y,z R, G, B
            0.0, 0.5, 0.0, 1.0, 0.0, 0.0,
            -0.5, -0.5, 0.0, 0.0, 1.0, 0.0,
            0.5, -0.5, 0.0, 0.0, 0.0, 1.0
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
            3, // number of elements in each attribute,
            this.gl.FLOAT, // attribute type
            false, // normalized
            6 * Float32Array.BYTES_PER_ELEMENT, // size of individual vertex
            0 // offset from start
        );

        // set pointer for color attributes
        this.gl.vertexAttribPointer(
            colorAttributeLocation, // attribute location
            3, // number of elements in each attribute,
            this.gl.FLOAT, // attribute type
            false, // normalized
            6 * Float32Array.BYTES_PER_ELEMENT, // total size of attribute
            3 * Float32Array.BYTES_PER_ELEMENT // offset from start
        );


        this.gl.enableVertexAttribArray(positionAttributeLocation);
        this.gl.enableVertexAttribArray(colorAttributeLocation);

        this.gl.useProgram(this.program);

        const matWorldLocation = this.worldAttributeLocation = this.gl.getUniformLocation(this.program, "matrixWorld");
        const matViewLocation = this.gl.getUniformLocation(this.program, "matrixView");
        const matProjectionLocation = this.gl.getUniformLocation(this.program, "matrixProjection");

        var worldMatrix = this.worldMatrix = new Float32Array(16);
        var viewMatrix = new Float32Array(16);
        var projectionMatrix = new Float32Array(16);

        mat4.identity(worldMatrix);
        // mat4.identity(viewMatrix);
        mat4.lookAt(viewMatrix, [0, 0, -2], [0, 0, 0], [0, 1, 0]);
        mat4.perspective(projectionMatrix, glMatrix.toRadian(45), 800 / 600, 0.1, 1000.1);



        this.gl.uniformMatrix4fv(matWorldLocation, false, worldMatrix);
        this.gl.uniformMatrix4fv(matViewLocation, false, viewMatrix);
        this.gl.uniformMatrix4fv(matProjectionLocation, false, projectionMatrix);


    }

    private running: boolean = true;

    stop() {
        this.running = false;
    }

    private mainRenderLoop() {
        var angle = 0;
        const identityMatrix = new Float32Array(16);
        mat4.identity(identityMatrix);

        const loop = () => {

            angle = Date.now() / 1000 / 6 * 2 * Math.PI;

            mat4.rotate(this.worldMatrix, identityMatrix, angle, [0, 1, 0]);
            this.gl.uniformMatrix4fv(this.worldAttributeLocation, false, this.worldMatrix);
            
            this.clearScreen();

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

        // input - varying per vertex
        attribute vec3 vertPosition; // x, y and z
        attribute vec3 vertColor;

        // uniform stays the same for all vertices
        uniform mat4 matrixWorld;
        uniform mat4 matrixView;
        uniform mat4 matrixProjection; 

        // output
        varying vec3 fragColor;

        void main(){
            fragColor = vertColor;
            // 0.0 = z-index, last one always 1

            // multiply from right
            gl_Position = matrixProjection * matrixView * matrixWorld * vec4(vertPosition, 1.0);
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