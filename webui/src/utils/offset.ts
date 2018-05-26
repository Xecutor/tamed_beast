export type Offset = {
    x:number
    y:number
}

export function parseOffset(str?: string) {
    if (typeof (str) === 'undefined') {
        return undefined
    }
    let [x, y] = str.split(' ').map(val => parseInt(val))
    return { x, y }
}

export function offsetToString(off: Offset) {
    return `${off.x} ${off.y}`
}
