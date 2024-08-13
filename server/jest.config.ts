export default {
  moduleFileExtensions: [
    "js",
    "json",
    "ts",
  ],
  rootDir: "src",
  testRegex: ".*\\.(spec|test)\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  moduleNameMapper: {
    "src/(.*)": "<rootDir>/$1",
    "@entities/(.*)": "<rootDir>/entities/$1",
  },
};
