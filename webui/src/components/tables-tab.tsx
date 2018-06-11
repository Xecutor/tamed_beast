import * as React from "react";
import * as ReactDOM from "react-dom";

import {Dropdown, Loader, Segment, Label, Pagination, Input, Grid} from 'semantic-ui-react'
import { jsonrpcCall } from "../utils/jsonrpc";
import {dbScheme} from '../database/scheme'
import { TableView } from "./table-view";
import { METHODS } from "http";
import { caseInsensetiveFilter } from "../utils/string-util";

interface TablesTabState{
    table:Array<any>
    tableName:string
    page:number
    filter:string
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
            page:1,
            filter:'',
            loading:false,
        }
    }

    onTableChange(tableName:string) {
        this.loadTable(tableName, true)
    }

    loadTable(tableName:string, resetPage:boolean = false) {
        if(resetPage) {
            this.setState({ loading: true, page: 1, filter:'' })
        }
        else {
            this.setState({ loading: true})
        }
        jsonrpcCall('select', {table:tableName}).then(table=>this.setState({loading:false, tableName, table}))
    }

    onTableInsert(newRecord:any) {
        let _filename = newRecord._filename
        newRecord._filename = undefined
        jsonrpcCall('insert', {
            table:this.state.tableName,
            object:newRecord,
            _filename}).then(resp=>{
                    this.loadTable(this.state.tableName)
                }
        )
    }

    onTableUpdate(idx:number, updatedRecord:any) {
        let _filename = this.state.table[idx]._filename
        updatedRecord._filename = undefined
        jsonrpcCall('update', {
            table:this.state.tableName,
            object:updatedRecord,
            _filename}).then(resp=>{
                    this.loadTable(this.state.tableName)
                }
        )
    }

    onDeleteItem(idx:number) {
        let _filename = this.state.table[idx]._filename
        let ID = this.state.table[idx].ID
        console.log(`delete item ${ID}/${idx}`)
        jsonrpcCall('delete', {table:this.state.tableName, ID, idx, _filename}).then(resp=>this.loadTable(this.state.tableName))
    }

    onPageChange(page:number) {
        this.setState({page})
    }

    onFilterChange(filter:string) {
        this.setState({filter})
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
        let pagination
        let filter
        if(this.state.loading) {
            mainComponent = <Loader/>
        }
        else if(!dbScheme[this.state.tableName]) {
            mainComponent = <Label>No scheme for {this.state.tableName}</Label>
        }
        else {

            let table = this.state.table
            if(this.state.filter.length>0) {
                table = table.filter((value:any)=>caseInsensetiveFilter(value.ID, this.state.filter))
            }
            const pageSize = 20
            
            let page = this.state.page
            let pages = Math.ceil(table.length / pageSize)
            if (page > pages) {
                page = pages
            }

            let idxBase = 0
            
            if (pages > 1) {
                idxBase = (page-1)*pageSize
                pagination = <Pagination 
                                size='mini'
                                activePage={this.state.page}
                                totalPages={pages}
                                onPageChange={(e, { activePage }) => this.onPageChange(activePage as number)} />
                table = table.slice(idxBase, idxBase + pageSize)
            }

            filter = <Input placeholder='Search by ID' value={this.state.filter} onChange={(e,{value})=>this.onFilterChange(value)} icon='search'/>
            
            mainComponent = <TableView 
                                editMode
                                idxBase={idxBase}
                                onInsert={(rec:any)=>this.onTableInsert(rec)}
                                onUpdate={(idx:number, rec:any)=>this.onTableUpdate(idx, rec)}
                                onDelete={(idx:number)=>this.onDeleteItem(idx)}
                                table={table} 
                                tableDef={dbScheme[this.state.tableName]}/>
        }

   
        return <Segment.Group>
            <Grid columns={3}>
                <Grid.Row>
                    <Grid.Column width={3}>
                    <Dropdown 
                        search
                        placeholder='Select table'
                        selection
                        labeled
                        text={this.state.tableName}
                        onChange={(e,{value})=>this.onTableChange(value as string)} 
                        options={tableList}/>
                    </Grid.Column>
                    <Grid.Column width={4}>
                        {pagination}
                    </Grid.Column>
                    <Grid.Column>
                        {filter}
                    </Grid.Column>
                </Grid.Row>
            </Grid>
            <Segment vertical>
                {mainComponent}
            </Segment>
        </Segment.Group>
    }
}
