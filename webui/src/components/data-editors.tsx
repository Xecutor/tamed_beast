import * as React from "react";

import {Form, Popup, Label, Icon, Segment, Grid} from 'semantic-ui-react'
import { SketchPicker } from 'react-color'
import { TableView } from "./table-view";
import { FieldDef, TypeDef } from "../database/scheme";
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
        let value = this.props.value === undefined ? '' : this.props.value
        return <Form.Input key={this.props.name} label={this.props.name} value={value} onChange={(e,{value})=>this.props.onChange(value)}/>
    }
}

interface StringChoiceEditorProps extends EditorProps<string> {
    values:string[]
}

export class StringChoiceEditor extends React.Component<StringChoiceEditorProps,any> {
    render() {
        let options = this.props.values.map(value=>{return {
            key:value,
            text:value,
            value:value,
            selected:value==this.props.value
        }})
        options.splice(0, 0, {key:'<Undefined>', text:'<Undefined>', value:undefined, selected:this.props.value===undefined})
        return <Form.Select
             key={this.props.name} 
             label={this.props.name} 
             value={this.props.value} 
             options={options} onChange={(e,{value})=>this.props.onChange(value as string)}/>
    }
}

export class NumberEditor extends React.Component<EditorProps<number>,any> {
    render() {
        return <Form.Input key={this.props.name} label={this.props.name}value={this.props.value} onChange={(e,{value})=>this.props.onChange(parseInt(value))}/>
    }
}

interface ColorEditorProps extends EditorProps<string>{
    hexColor:boolean
}

export class ColorEditor extends React.Component<ColorEditorProps,any> {
    render() {
        let clr = parseColor(this.props.value)
        console.log(clr)
        let style={
            width:'16px',
            height:'16px',
            display: 'inline-block',
            backgroundColor:clr
        }
        let trigger
        let delIcon
        if(clr.length==0) {
            trigger = <Icon name='edit'/>
        }
        else {
            trigger = <span><span style={style}>&nbsp;</span>{this.props.value}</span>
            delIcon = <Icon name='delete' link circular color='red' onClick={()=>this.props.onChange(undefined)}/>
        }
        return <Form.Field key={this.props.name}>
                <label>{this.props.name}</label>
                <Popup
                    hoverable
                    flowing
                    on='click'
                    trigger={trigger}
                    position='right center'
                    content={
                        <SketchPicker 
                            disableAlpha={this.props.hexColor}
                            color={clr}
                            onChangeComplete={val=>this.props.onChange(colorToString(this.props.hexColor,val))}
                        />
                    }
                />
                {
                    delIcon
                }
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
    onInsert(record:any) {
        let updatedTable = this.props.value?[...this.props.value]:[]
        updatedTable.push(record)
        this.props.onChange(updatedTable)
    }
    onUpdate(idx:number, record:any) {
        let updatedTable = this.props.value?[...this.props.value]:[]
        updatedTable[idx] = record
        this.props.onChange(updatedTable)
    }
    onDelete(idx:number) {
        let updatedTable = [...this.props.value]
        updatedTable.splice(idx, 1)
        this.props.onChange(updatedTable)
    }
    render() {
        return <Form.Field key={this.props.name}>
            <label>{this.props.name}</label>
            <TableView editMode 
                onInsert={(record:any)=>this.onInsert(record)}
                onUpdate={(idx:number, record:any)=>this.onUpdate(idx, record)}
                onDelete={idx=>this.onDelete(idx)}
                table={this.props.value} 
                tableDef={this.props.tableDef} />
        </Form.Field>
    }
}

export class SpriteIDEditor extends React.Component<EditorProps<string>,any> {
    render() {
        console.log(this.props.value)
        let imgSrc = getSpriteImgURL(this.props.value)
        let trigger
        let delIcon
        if(imgSrc) {
            trigger = <span><img src={imgSrc}/>{this.props.value}</span>
            delIcon = <Icon name='delete' link circular color='red' onClick={()=>this.props.onChange(undefined)}/>
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
            {
                delIcon
            }
        </Form.Field>
    }
}

interface TableRefEditorProps extends EditorProps<string> {
    tableName:string
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
        let trigger 
        let delIcon
        if(this.props.value) {
            trigger = <Label as='a'>{this.props.tableName}:{this.props.value}</Label>
            delIcon = <Icon name='delete' link circular color='red' onClick={()=>this.props.onChange(undefined)}/>
        }
        else {
            trigger = <Label as='a'>{this.props.tableName}:{this.props.value}</Label>
            
        }
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
                {
                    delIcon
                }
        </Form.Field>
    }
}

interface ArrayEditorProps extends EditorProps<any[]> {
    type:TypeDef
    plainSingleItem?:boolean
}

export class ArrayEditor extends React.Component<ArrayEditorProps, any> {
    onItemChange(item:any, idx:number) {
        let newValue = this.props.value ? [...this.props.value] : []
        newValue[idx]=item
        this.props.onChange(this.props.plainSingleItem && newValue.length==1?newValue[0]:newValue)
    }

    onDeleteItem(idx:number) {
        let newValue = [...this.props.value]
        newValue.splice(idx, 1)
        this.props.onChange(newValue)
    }

    onAddItem() {
        let newValue = this.props.value ? [...this.props.value] : []
        newValue.push(undefined)
        console.log(newValue.length)
        this.props.onChange(newValue)
    }

    render() {
        let rv: any[] = []
        if(this.props.value) {
            let value = this.props.plainSingleItem && !(this.props.value instanceof Array) ? [this.props.value] : this.props.value
            rv = value.map((value,idx)=><Segment key={idx}><Grid columns={2}>
                <Grid.Row>
                    <Grid.Column width={10}>
                        {this.props.type.renderEditor(undefined, value, (newValue)=>this.onItemChange(newValue, idx))}
                    </Grid.Column>
                    <Grid.Column floated='right' width={1}>
                        <Icon floated='right' name="delete" link color='red' circular onClick={()=>this.onDeleteItem(idx)}/>
                    </Grid.Column>
                </Grid.Row>
            </Grid></Segment>)
        }
        rv.push(<Segment key='add'><Icon name="plus" link circular onClick={()=>this.onAddItem()}/></Segment>)
        return <Form.Field>
                <label>{this.props.name}</label>
                <Segment>{rv}</Segment>
            </Form.Field>
    }
}