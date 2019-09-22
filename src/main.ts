import * as core from "@actions/core";
import { install } from "./install";

async function run() {
  try {
    const version = core.getInput("java-version");
    console.log(`Installing Java version '${version}'`);
    await install(parseInt(version));
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
