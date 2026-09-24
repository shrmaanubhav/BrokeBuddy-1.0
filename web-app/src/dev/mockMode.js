export const isDevMode = () => {
  return typeof window !== "undefined" && window.__BROKEBUDDY_DEV_MODE__ === true;
};

export const waitForMock = (ms = 250) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
