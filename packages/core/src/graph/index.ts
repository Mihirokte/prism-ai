export { buildGraphFromGtr, type DepGraph } from "./build.js";
export {
  findCircularDependencies,
  couplingScore,
  findDeadCode,
  type CircularDepsResult,
} from "./analyze.js";
export { traceFrom, findPath, type TraceStep } from "./trace.js";
export { toMermaid, toJson } from "./export.js";
