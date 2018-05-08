import * as React from "react";
import {Label} from 'semantic-ui-react'

import {FieldDef, TypeDef} from '../database/scheme'
import {TableView} from './table-view'
import {getTile} from '../utils/tiles-loader'

interface StringRendererProps {
    value:string
}

export class StringRenderer extends React.Component<StringRendererProps,any> {
    render() {
        return <span style={{display:'inline-block'}}>{this.props.value}&nbsp;</span>
    }
}

interface TableRefRendererProps{
    id:string
}

export class TableRefRenderer extends React.Component<TableRefRendererProps,any> {
    render() {
        return <Label>{this.props.id}</Label>
    }
}

interface ColorRendererProps{
    value:string
}

export class ColorRenderer extends React.Component<ColorRendererProps,any> {
    render() {
        let clr=this.props.value;
        if (clr.substr(0, 1) != '#') {
            let [r, g, b, a] = this.props.value.split(' ').map(v => parseInt(v))
            clr = `rgba(${r}, ${g}, ${b}, ${a})`
        }
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
        console.log('nestedtable',this.props.table)
        return <TableView table={this.props.table} tableDef={this.props.typeDef}/>
    }
}

interface TileRendererProps{
    id:string
}

export class TileRenderer extends React.Component<TileRendererProps,any> {
    render() {
        let tile = getTile(this.props.id)
        if(tile!==undefined) {
            return <Label image={true}><img src={tile.img.src}/>{this.props.id}</Label>
        }
        else {
            return <Label icon='question'>{this.props.id}</Label>
        }
    }
}