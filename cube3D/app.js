//simple 3D cube modeler program


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
                                      -0.5, -0.5, 0.5]);


        const shaders = {
            vs: `#version 300 es`,
            fs: ``
        };
    }
}