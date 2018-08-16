const hasWebGPU = () => {
  return "WebGPURenderingContext" in window;
};

export const checkForWebGPU = () => {
  if (hasWebGPU()) {
    return true;
  }

  return false;
};
