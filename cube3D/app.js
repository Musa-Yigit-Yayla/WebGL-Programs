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

class Triangle{
    constructor(coordinates, colors){
        this.coordinates = coordinates;
        this.colors = colors;
    }
}
class Model{
    constructor(triangles){
        this.triangles = triangles;
        this.scale = 1.0;
        this.translation = [0.0, 0.0, 0.0];
        this.rotation = [0, 0, 0]; //rotation in angles
    }
}

function modelCube(){
    let canvas = document.getElementById("canvas");
    let gl = document.getContext('webgl2');

    if(gl){
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        //first fill out the model for passing to the GPU using vertex buffer
        //our cube's weight center will be at the origin
        const LENGTH = 1.0;
        
        //the front face
        let frontUpper = new Triangle([0.5, 0.5, 0.5,
                                     -0.5, 0.5, 0.5,
                                      -0.5, -0.5, 0.5],
                                      [FRONT_R, FRONT_G, FRONT_B]);
        let frontLower = new Triangle([0.5, 0.5, 0.5,
                                     0.5, -0.5, 0.5,
                                      -0.5, -0.5, 0.5],
                                      [FRONT_R, FRONT_G, FRONT_B]);
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
        

        let cubeModel = new Model({frontUpper, frontLower, backUpper, backLower, topUpper, topLower, bottomUpper, bottomLower, leftUpper, leftLower,
            rightUpper, rightLower},
        )    
        const shaders = {
            vs: `#version 300 es
                in vec3 vertPos;
                in vec3 vertColor;
                out vec3 fragColor;

                void main(){
                    fragColor = vertColor;
                    gl_Pos = vec4(vertPos, 1);
                }
                `,
            fs: `#version 300 es
                precision mediump float;
                in vec3 fragColor;
                out vec4 fragColor;

                void main(){
                    fragColor = vec4(fragColor, 1);
                }
                `
        };

        //create shaders
        let vertexShader = gl.createShader(gl.VERTEX_SHADER);
        let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

        gl.shaderSource(vertexShader, shaders.vs);
        gl.shaderSource(fragmentShader, shaders.fs);

        //compile shaders
        gl.compileShader(vertexShader);
        gl.compileShader(fragmentShader);

        let program = gl.createProgram();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);




        let posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);

        let posArray = [];
        for(let i = 0; i < cubeModel.triangles.length; i++){
            let currTriangle = cubeModel.triangles[i];
            posArray.push(currTriangle.coordinates);
        }
        gl.bufferData(gl.ARRAY_BUFFER, posArray, gl.STATIC_DRAW);

        let attributeLocation = gl.getAttribLocation(program, 'vertPos');
        const posComponentCount = 3;

        gl.vertexAttribPointer(attributeLocation, posComponentCount, gl.FLOAT, gl.FALSE, 0, 0);
        gl.enableVertexAttribArray(attributeLocation);

        
    }
}