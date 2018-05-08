import { jsonrpcCall } from './jsonrpc'

let images: { [key: string]: HTMLImageElement } = {}
let imagesLoaded = 0

type TileInfo = {
    img:HTMLImageElement,
    rect:{
        x:number,
        y:number,
        w:number,
        h:number
    }
    file:string
}

let tiles: { [key: string]: TileInfo } = {}

export function loadTiles(imgList: Array<{ Tilesheet: string, File: string }>, progressReporter: (stage: string, progress: number, done: boolean) => void) {
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
        jsonrpcCall('select', { table: 'BaseSprites' }).then(tbl => prepareTiles(tbl))
        progressReporter("Preparing tiles", 0, false)
    }

    function prepareTiles(tbl: Array<any>) {
        let idx = 0
        function prepareTileBatch() {
            while (idx < tbl.length) {
                let tile = tbl[idx]
                let ss = images[tile._filename]
                let canvas = document.createElement("canvas");
                let [x, y, w, h] = (tile.SourceRectangle as string).split(' ').map(v => parseInt(v));
                canvas.width = w
                canvas.height = h
                let ctx = canvas.getContext('2d')
                ctx.drawImage(ss, x, y, w, h, 0, 0, w, h)
                let imgData = ctx.getImageData(0, 0, w, h)
                let data = imgData.data
                let ck = [data[0], data[1], data[2]]
                for (let i = 0; i < data.length; i += 4) {
                    if (data[i] == ck[0] && data[i + 1] == ck[1] && data[i + 2] == ck[2]) {
                        data[i + 3] = 0
                    }
                }
                ctx.putImageData(imgData, 0, 0)

                let tileImg = new Image
                tileImg.src = canvas.toDataURL("image/png")
                tiles[tile.ID] = {img:tileImg, file:tile._filename, rect:{x,y,w,h}}
                ++idx
                if ((idx % 50) == 0) {
                    break
                }
            }
            if (idx < tbl.length) {
                progressReporter("Preparing tiles", idx, false)
                setTimeout(prepareTileBatch, 10);
            }
            else {
                progressReporter("Complete", 0, true)
            }
        }
        setTimeout(prepareTileBatch, 10)
    }
}

export function getImage(file:string) {
    return images[file]
}

export function getTilesList() {
    return Object.keys(tiles).sort()
}

export function getTile(id:string) {
    return tiles[id]
}
