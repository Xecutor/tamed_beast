import * as React from "react";
import * as ReactDOM from "react-dom";

import {Modal, Icon, Table} from 'semantic-ui-react'
import {FieldDef, TypeDef, copyTable} from '../database/scheme'
import { RecordEditForm } from "./record-edit-form";
import { isSymbol } from "util";

interface TableViewState{
    collapsed:boolean
    isModalOpen:{[key:string]:boolean}
    editedTable:Array<any>
}

interface TableViewProps{
    table:Array<any>
    tableDef?:Array<FieldDef>
    collapsable?:boolean
    initiallyCollapsed?:boolean
    editMode?:boolean
    onUpdate?:(idx:number, record:any)=>void
}

function getID(idx:number,item:any) {
    if(item.ID) {
        return item.ID
    }
    return idx.toString()
}

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
            isModalOpen:{},
            editedTable:[]
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
        let id = idx < editedTable.length ? getID(idx, rec) : kNewItemPseudoId
        editedTable[idx] = rec
        let isModalOpen = {...this.state.isModalOpen}
        isModalOpen[id] = false
        this.props.onUpdate(idx, rec)
        this.setState({editedTable, isModalOpen})
    }

    onModalOpen(id:string) {
        let isModalOpen = {...this.state.isModalOpen}
        isModalOpen[id] = true
        this.setState({isModalOpen})
    }

    onModalClosed(id:string) {
        let isModalOpen = {...this.state.isModalOpen}
        isModalOpen[id] = false
        this.setState({isModalOpen})
    }

    renderEditModal(idx:number, row:any) {
        return <Modal 
            onOpen={()=>this.onModalOpen(getID(idx, row))}
            onClose={()=>this.onModalClosed(getID(idx, row))}
            open={this.state.isModalOpen[getID(idx, row)]}
            style={modalStyleFix} 
            trigger={<Icon name='edit' circular link/>}>
            <Modal.Header>
                {getID(idx, row)}
            </Modal.Header>
            <Modal.Content>
                {
                    this.state.isModalOpen[getID(idx, row)]?
                    <RecordEditForm inputRecord={row} tableDef={this.props.tableDef} onSave={(rec)=>this.onRecordSave(idx, rec)}/>
                    :undefined
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
                if(item._filename) {
                    files[item._filename] = true
                }
            }
        }
        let fileList = Object.keys(files).sort()
        if(fileList.length==0) {
            fileList = undefined
        }

        return <Modal 
            onOpen={()=>this.onModalOpen(id)}
            onClose={()=>this.onModalClosed(id)}
            open={this.state.isModalOpen[id]}
            style={modalStyleFix} 
            trigger={<Icon size='tiny' circular link name='plus' inverted/>}>
            <Modal.Header>
                New item
            </Modal.Header>
            <Modal.Content>
                {
                    this.state.isModalOpen[id] &&
                    <RecordEditForm 
                        fileList={fileList}
                        inputRecord={row}
                        tableDef={this.props.tableDef}
                        onSave={(rec)=>this.onRecordSave(idx, rec)}/>
                }
            </Modal.Content>
        </Modal>
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
                        table.map((row,idx)=>
                        <Table.Row key={getID(idx, row)}>
                            {
                                this.props.editMode &&
                                <Table.Cell key={`${getID(idx, row)}-e`}>
                                    {this.renderEditModal(idx, row)}
                                </Table.Cell>
                            }
                            {names.map((n,idx)=><Table.Cell   key={`${getID(idx, row)}-${n}`} style={{wordWrap:'break-word'}}>{this.renderItem(row[n], this.props.tableDef ? this.props.tableDef[idx].type: undefined)}</Table.Cell>)}
                        </Table.Row>
                    )
                    }
                </Table.Body>
            </Table>
            </div>
        }
    }
}
