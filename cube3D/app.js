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

const CANVAS_LENGTH = 600;
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
        this.rotation = [0.0, 0.0, 0.0]; //rotation in angles
    }
}

let dragEnabled = false;
let prevX, prevY;
let totalRotateX = 0.0, totalRotateY= 0.0; //total rotation angles

let cubeModel; //Model object

function mouseDown(event){
    dragEnabled = true;
    prevX = event.clientX;
    prevY = event.clientY;
}
function mouseMove(event){
    if(dragEnabled){
        //calculate the rotation angle in degrees
        //console.log("Drag event coordinates are " + event.clientX + ", " + event.clientY);
        let x = event.clientX;
        let y = event.clientY;
        let dy = y - prevY;
        let dx = x - prevX;

        let rotationAngleX; //in degrees
        let rotationAngleY;
        /*if(dx !== 0){
            rotationAngle = Math.atan(dy / (dx * 1.0));
        }
        else{
            if(dy > 0){
                rotationAngle = 90;
            }
            else{
                rotationAngle = -90;
            }
        }*/
       const rotationCoefficient = 360.0;
       rotationAngleX = dx * rotationCoefficient;
       rotationAngleY = dy * rotationCoefficient;
       totalRotateX += rotationAngleX;
       totalRotateY += rotationAngleY;
       totalRotateX %= 360.0;
       totalRotateY %= 360.0;
       cubeModel.rotation[0] = totalRotateX;
       cubeModel.rotation[1] = totalRotateY;

       //rerender the cube model
       modelCube();
    }
}
function mouseUp(){
    dragEnabled = false;
}

function modelCube() {
    let canvas = document.getElementById("canvas");
    let gl = canvas.getContext('webgl2');
    console.log("gl yields: " + gl);
    if (gl) {
        console.log("FREEMAN");
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
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
         //the back face
        let backUpper = new Triangle([0.5, 0.5, -0.5,
                    -0.5, 0.5, -0.5,
                    -0.5, -0.5, -0.5],
                    [BACK_R, BACK_G, BACK_B]);
        let backLower = new Triangle([0.5, 0.5, -0.5,
                    0.5, -0.5, -0.5,
                    -0.5, -0.5, -0.5],
                    [BACK_R, BACK_G, BACK_B]);
        //top face
        let topUpper = new Triangle([-0.5, 0.5, 0.5,
                    -0.5, 0.5, -0.5,
                    0.5, 0.5, -0.5],
                    [TOP_R, TOP_G, TOP_B]);
        let topLower = new Triangle([-0.5, 0.5, 0.5,
                    0.5, 0.5, 0.5,
                    0.5, 0.5, -0.5], 
                    [TOP_R, TOP_G, TOP_B]);
        //bottom face
        let bottomUpper = new Triangle([-0.5, -0.5, 0.5,
                    -0.5, -0.5, -0.5,
                    0.5, -0.5, -0.5],
                    [BOTTOM_R, BOTTOM_G, BOTTOM_B]);
        let bottomLower = new Triangle([-0.5, -0.5, 0.5,
                    0.5, -0.5, 0.5,
                    0.5, -0.5, -0.5],
                    [BOTTOM_R, BOTTOM_G, BOTTOM_B]);
        //left face
        let leftUpper = new Triangle([-0.5, 0.5, -0.5,
                    -0.5, 0.5, 0.5,
                    -0.5, -0.5, 0.5],
                    [LEFT_R, LEFT_G, LEFT_B]);
        let leftLower = new Triangle([-0.5, -0.5, -0.5, 
                    -0.5, 0.5, 0.5,
                    -0.5, -0.5, 0.5],
                [LEFT_R, LEFT_G, LEFT_B]);
        //right face
        let rightUpper = new Triangle([0.5, 0.5, -0.5,
                    0.5, 0.5, 0.5,
                    0.5, -0.5, 0.5],
                    [RIGHT_R, RIGHT_G, RIGHT_B]);
        let rightLower = new Triangle([0.5, -0.5, -0.5, 
                    0.5, 0.5, 0.5,
                    0.5, -0.5, 0.5],
                    [RIGHT_R, RIGHT_G, RIGHT_B]);


        cubeModel = new Model([
            frontUpper, frontLower, backUpper, backLower, topUpper, topLower, bottomUpper, bottomLower, leftUpper, leftLower, rightUpper, rightLower
        ]);

        const shaders = {
            vs: `#version 300 es
                in vec3 vertPos;
                in vec3 vertColor;
                out vec3 fragColor;
                in float rotateX; //in degrees angle
                in float rotateY; //in degrees angle
                attribute vec3 a_rotatedPos;
    
                void main(){
                    const float cubeLength = 1.0;
                    float radX = radians(rotateX);
                    float radY = radians(rotateY);
                    
                    
                    if(vertPos.x < 0){
                        //we will increment the overall x hence multiply by positive
                        a_rotatedPos.x = vertPos.x * cos(radX); //double check the angles
                        a_rotatedPos.z = vertPos.z * sin(radX); //z should change positive proportionate 
                    }
                    else{
                        a_rotatedPos.x = vertPos.x * cos(radX) * -1.0;
                        a_rotatedPos.z = vertPos.z * sin(radX) * -1.0; 
                    }
                    //similar procude for y coordinates
                    if(vertPos.y < 0){
                        a_rotatedPos.y = vertPos.y * sin(radY); //check the angles
                        a_rotatedPos.z = vertPos.z * cos(radY); 
                    }
                    else{
                        a_rotatedPos.y = vertPos.y * sin(radY) * -1.0;
                        a_rotatedPos.z = vertPos.z * cos(radX) * -1.0; 
                    }

                    
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
        if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
            console.error("Vertex Shader Error: " + gl.getShaderInfoLog(vertexShader));
        }
        if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
            console.error("Fragment Shader Error: " + gl.getShaderInfoLog(fragmentShader));
        }
        if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
            console.error("Shader Program Error: " + gl.getProgramInfoLog(program));
        }

        gl.useProgram(program);

        // Pass the pos buffer
        let posArray = new Float32Array(cubeModel.triangles.length * 9); // 9 = 3 vertices * 3 components (x, y, z)
        for(let i = 0; i < cubeModel.triangles.length; i++){
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

        if(singleColor){
            colorArr = new Float32Array(cubeModel.triangles.length * 9);
            for (let i = 0; i < cubeModel.triangles.length * 3; i++) {
                colorArr.set([FIXED_R, FIXED_G, FIXED_B], i * 3);
            }
        } 
        else{
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

        //pass the rotation angles
        let rotateArray = new Float32Array([cubeModel.rotation[0], cubeModel.rotation[1]]);
        let xBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, xBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, rotateArray, gl.STATIC_DRAW);

        let rotateXLocation = gl.getAttribLocation(program, 'rotateX');
        gl.vertexAttribPointer(rotateXLocation, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(rotateXLocation);

        let yBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, yBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, rotateArray, gl.STATIC_DRAW);

        let rotateYLocation = gl.getAttribLocation(program, 'rotateY');
        gl.vertexAttribPointer(rotateYLocation, 1, gl.FLOAT, false, 0, 1);
        gl.enableVertexAttribArray(rotateYLocation);
        
        // Draw the triangles
        gl.drawArrays(gl.TRIANGLES, 0, verticeCount);
    }
}

modelCube();
