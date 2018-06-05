import * as React from "react";
import * as ReactDOM from "react-dom";

import {Modal, Button, Icon, Table, Pagination} from 'semantic-ui-react'
import {FieldDef, TypeDef, copyTable} from '../database/scheme'
import { RecordEditForm } from "./record-edit-form";
import { isSymbol } from "util";

interface TableViewState{
    collapsed:boolean
    isEditModalOpen:boolean[]
    isInsertModalOpen:boolean[]
    isDeleteModalOpen:boolean[]
    editedTable:Array<any>
    page:number
}

interface TableViewProps{
    table:Array<any>
    tableDef?:Array<FieldDef>
    collapsable?:boolean
    initiallyCollapsed?:boolean
    editMode?:boolean
    onUpdate?:(idx:number, record:any)=>void
    onDelete?:(idx:number)=>void
    pageSize?:number
}

function getID(idx:number,item:any) {
    if(item && item.ID) {
        return item.ID
    }
    return idx.toString()
}
//    marginTop: '0px !important',

const modalStyleFix = {
    marginTop: '0px !important',
    marginLeft: 'auto',
    marginRight: 'auto'
};            

const kNewItemPseudoId = '__new_item'

export class TableView extends React.Component<TableViewProps, TableViewState>{
    constructor(props:TableViewProps) {
        super(props)
        this.state={
            collapsed:props.collapsable && props.initiallyCollapsed,
            isEditModalOpen:[],
            isInsertModalOpen:[],
            isDeleteModalOpen:[],
            editedTable:[],
            page:1
        }
    }

    static getDerivedStateFromProps(props:TableViewProps, state:TableViewState) {
        if(props.editMode) {
            let rv = {...state}
            rv.editedTable = copyTable(props.table, props.tableDef)
            return rv
        }
        return null
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

    onRecordSave(idx:number, rec:any) {
        let editedTable = this.state.editedTable?[...this.state.editedTable]:[]
        let isEdit = idx < editedTable.length
        let id = isEdit ? getID(idx, rec) : kNewItemPseudoId
        editedTable[idx] = rec
        this.props.onUpdate(idx, rec)
        if(isEdit) {
            let isEditModalOpen = [...this.state.isEditModalOpen]
            isEditModalOpen[idx] = false
            this.setState({editedTable, isEditModalOpen})
        }
        else {
            let isInsertModalOpen = [...this.state.isInsertModalOpen]
            isInsertModalOpen[idx] = false
            this.setState({editedTable, isInsertModalOpen})
        }
    }

    onEditModalOpen(idx:number) {
        let isEditModalOpen = [...this.state.isEditModalOpen]
        isEditModalOpen[idx] = true
        this.setState({isEditModalOpen})
    }

    onEditModalClosed(idx:number) {
        let isEditModalOpen = [...this.state.isEditModalOpen]
        isEditModalOpen[idx] = false
        this.setState({isEditModalOpen})
    }

    onInsertModalOpen(idx:number) {
        let isInsertModalOpen = [...this.state.isInsertModalOpen]
        isInsertModalOpen[idx] = true
        this.setState({isInsertModalOpen})
    }

    onInsertModalClosed(idx:number) {
        let isInsertModalOpen = [...this.state.isInsertModalOpen]
        isInsertModalOpen[idx] = false
        this.setState({isInsertModalOpen})
    }

    onDeleteModalOpen(idx:number) {
        let isDeleteModalOpen = [...this.state.isDeleteModalOpen]
        isDeleteModalOpen[idx] = true
        this.setState({isDeleteModalOpen})
    }

    onDeleteModalClosed(idx:number) {
        let isDeleteModalOpen = [...this.state.isDeleteModalOpen]
        isDeleteModalOpen[idx] = false
        this.setState({isDeleteModalOpen})
    }
    
    renderEditModal(idx:number, row:any) {
        return <Modal 
            onOpen={()=>this.onEditModalOpen(idx)}
            onClose={()=>this.onEditModalClosed(idx)}
            dimmer='inverted'
            closeOnDimmerClick={false}
            open={this.state.isEditModalOpen[idx]}
            style={modalStyleFix} 
            trigger={<Icon size='small' name='edit' inverted circular link/>}>
            <Modal.Header>
                {getID(idx, row)}
            </Modal.Header>
            <Modal.Content scrolling>
                {
                    this.state.isEditModalOpen &&
                    <RecordEditForm inputRecord={row} tableDef={this.props.tableDef} onSave={(rec)=>this.onRecordSave(idx, rec)}/>
                }
            </Modal.Content>
        </Modal>
    }

    renderInsertModal() {
        let idx = this.state.editedTable?this.state.editedTable.length:0
        let row = {}
        let id = kNewItemPseudoId
        let files : {[key:string]:boolean} = {}
        if(this.props.table) {
            for(let item of this.props.table) {
                if(item && item._filename) {
                    files[item._filename] = true
                }
            }
        }
        let fileList = Object.keys(files).sort()
        if(fileList.length==0) {
            fileList = undefined
        }

        return <Modal 
            onOpen={()=>this.onInsertModalOpen(idx)}
            onClose={()=>this.onInsertModalClosed(idx)}
            dimmer='inverted'
            closeOnDimmerClick={false}
            open={this.state.isInsertModalOpen[idx]}
            style={modalStyleFix} 
            trigger={<Icon size='tiny' circular link name='plus' inverted/>}>
            <Modal.Header>
                New item
            </Modal.Header>
            <Modal.Content scrolling>
                {
                    this.state.isInsertModalOpen &&
                    <RecordEditForm 
                        fileList={fileList}
                        inputRecord={row}
                        tableDef={this.props.tableDef}
                        onSave={(rec)=>this.onRecordSave(idx, rec)}/>
                }
            </Modal.Content>
        </Modal>
    }

    renderDeleteModal(idx:number) {
        let table = this.props.editMode ? this.state.editedTable : this.props.table
        let id = typeof(table[idx].ID)==='string' ? table[idx].ID : `Item ${idx}`
        return <Modal 
            onOpen={()=>this.onDeleteModalOpen(idx)}
            onClose={()=>this.onDeleteModalClosed(idx)}
            closeOnDimmerClick={false}
            open={this.state.isDeleteModalOpen[idx]}
            basic
            size='small'
            trigger={<Icon size='small' color='red' inverted name='delete' circular link/>}>
            <Modal.Header>
                {id}
            </Modal.Header>
            <Modal.Content scrolling>
                <p>Confirm delete operation</p>
            </Modal.Content>
            <Modal.Actions>
                <Button basic color='red' inverted onClick={()=>this.onDeleteItem(idx)}>
                    <Icon name='remove' /> Confirm
                </Button>
                <Button color='green' inverted onClick={()=>this.onDeleteModalClosed(idx)}>
                    Cancel
                </Button>
            </Modal.Actions>
        </Modal>
    }

    onPageChange(page:number) {
        this.setState({page})
    }

    onDeleteItem(idx:number) {
        this.props.onDelete && this.props.onDelete(idx)
    }

    render() {
        let names: string[] = []
        const pageSize = this.props.pageSize ? this.props.pageSize : 20
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
            return <Icon size='tiny' circular link name='plus' onClick={()=>this.expandClick()}/>
        }
        else {
            let table = this.props.editMode ? this.state.editedTable : this.props.table
            if(table===undefined) {
                table = []
            }
            let page = this.state.page
            let pages = Math.ceil(table.length / pageSize)
            if(page>pages) {
                page = pages
            }

            let pagination

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


            //, width:'100vw', height:'100vh'
            return <div style={{overflowX:'auto'}}>
                {
                    this.props.collapsable?<Icon size='tiny' circular link name='minus' onClick={()=>this.collapseClick()}/>:undefined
                }
                {
                    pagination
                }
                <Table selectable size='small' structured>
                    <Table.Header>
                        <Table.Row>
                            {
                                this.props.editMode && this.props.tableDef && <Table.HeaderCell>{this.renderInsertModal()}</Table.HeaderCell>
                            }
                            {names.map(n=><Table.HeaderCell key={n}>{n}</Table.HeaderCell>)}
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {
                            table.map((row,ridx)=>
                            <Table.Row key={getID(idxBase + ridx, row)}>
                                {
                                    this.props.editMode &&
                                    <Table.Cell key={`${getID(idxBase + ridx, row)}-e`}>
                                        {this.renderEditModal(idxBase + ridx, row)}
                                        {this.renderDeleteModal(idxBase + ridx)}
                                    </Table.Cell>
                                }
                                {
                                    names.map((n,cidx)=>
                                        <Table.Cell key={`${getID(idxBase + ridx, row)}-${n}`} style={{wordWrap:'break-word'}}>
                                            {this.renderItem(row?row[n]:undefined, this.props.tableDef ? this.props.tableDef[cidx].type: undefined)}
                                        </Table.Cell>)
                                }
                            </Table.Row>
                        )
                        }
                    </Table.Body>
                </Table>
            </div>
        }
    }
}
