import * as React from "react";
import * as ReactDOM from "react-dom";

import {Icon, Table} from 'semantic-ui-react'
import {FieldDef, TypeDef} from '../database/scheme'

interface TableViewState{
    collapsed:boolean
}

interface TableViewProps{
    table:Array<any>
    tableDef?:Array<FieldDef>
    collapsable?:boolean
    initiallyCollapsed?:boolean
}

export class TableView extends React.Component<TableViewProps, TableViewState>{
    constructor(props:TableViewProps) {
        super(props)
        this.state={
            collapsed:props.collapsable && props.initiallyCollapsed
        }
    }

    renderItem(value: any, def?:TypeDef) {
        if (def && value!==undefined) {
            return def.renderValue(value)
        }
        return <span>{value===undefined?'':value.toString()}</span>
    }

    expandClick() {
        this.setState({collapsed:false})
    }

    collapseClick() {
        this.setState({collapsed:true})
    }
  
    render() {
        let names: string[] = []
        if (this.props.tableDef) {
            names = this.props.tableDef.map(td=>td.name)
        }
        else {
            if (this.props.table.length > 0) {
                for (let name in this.props.table[0]) {
                    names.push(name)
                }
            }
        }
    
        if(this.state.collapsed) {
            return <Icon circular size='tiny' name='plus' onClick={()=>this.expandClick()}/>
        }
        else {
            //, width:'100vw', height:'100vh'
            return <div style={{overflowX:'auto'}}>
            {
                this.props.collapsable?<Icon size='tiny' circular name='minus' onClick={()=>this.collapseClick()}/>:undefined
            }
            <Table selectable size='small' structured>
                <Table.Header>
                    <Table.Row>
                        {names.map(n=><Table.HeaderCell key={n}>{n}</Table.HeaderCell>)}
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {
                    this.props.table.map(row=>
                        <Table.Row key={row.ID}>
                        {names.map((n,idx)=><Table.Cell  style={{wordWrap:'break-word'}}>{this.renderItem(row[n], this.props.tableDef ? this.props.tableDef[idx].type: undefined)}</Table.Cell>)}
                        </Table.Row>
                    )
                    }
                </Table.Body>
            </Table>
            </div>
        }
    }
}
