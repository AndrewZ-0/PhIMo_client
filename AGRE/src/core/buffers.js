export function initBuffers(gl, objects) {
    let buffers = new Array(objects.length);
    for (let i = 0; i < objects.length; i++) {
        //create vertex buffer
        const vertexBufferObject = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
        gl.bufferData(gl.ARRAY_BUFFER, objects[i].getVertexData(), gl.STATIC_DRAW);

        //create index buffer
        const indexBufferObject = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferObject);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, objects[i].getIndexData(), gl.STATIC_DRAW);

        buffers[i] = {
            vertexBufferObject,
            indexBufferObject,

            indexCount: objects[i].indices.length
        };
        //console.log(vertexBufferObject);
        //console.log(objects[i].indices.length);
    }

    return buffers;
}


/*
//set attr pointers:
//attr loc, no of elements per attr
//type of elements
//size of individual vertex
//offset from beginning of single vertex to this attr
export function setAttrPointers(gl, buffers, positionAttrLoc, colourAttrLoc) {
    for (let i = 0; i < buffers.length; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers[i].vertexBufferObject);

        const attrLen = 6 * Float32Array.BYTES_PER_ELEMENT;

        gl.vertexAttribPointer(positionAttrLoc, 3, gl.FLOAT, false, attrLen, 0);
        gl.vertexAttribPointer(colourAttrLoc, 3, gl.FLOAT, false, attrLen, 3 * Float32Array.BYTES_PER_ELEMENT);

        gl.enableVertexAttribArray(positionAttrLoc);
        gl.enableVertexAttribArray(colourAttrLoc);
    }
}


export function setLightingAttrPointers(gl, buffers, positionAttrLoc, normalAttrLoc, colourAttrLoc) {
    for (let i = 0; i < buffers.length; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers[i].vertexBufferObject);

        const attrLen = 9 * Float32Array.BYTES_PER_ELEMENT;

        gl.vertexAttribPointer(positionAttrLoc, 3, gl.FLOAT, false, attrLen, 0);
        gl.vertexAttribPointer(normalAttrLoc, 3, gl.FLOAT, false, attrLen, 3 * Float32Array.BYTES_PER_ELEMENT);
        gl.vertexAttribPointer(colourAttrLoc, 3, gl.FLOAT, false, attrLen, 6 * Float32Array.BYTES_PER_ELEMENT);
        
        gl.enableVertexAttribArray(positionAttrLoc);
        gl.enableVertexAttribArray(normalAttrLoc);
        gl.enableVertexAttribArray(colourAttrLoc);
    }
}
*/
