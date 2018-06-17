import * as React from "react";
import {Label, Popup} from 'semantic-ui-react'

import {FieldDef, TypeDef, dbScheme} from '../database/scheme'
import {TableView} from './table-view'
import {getSprite} from '../utils/sprites-loader'
import { parseColor } from "../utils/color";
import { jsonrpcCall } from "../utils/jsonrpc";

interface StringRendererProps {
    value:string
}

export class StringRenderer extends React.Component<StringRendererProps,any> {
    render() {
        return <span style={{display:'inline-block'}}>{this.props.value}&nbsp;</span>
    }
}

interface TableRefRendererProps{
    table:string
    id:string
}

interface TableRefRendererState{
    record:any[]
}

export class TableRefRenderer extends React.Component<TableRefRendererProps,TableRefRendererState> {
    constructor(props:TableRefRendererProps) {
        super(props)
        this.state={
            record:[]
        }
    }
    onPopupOpen() {
        jsonrpcCall('select', {table:this.props.table, ID:this.props.id}).then((record:any)=>{
            this.setState({record})
        })
    }
    render() {
        let trigger = <Label as='a'>{this.props.table} - {this.props.id}</Label>
        return <Popup
            key={this.props.id}
            trigger={trigger}
            hoverable
            basic
            flowing
            onOpen={()=>this.onPopupOpen()}
            hideOnScroll={false}
            on='click'
            position='bottom center'>
            <Popup.Content>
                <TableView table={this.state.record} tableDef={dbScheme[this.props.table]}/>
            </Popup.Content>
        </Popup>

    }
}

interface ColorRendererProps{
    value:string
}

export class ColorRenderer extends React.Component<ColorRendererProps,any> {
    render() {
        let clr = parseColor(this.props.value)
        let style={
            width:'16px',
            height:'16px',
            display: 'inline-block',
            backgroundColor:clr
        }
        return <span><span style={style}>&nbsp;</span><span>{this.props.value}</span></span>
    }
}

interface NestedTableRendererProps{
    typeDef:Array<FieldDef>
    table:Array<any>
}

export class NestedTableRenderer extends React.Component<NestedTableRendererProps,any> {
    render() {
        //console.log('nestedtable',this.props.table)
        return <TableView collapsable={true} initiallyCollapsed={true} table={this.props.table} tableDef={this.props.typeDef}/>
    }
}

interface SpriteRendererProps{
    id:string
}

export class SpriteRenderer extends React.Component<SpriteRendererProps,any> {
    render() {
        let sprite = getSprite(this.props.id)
        if(sprite && sprite.img) {
            return <Label image><img src={sprite.img.src}/>{this.props.id}</Label>
        }
        else {
            return <Label icon='question' content={this.props.id}/>
        }
    }
}
