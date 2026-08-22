// Handles encoding and decoding collection progress into URL parameter keys.
//
// Bit position comes from each sprite's `shareIndex` (assigned in
// sprites-data.js from the frozen SHARE_INDEX_ORDER list), NOT from
// where the sprite sits in the baseSprites array. This is what lets
// sprites-data.js reorder/merge `characters` freely without ever
// breaking an existing share link — see "SHARE-LINK SAFETY" there.
function compressCollection(baseList, activeObtained, activeMastered) {
    const totalSlots = baseList.reduce((max, s) => Math.max(max, s.shareIndex), -1) + 1;
    const bits = new Array(totalSlots * 2).fill('0');

    baseList.forEach(sprite => {
        if (activeObtained.includes(sprite.id)) bits[sprite.shareIndex] = '1';
        if (activeMastered.includes(sprite.id)) bits[totalSlots + sprite.shareIndex] = '1';
    });

    let bitString = bits.join('');
    while (bitString.length % 8 !== 0) bitString += '0';

    let byteArray = [];
    for (let i = 0; i < bitString.length; i += 8) {
        byteArray.push(parseInt(bitString.substring(i, i + 8), 2));
    }

    let binaryString = String.fromCharCode.apply(null, byteArray);
    return btoa(binaryString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decompressCollection(baseList, compressedString) {
    if (!compressedString) return { obtained: [], mastered: [] };
    try {
        let base64 = compressedString.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';
        let binaryString = atob(base64);

        let bitString = '';
        for (let i = 0; i < binaryString.length; i++) {
            let bits = binaryString.charCodeAt(i).toString(2);
            bitString += bits.padStart(8, '0');
        }

        let obtainedIds = [];
        let masteredIds = [];
        const totalSlots = baseList.reduce((max, s) => Math.max(max, s.shareIndex), -1) + 1;

        baseList.forEach(sprite => {
            // Bits beyond the encoded string's length read as undefined,
            // which just fails the '1' check — old, shorter links still
            // decode fine against a site that has grown since.
            if (bitString[sprite.shareIndex] === '1') {
                obtainedIds.push(sprite.id);
            }
            if (bitString[totalSlots + sprite.shareIndex] === '1') {
                masteredIds.push(sprite.id);
            }
        });
        return { obtained: obtainedIds, mastered: masteredIds };
    } catch (e) {
        console.error("Failed to decode collection sequence string", e);
        return { obtained: [], mastered: [] };
    }
}
