import { mat4, vec3 } from "gl-matrix";
import * as React from "react";

const vertexData = new Float32Array(
  [
    // float4 position, float4 color
    1, -1, 1, 1, 1, 0, 1, 1,
    -1, -1, 1, 1, 0, 0, 1, 1,
    -1, -1, -1, 1, 0, 0, 0, 1,
    1, -1, -1, 1, 1, 0, 0, 1,
    1, -1, 1, 1, 1, 0, 1, 1,
    -1, -1, -1, 1, 0, 0, 0, 1,

    1, 1, 1, 1, 1, 1, 1, 1,
    1, -1, 1, 1, 1, 0, 1, 1,
    1, -1, -1, 1, 1, 0, 0, 1,
    1, 1, -1, 1, 1, 1, 0, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
    1, -1, -1, 1, 1, 0, 0, 1,

    -1, 1, 1, 1, 0, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, -1, 1, 1, 1, 0, 1,
    -1, 1, -1, 1, 0, 1, 0, 1,
    -1, 1, 1, 1, 0, 1, 1, 1,
    1, 1, -1, 1, 1, 1, 0, 1,

    -1, -1, 1, 1, 0, 0, 1, 1,
    -1, 1, 1, 1, 0, 1, 1, 1,
    -1, 1, -1, 1, 0, 1, 0, 1,
    -1, -1, -1, 1, 0, 0, 0, 1,
    -1, -1, 1, 1, 0, 0, 1, 1,
    -1, 1, -1, 1, 0, 1, 0, 1,

    1, 1, 1, 1, 1, 1, 1, 1,
    -1, 1, 1, 1, 0, 1, 1, 1,
    -1, -1, 1, 1, 0, 0, 1, 1,
    -1, -1, 1, 1, 0, 0, 1, 1,
    1, -1, 1, 1, 1, 0, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,

    1, -1, -1, 1, 1, 0, 0, 1,
    -1, -1, -1, 1, 0, 0, 0, 1,
    -1, 1, -1, 1, 0, 1, 0, 1,
    1, 1, -1, 1, 1, 1, 0, 1,
    1, -1, -1, 1, 1, 0, 0, 1,
    -1, 1, -1, 1, 0, 1, 0, 1,
  ]);

const NumActiveUniformBuffers = 3;

const ShaderSource = `
#include <metal_stdlib>

using namespace metal;

struct Vertex
{
    float4 position [[position]];
    float4 color;
};

struct Uniform
{
    float4x4 modelViewProjectionMatrix;
};

vertex Vertex vertex_main(device Vertex *vertices [[buffer(0)]],
                          constant Uniform *uniforms [[buffer(1)]],
                          uint vid [[vertex_id]])
{
    Vertex vertexOut;
    vertexOut.position = uniforms->modelViewProjectionMatrix * vertices[vid].position;
    vertexOut.color = vertices[vid].color;

    return vertexOut;
}

fragment float4 fragment_main(Vertex vertexIn [[stage_in]])
{
    return float4(vertexIn.color);
}
`;

export default class Simple extends React.Component {
  private canvas: HTMLCanvasElement;
  private gpu: WebGPURenderingContext;
  private commandQueue: WebGPUCommandQueue;
  private renderPipelineState: WebGPURenderPipelineState;
  private renderPassDescriptor: WebGPURenderPassDescriptor;
  private projectionMatrix: mat4;
  private depthStencilState: WebGPUDepthStencilState;
  private uniformBuffers: WebGPUBuffer[];
  private currentUniformBufferIndex: number;
  private vertexBuffer: WebGPUBuffer;
  private requestAnimationId: number;

  constructor(props, context?) {
    super(props, context);

    this.requestAnimationId = 0;

    this.draw = this.draw.bind(this);
    this.onCanvasRef = this.onCanvasRef.bind(this);
  }

  public componentWillUnmount() {
    if (this.requestAnimationId !== 0) {
      cancelAnimationFrame(this.requestAnimationId);
      this.requestAnimationId = 0;
    }
  }

  public componentDidMount() {
    this.uniformBuffers = new Array(NumActiveUniformBuffers);
    this.currentUniformBufferIndex = 0;

    const canvasSize = this.canvas.getBoundingClientRect();
    this.canvas.width = canvasSize.width;
    this.canvas.height = canvasSize.height;

    const aspect = Math.abs(canvasSize.width / canvasSize.height);

    this.projectionMatrix = mat4.create();
    mat4.perspective(this.projectionMatrix, (2 * Math.PI) / 5, aspect, 1, 100.0);

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
    pipelineDescriptor.colorAttachments[0].pixelFormat = this.gpu.PixelFormatBGRA8Unorm;
    pipelineDescriptor.depthAttachmentPixelFormat = this.gpu.PixelFormatDepth32Float;

    this.renderPipelineState = this.gpu.createRenderPipelineState(pipelineDescriptor);

    const depthStencilDescriptor = new WebGPUDepthStencilDescriptor();
    depthStencilDescriptor.depthWriteEnabled = true;
    depthStencilDescriptor.depthCompareFunction = "less";
    this.depthStencilState = this.gpu.createDepthStencilState(depthStencilDescriptor);

    for (let i = 0; i < NumActiveUniformBuffers; i++) {
      this.uniformBuffers[i] = this.gpu.createBuffer(new Float32Array(16));
    }

    const depthTextureDescriptor = new WebGPUTextureDescriptor(
      this.gpu.PixelFormatDepth32Float,
      canvasSize.width,
      canvasSize.height,
      false,
    );

    // NOTE: Our API proposal has some of these values as enums, not constant numbers.
    // We haven't got around to implementing the enums yet.
    depthTextureDescriptor.textureType = this.gpu.TextureType2D;
    depthTextureDescriptor.sampleCount = 1;
    depthTextureDescriptor.usage = this.gpu.TextureUsageUnknown;
    depthTextureDescriptor.storageMode = this.gpu.StorageModePrivate;

    const depthTexture = this.gpu.createTexture(depthTextureDescriptor);

    this.renderPassDescriptor = new WebGPURenderPassDescriptor();
    // NOTE: Our API proposal has some of these values as enums, not constant numbers.
    // We haven't got around to implementing the enums yet.
    this.renderPassDescriptor.colorAttachments[0].loadAction = this.gpu.LoadActionClear;
    this.renderPassDescriptor.colorAttachments[0].storeAction = this.gpu.StoreActionStore;
    this.renderPassDescriptor.colorAttachments[0].clearColor = [0.35, 0.65, 0.85, 1.0];
    this.renderPassDescriptor.depthAttachment.loadAction = this.gpu.LoadActionClear;
    this.renderPassDescriptor.depthAttachment.storeAction = this.gpu.StoreActionDontCare;
    this.renderPassDescriptor.depthAttachment.clearDepth = 1.0;
    this.renderPassDescriptor.depthAttachment.texture = depthTexture;

    this.vertexBuffer = this.gpu.createBuffer(vertexData);

    this.draw();
  }

  public render() {
    return (
      <canvas ref={this.onCanvasRef} />
    );
  }

  private onCanvasRef(el: HTMLCanvasElement) {
    this.canvas = el;
  }

  private draw() {
    this.updateUniformData(this.currentUniformBufferIndex);

    const commandBuffer = this.commandQueue.createCommandBuffer();

    const drawable = this.gpu.nextDrawable();

    this.renderPassDescriptor.colorAttachments[0].texture = drawable.texture;

    const commandEncoder = commandBuffer.createRenderCommandEncoderWithDescriptor(this.renderPassDescriptor);
    commandEncoder.setDepthStencilState(this.depthStencilState);
    commandEncoder.setRenderPipelineState(this.renderPipelineState);
    commandEncoder.setVertexBuffer(this.vertexBuffer, 0, 0);
    commandEncoder.setVertexBuffer(this.uniformBuffers[this.currentUniformBufferIndex], 0, 1);
    commandEncoder.drawPrimitives(this.gpu.PrimitiveTypeTriangle, 0, 36);

    commandEncoder.endEncoding();
    commandBuffer.presentDrawable(drawable);
    commandBuffer.commit();

    this.currentUniformBufferIndex = (this.currentUniformBufferIndex + 1) % NumActiveUniformBuffers;
    this.requestAnimationId = requestAnimationFrame(this.draw);
  }

  private updateUniformData(index: number) {
    const viewMatrix = mat4.create();
    mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -5));
    const now = Date.now() / 1000;
    mat4.rotate(viewMatrix, viewMatrix, 1, vec3.fromValues(Math.sin(now), Math.cos(now), 0));

    const modelViewProjectionMatrix = mat4.create();
    mat4.multiply(modelViewProjectionMatrix, this.projectionMatrix, viewMatrix);

    const uniform = new Float32Array(this.uniformBuffers[index].contents);
    for (let i = 0; i < 16; i++) {
        uniform[i] = modelViewProjectionMatrix[i];
    }
  }
}
