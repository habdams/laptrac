let resolveAuthReady: () => void;

// This promise acts as a barrier that Axios will wait for
export const authReadyPromise = new Promise<void>((resolve) => {
  resolveAuthReady = resolve;
});

// Call this function once your OpenID setup or token check is complete
export const setAuthAsReady = () => {
  resolveAuthReady();
};
