import * as React from "react";
import { Checkbox, Grid, Label, List, Segment } from 'semantic-ui-react';
import { BaseSpriteRef, BaseSpriteRotation, CombineInfo, IntermediateSprite, SpriteInfo, getBaseSpriteImgURL, getSprite, getSpriteList, RandomSprite, BaseSpriteSeasonChoice, getSpriteImgURL } from "../utils/sprites-loader";
import { FilteredList } from './filtered-list';

import {offsetToString} from '../utils/offset';


interface SpritesTabState{
    inverted : boolean
    selectedId:string
}

interface SpritesTabProps{

}

function convertArrayToList<T>(arr:T[]) {
    return <List>
        {arr.map(item=><List.Item>{item}</List.Item>)}
    </List>
}

export class SpritesTab extends React.Component<SpritesTabProps, SpritesTabState>{
    constructor(props:any) {
        super(props)
        this.state = {
            inverted : true,
            selectedId:''
        }
    }
    onClick(selectedId:string) {
        this.setState({selectedId})
    }

    onInvertedChanged(inverted:boolean) {
        this.setState({inverted})
    }

    makeBaseSpriteDetails(base:BaseSpriteRef, effect?:string){
        let style = {}
        if(effect=='FlipHorizontal') {
            style = {
                filter:'FlipH',
                transform:'scaleX(-1)'
            }
            console.log('style=',style)
        }
        return <span>Base:<Label image><img style={style} src={getBaseSpriteImgURL(base.ID)}/>{base.ID}</Label></span>
        //<span><Image src={getBaseSprite(sprite.base.ID).img.src}/>{sprite.base.ID}</span>
    }

    makeIntermediateDetails(intArr:IntermediateSprite[]) {
        return <span>Intermediate:<List>{intArr.map(int=><List.Item>{int.percent}:{this.makeBaseSpriteDetails(int.base)}</List.Item>)}</List></span>
    }

    makeShortSpriteDetals(sprite:SpriteInfo) {
        return <span>Sprite:<Label image={getSpriteImgURL(sprite.id)} content={sprite.id}/></span>
    }

    makeCombineDetails(combine:CombineInfo) {
        let rv = [[<span>Combine:</span>]]
        for(let item of combine.items) {
            let details = [];
            if(item.base) {
                details.push(this.makeBaseSpriteDetails(item.base))
            }
            if(item.sprite) {
                details.push(this.makeShortSpriteDetals(item.sprite as SpriteInfo))
            }
            if(item.offset) {
                details.push(<span>Offset:{offsetToString(item.offset)}</span>)
            }
            if(item.tint) {
                details.push(<span>Tint:{item.tint}</span>)
            }
            rv.push(details)
        }
        return convertArrayToList(rv)
    }

    makeRotationsDetails(rots:BaseSpriteRotation[]) {
        let rv = [<span>Rotations:</span>]
        for(let rot of rots) {
            let detail;
            if(rot.base) {
                detail = this.makeBaseSpriteDetails(rot.base, rot.effect)
            }
            if(rot.combine) {
                detail = this.makeCombineDetails(rot.combine)
            }
            rv.push(<span>{detail},Rot:{rot.rotation}{rot.effect?<span>,Effect:{rot.effect}</span>:''}</span>)
        }
        return convertArrayToList(rv)
    }

    makeByMaterialTypeDetails(sprite:SpriteInfo) {
        let rv = [<span>By material type</span>]
        for(let item of sprite.byMaterial) {
            let detail
            if(item.base) {
                detail = this.makeBaseSpriteDetails(item.base)
            }
            else if(item.intermediate) {
                detail = this.makeIntermediateDetails(item.intermediate)
            }
            else if(item.rotations) {
                detail = <span>{this.makeRotationsDetails(item.rotations)}</span>
            }
            else if(item.sprite) {
                detail = this.makeShortSpriteDetals(item.sprite)
            }
            rv.push(<span>{detail},Material type:{item.materialType}</span>)
        }
        return convertArrayToList(rv)
    }

    makeRandomDetails(random:RandomSprite[]) {
        let rv = [<span>Random:</span>]
        for(let rs of random) {
            let detail
            if(rs.base) {
                detail = this.makeBaseSpriteDetails(rs.base)
            }else if(rs.sprite) {
                detail = this.makeShortSpriteDetals(rs.sprite)
            }
            rv.push(<span>{detail}, Weight:{rs.weight}</span>)
        }
        return convertArrayToList(rv)
    }

    makeSeasonsDetails(seasons:BaseSpriteSeasonChoice[]) {
        let rv = [<span>Seasons:</span>]
        for(let season of seasons) {
            let details
            if(season.base) {
                details=this.makeBaseSpriteDetails(season.base)
            } else {
                details=this.makeRotationsDetails(season.rotations)
            }
            rv.push(<span>{details} - {season.season}</span>)
        }
        return convertArrayToList(rv)
    }

    makeFrameDetails(frames:BaseSpriteRef[]) {
        let rv = [<span>Frames:</span>]
        for(let frame of frames) {
            rv.push(this.makeBaseSpriteDetails(frame))
        }
        return convertArrayToList(rv)
    }

    makeSpriteDetails(id:string) {
        let sprite = getSprite(id)
        if(sprite.base) {
            return this.makeBaseSpriteDetails(sprite.base)
        }
        if(sprite.byMaterial) {
            return this.makeByMaterialTypeDetails(sprite)
        }
        if(sprite.rotations) {
            return this.makeRotationsDetails(sprite.rotations)
        }
        if(sprite.combine) {
            return this.makeCombineDetails(sprite.combine)
        }
        if(sprite.random) {
            return this.makeRandomDetails(sprite.random)
        }
        if(sprite.seasons) {
            return this.makeSeasonsDetails(sprite.seasons)
        }
        if(sprite.frames) {
            return this.makeFrameDetails(sprite.frames)
        }
        return <span>Unknown</span>
    }

    render() {
        let spriteDetails

        if(this.state.selectedId) {
            spriteDetails = this.makeSpriteDetails(this.state.selectedId)
        }

        return <Grid columns={2}>
            <Grid.Row>
                <Grid.Column width={5}>
                    <Segment>
                        Inverted: <Checkbox checked={this.state.inverted} onChange={(e,{checked})=>this.onInvertedChanged(checked)}/>
                        <FilteredList
                            inverted={this.state.inverted}
                            data={getSpriteList()} 
                            filterItem={(id:string,flt:string)=>id.toUpperCase().indexOf(flt.toUpperCase())>=0}
                            getItemImageURL={(id:string)=>getSpriteImgURL(id)}
                            getItemText={(id:string)=>id}
                            onClick={id=>this.onClick(id)}
                            />
                    </Segment>
                </Grid.Column>
                <Grid.Column>
                    <Segment>
                        {spriteDetails}
                    </Segment>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    }
}
