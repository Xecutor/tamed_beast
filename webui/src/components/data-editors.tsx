import * as React from "react";

import {Form, Label} from 'semantic-ui-react'
import { TableView } from "./table-view";
import { FieldDef } from "../database/scheme";
import { getSprite, getSpriteImgURL } from "../utils/sprites-loader";

interface EditorProps<T> {
    name:string
    value:T
    onChange:(newValue:T)=>void
}

export class StringEditor extends React.Component<EditorProps<string>,any> {
    render() {
        return <Form.Input key={this.props.name} label={this.props.name} value={this.props.value} onChange={(e,{value})=>this.props.onChange(value)}/>
    }
}

export class NumberEditor extends React.Component<EditorProps<number>,any> {
    render() {
        return <Form.Input key={this.props.name} label={this.props.name}value={this.props.value} onChange={(e,{value})=>this.props.onChange(parseInt(value))}/>
    }
}

export class ColorEditor extends React.Component<EditorProps<string>,any> {
    render() {
        return <Form.Input key={this.props.name} label={this.props.name}value={this.props.value} onChange={(e,{value})=>this.props.onChange(value)}/>
    }
}

export class BoolEditor extends React.Component<EditorProps<boolean>,any> {
    render() {
        return <Form.Checkbox 
                indeterminate={typeof(this.props.value)==='undefined'}
                key={this.props.name}
                label={this.props.name}
                checked={this.props.value}
                onChange={(e,{checked})=>this.props.onChange(checked)}/>
    }
}

interface NestedTableEditorProps {
    name:string
    value:any[]
    tableDef:Array<FieldDef>
    onChange:(newValue:any[])=>void
}

export class NestedTableEditor extends React.Component<NestedTableEditorProps,any> {
    onUpdate(idx:number, record:any) {
        let updatedTable = [...this.props.value]
        updatedTable[idx] = record
        this.props.onChange(updatedTable)
    }
    render() {
        return <Form.Field key={this.props.name}>
            <label>{this.props.name}</label>
            <TableView editMode onUpdate={(idx:number, record:any)=>this.onUpdate(idx, record)} table={this.props.value} tableDef={this.props.tableDef} />
        </Form.Field>
    }
}

export class SpriteIDEditor extends React.Component<EditorProps<string>,any> {
    render() {
        console.log(this.props.value)
        let imgSrc = getSpriteImgURL(this.props.value)
        return <Form.Field key={this.props.name} label={this.props.name}>
            <img src={imgSrc}/>
        </Form.Field>
    }
}

