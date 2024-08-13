console.log(math);



let gl = document.getElementById('canvas').getContext('webgl2');
const shaders = {
    vs: 
    `#version 300 es
    
    in vec3 vertices;
    in vec3 vertColor;
    uniform vec3 cameraPos;
    out vec3 fragColor;

    in vec2 rotation;

    void main(){
        gl_Position = vec4(vertices, 1.0);
        fragColor = vertColor;
    }

    `,
    fs: 
    `#version 300 es

    precision mediump float;
    in vec3 fragColor;
    out vec4 outColor;

    void main(){
        outColor = vec4(fragColor, 1.0);
    }
    `
};
let program;
let vertexBuffer;
let colorBuffer;

const CIRCLE_PRECISION = 240;

const initialPos = {
    x: 0.0,
    y: 0.0,
    z: 0.8
}

const cameraPos = {
    x: initialPos.x,
    y: initialPos.y,
    z: initialPos.z
};

// we look towards z- direction when both rotations are 0.0, if mouse goes up or right we increase rotation, else decrease it
const rotation = {
    rotX: 0.0,
    rotY: 0.0
}; 


const mainPole = getCylinder(
    0.0, 0.8, 0.0, //top
    0.0, -0.8, 0.0, //bottom
    0.25 //radius 
);

const orthoPole = getCylinder(
    -0.25, 0.6, -0.4,
    -0.25, 0.6, 0.3,
    0.15
);

const rotatingPole = getCylinder(
    0.0, 0.6, 0.0,
    0.0, 1.0, 0.0,
    0.1
); //upright position

function getCone(topX, topY, topZ, baseCenterX, baseCenterY, baseCenterZ, radius){

}

/**
 * 
 * @param {*} cx0 
 * @param {*} cy0 
 * @param {*} cz0 
 * @param {*} cx1 
 * @param {*} cy1 
 * @param {*} cz1 
 * @param {*} radius 
 * 
 * @return an array with two entries each holding a 2D array which has a 3D vertex for each entry, first element of 3D array is circle0, second circle1
 */
function getCylinder(cx0, cy0, cz0, cx1, cy1, cz1, radius){
    let circleVert0 = [];
    let circleVert1 = []; 
    let distance = Math.sqrt(Math.pow(cx0 - cx1, 2) + Math.pow(cy0 - cy1, 2) + Math.pow(cz0 - cz1, 2));



    //first find points of a similar circle (with same radius) which has center as origin and normal vector as Z+ axis
    //start from top point and go clockwise

    let currX = 0.0, currY = 0.0 + radius;

    const a = 360.0 / CIRCLE_PRECISION;
    for(let i = 0; i < CIRCLE_PRECISION; i++){
        currX += Math.sin(a * i);
        currY -= Math.cos(a * i);

        circleVert0.push([currX, currY, 0.0]);
        circleVert1.push([currX, currY, distance]);
    }
    
    const tarX = cx1 - cx0;
    const tarY = cy1 - cy0;
    const tarZ = cz1 - cz0; //careful here

    //now apply rotations to points
    circleVert0 = rotateVertices(circleVert0, tarX, tarY, tarZ);
    circleVert1 = rotateVertices(circleVert1, tarX, tarY, tarZ);

    return [circleVert0, circleVert1];
}

function renderFrame(){
    console.log("Debug: renderFrame invoked");

    //render the main pole
    
    renderCylinder(mainPole[0], mainPole[1], 0, 0, 0, [0.0, 0.0, 0.0]);
    
    requestAnimationFrame(renderFrame);
}

//color is expected to be an array with 3 entries, rgb respectively
function renderCylinder( circleVert0, circleVert1, rotX, rotY, rotZ , color){
    console.log("Debug: renderCylinder invoked");


    let vertices0 = new Float32Array(circleVert0);
    let vertices1 = new Float32Array(circleVert1);
    
    let vertices = new Float32Array(vertices0.length + vertices1.length);
    for(let i = 0; i < vertices.length; i++){
        if(i < vertices0.length){
            vertices[i] = vertices0[i];
        }
        else{
            vertices[i] = vertices1[i - vertices0.length];
        }
    }

    let colorArr = new Float32Array(color);
    let cameraArr = new Float32Array([cameraPos.x, cameraPos.y, cameraPos.z]);
    
    let wallVertices = new Float32Array(circleVert0.length * 3); //hold first two vertices from c0, then first vertex of c1, 
    //then hold first two from c0 and second from c1, and then the second pair from c0 and second from c1, and then second pair from c0 and thrid from c1 and so on

    let it = 0; //iterator for wallVertices
    for(let i = 0; i < vertices0.length; i += 2){
        for(let j = 0; j < 2; j++){
            wallVertices[it++] = vertices0[i];
            wallVertices[it++] = vertices0[i + 1];
            wallVertices[it++] = vertices1[j];
        }
    }
    
    let verticesLoc = gl.getAttribLocation(program, 'vertices');

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    gl.vertexAttribPointer(verticesLoc, 3, gl.FLOAT, gl.FALSE, 0, 0);

    let vertColorLoc = gl.getAttribLocation(program, 'vertColor');

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colorArr, gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertColorLoc, 3, gl.FLOAT, gl.FALSE, 0, 0);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 3);
}

/**
 * 
 * @param {*} vert 2d array of 3D vertices
 * @param {*} tarX x coordinate for the tip of the given vector (the other tip is origin) 
 * @return rotated vertex positions
 */
function rotateVertices(vert, tarX, tarY, tarZ) {
    let rotatedVert = [];

    // Define current axis (Z-axis)
    let currAxis = math.matrix([0, 0, 1]);

    // Define target vector
    let targetVector = math.matrix([tarX, tarY, tarZ]);

    // Normalize the target vector manually
    let magnitude = math.norm(targetVector);
    targetVector = math.dotDivide(targetVector, magnitude);

    // Compute the rotation axis
    let rotationAxis = math.cross(currAxis, targetVector);

    // Compute the rotation angle
    let cosTheta = math.dot(currAxis, targetVector);
    let angle = Math.acos(cosTheta);

    // Create the rotation matrix for rotation around the Z-axis
    let rotationMatrix = math.matrix([
        [Math.cos(angle), -Math.sin(angle), 0],
        [Math.sin(angle), Math.cos(angle), 0],
        [0, 0, 1]
    ]);

    // Rotate each vertex
    for (let i = 0; i < vert.length; i++) {
        let vertex = math.matrix([vert[i][0], vert[i][1], vert[i][2]]);
        let rotatedVec = math.multiply(rotationMatrix, vertex).toArray();
        rotatedVert.push([rotatedVec[0], rotatedVec[1], rotatedVec[2]]);
    }

    return rotatedVert;
}
function initProgram(){
    console.log("Debug: initProgram invoked");
    
    program = gl.createProgram();
    
    let vertexShader = gl.createShader(gl.VERTEX_SHADER);
    let fragShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, shaders.vs);
    gl.shaderSource(fragShader, shaders.fs);

    gl.compileShader(vertexShader);
    gl.compileShader(fragShader);

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    vertexBuffer = gl.createBuffer();
    colorBuffer = gl.createBuffer();
}

initProgram();
renderFrame();


