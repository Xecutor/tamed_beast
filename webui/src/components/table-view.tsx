import * as React from "react";
import * as ReactDOM from "react-dom";

import {Table} from 'semantic-ui-react'
import {FieldDef, TypeDef} from '../database/scheme'

interface TableViewState{
}

interface TableViewProps{
    table:Array<any>
    tableDef?:Array<FieldDef>
}

export class TableView extends React.Component<TableViewProps, TableViewState>{
    constructor(props:any) {
        super(props)
    }

    renderItem(value: any, def?:TypeDef) {
        if (def && value!==undefined) {
            return def.renderValue(value)
        }
        return <span>{value===undefined?'':value.toString()}</span>
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
    
        return <div style={{overflowX:'auto'}}><Table>
            <Table.Header>
                <Table.Row>
                    {names.map(n=><Table.HeaderCell>{n}</Table.HeaderCell>)}
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {
                this.props.table.map(row=>
                    <Table.Row>
                    {names.map((n,idx)=><Table.Cell  style={{wordWrap:'break-word'}}>{this.renderItem(row[n], this.props.tableDef ? this.props.tableDef[idx].type: undefined)}</Table.Cell>)}
                    </Table.Row>
                )
                }
            </Table.Body>
        </Table>
        </div>
    }
}
