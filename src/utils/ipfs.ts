export function convertStringToUint32(string, obj) {
    if (string.length > 62) {
        throw new Error("String must be less than or equal to 62 characters.");
    }
    const byteArray = Buffer.from(string, 'ascii');
    const length = byteArray.length;
    const part1 = Buffer.alloc(32);
    const part2 = Buffer.alloc(32);
    part1[0] = length;
    byteArray.copy(part1, 1, 0, Math.min(length, 31));
    if (length > 31) {
        byteArray.copy(part2, 0, 31);
    }
    let part1Uint = '0x' + part1.toString('hex');
    let part2Uint = '0x' + part2.toString('hex');
    obj.part1 = part1Uint;
    obj.part2 = part2Uint;
  }
  
export function decodeUint32ToString(part1Uint, part2Uint) {
    const part1 = Buffer.from(part1Uint.toString(16).padStart(64, '0'), 'hex');
    const part2 = Buffer.from(part2Uint.toString(16).padStart(64, '0'), 'hex');
    const length = part1[0];
    const fullBuffer = Buffer.concat([part1.slice(1, 32), part2]).slice(0, length);
    return fullBuffer.toString('ascii');
  }