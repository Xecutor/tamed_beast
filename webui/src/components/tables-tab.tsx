import * as React from "react";
import * as ReactDOM from "react-dom";

import {Dropdown, Loader, Segment, Label} from 'semantic-ui-react'
import { jsonrpcCall } from "../utils/jsonrpc";
import {dbScheme} from '../database/scheme'
import { TableView } from "./table-view";
import { METHODS } from "http";

interface TablesTabState{
    table:Array<any>
    tableName:string
    loading:boolean
}

interface TablesTabProps{
    tableList:string[]
}

export class TablesTab extends React.Component<TablesTabProps, TablesTabState>{
    constructor(props:any) {
        super(props)
        this.state={
            table:[],
            tableName:'',
            loading:false
        }
    }

    onTableChange(tableName:string) {
        this.setState({loading:true})
        jsonrpcCall('select', {table:tableName}).then(table=>this.setState({loading:false, tableName, table}))
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

    onDeleteItem(idx:number) {
        let _filename = this.state.table[idx]._filename
        let ID = this.state.table[idx].ID
        console.log(`delete item ${ID}/${idx}`)
        jsonrpcCall('delete', {table:this.state.tableName, ID, idx, _filename}).then(resp=>this.onTableChange(this.state.tableName))
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
        let mainComponent
        if(this.state.loading) {
            mainComponent = <Loader/>
        }
        else if(!dbScheme[this.state.tableName]) {
            mainComponent = <Label>No scheme for {this.state.tableName}</Label>
        }
        else {
            mainComponent = <TableView 
                                editMode
                                onUpdate={(idx:number, rec:any)=>this.onTableUpdate(idx, rec)}
                                onDelete={(idx:number)=>this.onDeleteItem(idx)}
                                table={this.state.table} 
                                tableDef={dbScheme[this.state.tableName]}/>
        }

        return <Segment.Group>
            <Segment vertical>
                Table:<Dropdown 
                        search
                        selection
                        text={this.state.tableName}
                        onChange={(e,{value})=>this.onTableChange(value as string)} 
                        options={tableList}/><br/>
            </Segment>
            <Segment vertical>
                {mainComponent}
            </Segment>
        </Segment.Group>
    }
}
