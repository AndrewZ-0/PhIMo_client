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
    }

    return buffers;
}
