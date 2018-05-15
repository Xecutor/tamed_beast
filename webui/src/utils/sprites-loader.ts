import { jsonrpcCall } from './jsonrpc'
import { Rect, parseRect } from './rect'

let images: { [key: string]: HTMLImageElement } = {}
let colorKeyCache : { [key: string]: number[] } = {}
let imagesLoaded = 0

type BaseSpriteInfo = {
    img:HTMLImageElement,
    rect:Rect
    file:string
}

let baseSprites: { [key: string]: BaseSpriteInfo } = {}

function getImageColorKey(defFile:string) {
    let ck = colorKeyCache[defFile]
    if(ck) {
        return ck
    }
    let ss = images[defFile]
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext('2d')
    ctx.drawImage(ss, 0, 0, 1, 1, 0, 0, 1, 1)
    let imgData = ctx.getImageData(0, 0, 1, 1)
    let data = imgData.data
    ck = [data[0], data[1], data[2]]
    colorKeyCache[defFile] = ck
    return ck
}

function makeSpriteImage(defFile:string, rect:Rect) {
    let ss = images[defFile]
    let canvas = document.createElement("canvas");
    let {x, y, w, h} = rect
    canvas.width = w
    canvas.height = h
    let ctx = canvas.getContext('2d')
    ctx.drawImage(ss, x, y, w, h, 0, 0, w, h)
    let imgData = ctx.getImageData(0, 0, w, h)
    let data = imgData.data
    let ck = getImageColorKey(defFile)
    for (let i = 0; i < data.length; i += 4) {
        if (data[i] == ck[0] && data[i + 1] == ck[1] && data[i + 2] == ck[2]) {
            data[i + 3] = 0
        }
    }
    ctx.putImageData(imgData, 0, 0)

    let spriteImg = new Image
    spriteImg.src = canvas.toDataURL("image/png")
    return spriteImg
}

export function loadSprites(imgList: Array<{ Tilesheet: string, File: string }>, progressReporter: (stage: string, progress: number, done: boolean) => void) {
    progressReporter("Loading images", 0, false)
    for(let imgFile of imgList) {
        let img = new Image()
        img.src='/tilesheet/'+imgFile.Tilesheet;
        img.onload=()=>onImgLoaded()
        images[imgFile.File]=img
    }
    function onImgLoaded() {
        ++imagesLoaded
        progressReporter("Loading images", imagesLoaded, false)
        if (imagesLoaded == Object.keys(images).length) {
            allImagesLoaded()
        }
    }

    function allImagesLoaded() {
        console.log("all images loaded")
        jsonrpcCall('select', { table: 'BaseSprites' }).then(tbl => prepareSprites(tbl))
        progressReporter("Preparing base sprites", 0, false)
    }

    function prepareSprites(tbl: Array<any>) {
        let idx = 0
        function prepareSpriteBatch() {
            while (idx < tbl.length) {
                let sprite = tbl[idx]
                let file = sprite._filename
                let rect = parseRect(sprite.SourceRectangle as string)
                let img = makeSpriteImage(file, rect)
                baseSprites[sprite.ID] = {file, rect, img}
                ++idx
                if ((idx % 50) == 0) {
                    break
                }
            }
            if (idx < tbl.length) {
                progressReporter("Preparing base sprites", idx, false)
                setTimeout(prepareSpriteBatch, 5);
            }
            else {
                progressReporter("Complete", 0, true)
            }
        }
        setTimeout(prepareSpriteBatch, 5)
    }
}

export function getImage(defFile:string) {
    return images[defFile]
}

function getFileNameFromURL(url:string) {
    return url.substr(url.lastIndexOf('/') + 1)
}

export function getImageFile(defFile:string) {
    return getFileNameFromURL(images[defFile].src)
}

export function getBaseSpriteList() {
    return Object.keys(baseSprites).sort()
}

export function getBaseSprite(id:string) {
    return baseSprites[id]
}

export function getBaseSpriteImageFile(sprite:BaseSpriteInfo) {
    return getFileNameFromURL(getImage(sprite.file).src)
}

export function getFileList() {
    return Object.keys(images).sort()
}

export function addSpriteDefinition(defFile:string, id:string, rect:Rect) {
    baseSprites[id]={
        img:makeSpriteImage(defFile, rect),
        rect,
        file:defFile
    }
}
