import * as React from "react";
import {Button, Icon, Modal, SemanticICONS} from 'semantic-ui-react'

interface ConfirmModalProps{
    onOpen:()=>void
    onClose:()=>void
    onConfirm:()=>void
    onCancel:()=>void
    open:boolean
    icon:SemanticICONS
    header:string
    text:string

    trigger:JSX.Element

    confirmText?:string
    cancelText?:string
}

export class ConfirmModal extends React.Component<ConfirmModalProps,any> {
    render() {
        return <Modal 
            onOpen={()=>this.props.onOpen()}
            onClose={()=>this.props.onClose()}
            closeOnDimmerClick={false}
            open={this.props.open}
            basic
            size='small'
            trigger={this.props.trigger}>
            <Modal.Header>
                {this.props.header}
            </Modal.Header>
            <Modal.Content scrolling>
                <p>{this.props.text}</p>
            </Modal.Content>
            <Modal.Actions>
                <Button basic color='red' inverted onClick={this.props.onConfirm}>
                    <Icon name={this.props.icon}/>{this.props.confirmText?this.props.confirmText:'Confirm'}
                </Button>
                <Button color='green' inverted onClick={this.props.onCancel}>
                    {this.props.cancelText?this.props.cancelText:'Cancel'}
                </Button>
            </Modal.Actions>
        </Modal>
    }
}
