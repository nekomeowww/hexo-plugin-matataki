function hexToArray(s) {
    return new Uint8Array(s.match(/[\da-f]{2}/gi).map((h => {
        return parseInt(h, 16);
    })));
}

function textToArray(s) {
    var i = s.length;
    var n = 0;
    var ba = new Array()

    for (var j = 0; j < i;) {
        var c = s.codePointAt(j);
        if (c < 128) {
            ba[n++] = c;
            j++;
        } else if ((c > 127) && (c < 2048)) {
            ba[n++] = (c >> 6) | 192;
            ba[n++] = (c & 63) | 128;
            j++;
        } else if ((c > 2047) && (c < 65536)) {
            ba[n++] = (c >> 12) | 224;
            ba[n++] = ((c >> 6) & 63) | 128;
            ba[n++] = (c & 63) | 128;
            j++;
        } else {
            ba[n++] = (c >> 18) | 240;
            ba[n++] = ((c >> 12) & 63) | 128;
            ba[n++] = ((c >> 6) & 63) | 128;
            ba[n++] = (c & 63) | 128;
            j += 2;
        }
    }
    return new Uint8Array(ba);
}

module.exports = {
    hexToArray,
    textToArray
}