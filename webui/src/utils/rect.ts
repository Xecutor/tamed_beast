export type Rect = {
    x:number,
    y:number,
    w:number,
    h:number
}

export function parseRect(txt:string) {
    let [x,y,w,h] = txt.split(/\s+/).map(str=>parseInt(str))
    return {x,y,w,h}
}

export function rectToString(r:Rect){
    return `${r.x} ${r.y} ${r.w} ${r.h}`
}
