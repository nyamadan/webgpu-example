import * as React from "react";
import { checkForWebGPU } from "../utils";
const ShaderSource = `#include <metal_stdlib>

using namespace metal;

struct Vertex
{
    float4 position [[position]];
};

vertex Vertex vertex_main(uint vid [[vertex_id]])
{
    Vertex v;
    switch (vid) {
    case 0:
        v.position = float4(-.75, -.75, 0, 1);
        break;
    case 1:
        v.position = float4(.75, -.75, 0, 1);
        break;
    case 2:
        v.position = float4(0, .75, 0, 1);
        break;
    default:
        v.position = float4(0, 0, 0, 1);
    }
    return v;
}

fragment float4 fragment_main(Vertex vertexIn [[stage_in]])
{
    return float4(1.0, 0.0, 0.0, 1.0);
}
`;

export default class Hello extends React.Component {
  private canvas: HTMLCanvasElement;
  private gpu: WebGPURenderingContext;
  private commandQueue: WebGPUCommandQueue;
  private renderPipelineState: WebGPURenderPipelineState;
  private renderPassDescriptor: WebGPURenderPassDescriptor;

  constructor(props, context?) {
    super(props, context);
  }

  public componentDidMount() {
    const canvasSize = this.canvas.getBoundingClientRect();
    this.canvas.width = canvasSize.width;
    this.canvas.height = canvasSize.height;

    this.gpu = this.canvas.getContext("webgpu");
    this.commandQueue = this.gpu.createCommandQueue();

    const library = this.gpu.createLibrary(ShaderSource);
    const vertexFunction = library.functionWithName("vertex_main");
    const fragmentFunction = library.functionWithName("fragment_main");

    if (!library || !fragmentFunction || !vertexFunction) {
      return;
    }

    const pipelineDescriptor = new WebGPURenderPipelineDescriptor();
    pipelineDescriptor.vertexFunction = vertexFunction;
    pipelineDescriptor.fragmentFunction = fragmentFunction;
    // NOTE: Our API proposal has these values as enums, not constant numbers.
    // We haven't got around to implementing the enums yet.
    pipelineDescriptor.colorAttachments[0].pixelFormat =
      this.gpu.PixelFormatBGRA8Unorm;

    this.renderPipelineState = this.gpu.createRenderPipelineState(pipelineDescriptor);

    this.renderPassDescriptor = new WebGPURenderPassDescriptor();

    // NOTE: Our API proposal has some of these values as enums, not constant numbers.
    // We haven't got around to implementing the enums yet.
    this.renderPassDescriptor.colorAttachments[0].loadAction = this.gpu.LoadActionClear;
    this.renderPassDescriptor.colorAttachments[0].storeAction = this.gpu.StoreActionStore;
    this.renderPassDescriptor.colorAttachments[0].clearColor = [0.35, 0.65, 0.85, 1.0];

    this.draw();
  }

  public render() {
    const onCanvasRef = (el) => this.canvas = el;

    return (
      <canvas ref={onCanvasRef} />
    );
  }

  private draw() {
    const { gpu, commandQueue, renderPassDescriptor, renderPipelineState } = this;
    const commandBuffer = commandQueue.createCommandBuffer();
    const drawable = gpu.nextDrawable();
    renderPassDescriptor.colorAttachments[0].texture = drawable.texture;

    const commandEncoder = commandBuffer.createRenderCommandEncoderWithDescriptor(
      renderPassDescriptor,
    );
    commandEncoder.setRenderPipelineState(renderPipelineState);

    // NOTE: We didn't attach any buffers. We create the geometry in the vertex shader using
    // the vertex ID.

    // NOTE: Our API proposal uses the enum value "triangle" here. We haven't got around to implementing the enums yet.
    commandEncoder.drawPrimitives(gpu.PrimitiveTypeTriangle, 0, 3);

    commandEncoder.endEncoding();
    commandBuffer.presentDrawable(drawable);
    commandBuffer.commit();
  }
}
