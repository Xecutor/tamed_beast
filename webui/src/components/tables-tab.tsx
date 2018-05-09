import * as React from "react";
import * as ReactDOM from "react-dom";

import {Dropdown, Table} from 'semantic-ui-react'
import { jsonrpcCall } from "../utils/jsonrpc";
import {dbScheme} from '../database/scheme'
import { TableView } from "./table-view";

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
        this.setState({tableName})
        jsonrpcCall('select', {table:tableName}).then(table=>this.setState({table}))
    }

    render() {
        let names: string[] = []
        if (this.state.table.length > 0) {
            for (let name in this.state.table[0]) {
                names.push(name)
            }
        }

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
            <TableView table={this.state.table} tableDef={dbScheme[this.state.tableName]}/>
        </div>
    }
}
