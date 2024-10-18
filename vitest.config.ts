export default {
  test: {
    globalSetup: ["./setupTests.ts"],
    include: ["src/**/*.test.ts"],
    setupFiles: ["./setupTests.ts"],
  },
};
