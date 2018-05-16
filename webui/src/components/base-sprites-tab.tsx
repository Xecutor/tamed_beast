import * as React from "react";
import * as ReactDOM from "react-dom";

import {List, Button, Grid, Label, Input, Dropdown} from 'semantic-ui-react'

import {
    addSpriteDefinition,
    getBaseSprite,
    getImageFile,
    getBaseSpriteList,
    getImage,
    getFileList,
    getBaseSpriteImageFile,
    updateSpriteDefinition} from '../utils/sprites-loader'

import {Rect, mkRect, rectToString, parseRect} from '../utils/rect'
import { jsonrpcCall } from "../utils/jsonrpc";

enum BaseSpriteMode{
    view,
    edit,
    insert,
}

interface BaseSpriteTabState{
    filter:string
    selectedId:string
    displayedImgDef:string
    mode:BaseSpriteMode

    editId:string,
    editDef:string,
    editRect:Rect
    editModified:boolean
}

interface BaseSpriteTabProps{

}

export class BaseSpritesTab extends React.Component<BaseSpriteTabProps, BaseSpriteTabState>{
    canvas:HTMLCanvasElement
    constructor(props:any) {
        super(props)
        this.state={
            filter:'',
            selectedId:'',
            displayedImgDef:'',
            mode:BaseSpriteMode.view,

            editId:'',
            editDef:'',
            editRect:{x:0, y:0, w:32, h:32},
            editModified:false
        }
    }
    
    storeCanvas(canvas:HTMLCanvasElement) {
        this.canvas = canvas
    }

    onSpriteClick(id:string) {
        if (this.state.mode == BaseSpriteMode.insert ||
            (this.state.mode == BaseSpriteMode.edit && this.state.editModified)) {
            return;
        }
        let spriteInfo = getBaseSprite(id)
        let image = getImage(spriteInfo.file)
        this.updateCanvas(image, [spriteInfo.rect])
        this.setState({selectedId:id, displayedImgDef:spriteInfo.file})
    }

    updateCanvas(image:HTMLImageElement, rects?:Rect[], clr?:string) {
        this.canvas.width=image.width
        this.canvas.height=image.height
        let ctx = this.canvas.getContext('2d')
        ctx.drawImage(image, 0, 0)
        if (rects) {
            ctx.save()
            for(let rect of rects) {
                ctx.fillStyle = clr?clr:'rgba(0, 0, 0, 0.3)'
                ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
            }
            ctx.restore()
        }
    }
    
    onFilterChange(filter:string) {
        this.setState({filter})
    }

    onCanvasClick(evt:React.MouseEvent<HTMLCanvasElement>) {
        let br = this.canvas.getBoundingClientRect()
        let cx = (evt.clientX-br.left) * this.canvas.width/br.width
        let cy = (evt.clientY-br.top) * this.canvas.height/br.height
        console.log(`cx=${cx}, cy=${cy}`)
        if (this.state.mode == BaseSpriteMode.view) {
            const file = this.state.displayedImgDef
            let sprites = getBaseSpriteList()
            for (let id of sprites) {
                const tile = getBaseSprite(id)
                if (tile.file != file) {
                    continue
                }
                let { x, y, w, h } = tile.rect
                if (cx >= x && cy >= y && cx <= x + w && cy <= y + h) {
                    this.onSpriteClick(id)
                    break
                }
            }
        }
        else {
            let file = this.state.editDef
            if(file===undefined) {
                return
            }
            let tiles = getBaseSpriteList()
            let er = {x:Math.floor(cx/32)*32, y:Math.floor(cy/32)*32, w:32, h:32}
            for (let id of tiles) {
                let tile = getBaseSprite(id)
                if (tile.file != file) {
                    continue
                }
                let { x, y, w, h } = tile.rect
                if (cx >= x && cx <= x + w) {
                    er.x = x
                    er.w = w
                }
                if (cy >= y && cy <= y + h) {
                    er.y = y;
                    er.h = h
                }
            }
            console.log(er)
            this.setState({editRect:er})
            this.updateCanvas(getImage(file), [er])
        }
    }

    switchToEditMode() {
        let sprite = getBaseSprite(this.state.selectedId)
        this.setState({
            mode:BaseSpriteMode.edit,
            editId:this.state.selectedId,
            editDef:sprite.file,
            editRect:sprite.rect,
        })
    }

    switchToInsertMode() {
        let defFile = ''
        if(this.state.displayedImgDef.length) {
            defFile = this.state.displayedImgDef
        }
        let rect = mkRect(0,0,32,32)
        this.setState({
            mode:BaseSpriteMode.insert,
            editId:'',
            editDef:defFile,
            editRect:rect
        })
        if (defFile) {
            this.updateCanvas(getImage(defFile), [rect])
        }
    }

    cancelEditMode() {
        this.setState({mode:BaseSpriteMode.view, editModified:false})
    }

    onDefFileChange(file:string) {
        this.setState({editDef:file, displayedImgDef:file, editModified:true})
        this.updateCanvas(getImage(file))
    }

    onXChange(value:string) {
        let {x,y,w,h} = this.state.editRect
        x = parseInt(value)
        this.updateEditRect({x,y,w,h})
    }

    onYChange(value:string) {
        let {x,y,w,h} = this.state.editRect
        y = parseInt(value)
        this.updateEditRect({x,y,w,h})
    }
    
    onWChange(value:string) {
        let {x,y,w,h} = this.state.editRect
        w = parseInt(value)
        this.updateEditRect({x,y,w,h})
    }

    onHChange(value:string) {
        let {x,y,w,h} = this.state.editRect
        h = parseInt(value)
        this.updateEditRect({x,y,w,h})
    }
    
    updateEditRect(rect:Rect) {
        this.setState({editRect:rect, editModified:true})
        this.updateCanvas(getImage(this.state.editDef), [rect])
    }

    onEditIdChange(value:string) {
        this.setState({editId:value, editModified:true})
    }

    saveChanges() {
        const id = this.state.editId
        const defFile = this.state.editDef
        const rect = {...this.state.editRect}
        if(this.state.mode==BaseSpriteMode.edit) {
            jsonrpcCall("update",{
                _filename:defFile, 
                object:{
                    ID:id,
                    SourceRectangle:rectToString(this.state.editRect)
                }}).then(()=>{
                    updateSpriteDefinition(id, rect)
                    this.setState({mode:BaseSpriteMode.view, selectedId:id})
                });
        }
        else {
            jsonrpcCall("insert",{
                _filename:defFile, 
                object:{
                    ID:id,
                    SourceRectangle:rectToString(this.state.editRect)
                }}).then(()=>{
                    addSpriteDefinition(defFile, id, rect)
                    this.setState({mode:BaseSpriteMode.view, selectedId:id})
                });
        }
    }

    markAssigned() {
        const file = this.state.displayedImgDef
        const image = getImage(file)
        let allSprites = getBaseSpriteList()
        let duplicate : {[key:string]:boolean}={}
        let rects = []
        for (let id of allSprites) {
            let sprite = getBaseSprite(id)
            if (sprite.file != file) {
                continue;
            }
            if(duplicate[rectToString(sprite.rect)]) {
                continue
            }
            duplicate[rectToString(sprite.rect)] = true
            rects.push(sprite.rect)
        }

        this.updateCanvas(image, rects, 'rgba(0, 0, 230, 0.3)')
    }

    canSave() {
        return this.state.editId.length > 0 &&
            (
                (this.state.mode == BaseSpriteMode.edit && this.state.editModified) || 
                (this.state.mode == BaseSpriteMode.insert && getBaseSprite(this.state.editId) === undefined)
            )
    }

    makeFileListOptions(sel:string) {
        return getFileList().map(file=>{
            let short = file.substr(file.indexOf('/') + 1)
            short = short.substr(0, short.indexOf('.'))
            return {
                text:short,
                value:file,
                selected:file==sel
            }
        })    
    }

    changeTileSheet(fileDef:string) {
        this.setState({displayedImgDef:fileDef, selectedId:''})
        this.updateCanvas(getImage(fileDef))
    }

    render() {
        let spriteList : string[] = []
        let id = this.state.mode==BaseSpriteMode.view?this.state.selectedId:this.state.editId
        let defFile = this.state.displayedImgDef
        let spriteFile = defFile ? getImageFile(defFile) : ''
        let rect
        if(id.length && this.state.mode==BaseSpriteMode.view) {
            let sprite = getBaseSprite(id)
            rect = sprite.rect
        }
        else {
            rect = this.state.editRect
        }

        if(this.state.filter.length) {
            let flt=this.state.filter.toUpperCase()
            spriteList = getBaseSpriteList().filter(val=>val.toUpperCase().indexOf(flt)!=-1)
        }

        let middleColumn;
        if(this.state.mode==BaseSpriteMode.view) {
            middleColumn=<div>
                <Button disabled={this.state.selectedId.length==0} onClick={()=>this.switchToEditMode()}>Edit</Button>
                <Button onClick={()=>this.switchToInsertMode()}>Insert</Button><br/>
                ID:{id}<br/>
                Def file:{defFile}<br/>
                Img file:{spriteFile}<br/>
                Rect:{rectToString(rect)}
            </div>
        }
        else {
            let filesOptions=this.makeFileListOptions(this.state.editDef)
            middleColumn=<div>
                ID:{
                    this.state.mode==BaseSpriteMode.edit?id:<Input onChange={(e,{value})=>this.onEditIdChange(value)}value={id}/>
                }<br/>
                Def file:{
                    this.state.mode==BaseSpriteMode.edit?
                    defFile:
                    <Dropdown options={filesOptions} value={this.state.editDef} onChange={(e,{value})=>this.onDefFileChange(value as string)}/>}<br/>
                Img file:{spriteFile}<br/>
                Rect:<br/>
                <Grid verticalAlign='middle'>
                    <Grid.Row>
                        <Grid.Column>
                            X:
                        </Grid.Column>
                        <Grid.Column>
                            <Input type='number' onChange={(e, {value})=>this.onXChange(value)} value={rect.x}/><br/>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column>
                            Y:
                        </Grid.Column>
                        <Grid.Column>
                            <Input type='number' onChange={(e, {value})=>this.onYChange(value)} value={rect.y}/><br/>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column>
                            W:
                        </Grid.Column>
                        <Grid.Column>
                            <Input type='number' onChange={(e, {value})=>this.onWChange(value)} value={rect.w}/><br/>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column>
                            H:
                        </Grid.Column>
                        <Grid.Column>
                            <Input type='number' onChange={(e, {value})=>this.onHChange(value)} value={rect.h}/><br/>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <Button disabled={!this.canSave()} onClick={()=>this.saveChanges()}>Save</Button><Button onClick={()=>this.cancelEditMode()}>Cancel</Button>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        }

        return <div>
            <Grid columns={3}>
                <Grid.Row>
                    <Grid.Column width={3}>
                        <Input icon='search' onChange={(e,{value})=>this.onFilterChange(value)}/><br/>
                        <List>
                            {spriteList.map(id=><List.Item key={id} as='a' image={getBaseSprite(id).img.src} content={id} onClick={()=>this.onSpriteClick(id)}/>)}
                        </List>
                    </Grid.Column>
                    <Grid.Column width={3}>
                        {middleColumn}
                    </Grid.Column>
                    <Grid.Column floated={'left'}>
                        <Button disabled={this.state.displayedImgDef.length==0} onClick={()=>this.markAssigned()}>Mark assigned</Button>
                        <Dropdown disabled={this.state.mode!=BaseSpriteMode.view} options={this.makeFileListOptions(this.state.displayedImgDef)} onChange={(e,{value})=>this.changeTileSheet(value as string)}/>
                        <br/>
                        <canvas onClick={(evt)=>this.onCanvasClick(evt)} ref={(canvas=>this.storeCanvas(canvas))}/>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </div>
    }
}
