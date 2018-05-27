import { jsonrpcCall } from './jsonrpc'
import { Rect, parseRect } from './rect'
import { Offset, parseOffset } from './offset'
import { DEFAULT_ENCODING } from 'crypto';
import { SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS, SIGSTKFLT } from 'constants';
import { BADFAMILY } from 'dns';

let images: { [key: string]: HTMLImageElement } = {}
let colorKeyCache: { [key: string]: number[] } = {}
let imagesLoaded = 0

type BaseSpriteInfo = {
    img: HTMLImageElement,
    rect: Rect
    file: string
}

const validRotations = {
    'FR': true,
    'FL': true,
    'BR': true,
    'BL': true
}

type Rotation = 'FR' | 'FL' | 'BR' | 'BL'
type Effect = 'FlipHorizontal'
type Tint = 'Material'
type Season = 'Spring' | 'April' | 'May' | 'June' | 'Summer' | 'August' | 'September' | 'Autumn' | 'November' | 'December' | 'Winter' | 'February'

export type BaseSpriteRef = {
    info: BaseSpriteInfo
    ID: string
}

export type BaseSpriteRotation = {
    base?: BaseSpriteRef
    combine?: CombineInfo
    rotation: Rotation
    effect?: Effect
}

function getRotationImg(br:BaseSpriteRotation) {
    if (br.base) {
        if(!br.base.info) {
            return undefined
        }
        return br.base.info.img
    }
    return br.combine.img
}

export type BaseSpriteSeasonChoice = {
    base?: BaseSpriteRef
    rotations?: Array<BaseSpriteRotation>
    season: Season
}

function getSeasonImg(seasons:Array<BaseSpriteSeasonChoice>) {
    for(let season of seasons) {
        if(season.base && season.base.ID=='empty') {
            continue;
        }
        if(season.rotations) {
            return getRotationImg(season.rotations[0])
        }
        return season.base.info.img
    }
}

export type CombineItem = {
    base?: BaseSpriteRef,
    sprite?: SpriteInfo | string
    tint?: Tint
    offset?: Offset
}

export type CombineInfo = {
    items: Array<CombineItem>
    img: HTMLImageElement
}

export type IntermediateSprite = {
    base:BaseSpriteRef
    percent:number
}

export type SpriteByMaterialType = {
    materialType : string
    sprite?:SpriteInfo
    base?:BaseSpriteRef
    intermediate?:Array<IntermediateSprite>
    rotations?:Array<BaseSpriteRotation>
}

export type RandomSprite = {
    base?:BaseSpriteRef
    sprite?:SpriteInfo
    weight:number
}

export type SpriteInfo = {
    id: string
    offset?: Offset
    tint?:string
    anim?:boolean
    rotations?: Array<BaseSpriteRotation>
    base?: BaseSpriteRef
    seasons?: Array<BaseSpriteSeasonChoice>
    combine?: CombineInfo
    byMaterial?:Array<SpriteByMaterialType>
    random?: Array<RandomSprite>
    frames?: Array<BaseSpriteRef>
    img: HTMLImageElement
    filename: string
}

let baseSprites: { [key: string]: BaseSpriteInfo } = {}
let sprites: { [key: string]: SpriteInfo } = {}

function getImageColorKey(defFile: string) {
    let ck = colorKeyCache[defFile]
    if (ck) {
        return ck
    }
    let ss = images[defFile]
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d')
    ctx.drawImage(ss, 0, 0, 1, 1, 0, 0, 1, 1)
    let imgData = ctx.getImageData(0, 0, 1, 1)
    let data = imgData.data
    ck = [data[0], data[1], data[2]]
    colorKeyCache[defFile] = ck
    return ck
}

function makeSpriteImage(defFile: string, rect: Rect) {
    let ss = images[defFile]
    let canvas = document.createElement('canvas');
    let { x, y, w, h } = rect
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
    spriteImg.src = canvas.toDataURL('image/png')
    return spriteImg
}

export function loadSprites(imgList: Array<{ Tilesheet: string, File: string }>, progressReporter: (stage: string, progress: number, done: boolean) => void) {
    progressReporter('Loading images', 0, false)
    for (let imgFile of imgList) {
        let img = new Image()
        img.src = '/tilesheet/' + imgFile.Tilesheet;
        img.onload = () => onImgLoaded()
        images[imgFile.File] = img
    }
    function onImgLoaded() {
        ++imagesLoaded
        progressReporter('Loading images', imagesLoaded, false)
        if (imagesLoaded == Object.keys(images).length) {
            allImagesLoaded()
        }
    }

    function allImagesLoaded() {
        console.log('all images loaded')
        jsonrpcCall('select', { table: 'BaseSprites' }).then(tbl => prepareBaseSprites(tbl))
        progressReporter('Preparing base sprites', 0, false)
    }

    function prepareBaseSprites(tbl: Array<any>) {
        let idx = 0
        function prepareBaseSpriteBatch() {
            while (idx < tbl.length) {
                let sprite = tbl[idx]
                let file = sprite._filename
                let rect = parseRect(sprite.SourceRectangle as string)
                let img = makeSpriteImage(file, rect)
                baseSprites[sprite.ID] = { file, rect, img }
                ++idx
                if ((idx % 200) == 0) {
                    break
                }
            }
            if (idx < tbl.length) {
                progressReporter('Preparing base sprites', idx, false)
                setTimeout(prepareBaseSpriteBatch, 5);
            }
            else {
                jsonrpcCall('select', { table: 'Sprites' }).then((tbl) => prepareSprites(tbl))
            }
        }
        setTimeout(prepareBaseSpriteBatch, 5)
    }

    function prepareSprites(tbl: Array<any>) {
        let idx = 0

        function makeBaseSpriteRefByID(ID:string) : BaseSpriteRef {
            if(!baseSprites[ID]) {
                console.warn(`Missing base sprite ref:${ID}`)
            }
            return {
                info:getBaseSprite(ID),
                ID
            }
        }

        function makeBaseSpriteRef(def: any): BaseSpriteRef {
            if(!baseSprites[def.BaseSprite]) {
                console.warn(`Missing base sprite ref:${def.BaseSprite}`)
            }
            return {
                info: getBaseSprite(def.BaseSprite),
                ID: def.BaseSprite
            }
        }

        function makeRotation(def: any, baseID:string): BaseSpriteRotation {
            let base: BaseSpriteRef
            let combine: CombineInfo
            if (def.BaseSprite) {
                base = makeBaseSpriteRef(def)
            }
            else if (def.Combine) {
                combine = makeCombine(def)
            }
            else {
                base = makeBaseSpriteRefByID(baseID)
            }
            return {
                base,
                combine,
                rotation: def.Rotation,
                effect: def.Effect
            }
        }

        function makeRotations(def: any): Array<BaseSpriteRotation> {
            let rotations: Array<BaseSpriteRotation> = [];
            for (let rdef of def.Rotations) {
                rotations.push(makeRotation(rdef, def.ID))
            }
            return rotations
        }

        function makeSeason(def: any): BaseSpriteSeasonChoice {
            if (def.Rotations) {
                return {
                    rotations: makeRotations(def),
                    season: def.Season
                }
            }
            return {
                base: makeBaseSpriteRef(def),
                season: def.Season
            }
        }

        function makeSeasons(def: any): Array<BaseSpriteSeasonChoice> {
            let seasons: Array<BaseSpriteSeasonChoice> = []
            for (let sdef of def.Seasons) {
                seasons.push(makeSeason(sdef))
            }
            return seasons
        }

        function makeCombine(def: any): CombineInfo {

            let items = []
            let baseSprites = false

            for (let cdef of def.Combine) {
                let base: BaseSpriteRef
                let sprite: SpriteInfo
                let tint = def.Tint
                let offset = parseOffset(def.Offset)
                if (cdef.Sprite) {
                    sprite = getSprite(cdef.Sprite)
                    if (!sprite) {
                        sprite = cdef.Sprite
                    }
                }
                if (cdef.BaseSprite) {
                    baseSprites = true
                    base = makeBaseSpriteRef(cdef)
                }
                items.push({
                    base,
                    sprite,
                    tint,
                    offset
                })
            }

            let rv : CombineInfo = {
                items,
                img:undefined
            }

            if(baseSprites) {
                makeCombinedSprite(rv)
            }
        
            return rv
        }

        function makeRandom(def:any) : RandomSprite {
            let base : BaseSpriteRef
            let sprite : SpriteInfo
            let weight = def.Weight

            if(def.BaseSprite) {
                base = makeBaseSpriteRef(def)
            }
            else if(def.Sprite) {
                sprite = getSprite(def.Sprite)
                if(!sprite) {
                    sprite = def.Sprite
                }
            }

            return {
                base,
                sprite,
                weight
            }
        }

        function makeRandomArray(def: any): Array<RandomSprite> {
            let random: Array<RandomSprite> = []
            for (let rdef of def.Random) {
                random.push(makeRandom(rdef))
            }
            return random
        }

        function makeIntermediateSprite(def:any) : IntermediateSprite {
            return {
                base : makeBaseSpriteRef(def),
                percent : def.Percent
            }
        }

        function makeIntermediateSprites(def:any) : Array<IntermediateSprite> {
            let intermediate = []
            for(let idef of def.IntermediateSprites) {
                intermediate.push(makeIntermediateSprite(idef))
            }
            return intermediate
        }

        function makeSpriteByMaterial(def:any) : SpriteByMaterialType {
            let materialType = def.MaterialType
            let sprite : SpriteInfo
            let base : BaseSpriteRef
            let rotations : Array<BaseSpriteRotation>
            let intermediate : Array<IntermediateSprite>

            if(def.Sprite) {
                sprite = getSprite(def.Sprite)
                if (!sprite) {
                    sprite = def.Sprite
                }
            }
            else if(def.BaseSprite) {
                base = makeBaseSpriteRef(def)
            }
            else if(def.IntermediateSprites) {
                intermediate = makeIntermediateSprites(def)
            }
            else if(def.Rotations) {
                rotations = makeRotations(def)
            }
            return {
                materialType,
                sprite,
                base,
                intermediate,
                rotations
            }
        }

        function makeSpriteByMaterialTypeArray(def:any) : Array<SpriteByMaterialType> {
            let sprites = []
            for(let sdef of def.ByMaterialTypes) {
                sprites.push(makeSpriteByMaterial(sdef))
            }
            return sprites
        }

        function makeFrames(def:any) : Array<BaseSpriteRef> {
            let frames = []
            for(let fdef of def.Frames) {
                frames.push(makeBaseSpriteRef(fdef))
            }
            return frames
        }

        function prepareSpriteBatch() {
            while (idx < tbl.length) {
                let spriteDef = tbl[idx]
                let offset = parseOffset(spriteDef.Offset)
                let anim = spriteDef.Anim
                let base: BaseSpriteRef
                let rotations: Array<BaseSpriteRotation>;
                let seasons: Array<BaseSpriteSeasonChoice>;
                let random: Array<RandomSprite>
                let combine: CombineInfo
                let byMaterial : Array<SpriteByMaterialType>
                let frames : Array<BaseSpriteRef>
                let tint = spriteDef.tint

                try{

                    if (spriteDef.Rotations) {
                        rotations = makeRotations(spriteDef)
                    }
                    else if (spriteDef.Seasons) {
                        seasons = makeSeasons(spriteDef)
                    }
                    else if (spriteDef.Combine) {
                        combine = makeCombine(spriteDef)
                    }
                    else if (spriteDef.Random) {
                        random = makeRandomArray(spriteDef)
                    }
                    else if (spriteDef.ByMaterialTypes) {
                        byMaterial = makeSpriteByMaterialTypeArray(spriteDef)
                    }
                    else if (spriteDef.Frames) {
                        frames = makeFrames(spriteDef)
                    }
                    else {
                        if (spriteDef.BaseSprite) {
                            base = makeBaseSpriteRef(spriteDef)
                        }
                        else {
                            base = {
                                info: getBaseSprite(spriteDef.ID),
                                ID: spriteDef.ID
                            }
                        }
                        if(!base.info) {
                            console.log(`Failed to make base sprite ref for ${base.ID}`)
                        }
                    }

                    let img: HTMLImageElement

                    if (base) {
                        img = base.info.img
                    }
                    else if (rotations) {
                        img = getRotationImg(rotations[0])
                    }
                    else if(combine) {
                        img = combine.img
                    }
                    else if(random) {
                        let ridx = Math.floor(Math.random()*random.length)
                        if (typeof (random[ridx]) !== 'string') {
                            img = getRandomSpriteImg(random)
                        }
                    }
                    else if(byMaterial) {
                        let m0 = byMaterial[0]
                        if(m0.sprite) {
                            img = typeof(m0.sprite)!=='string'?m0.sprite.img:undefined
                        }
                        else if(m0.base) {
                            img = m0.base.info.img
                        }
                        else if(m0.intermediate) {
                            img = m0.intermediate[0].base.info.img
                        }
                        else {
                            img = getRotationImg(m0.rotations[0])
                        }
                    }
                    else if(seasons) {
                        img=getSeasonImg(seasons)
                    }
                    else if(frames) {
                        img = frames[0].info.img
                    }

                    let id = spriteDef.ID as string

                    if(!img) {
                        console.log(`Failed to make img for id=${id}`)
                    }

                    sprites[id] = {
                        id,
                        base,
                        offset,
                        tint,
                        anim,
                        img,
                        rotations,
                        seasons,
                        byMaterial,
                        combine,
                        frames,
                        random,
                        filename: spriteDef._filename
                    }
                }catch(e) {
                    console.log('failed:', spriteDef, e)
                }
                ++idx
                if ((idx % 200) == 0) {
                    break
                }
            }
            if (idx < tbl.length) {
                progressReporter('Preparing sprites', idx, false)
                setTimeout(prepareSpriteBatch, 5);
            }
            else {
                fixDelayedSpriteRef()
                progressReporter('Complete', 0, true)
            }
        }
        setTimeout(prepareSpriteBatch, 5);
    }

    function getRandomSpriteImg(random:Array<RandomSprite>) {
        let imgs = random.filter(item=>(item.base && item.base.info) || (item.sprite && item.sprite.img))
        if(imgs.length) {
            let img = imgs[Math.floor(Math.random()*imgs.length)]
            if(img.base)return img.base.info.img
            return img.sprite.img
        }
    }

    function makeCombinedSprite(combine:CombineInfo) {
        let imgs = []
        let offsets = []
    
        for (let item of combine.items) {
            offsets.push(item.offset)
            if (item.base) {
                imgs.push(item.base.info.img)
            }
            if (item.sprite) {
                if (typeof (item.sprite) === 'string') {
                    let sprite = getSprite(item.sprite)
                    if(sprite) {
                        item.sprite = sprite
                    }
                    else {
                        console.log(`Sprite ${item.sprite} not found?`)
                        return
                    }
                }
                if(!item.sprite.img) {
                    fixDelayedSpriteRefForSprite(item.sprite.id, item.sprite)
                    if(!item.sprite.img) {
                        console.warn(`${item.sprite.id} have no image on delayed combine`)
                    }
                }
                if(!item.offset && item.sprite.offset) {
                    offsets[offsets.length-1] = item.sprite.offset
                }
                imgs.push(item.sprite.img)
            }
        }
        let w = 1, h = 1
        for (let i = 0; i < imgs.length; ++i) {
            if(!imgs[i]) {
                continue;
            }
            let ww = imgs[i].width
            let hh = imgs[i].height
            if (offsets[i]) {
                let { x, y } = offsets[i]
                ww += x
                hh += y
            }
            w = Math.max(w, ww)
            h = Math.max(h, hh)
        }

        let canvas = document.createElement('canvas')
        canvas.width=w
        canvas.height=h
        let ctx = canvas.getContext('2d')
        for (let i = 0; i < imgs.length; ++i) {
            if(!imgs[i]) {
                continue
            }
            let {x,y} = offsets[i]?offsets[i]:{x:0,y:0}
            ctx.drawImage(imgs[i], x, y)
        }
        
        let img = new Image
        img.src = canvas.toDataURL('image/png')
        combine.img = img
    }

    function fixDelayedSpriteRefForSprite(ID:string, sprite:SpriteInfo) {
        if(sprite.combine) {
            if(!sprite.combine.img) {
                console.log(`Fixing combine sprite for ${ID}`)
                makeCombinedSprite(sprite.combine)
                sprite.img = sprite.combine.img
            }
        }
        if (sprite.byMaterial) {
            for (let bm of sprite.byMaterial) {
                if (bm.sprite && typeof (bm.sprite) === 'string') {
                    bm.sprite = getSprite(bm.sprite)
                }
            }
            if(!sprite.img) {
                sprite.img = sprite.byMaterial[0].sprite.img
            }
        }
        if(sprite.random) {
            console.log(`About to fix random sprite ${ID}`)
            for(let i =0; i<sprite.random.length;++i) {
                if(typeof(sprite.random[i].sprite)==='string') {
                    let id : any = sprite.random[i].sprite
                    console.log(`Fixing random sprite ${ID} - ${id}`)
                    sprite.random[i].sprite = getSprite(id)
                }
            }
            if(!sprite.img) {
                sprite.img = getRandomSpriteImg(sprite.random)
            }
        }
}

    function fixDelayedSpriteRef() {
        for(let ID of Object.keys(sprites)) {
            let sprite = sprites[ID]
            fixDelayedSpriteRefForSprite(ID, sprite)
        }
    }
}

export function getImage(defFile: string) {
    return images[defFile]
}

function getFileNameFromURL(url: string) {
    return url.substr(url.lastIndexOf('/') + 1)
}

export function getImageFile(defFile: string) {
    return getFileNameFromURL(images[defFile].src)
}

export function getBaseSpriteList() {
    return Object.keys(baseSprites).sort()
}

export function getBaseSprite(id: string) {
    return baseSprites[id]
}

export function getBaseSpriteImgURL(id: string) {
    let baseSprite = getBaseSprite(id)
    if(baseSprite) {
        return baseSprite.img.src
    }
    return ''
}

export function getBaseSpriteImageFile(sprite: BaseSpriteInfo) {
    return getFileNameFromURL(getImage(sprite.file).src)
}

export function getFileList() {
    return Object.keys(images).sort()
}

export function addSpriteDefinition(defFile: string, id: string, rect: Rect) {
    baseSprites[id] = {
        img: makeSpriteImage(defFile, rect),
        rect,
        file: defFile
    }
}

export function updateSpriteDefinition(id: string, rect: Rect) {
    let sprite = baseSprites[id]
    sprite.rect = { ...rect }
    sprite.img = makeSpriteImage(sprite.file, rect)
}

export function getSprite(id: string) {
    return sprites[id]
}

export function getSpriteList() {
    return Object.keys(sprites).sort()
}
