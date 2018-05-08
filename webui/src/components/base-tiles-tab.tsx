import * as React from "react";
import * as ReactDOM from "react-dom";

import {Grid, Label, Input} from 'semantic-ui-react'

import {getTile, getTilesList, getImage} from '../utils/tiles-loader'

interface BaseTilesTabState{
    filter:string
    selected:string
}

interface BaseTilesTabProps{

}

export class BaseTilesTab extends React.Component<BaseTilesTabProps, BaseTilesTabState>{
    canvas:HTMLCanvasElement
    constructor(props:any) {
        super(props)
        this.state={
            filter:'',
            selected:''
        }
    }
    storeCanvas(canvas:HTMLCanvasElement) {
        this.canvas = canvas
    }
    onTileClick(id:string) {
        let tileInfo = getTile(id)
        let image = getImage(tileInfo.file)
        this.canvas.width=image.width
        this.canvas.height=image.height
        let ctx = this.canvas.getContext('2d')
        ctx.drawImage(image, 0, 0)
        ctx.save()
        ctx.fillStyle='rgba(0.5, 0.5, 1, 0.3)'
        ctx.fillRect(tileInfo.rect.x, tileInfo.rect.y, tileInfo.rect.w, tileInfo.rect.h)
        ctx.restore()
        this.setState({selected:id})
    }
    onFilterChange(filter:string) {
        this.setState({filter})
    }
    onCanvasClick(evt:React.MouseEvent<HTMLCanvasElement>) {
        let br = this.canvas.getBoundingClientRect()
        let cx = (evt.clientX-br.left) * this.canvas.width/br.width
        let cy = (evt.clientY-br.top) * this.canvas.height/br.height
        console.log(`cx=${cx}, cy=${cy}`)
        let file = getTile(this.state.selected).file
        let tiles = getTilesList()
        for(let id of tiles) {
            let tile = getTile(id)
            if(tile.file!=file) {
                continue
            }
            let {x,y,w,h} = tile.rect
            if(cx>=x && cy>=y && cx<=x+w && cy<=y+h) {
                this.onTileClick(id)
                break
            }
        }
    }
    render() {
        let tileList = getTilesList()
        let id = this.state.selected;
        let defFile;
        let tileFile;
        let rect;
        if(id.length) {
            let tile = getTile(id)
            defFile = tile.file
            tileFile = getImage(defFile).src
            let slash = tileFile.lastIndexOf('/')
            tileFile=tileFile.substr(slash + 1)
            let r = tile.rect
            rect = `${r.x} ${r.y} ${r.w} ${r.h}`
        }

        if(this.state.filter.length) {
            let flt=this.state.filter.toUpperCase()
            tileList = tileList.filter(val=>val.toUpperCase().indexOf(flt)!=-1)
        }

        return <div>
            <Grid columns={3}>
                <Grid.Row>
                    <Grid.Column>
                        <Input icon='search' onChange={(e,{value})=>this.onFilterChange(value)}/><br/>
                        {tileList.map(id=><Label as='a' image={true} onClick={()=>this.onTileClick(id)}><img src={getTile(id).img.src}/>{id}</Label>)}
                    </Grid.Column>
                    <Grid.Column width={3}>
                        ID:{id}<br/>
                        Def file:{defFile}<br/>
                        Img file:{tileFile}<br/>
                        Rect:{rect}
                    </Grid.Column>
                    <Grid.Column floated={'left'}>
                        <canvas onClick={(evt)=>this.onCanvasClick(evt)} ref={(canvas=>this.storeCanvas(canvas))}/>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </div>
    }
}
