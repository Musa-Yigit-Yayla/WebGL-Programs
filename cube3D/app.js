//simple 3D cube modeler program
const FRONT_R = 0.2;
const FRONT_G = 0.0;
const FRONT_B = 0.4;
const BACK_R = 0.2;
const BACK_G = 0.8;
const BACK_B = 0.4;
const TOP_R = 0.0;
const TOP_G = 0.5;
const TOP_B = 0.3;
const BOTTOM_R = 1.0;
const BOTTOM_G = 0.2;
const BOTTOM_B = 0.0;
const LEFT_R = 0.6;
const LEFT_G = 0.6;
const LEFT_B = 0.0;
const RIGHT_R = 0.0;
const RIGHT_G = 0.8;
const RIGHT_B = 0.4;

const FIXED_R = 0.4;
const FIXED_G = 0.3;
const FIXED_B = 0.2;
class Triangle {
    constructor(coordinates, colors) {
        this.coordinates = new Float32Array(coordinates);
        this.colors = new Float32Array(colors);
    }
}

class Model {
    constructor(triangles) {
        this.triangles = triangles;
        this.scale = 1.0;
        this.translation = [0.0, 0.0, 0.0];
        this.rotation = [0, 0, 0]; //rotation in angles
    }
}

function modelCube() {
    let canvas = document.getElementById("canvas");
    let gl = canvas.getContext('webgl2');
    console.log("gl yields: " + gl);
    if (gl) {
        console.log("FREEMAN");
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Define the triangles for each face of the cube
        let frontUpper = new Triangle(
            [0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5],
            [FRONT_R, FRONT_G, FRONT_B, FRONT_R, FRONT_G, FRONT_B, FRONT_R, FRONT_G, FRONT_B]
        );
        let frontLower = new Triangle(
            [0.5, 0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5],
            [FRONT_R, FRONT_G, FRONT_B, FRONT_R, FRONT_G, FRONT_B, FRONT_R, FRONT_G, FRONT_B]
        );

        // Define other faces similarly...

        let cubeModel = new Model([
            frontUpper, frontLower
            // Add other faces here...
        ]);

        const shaders = {
            vs: `#version 300 es
                in vec3 vertPos;
                in vec3 vertColor;
                out vec3 fragColor;

                void main(){
                    fragColor = vertColor;
                    gl_Position = vec4(vertPos, 1.0);
                }`,
            fs: `#version 300 es
                precision mediump float;
                in vec3 fragColor;
                out vec4 outColor;

                void main(){
                    outColor = vec4(fragColor, 1.0);
                }`
        };

        // Create shaders
        let vertexShader = gl.createShader(gl.VERTEX_SHADER);
        let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

        gl.shaderSource(vertexShader, shaders.vs);
        gl.shaderSource(fragmentShader, shaders.fs);

        // Compile shaders
        gl.compileShader(vertexShader);
        gl.compileShader(fragmentShader);

        // Create program
        let program = gl.createProgram();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        // Check for shader compile errors
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error("Vertex Shader Error: " + gl.getShaderInfoLog(vertexShader));
        }
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error("Fragment Shader Error: " + gl.getShaderInfoLog(fragmentShader));
        }
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Shader Program Error: " + gl.getProgramInfoLog(program));
        }

        gl.useProgram(program);

        // Pass the pos buffer
        let posArray = new Float32Array(cubeModel.triangles.length * 9); // 9 = 3 vertices * 3 components (x, y, z)
        for (let i = 0; i < cubeModel.triangles.length; i++) {
            posArray.set(cubeModel.triangles[i].coordinates, i * 9);
        }

        let posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, posArray, gl.STATIC_DRAW);

        let attributeLocation = gl.getAttribLocation(program, 'vertPos');
        const posComponentCount = 3;

        gl.vertexAttribPointer(attributeLocation, posComponentCount, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attributeLocation);

        // Pass the color buffer
        let colorArr;
        let singleColor = document.getElementById("checkboxSingleColor").checked;

        if (singleColor) {
            colorArr = new Float32Array(cubeModel.triangles.length * 9);
            for (let i = 0; i < cubeModel.triangles.length * 3; i++) {
                colorArr.set([FIXED_R, FIXED_G, FIXED_B], i * 3);
            }
        } else {
            colorArr = new Float32Array(cubeModel.triangles.length * 9);
            for (let i = 0; i < cubeModel.triangles.length; i++) {
                colorArr.set(cubeModel.triangles[i].colors, i * 9);
            }
        }

        let colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colorArr, gl.STATIC_DRAW);

        attributeLocation = gl.getAttribLocation(program, 'vertColor');
        const colorCompCount = 3;

        gl.vertexAttribPointer(attributeLocation, colorCompCount, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attributeLocation);

        const verticeCount = posArray.length / 3;

        // Draw the triangles
        gl.drawArrays(gl.TRIANGLES, 0, verticeCount);
    }
}

modelCube();
