import * as React from "react";
import * as ReactDOM from "react-dom";

import {Dropdown, Table} from 'semantic-ui-react'
import { jsonrpcCall } from "../utils/jsonrpc";
import {dbScheme} from '../database/scheme'
import { TableView } from "./table-view";
import { METHODS } from "http";

interface TablesTabState{
    table:Array<any>
    tableName:string
}

interface TablesTabProps{
    tableList:string[]
}

export class TablesTab extends React.Component<TablesTabProps, TablesTabState>{
    constructor(props:any) {
        super(props)
        this.state={
            table:[],
            tableName:''
        }
    }

    onTableChange(tableName:string) {
        jsonrpcCall('select', {table:tableName}).then(table=>this.setState({tableName, table}))
    }

    onTableUpdate(idx:number, updatedRecord:any) {
        let _filename = idx<this.state.table.length?this.state.table[idx]._filename:updatedRecord._filename
        updatedRecord._filename = undefined
        jsonrpcCall(idx<this.state.table.length?'update':'insert', {
            table:this.state.tableName,
            object:updatedRecord,
            _filename}).then(resp=>{
                    this.onTableChange(this.state.tableName)
                }
        )
    }

    render() {
        let tableList = []
        for (let table of this.props.tableList) {
            tableList.push({
                key: table,
                text: table,
                value: table
            })
        }
        return <div>
            Table:<Dropdown search selection text={this.state.tableName} onChange={(e,{value})=>this.onTableChange(value as string)} options={tableList}/><br/>
            <TableView editMode onUpdate={(idx:number, rec:any)=>this.onTableUpdate(idx, rec)} table={this.state.table} tableDef={dbScheme[this.state.tableName]}/>
        </div>
    }
}
