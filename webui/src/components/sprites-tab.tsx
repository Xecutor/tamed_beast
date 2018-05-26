import * as React from "react";
import * as ReactDOM from "react-dom";

import {Table} from 'semantic-ui-react'

import {FilteredList} from './filtered-list'
import { getSpriteList, getImageFile, getSprite } from "../utils/sprites-loader";

interface SpritesTabState{
    filter:string
}

interface SpritesTabProps{

}

function getSpriteURL(id:string)
{
    let sprite = getSprite(id)
    if(sprite.img) {
        return sprite.img.src
    }
    return ''
}

export class SpritesTab extends React.Component<SpritesTabProps, SpritesTabState>{
    constructor(props:any) {
        super(props)
    }
    onClick(id:string) {

    }
    render() {
        //let lst = get
        return <div>
            <FilteredList 
                data={getSpriteList()} 
                filterItem={(id:string,flt:string)=>id.toUpperCase().indexOf(flt.toUpperCase())>=0}
                getItemImageURL={(id:string)=>getSpriteURL(id)}
                getItemText={(id:string)=>id}
                onClick={id=>this.onClick(id)}
                />
        </div>
    }
}
