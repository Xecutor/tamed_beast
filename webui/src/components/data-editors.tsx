import * as React from "react";

import {Form, Popup, Label, Icon} from 'semantic-ui-react'
import { SketchPicker } from 'react-color'
import { TableView } from "./table-view";
import { FieldDef } from "../database/scheme";
import { getSprite, getSpriteImgURL, getSpriteList } from "../utils/sprites-loader";
import { parseColor, colorToString, isHexColor } from "../utils/color";
import { FilteredList } from "./filtered-list";
import { caseInsensetiveFilter } from "../utils/string-util";
import { jsonrpcCall } from "../utils/jsonrpc";

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
        let clr = parseColor(this.props.value)
        let style={
            width:'16px',
            height:'16px',
            display: 'inline-block',
            backgroundColor:clr
        }
        return <Form.Field key={this.props.name}>
                <label>{this.props.name}</label>
                <Popup
                    hoverable
                    flowing
                    on='click'
                    trigger={<span><span style={style}>&nbsp;</span>{this.props.value}</span>}
                    position='right center'
                    content={<SketchPicker disableAlpha={isHexColor(clr)} color={clr} onChangeComplete={val=>this.props.onChange(colorToString(this.props.value,val))}/>}
                />
            </Form.Field>
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
        let trigger
        if(imgSrc) {
            trigger = <span><img src={imgSrc}/>{this.props.value}</span>
        }
        else {
            trigger = <Icon name='image'/>
        }

        return <Form.Field key={this.props.name}>
            <label>{this.props.name}</label>
            <Popup
                trigger={trigger}
                hoverable
                basic
                flowing
                hideOnScroll={false}
                on='click'
                position='right center'
                content={<FilteredList
                    data={getSpriteList()}
                    pageSize={5}
                    simple
                    filterItem={caseInsensetiveFilter}
                    getItemImageURL={(id:string)=>getSpriteImgURL(id)}
                    getItemText={(id:string)=>id}
                    onClick={id=>this.props.onChange(id)}
                    />}
                />
        </Form.Field>
    }
}

interface TableRefEditorProps {
    name:string
    value:string
    tableName:string
    onChange:(id:string)=>void
}

interface TableRefEditorState {
    ids:string[]
}

export class TableRefEditor extends React.Component<TableRefEditorProps, TableRefEditorState> {
    constructor(props:TableRefEditorProps){
        super(props)
        this.state = {
            ids : []
        }
    }

    onPopupOpen() {
        jsonrpcCall('select', {table:this.props.tableName}).then(table=>{
            let ids = table.map((item:any)=>item.ID)
            this.setState({ids})
        })
    }

    render() {
        let trigger = <Label as='a'>{this.props.tableName}:{this.props.value}</Label>
        return <Form.Field key={this.props.name}>
            <label>{this.props.name}</label>
            <Popup
                trigger={trigger}
                hoverable
                basic
                flowing
                onOpen={()=>this.onPopupOpen()}
                hideOnScroll={false}
                on='click'
                position='right center'
                content={<FilteredList
                    data={this.state.ids}
                    pageSize={5}
                    simple
                    filterItem={caseInsensetiveFilter}
                    getItemText={(id:string)=>id}
                    onClick={id=>this.props.onChange(id)}
                    />}
                />
        </Form.Field>
    }
}
