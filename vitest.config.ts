export default {
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
    },
    globalSetup: ["./setupTests.ts"],
    include: ["src/**/*.test.ts"],
    setupFiles: ["./setupTests.ts"],
  },
};
