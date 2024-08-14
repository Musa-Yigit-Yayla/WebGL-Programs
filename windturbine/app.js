
const SPEED = 0.04;

let gl = document.getElementById('canvas').getContext('webgl2');

const shaders = {
    vs: 
    `#version 300 es
    
    in vec3 vertices;
    in vec3 vertColor;
    uniform vec3 cameraPos;
    out vec3 fragColor;

    uniform vec2 rotation; //expected to be in radians

    void main(){
        float relativeZ = vertices[2] - cameraPos[2];
        float relativeX = (vertices[0] - cameraPos[0]) / (relativeZ);
        float relativeY = (vertices[1] - cameraPos[1]) / (relativeZ); //divide x and y by z to obtain close-far perspective
        
        float radX = rotation[0];
        float radY = rotation[1];

        mat4 rotX = mat4(
            1.0, 0.0, 0.0, 0.0,
            0.0, cos(radX), -sin(radX), 0.0,
            0.0, sin(radX), cos(radX), 0.0,
            0.0, 0.0, 0.0, 1.0
        ); //rotation matrix around x axis

        mat4 rotY = mat4(
            cos(radY), 0.0, sin(radY), 0.0,
            0.0, 1.0, 0.0, 0.0,
            -sin(radY), 0.0, cos(radY), 0.0,
            0.0, 0.0, 0.0, 1.0
        );

        gl_Position = rotY * rotX * vec4(relativeX, relativeY, relativeZ, 1.0);
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
    y: 0.2,
    z: 0.3
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
        currX += Math.sin(a * i) * radius;
        currY -= Math.cos(a * i) * radius;

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

let toRad = function(degree){
    return degree * Math.PI / 180.0;
};

function renderFrame(){
    console.log("Debug: renderFrame invoked");

    //render the main pole
    
    renderCylinder(mainPole[0], mainPole[1], 0, 0, 0, [0.1, 0.4, 0.0]);
    
    requestAnimationFrame(renderFrame);
}

//color is expected to be an array with 3 entries, rgb respectively
function renderCylinder(circleVert0, circleVert1, rotX, rotY, rotZ, color) {
    console.log("Debug: renderCylinder invoked with color:", color);

    // Combine vertices
    let vertices0 = new Float32Array(circleVert0.flat());
    let vertices1 = new Float32Array(circleVert1.flat());
    let vertices = new Float32Array(vertices0.length + vertices1.length);
    vertices.set(vertices0);
    vertices.set(vertices1, vertices0.length);

    // Set up color data
    let colorArr = new Float32Array(color);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    let verticesLoc = gl.getAttribLocation(program, 'vertices');
    gl.enableVertexAttribArray(verticesLoc);
    gl.vertexAttribPointer(verticesLoc, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colorArr, gl.STATIC_DRAW);

    let vertColorLoc = gl.getAttribLocation(program, 'vertColor');
    gl.enableVertexAttribArray(vertColorLoc);
    gl.vertexAttribPointer(vertColorLoc, 3, gl.FLOAT, false, 0, 0);

    let cameraPosArr = new Float32Array([cameraPos.x, cameraPos.y, cameraPos.z]);
    let cameraPosLoc = gl.getUniformLocation(program, 'cameraPos');
    gl.uniform3fv(cameraPosLoc, cameraPosArr);

    
    let rotationArr = new Float32Array([toRad(rotation.rotX), toRad(rotation.rotY)]);
    let rotationLoc = gl.getUniformLocation(program, 'rotation');
    gl.uniform2fv(rotationLoc, rotationArr);

    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw the cylinder
    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 3);

    // Check for WebGL errors
    let error = gl.getError();
    if (error !== gl.NO_ERROR) {
        console.error('WebGL Error:', error);
    }
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

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('Vertex Shader Compile Error:', gl.getShaderInfoLog(vertexShader));
        return;
    }
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
        console.error('Fragment Shader Compile Error:', gl.getShaderInfoLog(fragShader));
        return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const infoLog = gl.getProgramInfoLog(program);
        console.error('WebGL Program Link Error: ', infoLog);
    }
    gl.useProgram(program);

    vertexBuffer = gl.createBuffer();
    colorBuffer = gl.createBuffer();
}

//call upon keystroke
function setKeyEvents(){
    //update camera pos with respect to current set rotations
    window.onkeydown = function(e){
        const key = (e.key).toString().toLowerCase();
        console.log(key);
        if(key === 'w'){
            console.log("Debug: move front");
            cameraPos.x += Math.sin(toRad(rotation.rotY)) * SPEED;
            cameraPos.y += Math.sin(toRad(rotation.rotX)) * SPEED;
            cameraPos.z += (-1 + Math.sin(toRad(rotation.rotX)) + Math.sin(toRad(rotation.rotY))) * SPEED;
        }
        else if(key === "s"){
            cameraPos.x -= Math.sin(toRad(rotation.rotY)) * SPEED;
            cameraPos.y -= Math.sin(toRad(rotation.rotX)) * SPEED;
            cameraPos.z -= (-1 + Math.sin(toRad(rotation.rotX)) + Math.sin(toRad(rotation.rotY))) * SPEED;
        }
        else if(key === "a"){
            cameraPos.x += (-1 + Math.sin(toRad(rotation.rotY))) * SPEED;
            cameraPos.y = Math.sin(toRad(rotation.rotX)) * SPEED;
            cameraPos.z = (Math.sin(toRad(rotation.rotX)) + Math.sin(toRad(rotation.rotY))) * SPEED;
        }
    }
}

setKeyEvents();
initProgram();
renderFrame();


