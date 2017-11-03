export class Canvas {
  canvas: any;
  ctx: any;

  /**
   * Un compress bitmap are reverse in y axis
   */
  private static reverse(bitmap: any) {
    return {width: bitmap.width, height: bitmap.height, data: new Uint8ClampedArray(bitmap.data)};
  }

  create(id: string) {
    this.canvas = document.getElementById(id);
    this.ctx = this.canvas.getContext('2d');
    return this;
  }

  /**
   * decompress bitmap from RLE algorithm
   * @param  bitmap  {object} bitmap object of bitmap event of node-rdpjs
   */
  decompress(bitmap: any) {
    let fName = null;
    switch (bitmap.bitsPerPixel) {
      case 15:
        fName = 'bitmap_decompress_15';
        break;
      case 16:
        fName = 'bitmap_decompress_16';
        break;
      case 24:
        fName = 'bitmap_decompress_24';
        break;
      case 32:
        fName = 'bitmap_decompress_32';
        break;
      default:
        throw 'invalid bitmap data format';
    }
    const input = new Uint8Array(bitmap.data);
    const inputPtr = Module._malloc(input.length);
    const inputHeap = new Uint8Array(Module.HEAPU8.buffer, inputPtr, input.length);
    inputHeap.set(input);

    const output_width = bitmap.destRight - bitmap.destLeft + 1;
    const output_height = bitmap.destBottom - bitmap.destTop + 1;
    const ouputSize = output_width * output_height * 4;
    const outputPtr = Module._malloc(ouputSize);

    const outputHeap = new Uint8Array(Module.HEAPU8.buffer, outputPtr, ouputSize);

    const res = Module.ccall(fName,
      'number',
      ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'],
      [outputHeap.byteOffset, output_width, output_height, bitmap.width, bitmap.height, inputHeap.byteOffset, input.length]
    );

    const output = new Uint8ClampedArray(outputHeap.buffer, outputHeap.byteOffset, ouputSize);

    Module._free(inputPtr);
    Module._free(outputPtr);

    return {width: output_width, height: output_height, data: output};
  }


  /**
   * update canvas with new bitmap
   * @param bitmap {object}
   */
  update(bitmap: any) {
    let output = null;
    if (bitmap.isCompress) {
      output = this.decompress(bitmap);
    } else {
      output = Canvas.reverse(bitmap);
    }

    // use image data to use asm.js
    const imageData = this.ctx.createImageData(output.width, output.height);
    imageData.data.set(output.data);
    this.ctx.putImageData(imageData, bitmap.destLeft, bitmap.destTop);
  }
}
