import { mat4, vec3 } from "gl-matrix";
import * as React from "react";

class Uniform {
  private readonly array: Float32Array;

  constructor(float32Array) {
    if (float32Array && float32Array.length !== 64) {
      throw new Error("Incorrect backing store for Uniform");
      return;
    }

    this.array = float32Array || new Float32Array(64);
  }

  // Layout is
  // 0-15 = model_view_projection_matrix (float4x4)
  // 16-31 = normal matrix (float4x4)
  // 32-35 = ambient color (float4)
  // 36 = multiplier (int)
  get buffer() {
    return this.array;
  }
  get mvp() {
    return this.array.subarray(0, 16);
  }
  set mvp(value: Float32Array) {
    this._copyMatrix(value, 0);
  }
  get normal() {
    return this.array.subarray(16, 32);
  }
  set normal(value: Float32Array) {
    this._copyMatrix(value, 16);
  }
  get ambientColor(): Float32Array {
    return this.array.subarray(32, 36);
  }
  set ambientColor(value: Float32Array) {
    this.array[32] = value[0];
    this.array[33] = value[1];
    this.array[34] = value[2];
    this.array[35] = value[3];
  }
  get multiplier() {
    return this.array[40];
  }
  set multiplier(value) {
    this.array[36] = value;
  }
  private _copyMatrix(matrix, offset) {
    for (let i = 0; i < 16; i++) {
      this.array[offset + i] = matrix[i];
    }
  }
}

const smoothstep = (min, max, value) => {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
};

const inTimeRange = (now, start, end, period) => {
  const offset = now % period;
  return offset >= start && offset <= end;
};

const timeRangeOffset = (now, start, end, period) => {
  if (!inTimeRange(now, start, end, period)) {
    return 0;
  }
  const offset = now % period;
  return Math.min(1, Math.max(0, (offset - start) / (end - start)));
};

const middlePeakTimeRangeOffset = (now, start, end, period) => {
  const offset = timeRangeOffset(now, start, end, period);
  return 1 - Math.abs(0.5 - offset) * 2;
};

const kNumActiveUniformBuffers = 3;
const kNumberOfBoxesPerAxis = 6;
const kNumberOfBoxes = kNumberOfBoxesPerAxis * kNumberOfBoxesPerAxis;
const kBoxBaseAmbientColor = [0.2, 0.2, 0.2, 1.0];
const kFOVY = 45.0 / 180 * Math.PI;
const kEye = vec3.fromValues(0.0, 2.75, -2);
const kCenter = vec3.fromValues(0.0, 1.5, 1.0);
const kUp = vec3.fromValues(0.0, 1.0, 0.0);
const kEdge = 1.5 / kNumberOfBoxesPerAxis;

const kCubeVertexData = new Float32Array(
  [
    kEdge, -kEdge, kEdge, 0.0, -1.0, 0.0,
    -kEdge, -kEdge, kEdge, 0.0, -1.0, 0.0,
    -kEdge, -kEdge, -kEdge, 0.0, -1.0, 0.0,
    kEdge, -kEdge, -kEdge, 0.0, -1.0, 0.0,
    kEdge, -kEdge, kEdge, 0.0, -1.0, 0.0,
    -kEdge, -kEdge, -kEdge, 0.0, -1.0, 0.0,

    kEdge, kEdge, kEdge, 1.0, 0.0, 0.0,
    kEdge, -kEdge, kEdge, 1.0, 0.0, 0.0,
    kEdge, -kEdge, -kEdge, 1.0, 0.0, 0.0,
    kEdge, kEdge, -kEdge, 1.0, 0.0, 0.0,
    kEdge, kEdge, kEdge, 1.0, 0.0, 0.0,
    kEdge, -kEdge, -kEdge, 1.0, 0.0, 0.0,

    -kEdge, kEdge, kEdge, 0.0, 1.0, 0.0,
    kEdge, kEdge, kEdge, 0.0, 1.0, 0.0,
    kEdge, kEdge, -kEdge, 0.0, 1.0, 0.0,
    -kEdge, kEdge, -kEdge, 0.0, 1.0, 0.0,
    -kEdge, kEdge, kEdge, 0.0, 1.0, 0.0,
    kEdge, kEdge, -kEdge, 0.0, 1.0, 0.0,

    -kEdge, -kEdge, kEdge, -1.0, 0.0, 0.0,
    -kEdge, kEdge, kEdge, -1.0, 0.0, 0.0,
    -kEdge, kEdge, -kEdge, -1.0, 0.0, 0.0,
    -kEdge, -kEdge, -kEdge, -1.0, 0.0, 0.0,
    -kEdge, -kEdge, kEdge, -1.0, 0.0, 0.0,
    -kEdge, kEdge, -kEdge, -1.0, 0.0, 0.0,

    kEdge, kEdge, kEdge, 0.0, 0.0, 1.0,
    -kEdge, kEdge, kEdge, 0.0, 0.0, 1.0,
    -kEdge, -kEdge, kEdge, 0.0, 0.0, 1.0,
    -kEdge, -kEdge, kEdge, 0.0, 0.0, 1.0,
    kEdge, -kEdge, kEdge, 0.0, 0.0, 1.0,
    kEdge, kEdge, kEdge, 0.0, 0.0, 1.0,

    kEdge, -kEdge, -kEdge, 0.0, 0.0, -1.0,
    -kEdge, -kEdge, -kEdge, 0.0, 0.0, -1.0,
    -kEdge, kEdge, -kEdge, 0.0, 0.0, -1.0,
    kEdge, kEdge, -kEdge, 0.0, 0.0, -1.0,
    kEdge, -kEdge, -kEdge, 0.0, 0.0, -1.0,
    -kEdge, kEdge, -kEdge, 0.0, 0.0, -1.0,
  ]);

const ShaderSource = `
#include <metal_stdlib>
#include <simd/simd.h>

using namespace metal;

struct uniform_t
{
    float4x4 modelview_projection_matrix;
    float4x4 normal_matrix;
    float4 ambient_color;
    float multiplier;
} __attribute__ ((aligned (256)));

constant float3 light_position = float3(0.0, -1.0, 1.0);
constant float4 light_color = float4(1, 1, 1, 1);

struct vertex_t
{
    packed_float3 position;
    packed_float3 normal;
};

struct varying_t {
    float4 position [[position]];
    half4 color;
};

vertex varying_t vertex_function(device vertex_t* vertex_array [[ buffer(0) ]],
                               constant uniform_t& uniforms [[ buffer(1) ]],
                               unsigned int vid [[ vertex_id ]])
{
    varying_t out;

    float4 position = float4(float3(vertex_array[vid].position), 1.0);
    out.position = uniforms.modelview_projection_matrix * position;

    float3 normal = vertex_array[vid].normal;
    float4 eye_normal = normalize(uniforms.normal_matrix * float4(normal, 0.0));

    float n_dot_l = dot(eye_normal.rgb, normalize(light_position));
    n_dot_l = fmax(0.0, n_dot_l);

    out.color = half4(uniforms.ambient_color + light_color * n_dot_l);

    return out;
}

fragment half4 fragment_function(varying_t in [[stage_in]])
{
    return in.color;
};
`;

// tslint:disable-next-line:max-classes-per-file
export default class AnimationCube extends React.Component {
  private canvas: HTMLCanvasElement;
  private gpu: WebGPURenderingContext;
  private commandQueue: WebGPUCommandQueue;
  private renderPipelineState: WebGPURenderPipelineState;
  private renderPassDescriptor: WebGPURenderPassDescriptor;
  private projectionMatrix: mat4;
  private viewMatrix: mat4;
  private depthStencilState: WebGPUDepthStencilState;
  private uniformBuffers: WebGPUBuffer[][];
  private currentUniformBufferIndex: number;
  private vertexBuffer: WebGPUBuffer;
  private startTime: number;
  private elapsedTime: number;
  private cameraAltitude: number;
  private cameraRotation: number;
  private requestAnimationId: number;

  constructor(props, context?) {
    super(props, context);

    this.projectionMatrix = mat4.create();
    this.viewMatrix = mat4.create();
    this.startTime = 0;
    this.elapsedTime = 0;
    this.cameraAltitude = 0;
    this.cameraRotation = 0;

    this.uniformBuffers = new Array(kNumActiveUniformBuffers);
    this.currentUniformBufferIndex = 0;

    this.requestAnimationId = 0;

    this.draw = this.draw.bind(this);
    this.updateUniformData = this.updateUniformData.bind(this);
  }

  public componentWillUnmount() {
    if (this.requestAnimationId !== 0) {
      cancelAnimationFrame(this.requestAnimationId);
      this.requestAnimationId = 0;
    }
  }

  public componentDidMount() {
    const canvasSize = this.canvas.getBoundingClientRect();
    this.canvas.width = canvasSize.width;
    this.canvas.height = canvasSize.height;

    const aspect = Math.abs(canvasSize.width / canvasSize.height);
    mat4.perspective(this.projectionMatrix, kFOVY, aspect, 0.1, 100.0);
    mat4.lookAt(this.viewMatrix, kEye, kCenter, kUp);

    this.gpu = this.canvas.getContext("webgpu");
    this.commandQueue = this.gpu.createCommandQueue();

    const library = this.gpu.createLibrary(ShaderSource);
    const vertexFunction = library.functionWithName("vertex_function");
    const fragmentFunction = library.functionWithName("fragment_function");

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

    for (let i = 0; i < kNumActiveUniformBuffers; i++) {
      this.uniformBuffers[i] = [];
      for (let j = 0; j < kNumberOfBoxes; j++) {
        const uniform = new Uniform(null);
        uniform.multiplier = (j % 2) ? -1 : 1;
        uniform.ambientColor = new Float32Array(kBoxBaseAmbientColor);
        this.uniformBuffers[i].push(this.gpu.createBuffer(uniform.buffer));
      }
    }

    const depthTextureDescriptor = new WebGPUTextureDescriptor(
      this.gpu.PixelFormatDepth32Float,
      canvasSize.width,
      canvasSize.height,
      false);

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

    this.vertexBuffer = this.gpu.createBuffer(kCubeVertexData);

    this.startTime = Date.now();

    this.draw();
  }

  public render() {
    const onCanvasRef = (el) => this.canvas = el;

    return (
      <canvas ref={onCanvasRef} />
    );
  }

  private updateUniformData(index: number) {
    const baseModelViewMatrix = mat4.create();
    mat4.translate(baseModelViewMatrix, baseModelViewMatrix, vec3.fromValues(0, -1 * this.cameraAltitude, 5));
    mat4.rotate(baseModelViewMatrix, baseModelViewMatrix, this.cameraRotation, vec3.fromValues(0, 1, 0));

    mat4.multiply(baseModelViewMatrix, this.viewMatrix, baseModelViewMatrix);

    for (let i = 0; i < kNumberOfBoxesPerAxis; i++) {
      for (let j = 0; j < kNumberOfBoxesPerAxis; j++) {

        const boxIndex = i * kNumberOfBoxesPerAxis + j;

        const modelViewMatrix = mat4.create();

        // Position the cube in X,Y.
        const translationMatrix = mat4.create();
        if (kNumberOfBoxesPerAxis > 1) {
          const step = 4 / (kNumberOfBoxesPerAxis - 1);
          mat4.translate(translationMatrix, translationMatrix, vec3.fromValues(j * step - 2, 0, i * step - 2));
        } else {
          mat4.translate(translationMatrix, translationMatrix, vec3.fromValues(0, 0, 0));
        }

        const translateElapsedOffset = this.elapsedTime + boxIndex * 0.6;
        if (inTimeRange(translateElapsedOffset, 10, 12, 23)) {
          const translate = smoothstep(0, 1, middlePeakTimeRangeOffset(translateElapsedOffset, 10, 12, 23)) * 0.4;
          mat4.translate(translationMatrix, translationMatrix, vec3.fromValues(0, translate, 0));
        }

        const scaleMatrix = mat4.create();
        const scaleElapsedOffset = this.elapsedTime + boxIndex * 0.1;
        if (inTimeRange(scaleElapsedOffset, 2, 6, 19)) {
          const scale = smoothstep(0, 1, middlePeakTimeRangeOffset(scaleElapsedOffset, 2, 6, 19)) * 0.5 + 1;
          mat4.scale(scaleMatrix, scaleMatrix, vec3.fromValues(scale, scale, scale));
        }
        mat4.multiply(modelViewMatrix, translationMatrix, scaleMatrix);

        // Rotate the cube.
        const rotationMatrix = mat4.create();
        const rotationElapsedOffset = this.elapsedTime + (kNumberOfBoxes - boxIndex) * 0.1;
        if (inTimeRange(rotationElapsedOffset, 3, 7, 11)) {
          const rotation = smoothstep(0, 1, timeRangeOffset(rotationElapsedOffset, 3, 7, 11)) * Math.PI * 2;
          mat4.rotate(rotationMatrix, rotationMatrix, rotation, vec3.fromValues(0.5, 1, 1));
        }
        mat4.multiply(modelViewMatrix, modelViewMatrix, rotationMatrix);

        mat4.multiply(modelViewMatrix, baseModelViewMatrix, modelViewMatrix);

        const normalMatrix = mat4.clone(modelViewMatrix);
        mat4.transpose(normalMatrix, normalMatrix);
        mat4.invert(normalMatrix, normalMatrix);

        const uniform = new Uniform(
          new Float32Array(this.uniformBuffers[index][i * kNumberOfBoxesPerAxis + j].contents),
        );

        uniform.normal = normalMatrix;

        const modelViewProjectionMatrix = mat4.create();
        mat4.multiply(modelViewProjectionMatrix, this.projectionMatrix, modelViewMatrix);

        uniform.mvp = modelViewProjectionMatrix;

        let colorElapsedOffset = this.elapsedTime + boxIndex * 0.15;
        if (inTimeRange(colorElapsedOffset, 2, 3, 10)) {
          const redBoost = middlePeakTimeRangeOffset(colorElapsedOffset, 2, 3, 10) * 0.5;
          uniform.ambientColor[0] = Math.min(1.0, Math.max(0, kBoxBaseAmbientColor[0] + redBoost));
        } else {
          uniform.ambientColor[0] = kBoxBaseAmbientColor[0];
        }
        colorElapsedOffset = this.elapsedTime + (kNumberOfBoxes - boxIndex) * 0.1;
        if (inTimeRange(colorElapsedOffset, 7, 11, 21)) {
          const greenBoost = middlePeakTimeRangeOffset(colorElapsedOffset, 7, 11, 21) * 0.3;
          uniform.ambientColor[1] = Math.min(1.0, Math.max(0, kBoxBaseAmbientColor[1] + greenBoost));
        } else {
          uniform.ambientColor[1] = kBoxBaseAmbientColor[1];
        }
      }
    }
  }

  private draw() {
    this.elapsedTime = (Date.now() - this.startTime) / 1000;

    this.cameraRotation = Math.PI * 2 * (1 - timeRangeOffset(this.elapsedTime, 0, 11, 11));
    this.cameraAltitude = Math.sin(this.elapsedTime / 6 * Math.PI) + 1;

    const eye = vec3.create();
    vec3.add(eye, kEye, vec3.fromValues(0, this.cameraAltitude, 0));
    mat4.lookAt(this.viewMatrix, eye, kCenter, kUp);

    this.updateUniformData(this.currentUniformBufferIndex);

    const commandBuffer = this.commandQueue.createCommandBuffer();

    const drawable = this.gpu.nextDrawable();

    this.renderPassDescriptor.colorAttachments[0].texture = drawable.texture;

    const commandEncoder = commandBuffer.createRenderCommandEncoderWithDescriptor(this.renderPassDescriptor);
    commandEncoder.setDepthStencilState(this.depthStencilState);
    commandEncoder.setRenderPipelineState(this.renderPipelineState);
    commandEncoder.setVertexBuffer(this.vertexBuffer, 0, 0);

    for (const geometryBuffer of this.uniformBuffers[this.currentUniformBufferIndex]) {
      commandEncoder.setVertexBuffer(geometryBuffer, 0, 1);
      // NOTE: Our API proposal uses the enum value "triangle" here.
      // We haven't got around to implementing the enums yet.
      commandEncoder.drawPrimitives(this.gpu.PrimitiveTypeTriangle, 0, kCubeVertexData.length);
    }

    commandEncoder.endEncoding();
    commandBuffer.presentDrawable(drawable);
    commandBuffer.commit();

    this.currentUniformBufferIndex = (this.currentUniformBufferIndex + 1) % kNumActiveUniformBuffers;
    this.requestAnimationId = requestAnimationFrame(this.draw);
  }
}
