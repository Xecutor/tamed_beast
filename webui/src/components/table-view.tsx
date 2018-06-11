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
}

interface TableViewProps{
    idxBase:number
    table:Array<any>
    tableDef?:Array<FieldDef>
    collapsable?:boolean
    initiallyCollapsed?:boolean
    editMode?:boolean
    onInsert?:(record:any)=>void
    onUpdate?:(idx:number, record:any)=>void
    onDelete?:(idx:number)=>void
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
        console.log(`idxbase=${this.props.idxBase}, idx=${idx}`)
        if(isEdit) {
            this.props.onUpdate(this.props.idxBase + idx, rec)
        }
        else {
            this.props.onInsert(rec)
        }
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
        console.log(`delete modal opened ${idx}`)
        let isDeleteModalOpen = [...this.state.isDeleteModalOpen]
        isDeleteModalOpen[idx] = true
        this.setState({isDeleteModalOpen})
    }

    onDeleteModalClosed(idx:number) {
        console.log(`delete modal closed ${idx}`)
        let isDeleteModalOpen = [...this.state.isDeleteModalOpen]
        isDeleteModalOpen[idx] = false
        this.setState({isDeleteModalOpen})
    }
    
    renderEditModal(idx:number, row:any) {
        return <Modal 
            onOpen={()=>this.onEditModalOpen(idx)}
            onClose={()=>this.onEditModalClosed(idx)}
            dimmer='inverted'
            closeIcon
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
        let idxBase = this.props.idxBase
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
            closeIcon
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
                        onSave={(rec)=>this.onRecordSave(idxBase + idx, rec)}/>
                }
            </Modal.Content>
        </Modal>
    }

    renderDeleteModal(idx:number) {
        let table = this.props.editMode ? this.state.editedTable : this.props.table
        let id = typeof(table[idx].ID)==='string' ? table[idx].ID : `Item ${idx}`
        let idxBase = this.props.idxBase
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
                <Button basic color='red' inverted onClick={()=>this.onDeleteItem(idxBase + idx)}>
                    <Icon name='remove' /> Confirm
                </Button>
                <Button color='green' inverted onClick={()=>this.onDeleteModalClosed(idx)}>
                    Cancel
                </Button>
            </Modal.Actions>
        </Modal>
    }

    onDeleteItem(idx:number) {
        this.onDeleteModalClosed(idx)
        this.props.onDelete && this.props.onDelete(idx)
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
            return <Icon size='tiny' circular link name='plus' onClick={()=>this.expandClick()}/>
        }
        else {
            let table = this.props.editMode ? this.state.editedTable : this.props.table
            if(table===undefined) {
                table = []
            }

            //, width:'100vw', height:'100vh'
            return <div style={{overflowX:'auto'}}>
                {
                    this.props.collapsable?<Icon size='tiny' circular link name='minus' onClick={()=>this.collapseClick()}/>:undefined
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
                            <Table.Row key={getID(ridx, row)}>
                                {
                                    this.props.editMode &&
                                    <Table.Cell key={`${getID(ridx, row)}-e`}>
                                        {this.renderEditModal(ridx, row)}
                                        {this.renderDeleteModal(ridx)}
                                    </Table.Cell>
                                }
                                {
                                    names.map((n,cidx)=>
                                        <Table.Cell key={`${getID(ridx, row)}-${n}`} style={{wordWrap:'break-word'}}>
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
