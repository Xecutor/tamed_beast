import * as React from "react";
import * as ReactDOM from "react-dom";

import {Dropdown, Loader, Segment, Label, Pagination, Input, Grid} from 'semantic-ui-react'
import { jsonrpcCall } from "../utils/jsonrpc";
import {dbScheme} from '../database/scheme'
import { TableView } from "./table-view";
import { METHODS } from "http";
import { caseInsensetiveFilter } from "../utils/string-util";
import { getSettings, updateSetting } from "../utils/settings";

type FilterType = {[key:string]:string}

interface TablesTabState{
    table:Array<any>
    fileList:string[]
    idxMap:number[]
    tableName:string
    page:number
    pageSize:number
    filter:FilterType
    loading:boolean
}

interface TablesTabProps{
    tableList:string[]
}

export class TablesTab extends React.Component<TablesTabProps, TablesTabState>{
    constructor(props:any) {
        super(props)
        let settings = getSettings()
        this.state={
            table:[],
            fileList:[],
            idxMap:[],
            tableName:'',
            page:1,
            pageSize:settings.pageSize,
            filter:{ID:''},
            loading:false,
        }
    }

    onTableChange(tableName:string) {
        this.loadTable(tableName, true)
    }

    loadTable(tableName:string, resetPage:boolean = false) {
        if(resetPage) {
            this.setState({ loading: true, page: 1, filter:{ID:''} })
        }
        else {
            this.setState({ loading: true})
        }
        jsonrpcCall('select', {table:tableName}).then(table=>this.onAfterTableLoaded(table,tableName))
    }

    onAfterTableLoaded(table:any[], tableName:string) {
        let files : {[key:string]:boolean} = {}
        if(table) {
            for(let item of table) {
                if(item && item._filename) {
                    files[item._filename] = true
                }
            }
        }
        let fileList = Object.keys(files).sort()
        if(fileList.length==0) {
            fileList = undefined
        }
        let idxMap = this.calcIdxMap(table, this.state.page, this.state.pageSize, this.state.filter)
        this.setState({loading:false, tableName, table, fileList, idxMap})
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
        console.log(idx, this.state.idxMap)
        idx = this.state.idxMap[idx]
        console.log(idx, this.state.table[idx])
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
        idx = this.state.idxMap[idx]
        let _filename = this.state.table[idx]._filename
        let ID = this.state.table[idx].ID
        console.log(`delete item ${ID}/${idx}`)
        jsonrpcCall('delete', {table:this.state.tableName, ID, idx, _filename}).then(resp=>this.loadTable(this.state.tableName))
    }

    calcIdxMap(table:any[], page:number,pageSize:number, filter:FilterType) {
        let idxMap : number[] = []
        table = this.getFilteredTable(table, filter)

        if (pageSize == -1) {
            pageSize = table.length
        }
        
        let pages = Math.ceil(table.length / pageSize)
        if (page > pages) {
            page = pages
        }

        let idxBase = 0
        
        if (pages > 1) {
            idxBase = (page - 1) * pageSize
        }
        for (let idx = 0; idx < pageSize; ++idx) {
            let item = table[idxBase + idx]
            if (!item) {
                break
            }
            idxMap[idx] = item._baseIdx !== undefined ? item._baseIdx : idxBase + idx
        }
        console.log(idxMap)
        return idxMap
    }

    onPageChange(page:number) {
        let idxMap = this.calcIdxMap(this.state.table, page, this.state.pageSize, this.state.filter)
        this.setState({page, idxMap})
    }

    onFilterIdChange(filterId:string) {
        let filter = {...this.state.filter}
        filter.ID = filterId
        this.onFilterChange(filter)
    }

    onFilterChange(filter:FilterType) {
        let idxMap = this.calcIdxMap(this.state.table,this.state.page, this.state.pageSize, filter)
        this.setState({filter, idxMap})
    }

    onPageSizeChange(pageSize:number) {
        updateSetting('pageSize', pageSize)
        let idxMap = this.calcIdxMap(this.state.table,this.state.page, pageSize, this.state.filter)
        this.setState({pageSize, idxMap})
    }

    getFilteredTable(table:any[], filter:FilterType) {
        if (!Object.values(filter).some(value => !!value.length)) {
            return table
        }
         table = table.map((value,index)=>{
            value._baseIdx = index
            return value
        })
        let dbDef = dbScheme[this.state.tableName]
        for(let name of Object.keys(filter)) {
            let def = dbDef.find(val=>val.name===name)
            let flt = filter[name]
            if (!def || !flt) {
                continue
            }
            table = table.filter((value:any)=>def.type.filter(value[name], flt))
        }
        return table
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
        let pageSizeSelector
        if(this.state.loading) {
            mainComponent = <Loader/>
        }
        else if(!dbScheme[this.state.tableName]) {
            mainComponent = <Label>No scheme for {this.state.tableName}</Label>
        }
        else {

            let table = this.getFilteredTable(this.state.table, this.state.filter)
            const pageSize = this.state.pageSize > 0 ? this.state.pageSize : this.state.table.length
            
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

            filter = <Input placeholder='Search by ID' value={this.state.filter.ID} onChange={(e,{value})=>this.onFilterIdChange(value)} icon='search'/>

            let pageSizeOptions : {key:number, value:number, text:string, selected?:boolean}[] = [
                {key:10, value:10, text:'10'},
                {key:20, value:20, text:'20'},
                {key:50, value:50, text:'50'},
                {key:100, value:100, text:'100'},
                {key:-1, value:-1, text:'Unlimited'},
            ]
            for(let opt of pageSizeOptions) {
                if(opt.value===pageSize) {
                    opt.selected = true
                }
            }

            pageSizeSelector=<Dropdown 
                                options={pageSizeOptions}
                                selection
                                value={this.state.pageSize}
                                onChange={(e,{value})=>this.onPageSizeChange(value as number)}/>
            
            mainComponent = <TableView 
                                editMode
                                showFilter
                                filter={this.state.filter}
                                onFilterChange={filter=>this.onFilterChange(filter)}
                                fileList={this.state.fileList}
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
                        {filter}&nbsp;
                        {pageSizeSelector}
                    </Grid.Column>
                </Grid.Row>
            </Grid>
            <Segment vertical>
                {mainComponent}
            </Segment>
        </Segment.Group>
    }
}
