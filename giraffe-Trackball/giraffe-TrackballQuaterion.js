"use strict";

var canvas;
var gl;

var NumVertices  = 36;

var points = [];
var colors = [];

var rotationQuaternion;
var rotationQuaternionLoc,rotationQuaternionLoc2;

//自己添加的部分
var distance;
var distanceLoc;
var scaleImage = [ 1.0, 1.0, 1.0 ];
var scaleSame = [ 1.0, 1.0, 1.0 ];
var scaleImageLoc,scaleImageLoc2;

var angle = 0.0;
var axis = [0, 0, 1];

var trackingMouse = false;
var trackballMove = false;

var lastPos = [0, 0, 0];
var curx, cury;
var startX, startY;

var choose=0;
var vBuffer1,vBuffer2;
var cBuffer;
var vPosition,vColor;

function multq( a,  b)
{
   // vec4(a.x*b.x - dot(a.yzw, b.yzw), a.x*b.yzw+b.x*a.yzw+cross(b.yzw, a.yzw))

   var s = vec3(a[1], a[2], a[3]);
   var t = vec3(b[1], b[2], b[3]);
   return(vec4(a[0]*b[0] - dot(s,t), add(cross(t, s), add(scale(a[0],t), scale(b[0],s)))));
}



function trackballView( x,  y ) {
    var d, a;
    var v = [];

    v[0] = x;
    v[1] = y;

    d = v[0]*v[0] + v[1]*v[1];
    if (d < 1.0)
      v[2] = Math.sqrt(1.0 - d);
    else {
      v[2] = 0.0;
      a = 1.0 /  Math.sqrt(d);
      v[0] *= a;
      v[1] *= a;
    }
    return v;
}

function mouseMotion( x,  y)
{
    var dx, dy, dz;

    var curPos = trackballView(x, y);
    if(trackingMouse) {
      dx = curPos[0] - lastPos[0];
      dy = curPos[1] - lastPos[1];
      dz = curPos[2] - lastPos[2];

      if (dx || dy || dz) {
           angle = -0.01 * Math.sqrt(dx*dx + dy*dy + dz*dz);


           axis[0] = lastPos[1]*curPos[2] - lastPos[2]*curPos[1];
           axis[1] = lastPos[2]*curPos[0] - lastPos[0]*curPos[2];
           axis[2] = lastPos[0]*curPos[1] - lastPos[1]*curPos[0];

         lastPos[0] = curPos[0];
           lastPos[1] = curPos[1];
           lastPos[2] = curPos[2];
      }
    render();
    }
    
    
}

function startMotion( x,  y)
{
    trackingMouse = true;
    startX = x;
    startY = y;
    curx = x;
    cury = y;

    lastPos = trackballView(x, y);
      trackballMove=true;
}

function stopMotion( x,  y)
{
    trackingMouse = false;
    if (startX != x || startY != y) {
    }
    else {
         angle = 0.0;
         trackballMove = false;
    }
}


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //start paint the animal----long neck Giraffe
    paintAnimal();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    //initialize the color buffer ----that is cBuffer
    cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
    //get the location of vColor in the shader(html) and name it vColor
    vColor = gl.getAttribLocation( program, "vColor" );
    gl.enableVertexAttribArray( vColor );
    //initialize the vertex Buffer-----vBuffer1
    vBuffer1 = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer1 );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    //initialize the vertex Buffer-----vBuffer2
    vBuffer2 = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer2 );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    //get the position of vPosition in the shader(html) and name it vPosition
    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.enableVertexAttribArray( vPosition );
    //initialize rotate angle=(1,0,0,0) and get the location ----rotationQuaternionLoc
    rotationQuaternion = vec4(1, 0, 0, 0);
    rotationQuaternionLoc = gl.getUniformLocation(program, "r");
    //initialize distance =0 and get the location ----distanceLoc
    distance = 0.0;
    distanceLoc = gl.getUniformLocation(program,"distance");
    //get the location ----scaleImageLoc
    scaleImageLoc = gl.getUniformLocation(program, "scaleImage");
  
    //add events listeners
    canvas.addEventListener("mousedown", function(event){
      var x = 2*event.clientX/canvas.width-1;
      var y = 2*(canvas.height-event.clientY)/canvas.height-1;
      startMotion(x, y);
    });

    canvas.addEventListener("mouseup", function(event){
      var x = 2*event.clientX/canvas.width-1;
      var y = 2*(canvas.height-event.clientY)/canvas.height-1;
      stopMotion(x, y);
    });

    canvas.addEventListener("mousemove", function(event){

      var x = 2*event.clientX/canvas.width-1;
      var y = 2*(canvas.height-event.clientY)/canvas.height-1;
      mouseMotion(x, y);
    } );

    window.onkeydown = function(event) {
        var key = String.fromCharCode(event.keyCode);
        switch(key) {
          case '1':
            distance += 0.04;
            //direction = !direction;
            break;

          case '2':
            distance -= 0.04;
            //delay /= 2.0;
            break;

          case '3':
            //delay *= 2.0;
            break;
        }
    };

    document.getElementById( "moveForward" ).onclick = function () {
        distance += 0.04;
    };
    document.getElementById( "moveBackward" ).onclick = function () {
        distance -= 0.04;
    };
    document.getElementById( "x-enlarge" ).onclick = function () {
        scaleImage[0] += 0.2;
    };
    document.getElementById( "x-narrow" ).onclick = function () {
        scaleImage[0] -= 0.2;
    };
    document.getElementById( "choose" ).onclick = function () {
        choose = !choose;
    };

    render();
}


function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  
    //bindBuffer to colorBuffer and specify the format--4
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    //if choose the first animal
    if(choose==0)
    {
    //bindBuffer to vertexBuffer1 and specify the format--4
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer1 );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    //check mouse movement
    if(trackballMove) {
      axis = normalize(axis);
      var c = Math.cos(angle/5.0);
      var s = Math.sin(angle/5.0);
      //console.log("before multq"); -------dont's know 
      //compute the rotation
      var rotation = vec4(c, s*axis[0], s*axis[1], s*axis[2]);
      rotationQuaternion = multq(rotationQuaternion, rotation);
      //send the rotationQuaternion to the vertexShader, using the rotationQuaternionLoc
      gl.uniform4fv(rotationQuaternionLoc, flatten(rotationQuaternion));
    }
    //send distance, scaleImage
    gl.uniform1f(distanceLoc,distance);
    gl.uniform3fv(scaleImageLoc, flatten(scaleImage));
    //draw the first animal
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices*16 );
  
    //画第二只动物
    //bindBuffer to colorBuffer and specify the format--4
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    //bindBuffer to vertexBuffer1 and specify the format--4
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer2 );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    //no rotation     
    var rotation2 = vec4(1, 0, 0, 0);
    var rQuaternion = multq(rotation2, rotation2);
    //send the rotationQuaternion to the vertexShader, using the rotationQuaternionLoc
    gl.uniform4fv(rotationQuaternionLoc, flatten(rQuaternion));
    //send distance=0, scaleImage=(1,1,1)
    gl.uniform1f(distanceLoc,0);
    gl.uniform3fv(scaleImageLoc, flatten(scaleSame));
    //draw the second animal
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices*16 );
    }

    else
    {
    //画第一只动物
    //bindBuffer to colorBuffer and specify the format--4
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    //bindBuffer to vertexBuffer1 and specify the format--4
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer1 );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    //no rotation 
    var rotation3 = vec4(1, 0, 0, 0);
    var rQuaternion = multq(rotation3, rotation3);
    //send the rotationQuaternion to the vertexShader, using the rotationQuaternionLoc
    gl.uniform4fv(rotationQuaternionLoc, flatten(rQuaternion));
    //send distance=0, scaleImage=(1,1,1)
    gl.uniform1f(distanceLoc,0);
    gl.uniform3fv(scaleImageLoc, flatten(scaleSame));
    //draw the second animal
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices*16 );
    //画第二只动物   
    //bindBuffer to vertexBuffer2 and specify the format--4
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer2 );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    //check mouse movement
    if(trackballMove) {
      axis = normalize(axis);
      var c = Math.cos(angle/20.0);
      var s = Math.sin(angle/20.0);
      //console.log("before multq"); -------dont's know 
      //compute the rotation
      var rotation = vec4(c, s*axis[0], s*axis[1], s*axis[2]);
      rotationQuaternion = multq(rotationQuaternion, rotation);
      //send the rotationQuaternion to the vertexShader, using the rotationQuaternionLoc
      gl.uniform4fv(rotationQuaternionLoc, flatten(rotationQuaternion));
    }
    //send distance, scaleImage
    gl.uniform1f(distanceLoc,distance);
    gl.uniform3fv(scaleImageLoc, flatten(scaleImage));
    //draw the first animal
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices*16 );
    }
    requestAnimFrame( render );
}



function paintAnimal()
{
    quad_body( 1, 0, 3, 2 );
    quad_body( 2, 3, 7, 6 );
    quad_body( 3, 0, 4, 7 );
    quad_body( 6, 5, 1, 2 );
    quad_body( 4, 5, 6, 7 );
    quad_body( 5, 4, 0, 1 );

    quad_neck( 1, 0, 3, 2 );
    quad_neck( 2, 3, 7, 6 );
    quad_neck( 3, 0, 4, 7 );
    quad_neck( 6, 5, 1, 2 );
    quad_neck( 4, 5, 6, 7 );
    quad_neck( 5, 4, 0, 1 );

    quad_mane( 1, 0, 3, 2 );//鬃毛
    quad_mane( 2, 3, 7, 6 );
    quad_mane( 3, 0, 4, 7 );
    quad_mane( 6, 5, 1, 2 );
    quad_mane( 4, 5, 6, 7 );
    quad_mane( 5, 4, 0, 1 );

    quad_head( 1, 0, 3, 2 );
    quad_head( 2, 3, 7, 6 );
    quad_head( 3, 0, 4, 7 );
    quad_head( 6, 5, 1, 2 );
    quad_head( 4, 5, 6, 7 );
    quad_head( 5, 4, 0, 1 );

    quad_mouth1( 1, 0, 3, 2 );
    quad_mouth1( 2, 3, 7, 6 );
    quad_mouth1( 3, 0, 4, 7 );
    quad_mouth1( 6, 5, 1, 2 );
    quad_mouth1( 4, 5, 6, 7 );
    quad_mouth1( 5, 4, 0, 1 );

    quad_mouth2( 1, 0, 3, 2 );
    quad_mouth2( 2, 3, 7, 6 );
    quad_mouth2( 3, 0, 4, 7 );
    quad_mouth2( 6, 5, 1, 2 );
    quad_mouth2( 4, 5, 6, 7 );
    quad_mouth2( 5, 4, 0, 1 );

    quad_leg1( 1, 0, 3, 2 );
    quad_leg1( 2, 3, 7, 6 );
    quad_leg1( 3, 0, 4, 7 );
    quad_leg1( 6, 5, 1, 2 );
    quad_leg1( 4, 5, 6, 7 );
    quad_leg1( 5, 4, 0, 1 );

    quad_leg2( 1, 0, 3, 2 );
    quad_leg2( 2, 3, 7, 6 );
    quad_leg2( 3, 0, 4, 7 );
    quad_leg2( 6, 5, 1, 2 );
    quad_leg2( 4, 5, 6, 7 );
    quad_leg2( 5, 4, 0, 1 );

    quad_leg3( 1, 0, 3, 2 );
    quad_leg3( 2, 3, 7, 6 );
    quad_leg3( 3, 0, 4, 7 );
    quad_leg3( 6, 5, 1, 2 );
    quad_leg3( 4, 5, 6, 7 );
    quad_leg3( 5, 4, 0, 1 );

    quad_leg4( 1, 0, 3, 2 );
    quad_leg4( 2, 3, 7, 6 );
    quad_leg4( 3, 0, 4, 7 );
    quad_leg4( 6, 5, 1, 2 );
    quad_leg4( 4, 5, 6, 7 );
    quad_leg4( 5, 4, 0, 1 );


    quad_hoof1( 1, 0, 3, 2 );
    quad_hoof1( 2, 3, 7, 6 );
    quad_hoof1( 3, 0, 4, 7 );
    quad_hoof1( 6, 5, 1, 2 );
    quad_hoof1( 4, 5, 6, 7 );
    quad_hoof1( 5, 4, 0, 1 );

    quad_hoof2( 1, 0, 3, 2 );
    quad_hoof2( 2, 3, 7, 6 );
    quad_hoof2( 3, 0, 4, 7 );
    quad_hoof2( 6, 5, 1, 2 );
    quad_hoof2( 4, 5, 6, 7 );
    quad_hoof2( 5, 4, 0, 1 );

    quad_hoof3( 1, 0, 3, 2 );
    quad_hoof3( 2, 3, 7, 6 );
    quad_hoof3( 3, 0, 4, 7 );
    quad_hoof3( 6, 5, 1, 2 );
    quad_hoof3( 4, 5, 6, 7 );
    quad_hoof3( 5, 4, 0, 1 );

    quad_hoof4( 1, 0, 3, 2 );
    quad_hoof4( 2, 3, 7, 6 );
    quad_hoof4( 3, 0, 4, 7 );
    quad_hoof4( 6, 5, 1, 2 );
    quad_hoof4( 4, 5, 6, 7 );
    quad_hoof4( 5, 4, 0, 1 );

    

    quad_tail1( 1, 0, 3, 2 );
    quad_tail1( 2, 3, 7, 6 );
    quad_tail1( 3, 0, 4, 7 );
    quad_tail1( 6, 5, 1, 2 );
    quad_tail1( 4, 5, 6, 7 );
    quad_tail1( 5, 4, 0, 1 );

    quad_tail2( 1, 0, 3, 2 );
    quad_tail2( 2, 3, 7, 6 );
    quad_tail2( 3, 0, 4, 7 );
    quad_tail2( 6, 5, 1, 2 );
    quad_tail2( 4, 5, 6, 7 );
    quad_tail2( 5, 4, 0, 1 );
}

function quad_body(a, b, c, d)
{
    var vertices = [
        vec4( -0.2, -0.3,  0.1, 1.0 ),
        vec4( -0.2,  0.0,  0.1, 1.0 ),
        vec4(  0.2,  0.0,  0.1, 1.0 ),
        vec4(  0.2, -0.3,  0.1, 1.0 ),
        vec4( -0.2, -0.3, -0.1, 1.0 ),
        vec4( -0.2,  0.0, -0.1, 1.0 ),
        vec4(  0.2,  0.0, -0.1, 1.0 ),
        vec4(  0.2, -0.3, -0.1, 1.0 )
    ];

    var vertexColors = [
        [ 183/255, 127/255, 88/255, 1.0 ],  //light brown
        [ 116/255, 58/255,  21/255, 1.0 ],  //deep brown
        [ 116/255, 58/255,  21/255, 1.0 ],
        [ 183/255, 127/255, 88/255, 1.0 ],
        [ 183/255, 127/255, 88/255, 1.0 ],
        [ 116/255, 58/255,  21/255, 1.0 ],
        [ 116/255, 58/255,  21/255, 1.0 ],
        [ 183/255, 127/255, 88/255, 1.0 ]
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );

        // for interpolated colors use
        colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        //colors.push(vertexColors[a]);
    }
}

function quad_neck(a, b, c, d)
{
    var vertices = [
        vec4(  0.05,  0.0,  0.1,  1.0 ),
        vec4(  0.33,  0.4,  0.04, 1.0 ),
        vec4(  0.38,  0.4,  0.04, 1.0 ),
        vec4(  0.2,  -0.1,  0.1,  1.0 ),
        vec4(  0.05,  0.0, -0.1,  1.0 ),
        vec4(  0.33,  0.4, -0.04, 1.0 ),
        vec4(  0.38,  0.4, -0.04, 1.0 ),
        vec4(  0.2,  -0.1, -0.1,  1.0 )
    ];

    var vertexColors = [
        [ 148/255, 82/255,  39/255, 1.0 ],
        [ 148/255, 82/255,  39/255, 1.0 ],
        [ 116/255, 58/255,  21/255, 1.0 ],
        [ 116/255, 58/255,  21/255, 1.0 ],
        [ 148/255, 82/255,  39/255, 1.0 ],
        [ 148/255, 82/255,  39/255, 1.0 ],
        [ 116/255, 58/255,  21/255, 1.0 ],
        [ 116/255, 58/255,  21/255, 1.0 ]
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );

        // for interpolated colors use
        colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        //colors.push(vertexColors[a]);
    }
}

function quad_mane(a, b, c, d)
{
    var vertices = [
        vec4(  0.05,  0.0,  0.1,  1.0 ),
        vec4(  0.30,  0.4,  0.04, 1.0 ),
        vec4(  0.33,  0.4,  0.04, 1.0 ),
        vec4(  0.05,  0.0,  0.1,  1.0 ),
        vec4(  0.05,  0.0, -0.1,  1.0 ),
        vec4(  0.30,  0.4, -0.04, 1.0 ),
        vec4(  0.33,  0.4, -0.04, 1.0 ),
        vec4(  0.05,  0.0, -0.1,  1.0 )
    ];

    var vertexColors = [
        [ 148/255, 82/255,  39/255, 1.0 ],
        [ 180/255, 107/255,  59/255, 1.0 ],
        [ 180/255, 107/255,  59/255, 1.0 ],
        [ 180/255, 107/255,  59/255, 1.0 ],
        [ 148/255, 82/255,  39/255, 1.0 ],
        [ 180/255, 107/255,  59/255, 1.0 ],
        [ 180/255, 107/255,  59/255, 1.0 ],
        [ 180/255, 107/255,  59/255, 1.0 ]
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );

        // for interpolated colors use
        colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        //colors.push(vertexColors[a]);
    }
}

function quad_head(a, b, c, d)
{
    var vertices = [
        vec4(  0.30,  0.4,   0.04, 1.0 ),
        vec4(  0.30,  0.51,  0.04, 1.0 ),
        vec4(  0.43,  0.50,  0.04, 1.0 ),
        vec4(  0.43,  0.4,   0.04, 1.0 ),
        vec4(  0.30,  0.4,  -0.04, 1.0 ),
        vec4(  0.30,  0.51, -0.04, 1.0 ),
        vec4(  0.43,  0.50, -0.04, 1.0 ),
        vec4(  0.43,  0.4,  -0.04, 1.0 )
    ];

    var vertexColors = [
        [ 148/255, 82/255,  39/255, 1.0 ],
        [ 148/255, 82/255,  39/255, 1.0 ],
        [ 213/255, 137/255, 51/255, 1.0 ],
        [ 236/255, 195/255, 160/255, 1.0 ],
        [ 148/255, 82/255,  39/255, 1.0 ],
        [ 148/255, 82/255,  39/255, 1.0 ],
        [ 213/255, 137/255, 51/255, 1.0 ],
        [ 236/255, 195/255, 160/255, 1.0 ],
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );

        // for interpolated colors use
        colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        //colors.push(vertexColors[a]);
    }
}

function quad_mouth1(a, b, c, d)
{
    var vertices = [
        vec4(  0.43,  0.40,  0.04, 1.0 ),
        vec4(  0.43,  0.50,  0.04, 1.0 ),
        vec4(  0.49,  0.46,  0.03, 1.0 ),
        vec4(  0.49,  0.41,  0.03, 1.0 ),
        vec4(  0.43,  0.40, -0.04, 1.0 ),
        vec4(  0.43,  0.50, -0.04, 1.0 ),
        vec4(  0.49,  0.46, -0.03, 1.0 ),
        vec4(  0.49,  0.41, -0.03, 1.0 )
    ];

    var vertexColors = [
        [ 236/255, 195/255, 160/255, 1.0 ],
        [ 213/255, 137/255, 51/255, 1.0 ],
        [ 241/255, 215/255, 180/255, 1.0 ],
        [ 241/255, 215/255, 180/255, 1.0 ],
        [ 236/255, 195/255, 160/255, 1.0 ],
        [ 213/255, 137/255, 51/255, 1.0 ],
        [ 241/255, 215/255, 180/255, 1.0 ],
        [ 241/255, 215/255, 180/255, 1.0 ]
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );

        // for interpolated colors use
        colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        //colors.push(vertexColors[a]);
    }
}

function quad_mouth2(a, b, c, d)
{
    var vertices = [
        vec4(  0.49,  0.41,  0.03, 1.0 ),
        vec4(  0.49,  0.46,  0.03, 1.0 ),
        vec4(  0.52,  0.41,  0.03, 1.0 ),
        vec4(  0.52,  0.46,  0.03, 1.0 ),
        vec4(  0.49,  0.41, -0.03, 1.0 ),
        vec4(  0.49,  0.46, -0.03, 1.0 ),
        vec4(  0.52,  0.41, -0.03, 1.0 ),
        vec4(  0.52,  0.46, -0.03, 1.0 )
    ];

    var vertexColors = [
        [ 241/255, 215/255, 180/255, 1.0 ],
        [ 241/255, 215/255, 180/255, 1.0 ],
        [ 156/255,  91/255,  59/255, 1.0 ],
        [ 156/255,  91/255,  59/255, 1.0 ],
        [ 241/255, 215/255, 180/255, 1.0 ],
        [ 241/255, 215/255, 180/255, 1.0 ],
        [ 156/255,  91/255,  59/255, 1.0 ],
        [ 156/255,  91/255,  59/255, 1.0 ]
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );

        // for interpolated colors use
        colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        //colors.push(vertexColors[a]);
    }
}

function quad_leg1(a, b, c, d)
{
    var vertices = [
        vec4(  0.23, -0.55, 0.1, 1.0 ),
        vec4(  0.13, -0.3,  0.1, 1.0 ),
        vec4(  0.20, -0.3,  0.1, 1.0 ),
        vec4(  0.30, -0.55, 0.1, 1.0 ),
        vec4(  0.23, -0.55, 0.03, 1.0 ),
        vec4(  0.13, -0.3,  0.03, 1.0 ),
        vec4(  0.20, -0.3,  0.03, 1.0 ),
        vec4(  0.30, -0.55, 0.03, 1.0 )
    ];

    var vertexColors = [
        [ 241/255, 209/255, 186/255, 1.0 ],  //ligter brown
        [ 183/255, 127/255, 88/255,  1.0 ],  //light brown
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 241/255, 209/255, 186/255, 1.0 ],
        [ 241/255, 209/255, 186/255, 1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 241/255, 209/255, 186/255, 1.0 ]
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );

        // for interpolated colors use
        colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        //colors.push(vertexColors[a]);
    }
}

function quad_leg2(a, b, c, d)
{
    var vertices = [
        vec4(  0.23, -0.55, -0.03, 1.0 ),
        vec4(  0.13, -0.3,  -0.03, 1.0 ),
        vec4(  0.20, -0.3,  -0.03, 1.0 ),
        vec4(  0.30, -0.55, -0.03, 1.0 ),
        vec4(  0.23, -0.55, -0.1, 1.0 ),
        vec4(  0.13, -0.3,  -0.1, 1.0 ),
        vec4(  0.20, -0.3,  -0.1, 1.0 ),
        vec4(  0.30, -0.55, -0.1, 1.0 )
    ];

    var vertexColors = [
        [ 241/255, 209/255, 186/255, 1.0 ],  //ligter brown
        [ 183/255, 127/255, 88/255,  1.0 ],  //light brown
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 241/255, 209/255, 186/255, 1.0 ],
        [ 241/255, 209/255, 186/255, 1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 241/255, 209/255, 186/255, 1.0 ]
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );

        // for interpolated colors use
        colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        //colors.push(vertexColors[a]);
    }
}

function quad_leg3(a, b, c, d)
{
    var vertices = [
        vec4(  -0.30, -0.55, 0.1, 1.0 ),
        vec4(  -0.20, -0.3,  0.1, 1.0 ),
        vec4(  -0.13, -0.3,  0.1, 1.0 ),
        vec4(  -0.23, -0.55, 0.1, 1.0 ),
        vec4(  -0.30, -0.55, 0.03, 1.0 ),
        vec4(  -0.20, -0.3,  0.03, 1.0 ),
        vec4(  -0.13, -0.3,  0.03, 1.0 ),
        vec4(  -0.23, -0.55, 0.03, 1.0 )
    ];

    var vertexColors = [
        [ 241/255, 209/255, 186/255, 1.0 ],  //ligter brown
        [ 183/255, 127/255, 88/255,  1.0 ],  //light brown
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 241/255, 209/255, 186/255, 1.0 ],
        [ 241/255, 209/255, 186/255, 1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 241/255, 209/255, 186/255, 1.0 ]
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );

        // for interpolated colors use
        colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        //colors.push(vertexColors[a]);
    }
}

function quad_leg4(a, b, c, d)
{
    var vertices = [
        vec4(  -0.30, -0.55, -0.03, 1.0 ),
        vec4(  -0.20, -0.3,  -0.03, 1.0 ),
        vec4(  -0.13, -0.3,  -0.03, 1.0 ),
        vec4(  -0.23, -0.55, -0.03, 1.0 ),
        vec4(  -0.30, -0.55, -0.1, 1.0 ),
        vec4(  -0.20, -0.3,  -0.1, 1.0 ),
        vec4(  -0.13, -0.3,  -0.1, 1.0 ),
        vec4(  -0.23, -0.55, -0.1, 1.0 )
    ];

    var vertexColors = [
        [ 241/255, 209/255, 186/255, 1.0 ],  //ligter brown
        [ 183/255, 127/255, 88/255,  1.0 ],  //light brown
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 241/255, 209/255, 186/255, 1.0 ],
        [ 241/255, 209/255, 186/255, 1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 241/255, 209/255, 186/255, 1.0 ]
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );

        // for interpolated colors use
        colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        //colors.push(vertexColors[a]);
    }
}

function quad_hoof1(a, b, c, d)
{
    var vertices = [
        vec4(  0.25, -0.58,  0.1, 1.0 ),
        vec4(  0.23, -0.55,  0.1, 1.0 ),
        vec4(  0.30, -0.55,  0.1, 1.0 ),
        vec4(  0.32, -0.58,  0.1, 1.0 ),
        vec4(  0.25, -0.58,  0.03, 1.0 ),
        vec4(  0.23, -0.55,  0.03, 1.0 ),
        vec4(  0.30, -0.55,  0.03, 1.0 ),
        vec4(  0.32, -0.58,  0.03, 1.0 )
    ];

    var vertexColors = [
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],  //light brown
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ]
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );

        // for interpolated colors use
        colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        //colors.push(vertexColors[a]);
    }
}

function quad_hoof2(a, b, c, d)
{
    var vertices = [
        vec4(  0.25, -0.58, -0.03, 1.0 ),
        vec4(  0.23, -0.55, -0.03, 1.0 ),
        vec4(  0.30, -0.55, -0.03, 1.0 ),
        vec4(  0.32, -0.58, -0.03, 1.0 ),
        vec4(  0.25, -0.58, -0.1, 1.0 ),
        vec4(  0.23, -0.55, -0.1, 1.0 ),
        vec4(  0.30, -0.55, -0.1, 1.0 ),
        vec4(  0.32, -0.58, -0.1, 1.0 )
    ];

    var vertexColors = [
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],  //light brown
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ]
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );

        // for interpolated colors use
        colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        //colors.push(vertexColors[a]);
    }
}

function quad_hoof3(a, b, c, d)
{
    var vertices = [
        vec4( -0.32, -0.58,  0.1, 1.0 ),
        vec4( -0.30, -0.55,  0.1, 1.0 ),
        vec4( -0.23, -0.55,  0.1, 1.0 ),
        vec4( -0.25, -0.58,  0.1, 1.0 ), 
        vec4( -0.32, -0.58,  0.03, 1.0 ),
        vec4( -0.30, -0.55,  0.03, 1.0 ),
        vec4( -0.23, -0.55,  0.03, 1.0 ),
        vec4( -0.25, -0.58,  0.03, 1.0 )
    ];

    var vertexColors = [
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],  //light brown
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ]
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );

        // for interpolated colors use
        colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        //colors.push(vertexColors[a]);
    }
}

function quad_hoof4(a, b, c, d)
{
    var vertices = [
        vec4( -0.32, -0.58, -0.03, 1.0 ),
        vec4( -0.30, -0.55, -0.03, 1.0 ),
        vec4( -0.23, -0.55, -0.03, 1.0 ),
        vec4( -0.25, -0.58, -0.03, 1.0 ),
        vec4( -0.32, -0.58, -0.1, 1.0 ),
        vec4( -0.30, -0.55, -0.1, 1.0 ),
        vec4( -0.23, -0.55, -0.1, 1.0 ),
        vec4( -0.25, -0.58, -0.1, 1.0 )
    ];

    var vertexColors = [
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],  //light brown
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ]
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );

        // for interpolated colors use
        colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        //colors.push(vertexColors[a]);
    }
}

function quad_tail1(a, b, c, d)
{
    var vertices = [
        vec4( -0.33, -0.17,  0.01, 1.0 ),
        vec4( -0.33, -0.15,  0.01, 1.0 ),
        vec4( -0.20, -0.11,  0.01, 1.0 ),
        vec4( -0.20, -0.13,  0.01, 1.0 ),
        vec4( -0.33, -0.17, -0.01, 1.0 ),
        vec4( -0.33, -0.15, -0.01, 1.0 ),
        vec4( -0.20, -0.11, -0.01, 1.0 ),
        vec4( -0.20, -0.13, -0.01, 1.0 )
    ];

    var vertexColors = [
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
        [ 183/255, 127/255, 88/255,  1.0 ],
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );

        // for interpolated colors use
        //colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        colors.push(vertexColors[a]);
    }
}

function quad_tail2(a, b, c, d)
{
    var vertices = [
        vec4( -0.380, -0.160,  0.00, 1.0 ),
        vec4( -0.365, -0.134,  0.01, 1.0 ),
        vec4( -0.350, -0.160,  0.02, 1.0 ),
        vec4( -0.365, -0.186,  0.01, 1.0 ),
        vec4( -0.350, -0.160, -0.02, 1.0 ),
        vec4( -0.335, -0.134, -0.01, 1.0 ),
        vec4( -0.320, -0.160, -0.00, 1.0 ),
        vec4( -0.335, -0.186, -0.01, 1.0 )
    ];

    var vertexColors = [
        [ 116/255, 58/255,  21/255, 1.0 ],
        [ 116/255, 58/255,  21/255, 1.0 ],
        [ 116/255, 58/255,  21/255, 1.0 ],
        [ 116/255, 58/255,  21/255, 1.0 ],
        [ 116/255, 58/255,  21/255, 1.0 ],
        [ 116/255, 58/255,  21/255, 1.0 ],
        [ 116/255, 58/255,  21/255, 1.0 ],
        [ 116/255, 58/255,  21/255, 1.0 ],
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );

        // for interpolated colors use
        //colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        colors.push(vertexColors[a]);
    }
}