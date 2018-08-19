declare class WebGPURenderingContext {
  createBuffer(data: ArrayBufferView): WebGPUBuffer;
  createCommandQueue(): WebGPUCommandQueue;
  createComputePipelineState(func: WebGPUFunction): WebGPUComputePipelineState;
  createComputePipelineState(descriptor: WebGPUComputePipelineDescriptor): WebGPUComputePipelineState;
  createDepthStencilState(descriptor: WebGPUDepthStencilDescriptor): WebGPUDepthStencilState;
  createLibrary(sourceCode: string): WebGPULibrary;
  createRenderPipelineState(descriptor: WebGPURenderPipelineDescriptor): WebGPURenderPipelineState;
  createTexture(descriptor: WebGPUTextureDescriptor): WebGPUTexture;
  nextDrawable(): WebGPUDrawable;

  readonly CompareFunctionNever : 0;
  readonly CompareFunctionLess : 1;
  readonly CompareFunctionEqual : 2;
  readonly CompareFunctionLessEqual : 3;
  readonly CompareFunctionGreater : 4;
  readonly CompareFunctionNotEqual : 5;
  readonly CompareFunctionGreaterEqual : 6;
  readonly CompareFunctionAlways : 7;

  readonly LoadActionDontCare : WebGPULoadAction.DontCare;
  readonly LoadActionLoad : WebGPULoadAction.Load;
  readonly LoadActionClear : WebGPULoadAction.Clear;

  readonly PixelFormatInvalid : WebGPUPixelFormat.Invalid;
  readonly PixelFormatBGRA8Unorm : WebGPUPixelFormat.BGRA8Unorm;
  readonly PixelFormatDepth32Float : WebGPUPixelFormat.Depth32Float;
  readonly PixelFormatStencil8 : WebGPUPixelFormat.Stencil8;

  readonly PrimitiveTypePoint : WebGPUPrimitiveType.Point;
  readonly PrimitiveTypeLine : WebGPUPrimitiveType.Line;
  readonly PrimitiveTypeLineStrip : WebGPUPrimitiveType.LineStrip;
  readonly PrimitiveTypeTriangle : WebGPUPrimitiveType.Triangle;
  readonly PrimitiveTypeTriangleStrip : WebGPUPrimitiveType.TriangleStrip;

  readonly StorageModeShared : WebGPUStorageModeShared.Shared;
  readonly StorageModeManaged : WebGPUStorageModeShared.Managed;
  readonly StorageModePrivate : WebGPUStorageModeShared.Private;

  readonly StoreActionDontCare : WebGPUStoreAction.DontCare;
  readonly StoreActionStore : WebGPUStoreAction.Store;
  readonly StoreActionMultisampleResolve : WebGPUStoreAction.MultisampleResolve;

  readonly TextureType1D : WebGPUTextureType.Texture1D;
  readonly TextureType1DArray : WebGPUTextureType.Texture1DArray;
  readonly TextureType2D : WebGPUTextureType.Texture2D;
  readonly TextureType2DArray : WebGPUTextureType.Texture2DArray;
  readonly TextureType2DMultisample : WebGPUTextureType.Texture2DMultisample;
  readonly TextureTypeCube : WebGPUTextureType.TextureCube;
  readonly TextureTypeCubeArray : WebGPUTextureType.TextureCubeArray;
  readonly TextureType3D : WebGPUTextureType.Texture3D;

  readonly TextureUsageUnknown : WebGPUTextureUsage.Unknown;
  readonly TextureUsageShaderRead : WebGPUTextureUsage.ShaderRead;
  readonly TextureUsageShaderWrite : WebGPUTextureUsage.ShaderWrite;
  readonly TextureUsageRenderTarget : WebGPUTextureUsage.RenderTarget;
  readonly TextureUsagePixelFormatView : WebGPUTextureUsage.PixelFormatView;
}

declare class WebGPURenderPipelineDescriptor {
  readonly colorAttachments : ReadonlyArray<WebGPURenderPipelineColorAttachmentDescriptor>;
  depthAttachmentPixelFormat : WebGPUPixelFormat;
  fragmentFunction : WebGPUFunction;
  vertexFunction : WebGPUFunction;
  reset(): void;
}

declare class WebGPURenderPassDescriptor {
  readonly colorAttachments: ReadonlyArray<WebGPURenderPassColorAttachmentDescriptor>;
  depthAttachment: WebGPURenderPassDepthAttachmentDescriptor;
}

declare class WebGPUTextureDescriptor {
  textureType: WebGPUTextureType;
  sampleCount: number;
  usage: WebGPUTextureUsage;
  storageMode: WebGPUStorageModeShared;

  constructor(
    pixelFormat: WebGPUPixelFormat,
    width: number,
    height: number,
    mipmapped: boolean
  );
}

declare class WebGPUComputePipelineDescriptor {
}

declare class WebGPUDepthStencilDescriptor {
  depthWriteEnabled: boolean;
  depthCompareFunction: WebGPUCompareFunction;
}

declare interface WebGPUBuffer {
  readonly contents: ArrayBuffer;
  readonly length: number;
}

declare interface WebGPUCommandQueue {
  readonly label: string;
  createCommandBuffer(): WebGPUCommandBuffer;
}

declare interface WebGPUFunction {
  readonly name: string;
}

declare interface WebGPUComputePipelineState {
}

declare interface WebGPUDepthStencilState {
}

declare interface WebGPULibrary {
  readonly functionNames: ReadonlyArray<string>;
  readonly label: string;
  readonly sourceCode: string;
  functionWithName(name: string): WebGPUFunction;
}


declare interface WebGPURenderPipelineState {
  readonly label: string;
}

declare interface WebGPUTextureDescriptor {
}

declare interface WebGPUTexture {
}

declare interface WebGPUDrawable {
  readonly texture: WebGPUTexture;
}

declare interface WebGPUCommandBuffer {
  readonly completed: Promise<boolean>;
  commit(): void;
  createComputeCommandEncoder() : WebGPUComputeCommandEncoder;
  createRenderCommandEncoderWithDescriptor(descriptor: WebGPURenderPassDescriptor): WebGPURenderCommandEncoder;
  presentDrawable(drawable: WebGPUDrawable): void;
}

interface WebGPURenderPipelineColorAttachmentDescriptor {
  pixelFormat: WebGPUPixelFormat;
}

declare interface WebGPURenderPassColorAttachmentDescriptor {
  clearColor: ArrayLike<number>;
  loadAction: WebGPULoadAction;
  storeAction: WebGPUStoreAction;
  texture: WebGPUTexture;
}

declare interface WebGPURenderPassDepthAttachmentDescriptor {
  loadAction: WebGPULoadAction;
  storeAction: WebGPUStoreAction;
  clearDepth: number;
  texture: WebGPUTexture;
}

declare interface WebGPUComputeCommandEncoder {
}

declare interface WebGPURenderCommandEncoder {
  drawPrimitives(type: WebGPUPrimitiveType, start: number, count: number);
  endEncoding(): void;
  setDepthStencilState(depthStencilState: WebGPUDepthStencilState): void;
  setFragmentBuffer(buffer: WebGPUBuffer, offset: number, index: number): void;
  setRenderPipelineState(pipelineState: WebGPURenderPipelineState): void;
  setVertexBuffer(buffer: WebGPUBuffer, offset: number, index: number): void;
}

declare interface HTMLCanvasElement {
  getContext(contextId: "webgpu"): WebGPURenderingContext | null;
}

declare enum WebGPUPixelFormat {
  Invalid = 0,
  BGRA8Unorm = 80,
  Depth32Float = 252,
  Stencil8 = 253
}

declare enum WebGPUStoreAction {
  DontCare = 0,
  Store = 1,
  MultisampleResolve = 2
}

declare enum WebGPULoadAction {
  DontCare = 0,
  Load = 1,
  Clear = 2
}

declare enum WebGPUPrimitiveType {
  Point = 0,
  Line = 1,
  LineStrip = 2,
  Triangle = 3,
  TriangleStrip = 4
}

declare enum WebGPUTextureType {
  Texture1D = 0,
  Texture1DArray = 1,
  Texture2D = 2,
  Texture2DArray = 3,
  Texture2DMultisample = 4,
  TextureCube = 5,
  TextureCubeArray = 6,
  Texture3D = 7
}

declare enum WebGPUTextureUsage {
  Unknown = 0,
  ShaderRead = 1,
  ShaderWrite = 2,
  RenderTarget = 4,
  PixelFormatView = 16
}

declare enum WebGPUStorageModeShared {
  Shared = 0,
  Managed = 1,
  Private = 2
}

declare type WebGPUCompareFunction = "never" | "less" | "equal" | "lessequal" | "greater" | "notequal" | "greaterequal" | "always";
