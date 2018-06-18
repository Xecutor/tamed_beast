import * as React from "react";

import {Modal, Button, Icon, Table, Input, Popup} from 'semantic-ui-react'
import {FieldDef, TypeDef, copyTable} from '../database/scheme'
import { RecordEditForm } from "./record-edit-form";
import { ConfirmModal } from "./confirm-modal";

interface TableViewState{
    collapsed:boolean
    isEditModalOpen:boolean[]
    isInsertModalOpen:boolean[]
    isDeleteModalOpen:boolean[]
    editedTable:Array<any>
}

interface TableViewProps{
    table:Array<any>
    fileList?:string[]
    tableDef?:Array<FieldDef>
    collapsable?:boolean
    initiallyCollapsed?:boolean
    editMode?:boolean
    showFilter?:boolean
    filter?:{[key:string]:string}
    onInsert?:(record:any)=>void
    onUpdate?:(idx:number, record:any)=>void
    onDelete?:(idx:number)=>void

    onFilterChange?:(filter:{[key:string]:string})=>void
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
        if(isEdit) {
            this.props.onUpdate(idx, rec)
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
                        fileList={this.props.fileList}
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
        return <ConfirmModal
            onOpen={()=>this.onDeleteModalOpen(idx)}
            onClose={()=>this.onDeleteModalClosed(idx)}
            open={this.state.isDeleteModalOpen[idx]}
            trigger={<Icon size='small' color='red' inverted name='delete' circular link/>}
            header={id}
            text='Confirm delete operation'
            onConfirm={()=>this.onDeleteItem(idx)}
            onCancel={()=>this.onDeleteModalClosed(idx)}
            icon='remove'
        />
    }

    onDeleteItem(idx:number) {
        this.onDeleteModalClosed(idx)
        this.props.onDelete && this.props.onDelete(idx)
    }

    onClearFilter(name:string) {
        let filter = {...this.props.filter}
        delete filter[name]
        this.props.onFilterChange(filter)
    }

    onFilterChange(name:string, value:string) {
        let filter = {...this.props.filter}
        filter[name] = value
        this.props.onFilterChange(filter)
    }

    renderFilterIcon(name:string) {
        if(!this.props.showFilter) {
            return
        }
        let icon = <span>
            &nbsp;
            <Icon 
                name='filter'
                inverted
                color={this.props.filter && this.props.filter[name] ? 'red' : 'grey'}
                bordered
                size='small'/>
        </span>
        return <Popup
                trigger={icon}
                hoverable
                flowing
                position='bottom center'
                on='click'>
            <Popup.Content>
                <Input 
                    size='small'
                    value={this.props.filter[name]?this.props.filter[name]:''} 
                    action={{icon:'delete', size:'small',onClick:()=>this.onClearFilter(name)}}
                    onChange={(e,{value})=>this.onFilterChange(name, value)}
                    />
            </Popup.Content>
        </Popup>
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
                            {names.map(n=><Table.HeaderCell key={n}>{n}
                                                {
                                                    this.renderFilterIcon(n)
                                                }
                                           </Table.HeaderCell>)}
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
