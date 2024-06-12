let currAngle = 0;
let intervalId;

function setRotation(){
    let updateAngle = function(){
        if(currAngle === 360){
            currAngle = 0;
        }
        else{
            currAngle++;
        }
        rangeChange(); //redraw implicitly
    }
    
    let checkBox = document.getElementById("checkBoxRotate");
    console.log("checkBox.value is: " + checkBox.checked);
    if(checkBox.checked){
        intervalId = setInterval(updateAngle, 20); //20 ms
        console.log(intervalId);
    }
    else{
        console.log("Clear interval has been entered " + intervalId);
        if(intervalId !== null && intervalId !== undefined){
            clearInterval(intervalId);
        }
    }
}

function rangeChange(){
    //bind this to onChange of sliders
    let currX = document.getElementById("x-slider").value;
    let currY = document.getElementById("y-slider").value;

    //convert coordinate values to clip space coordinate system
    currX = currX / 600.0;
    currY = currY / 600.0;

    redraw(currX, currY, 1);
}
function redraw(x, y, width){
    let canvas = document.getElementById("canvas");
    let gl = canvas.getContext("webgl2");

        
    if(gl){
        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT); //clear with the specified color

        //write the shaders
        const shaders = {
            vs: `#version 300 es
                in vec2 vertPos;
                in vec3 vertColor;
                out vec3 fragColor;
                uniform float rotationAngle;
                //vec2 rotationCoeffs = vec2(0, 0);
                uniform float scaleX;
                uniform float scaleY;

                void main(){
                    //rotationCoeffs[0] = sin(rotationAngle);
                    //rotationCoeffs[1] = cos(rotationAngle);

                    float rad = radians(rotationAngle);
                    float cosA = cos(rad);
                    float sinA = sin(rad);
                    vec2 newPos = vec2(
                        (vertPos.x * scaleX) * cosA - (vertPos.y * scaleY) * sinA,
                        (vertPos.x * scaleX) * sinA + (vertPos.y * scaleY) * cosA
                    );

                    /*for(int i = 0; i < vertPos.size() - 1; i += 2){
                        vertPos[i] += rotationCoeffs[0];
                        vertPos[i + 1] += rotationCoeffs[1];
                    }*/

                    fragColor = vertColor;
                    gl_Position = vec4(newPos, 0, 1);
                }`,
            fs: `#version 300 es
                precision mediump float;
                
                in vec3 fragColor;
                out vec4 outColor;

                void main(){
                    outColor = vec4(fragColor, 1);
                }`
        }

        //create shader objects
        let vertexShader = gl.createShader(gl.VERTEX_SHADER);
        let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

        //set shader sources using gl.shaderSource method
        gl.shaderSource(vertexShader, shaders.vs);
        gl.shaderSource(fragmentShader, shaders.fs);

        //compile the shaders using gl.compileShader
        gl.compileShader(vertexShader);
        gl.compileShader(fragmentShader);

        //create program
        let program = gl.createProgram();

        //link the shaders
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        let randRed = Math.max(1 - Math.random(), 0);
        let randGreen = Math.max(1 - Math.random(), 0);
        let randBlue = Math.max(1 - Math.random(), 0);

        //create buffers
        const vertAttributes = {
            
            positions: {
                componentCount: 2,
                data: new Float32Array([x, y, x + (width / 2), y, x + (width / 2), y + (width / 2), x, y + (width / 2)])
            } //given x, y function parameters stand for top left pos
            ,
            colors: {
                componentCount: 3,
                data: new Float32Array(4 * 3)
            }
        };
        
        let counter = 0;
        for(let i = 0; i < vertAttributes.positions.data.length * 1.5; i++){
            vertAttributes.colors.data[counter++] = (randRed);
            vertAttributes.colors.data[counter++] = (randGreen);
            vertAttributes.colors.data[counter++] = (randBlue);
            //console.log(vertAttributes.colors.data[counter - 1]);
        }
        //console.log(vertAttributes.colors.data.toString());
        let posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertAttributes.positions.data, gl.STATIC_DRAW);

        //now propagate the buffer
        let attributeLocation = gl.getAttribLocation(program, 'vertPos');
        //specify attribute values' attributes
        let posPointer = gl.vertexAttribPointer(attributeLocation, vertAttributes.positions.componentCount, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attributeLocation);

        let colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertAttributes.colors.data, gl.STATIC_DRAW);

        attributeLocation = gl.getAttribLocation(program, 'vertColor');
        let colorPtr = gl.vertexAttribPointer(attributeLocation,vertAttributes.colors.componentCount, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attributeLocation);

        

        // Check for shader compile errors
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error("Vertex Shader Error: " + gl.getShaderInfoLog(vertexShader));
            
        }
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error("Fragment Shader Error: " + gl.getShaderInfoLog(fragmentShader));
       
        }

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Program Link Error: " + gl.getProgramInfoLog(program));

        }
        //specify random colors
        gl.useProgram(program);
        let angleLocation = gl.getUniformLocation(program, 'rotationAngle');
        gl.uniform1f(angleLocation, currAngle);

        let scaleXLocation = gl.getUniformLocation(program, 'scaleX');
        gl.uniform1f(scaleXLocation, document.getElementById("scaleX").value);

        let scaleYLocation = gl.getUniformLocation(program, 'scaleY');
        gl.uniform1f(scaleYLocation, document.getElementById("scaleY").value);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); //4 vertices
    }
}

redraw(0, 0, 1);