
const SPEED = 0.04;
const SENSITIVITY = 0.13 * 0.3;
const FOV = 90;

const CANVAS_WIDTH = document.getElementById('canvas').clientWidth;
const CANVAS_HEIGHT = document.getElementById('canvas').clientHeight;

let gl = document.getElementById('canvas').getContext('webgl2');

const shaders = {
    vs: 
    `#version 300 es
    
    in vec3 vertices;
    in vec3 vertColor;
    uniform vec3 cameraPos;
    uniform mat4 viewMatrix;
    uniform mat4 projectionMatrix;
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

        //gl_Position = rotY * rotX * vec4(relativeX, relativeY, relativeZ, 1.0);
        gl_Position = projectionMatrix * viewMatrix * vec4(relativeX, relativeY, relativeZ, 1.0);
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

const skyboxShaders = {
    vs: 
    `#version 300 es

    in vec3 vertices;
    in vec2 textcoord;
    out vec2 texpos;
    uniform vec3 cameraPos;
    uniform mat4 viewMatrix;
    uniform mat4 projectionMatrix;

    uniform vec2 rotation;

    void main(){
        float relativeZ = vertices[2] - cameraPos[2];
        float relativeX = (vertices[0] - cameraPos[0]) / (relativeZ);
        float relativeY = (vertices[1] - cameraPos[1]) / (relativeZ); //divide x and y by z to obtain close-far perspective
        
        float radX = rotation[0];
        float radY = rotation[1];

        texPos = textcoord;
        gl_Position = projectionMatrix * viewMatrix * vec4(relativeX, relativeY, relativeZ, 1.0);
    }`,
    fs: 
    `#version 300 es
    precision mediump float;

    in vec2 texpos;
    uniform sampler2D u_texture;
    out vec4 outColor;

    void main(){
        outColor = texture(u_texture, texpos);
    }`
};

let program;
let program_skybox;
let vertexBuffer;
let colorBuffer;
let textureSkybox = gl.createTexture();
let skyboxVertexBuffer;
let texPosBuffer; // for skybox

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

const mousePos = { //will be used to determine viewing via mouse rotation
    x: CANVAS_WIDTH,
    y: CANVAS_HEIGHT
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

const skybox_vertices = new Float32Array([
    //left side of cube
    -1.0, -1.0, -1.0,
    -1.0, -1.0, 1.0,
    -1.0, 1.0, 1.0,
    -1.0, 1.0, 1.0,
    -1.0, 1.0, -1.0,
    -1.0, -1.0, -1.0
]);

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
};

let toRad = function(degree){
    return degree * Math.PI / 180.0;
};

function renderFrame(){
    console.log("Debug: renderFrame invoked");

    renderSkybox("nebula-skybox.jpg");

    //render the main pole
    
    //renderCylinder(mainPole[0], mainPole[1], 0, 0, 0, [0.1, 0.4, 0.0]);
    renderCylinder(orthoPole[0], orthoPole[1], 0, 0, 0, [0.4, 0.4, 0.5]);
    //renderCylinder(rotatingPole[0], rotatingPole[1], 0, 0, 0, [0.8, 0.0, 0.4]);
    
    requestAnimationFrame(renderFrame);
}

// View Matrix: Positions the camera
function getViewMatrix(cameraPosArr, pitch, yaw) {


    let front = [
        Math.cos(yaw) * Math.cos(pitch),
        Math.sin(pitch),
        Math.sin(yaw) * Math.cos(pitch)
    ];

    let right = math.cross([0, 1, 0], front);
    let up = math.cross(front, right);

    // View matrix construction
    let viewMatrix = [
        right[0], right[1], right[2], -math.dot(right, cameraPosArr),
        up[0], up[1], up[2], -math.dot(up, cameraPosArr),
        front[0], front[1], front[2], -math.dot(front, cameraPosArr),
        0, 0, 0, 1
    ];

    return new Float32Array(viewMatrix);
}

// Projection Matrix: Defines the view frustum
function getProjectionMatrix(fov, aspect, near, far) {
    let f = 1.0 / Math.tan(fov / 2);
    let rangeInv = 1.0 / (near - far);

    let projectionMatrix = [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, 2 * near * far * rangeInv, 0
    ];

    return new Float32Array(projectionMatrix);
}

//color is expected to be an array with 3 entries, rgb respectively
function renderCylinder(circleVert0, circleVert1, rotX, rotY, rotZ, color) {
    console.log("Debug: renderCylinder invoked with color:", color);

    gl.useProgram(program);
    // Combine vertices
    let vertices0 = new Float32Array(circleVert0.flat());
    let vertices1 = new Float32Array(circleVert1.flat());
    let vertices = new Float32Array(vertices0.length + vertices1.length);
    vertices.set(vertices0);
    vertices.set(vertices1, vertices0.length);

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

    let cameraPosArrNormal = [cameraPos.x, cameraPos.y, cameraPos.z]
    let cameraPosArr = new Float32Array(cameraPosArrNormal);
    let cameraPosLoc = gl.getUniformLocation(program, 'cameraPos');
    gl.uniform3fv(cameraPosLoc, cameraPosArr);

    let viewMatrixLoc = gl.getUniformLocation(program, 'viewMatrix');
    let viewMatrix = getViewMatrix(cameraPosArrNormal, rotation.rotX, rotation.rotY);
    gl.uniformMatrix4fv(viewMatrixLoc, false, viewMatrix);

    let projectionMatrixLoc = gl.getUniformLocation(program, 'projectionMatrix');
    let projectionMatrix = getProjectionMatrix(FOV, (CANVAS_WIDTH) / (CANVAS_HEIGHT * 1.0), 0.1, 1);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, projectionMatrix);
    
    let rotationArr = new Float32Array([toRad(rotation.rotX), toRad(rotation.rotY)]);
    let rotationLoc = gl.getUniformLocation(program, 'rotation');
    gl.uniform2fv(rotationLoc, rotationArr);


    // Draw the cylinder
    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 3);

    //draw rectangular area of the cylinder
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, wallVertices, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(verticesLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, wallVertices, gl.STATIC_DRAW);
    
    gl.drawArrays(gl.TRIANGLES, 0, wallVertices.length / 3);

    // Check for WebGL errors
    let error = gl.getError();
    if (error !== gl.NO_ERROR) {
        console.error('WebGL Error:', error);
    }
}

//given a texture source renders 3D skybox
function renderSkybox(textureSrc){
    gl.useProgram(program_skybox);

    gl.bindBuffer(gl.ARRAY_BUFFER, skyboxVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, skybox_vertices, gl.STATIC_DRAW);

    const skyboxVertLoc = gl.getAttribLocation(program_skybox, 'vertices');
    gl.enableVertexAttribArray(skyboxVertLoc);
    gl.vertexAttribPointer(skybox_vertices, 3, gl.FLOAT, false, 0, 0);

    gl.bindTexture(gl.ARRAY_BUFFER, textureSkybox);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, skyboxImg);
    gl.activeTexture(skyboxImg);
    
    const texLocation = gl.getUniformLocation(program_skybox, 'u_texture');
    gl.uniform1i(texLocation, 0);

    //bind the remaining uniforms
    let cameraPosArrNormal = [cameraPos.x, cameraPos.y, cameraPos.z]
    let cameraPosArr = new Float32Array(cameraPosArrNormal);
    let cameraPosLoc = gl.getUniformLocation(program, 'cameraPos');
    gl.uniform3fv(cameraPosLoc, cameraPosArr);

    let viewMatrixLoc = gl.getUniformLocation(program_skybox, 'viewMatrix');
    let viewMatrix = getViewMatrix(cameraPosArrNormal, rotation.rotX, rotation.rotY);
    gl.uniformMatrix4fv(viewMatrixLoc, false, viewMatrix);

    let projectionMatrixLoc = gl.getUniformLocation(program_skybox, 'projectionMatrix');
    let projectionMatrix = getProjectionMatrix(FOV, (CANVAS_WIDTH) / (CANVAS_HEIGHT * 1.0), 0.1, 1);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, projectionMatrix);
    
    let rotationArr = new Float32Array([toRad(rotation.rotX), toRad(rotation.rotY)]);
    let rotationLoc = gl.getUniformLocation(program_skybox, 'rotation');
    gl.uniform2fv(rotationLoc, rotationArr);

    gl.bindBuffer(gl.ARRAY_BUFFER, texPosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0
    ]), 2, gl.STATIC_DRAW);

    let textcoordLoc = gl.getAttribLocation(program_skybox, 'textcoord');
    gl.enableVertexAttribArray(textcoordLoc);
    gl.vertexAttribPointer(textcoordLoc, 12, gl.FLOAT, false, 0, 0);
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
function initPrograms(){
    console.log("Debug: initPrograms invoked");
    
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

    vertexBuffer = gl.createBuffer();
    colorBuffer = gl.createBuffer();

    //initialize skybox buffers
    skyboxVertexBuffer = gl.createBuffer();
    texPosBuffer = gl.createBuffer();

    //now initialize skybox program
    program_skybox = gl.createProgram();
    
    let skyboxVS = gl.createShader(gl.VERTEX_SHADER);
    let skyboxFS = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(skyboxVS, shaders.vs);
    gl.shaderSource(skyboxFS, skyboxShaders.fs);

    gl.compileShader(skyboxVS);
    gl.compileShader(skyboxFS);

    if (!gl.getShaderParameter(skyboxVS, gl.COMPILE_STATUS)) {
        console.error('Skybox Vertex Shader Compile Error:', gl.getShaderInfoLog(skyboxVS));
        return;
    }
    if (!gl.getShaderParameter(skyboxFS, gl.COMPILE_STATUS)) {
        console.error('Skybox Fragment Shader Compile Error:', gl.getShaderInfoLog(skyboxFS));
        return;
    }

    gl.attachShader(program_skybox, skyboxVS);
    gl.attachShader(program_skybox, skyboxFS);
    gl.linkProgram(program_skybox);

    if(!gl.getProgramParameter(program_skybox, gl.LINK_STATUS)){
        const infoLog = gl.getProgramInfoLog(program_skybox);
        console.log("Skybox program link error: ", infoLog);
    }
}


function setEvents(){
    //update camera pos with respect to current set rotations
    window.onkeydown = function(e){ //call upon keystroke
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
            cameraPos.x -= (-1 + Math.sin(toRad(rotation.rotY))) * SPEED;
            cameraPos.y -= Math.sin(toRad(rotation.rotX)) * SPEED;
            cameraPos.z -= (Math.sin(toRad(rotation.rotX)) + Math.sin(toRad(rotation.rotY))) * SPEED; //FIX HERE
        }
        else if(key === "d"){
            cameraPos.x += (-1 + Math.sin(toRad(rotation.rotY))) * SPEED;
            cameraPos.y += Math.sin(toRad(rotation.rotX)) * SPEED;
            cameraPos.z += (Math.sin(toRad(rotation.rotX)) + Math.sin(toRad(rotation.rotY))) * SPEED; //FIX HERE
        }

        if(cameraPos.x > 1.0){
            cameraPos.x = 1.0;
        }
        else if(cameraPos.x < -1.0){
            cameraPos.x = -1.0;
        }
        if(cameraPos.y > 1.0){
            cameraPos.y = 1.0;
        }
        else if(cameraPos.y < -1.0){
            cameraPos.y = -1.0;
        }
        if(cameraPos.z > 1.0){
            cameraPos.z = 1.0;
        }
        else if(cameraPos.z < -1.0){
            cameraPos.z = -1.0;
        }
    }
    window.onmousemove = function(e){
        let dx = mousePos.x - e.x;
        let dy = mousePos.y - e.y;

        let rotAngleX = (dx * 180.0) / (CANVAS_WIDTH);
        let rotAngleY = (dy * 180.0) / (CANVAS_HEIGHT);

        //add the new angles into existing angle attributes
        rotation.rotX += rotAngleY * SENSITIVITY;
        rotation.rotY += rotAngleX * SENSITIVITY;   //add the inverted angles (x to y, y to x) for better experience

        //set current client positions as the new mousePos attributes
        mousePos.x = e.x;
        mousePos.y = e.y;
    }
}

let skyboxImg = new Image();
    skyboxImg.src = "nebula-skybox.jpg";

    skyboxImg.onload = e => {
        gl.bindTexture(gl.TEXTURE_2D, textureSkybox);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, skyboxImg);
        gl.generateMipmap(gl.TEXTURE_2D);

    };

setEvents();
initPrograms();
renderFrame();


