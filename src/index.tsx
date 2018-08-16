import "!style-loader!css-loader?modules=false&url=false!normalize.css";

import * as React from "react";
import * as ReactDOM from "react-dom";

import "!style-loader!css-loader?modules=false!sass-loader!./styles.scss";

import App from "./app";

ReactDOM.render(<App />, document.querySelector("#root"));
