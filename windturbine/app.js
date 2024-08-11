import { mat4, vec3, vec4 } from 'gl-matrix';

const CIRCLE_PRECISION = 200;


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
    
    //now apply rotations to points
    circleVert0 = rotateVertices(circleVert0);
    circleVert1 = rotateVertices(circleVert1);

    return [circleVert0, circleVert1];
}

function renderFrame(gl){

    //render the main pole
    

}

function renderCylinder(gl, circleVert0, circleVert1, rotX, rotY, rotZ , color){
    
    const shaders = {
        vs: 
        `#version 300 es
        
        in vec3 vertices;

        void main(){
            gl_Pos = vec4(vertices, 1.0);
        }

        `,
        fs: ``
    };
}

/**
 * 
 * @param {*} vert 2d array of 3D vertices
 * @param {*} tarX x coordinate for the tip of the given vector (the tip is origin) 
 * @return rotated vertex positions
 */
function rotateVertices(vert, tarX, tarY, tarZ){
    let rotatedVert = [];

    const currAxis = vec3.fromValues(0, 0, 1);
    const targetVector = vec3.fromValues(tarX, tarY, tarZ);
    
    //normalize the target vector
    vec3.normalize(targetVector, targetVector);

    // Compute the rotation axis
    const rotationAxis = vec3.create();
    vec3.cross(rotationAxis, currAxis, targetVector);

    // Compute the rotation angle
    const cosTheta = vec3.dot(currentAxis, targetVector);
    const angle = Math.acos(cosTheta);

    // Create the rotation matrix
    const rotationMatrix = mat4.create();
    mat4.fromRotation(rotationMatrix, angle, rotationAxis);

    for(let i = 0; i < vert.length; i++){
        let vertex = vec4.fromValues(vert[i][0], vert[i][1], vert[i][2], 1);
        const rotatedVec = vec4.create();
        vec4.transformMat4(rotatedVec, vertex, rotationMatrix);
        rotatedVert.push([rotatedVec[0], rotatedVec[1], rotatedVec[2]]);
    }
    return rotatedVert;
}





