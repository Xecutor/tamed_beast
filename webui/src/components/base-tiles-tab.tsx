import * as React from "react";
import * as ReactDOM from "react-dom";

import {Button, Grid, Label, Input, Dropdown} from 'semantic-ui-react'

import {getTile, getTilesList, getImage, getFileList, getTileImageFile} from '../utils/tiles-loader'

import {Rect, mkRect, rectToString, parseRect} from '../utils/rect'

enum TileMode{
    view,
    edit,
    insert,
}

interface BaseTilesTabState{
    filter:string
    selected:string
    mode:TileMode

    editId:string,
    editDef:string,
    editImg:string,
    editRect:{x:number, y:number, w:number, h:number}
    editModified:boolean
}

interface BaseTilesTabProps{

}

export class BaseTilesTab extends React.Component<BaseTilesTabProps, BaseTilesTabState>{
    canvas:HTMLCanvasElement
    constructor(props:any) {
        super(props)
        this.state={
            filter:'',
            selected:'',
            mode:TileMode.view,

            editId:'',
            editDef:'',
            editImg:'',
            editRect:{x:0, y:0, w:32, h:32},
            editModified:false
        }
    }
    
    storeCanvas(canvas:HTMLCanvasElement) {
        this.canvas = canvas
    }

    onTileClick(id:string) {
        if (this.state.mode == TileMode.insert ||
            (this.state.mode == TileMode.edit && this.state.editModified)) {
            return;
        }
        let tileInfo = getTile(id)
        let image = getImage(tileInfo.file)
        this.updateCanvas(image, tileInfo.rect)
        this.setState({selected:id})
    }

    updateCanvas(image:HTMLImageElement, rect?:Rect) {
        this.canvas.width=image.width
        this.canvas.height=image.height
        let ctx = this.canvas.getContext('2d')
        ctx.drawImage(image, 0, 0)
        if (rect) {
            ctx.save()
            ctx.fillStyle = 'rgba(0.5, 0.5, 1, 0.3)'
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
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
        if (this.state.mode == TileMode.view) {
            let file = getTile(this.state.selected).file
            let tiles = getTilesList()
            for (let id of tiles) {
                let tile = getTile(id)
                if (tile.file != file) {
                    continue
                }
                let { x, y, w, h } = tile.rect
                if (cx >= x && cy >= y && cx <= x + w && cy <= y + h) {
                    this.onTileClick(id)
                    break
                }
            }
        }
        else {
            let file = this.state.editDef
            if(file===undefined) {
                return
            }
            let tiles = getTilesList()
            let er = {x:Math.floor(cx/32)*32, y:Math.floor(cy/32)*32, w:32, h:32}
            for (let id of tiles) {
                let tile = getTile(id)
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
            this.updateCanvas(getImage(file), er)
        }
    }

    switchToEditMode() {
        let tile = getTile(this.state.selected)
        this.setState({
            mode:TileMode.edit,
            editId:this.state.selected,
            editDef:tile.file,
            editRect:tile.rect,
            editImg:getTileImageFile(tile)
        })
    }

    switchToInsertMode() {
        let defFile = ''
        let imgFile = ''
        if(this.state.selected) {
            let tile = getTile(this.state.selected)
            defFile = tile.file
            imgFile = getTileImageFile(tile)
        }
        this.setState({
            mode:TileMode.insert,
            editId:'',
            editDef:defFile,
            editImg:imgFile,
            editRect:mkRect(0,0,32,32)
        })
    }

    cancelEditMode() {
        this.setState({mode:TileMode.view})
    }

    onDefFileChange(file:string) {
        this.setState({editDef:file, editModified:true})
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
        this.updateCanvas(getImage(this.state.editDef), rect)
    }

    onEditIdChange(value:string) {
        this.setState({editId:value, editModified:true})
    }

    render() {
        let tileList : string[] = []
        let id = this.state.mode==TileMode.view?this.state.selected:this.state.editId
        let defFile
        let tileFile
        let rect
        if(id.length && this.state.mode==TileMode.view) {
            let tile = getTile(id)
            defFile = tile.file
            tileFile = getTileImageFile(tile)
            rect = tile.rect
        }
        else {
            defFile = this.state.editDef
            tileFile = this.state.editImg
            rect = this.state.editRect
        }

        if(this.state.filter.length) {
            let flt=this.state.filter.toUpperCase()
            tileList = getTilesList().filter(val=>val.toUpperCase().indexOf(flt)!=-1)
        }

        let middleColumn;
        if(this.state.mode==TileMode.view) {
            middleColumn=<div>
                <Button disabled={this.state.selected.length==0} onClick={()=>this.switchToEditMode()}>Edit</Button>
                <Button onClick={()=>this.switchToInsertMode()}>Insert</Button><br/>
                ID:{id}<br/>
                Def file:{defFile}<br/>
                Img file:{tileFile}<br/>
                Rect:{rectToString(rect)}
            </div>
        }
        else {
            let filesOptions=getFileList().map(file=>{
                return {
                    text:file,
                    value:file,
                    selected:file==this.state.editDef
                }
            })
            middleColumn=<div>
                ID:<Input onChange={(e,{value})=>this.onEditIdChange(value)}value={id}/><br/>
                Def file:{this.state.mode==TileMode.edit?defFile:<Dropdown options={filesOptions} onChange={(e,{value})=>this.onDefFileChange(value as string)}/>}<br/>
                Img file:{tileFile}<br/>
                Rect:<br/>
                X:<Input type='number' onChange={(e, {value})=>this.onXChange(value)} value={rect.x}/><br/>
                Y:<Input type='number' onChange={(e, {value})=>this.onYChange(value)} value={rect.y}/><br/>
                W:<Input type='number' onChange={(e, {value})=>this.onWChange(value)} value={rect.w}/><br/>
                H:<Input type='number' onChange={(e, {value})=>this.onHChange(value)} value={rect.h}/><br/>
                <Button>Save</Button><Button onClick={()=>this.cancelEditMode()}>Cancel</Button>
            </div>
        }

        return <div>
            <Grid columns={3}>
                <Grid.Row>
                    <Grid.Column width={3}>
                        <Input icon='search' onChange={(e,{value})=>this.onFilterChange(value)}/><br/>
                        {tileList.map(id=><Label as='a' image={true} onClick={()=>this.onTileClick(id)}><img src={getTile(id).img.src}/>{id}</Label>)}
                    </Grid.Column>
                    <Grid.Column width={3}>
                        {middleColumn}
                    </Grid.Column>
                    <Grid.Column floated={'left'}>
                        <canvas onClick={(evt)=>this.onCanvasClick(evt)} ref={(canvas=>this.storeCanvas(canvas))}/>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </div>
    }
}
