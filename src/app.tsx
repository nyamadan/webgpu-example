import * as React from "react";
import AnimationCube from "./components/AnimationCube";
import Hello from "./components/Hello";
import Simple from "./components/Simple";
import { checkForWebGPU } from "./utils";

const App = () => {
  const content = checkForWebGPU() ? (
    <div>
      <h2>Hello</h2>
      <Hello />
      <h2>Simple</h2>
      <Simple />
      <h2>AnimationCube</h2>
      <AnimationCube />
    </div>
  ) : (
    <div>
      <p>WebGPU not available.</p>
    </div>
  );

  return (
    <div>
      <h1>WebGPU Example</h1>
      {content}
    </div>
  );
};

export default App;
