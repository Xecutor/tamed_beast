import { ColorResult } from "react-color";

export function isHexColor(value:string) {
    return value.substr(0, 1) === '#'
}

export function parseColor(value:string) {
    let clr=value;
    if (!isHexColor(clr)) {
        let [r, g, b, a] = value.split(' ').map(v => parseInt(v))
        clr = `rgba(${r}, ${g}, ${b}, ${a/255.0})`
    }
    return clr
}

export function colorToString(orgColor:string, clr:ColorResult) {
    if(isHexColor(orgColor)) {
        return clr.hex
    }
    return `${clr.rgb.r} ${clr.rgb.g} ${clr.rgb.b} ${Math.round(255*clr.rgb.a)}`
}
