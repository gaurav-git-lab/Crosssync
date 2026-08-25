const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

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

function createPNG(width, height, r = 37, g = 99, b = 235, a = 255) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

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

// Generate valid multi-resolution Windows .ICO file containing PNG payloads
function createICO(pngSizes) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(pngSizes.length, 4); // count

  let offset = 6 + 16 * pngSizes.length;
  const dirEntries = [];
  const buffers = [];

  for (const item of pngSizes) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(item.width >= 256 ? 0 : item.width, 0);
    entry.writeUInt8(item.height >= 256 ? 0 : item.height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(item.buffer.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset

    dirEntries.push(entry);
    buffers.push(item.buffer);
    offset += item.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...buffers]);
}

const targetDirs = [
  path.join(__dirname, '../src-tauri/icons'),
  path.join(__dirname, '../desktop/src-tauri/icons'),
  path.join(__dirname, '../mobile/assets/icons')
];

for (const dir of targetDirs) {
  fs.mkdirSync(dir, { recursive: true });
  
  const png16 = createPNG(16, 16, 37, 99, 235);
  const png32 = createPNG(32, 32, 37, 99, 235);
  const png128 = createPNG(128, 128, 37, 99, 235);
  const png256 = createPNG(256, 256, 37, 99, 235);
  const png512 = createPNG(512, 512, 37, 99, 235);

  fs.writeFileSync(path.join(dir, '32x32.png'), png32);
  fs.writeFileSync(path.join(dir, '128x128.png'), png128);
  fs.writeFileSync(path.join(dir, '128x128@2x.png'), png256);
  fs.writeFileSync(path.join(dir, 'icon.png'), png512);
  fs.writeFileSync(path.join(dir, 'app_icon.png'), png512);

  // Write valid Windows ICO format containing 16x16, 32x32, 128x128, 256x256
  const icoBuffer = createICO([
    { width: 16, height: 16, buffer: png16 },
    { width: 32, height: 32, buffer: png32 },
    { width: 128, height: 128, buffer: png128 },
    { width: 256, height: 256, buffer: png256 },
  ]);
  fs.writeFileSync(path.join(dir, 'icon.ico'), icoBuffer);
}

console.log('All icons and valid ICO files generated in all targets!');

