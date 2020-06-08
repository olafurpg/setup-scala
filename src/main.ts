import * as core from "@actions/core";
import { install } from "./install";

async function run() {
  try {
    const javaVersion = core.getInput("java-version", { required: true });
    const jabbaVersion = core.getInput("jabba-version", { required: true });
    const bloopVersion = core.getInput("bloop-version", { required: true });
    console.log(`Installing Java version '${javaVersion}'`);
    await install(javaVersion, jabbaVersion, bloopVersion);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
