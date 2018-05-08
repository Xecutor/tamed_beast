import * as React from "react";
import * as ReactDOM from "react-dom";

import {TamedBeastApp} from './components/app';

let rootDiv = document.createElement('div')
document.body.appendChild(rootDiv)

ReactDOM.render(
    <TamedBeastApp/>,
    rootDiv
);
