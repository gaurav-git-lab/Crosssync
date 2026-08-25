const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, r, g, b, a = 255) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.concat([typeBuf, data]);
    const crc = crc32(crcBuf);
    const crcOut = Buffer.alloc(4);
    crcOut.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcOut]);
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let n = 0; n < buf.length; n++) {
      c ^= buf[n];
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = chunk('IHDR', ihdr);

  // Raw image scanlines
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const offset = y * rowSize;
    rawData[offset] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const px = offset + 1 + x * 4;
      const isBorder = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      rawData[px] = isBorder ? 59 : Math.min(255, r + Math.floor((x / width) * 40));
      rawData[px + 1] = isBorder ? 130 : Math.min(255, g + Math.floor((y / height) * 40));
      rawData[px + 2] = isBorder ? 246 : Math.min(255, b + 30);
      rawData[px + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = chunk('IDAT', compressed);
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const targetDirs = [
  path.join(__dirname, '../src-tauri/icons'),
  path.join(__dirname, '../desktop/src-tauri/icons'),
  path.join(__dirname, '../mobile/assets/icons')
];

for (const dir of targetDirs) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, '32x32.png'), createPNG(32, 32, 37, 99, 235));
  fs.writeFileSync(path.join(dir, '128x128.png'), createPNG(128, 128, 37, 99, 235));
  fs.writeFileSync(path.join(dir, '128x128@2x.png'), createPNG(256, 256, 37, 99, 235));
  fs.writeFileSync(path.join(dir, 'icon.png'), createPNG(512, 512, 37, 99, 235));
  fs.writeFileSync(path.join(dir, 'icon.ico'), createPNG(256, 256, 37, 99, 235));
  fs.writeFileSync(path.join(dir, 'app_icon.png'), createPNG(512, 512, 37, 99, 235));
}

console.log('All icons generated in all targets!');
