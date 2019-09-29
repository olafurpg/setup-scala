import * as core from "@actions/core";
import * as shell from "shelljs";
import * as path from "path";

const homedir = require("os").homedir();
const bin = path.join(homedir, "bin");

export async function install(javaVersion: string, jabbaVersion: string) {
  installJava(javaVersion, jabbaVersion);
  installSbt();
}

function jabbaUrlSuffix(): string {
  const runnerOs = shell.env["RUNNER_OS"] || "undefined";
  switch (runnerOs.toLowerCase()) {
    case "linux":
      return "linux-amd64";
    case "macos":
      return "darwin-amd64";
    case "windows":
      return "windows-amd64.exe";
    default:
      throw new Error(
        `unknown runner OS: ${runnerOs}, expected one of Linux, macOS or Windows.`
      );
  }
}

function isWindows(): boolean {
  return shell.env["RUNNER_OS"] === "Windows";
}

function jabbaName(): string {
  if (isWindows()) return "jabba.exe";
  else return "jabba";
}

function installJava(javaVersion: string, jabbaVersion: string) {
  core.startGroup("Install Java");
  core.addPath(bin);
  const jabbaUrl = `https://github.com/shyiko/jabba/releases/download/${jabbaVersion}/jabba-${jabbaVersion}-${jabbaUrlSuffix()}`;
  shell.mkdir(bin);
  const jabba = path.join(bin, jabbaName());
  shell.set("-ev");
  shell.exec(`curl -sL -o ${jabba} ${jabbaUrl}`, { silent: true });
  shell.chmod(755, jabba);
  const toInstall = shell
    .exec(`${jabba} ls-remote`)
    .grep(javaVersion)
    .head({ "-n": 1 })
    .stdout.trim();
  console.log(`Installing ${toInstall}`);
  shell.exec(`${jabba} install ${toInstall}`);
  const javaHome = shell
    .exec(`${jabba} which --home ${toInstall}`)
    .stdout.trim();
  core.exportVariable("JAVA_HOME", javaHome);
  core.addPath(path.join(javaHome, "bin"));
  core.endGroup();
}

function installSbt() {
  core.startGroup("Install sbt");
  core.addPath(bin);
  curl(
    "https://raw.githubusercontent.com/paulp/sbt-extras/master/sbt",
    path.join(bin, "sbt")
  );
  curl(
    "https://raw.githubusercontent.com/coursier/sbt-extras/master/sbt",
    path.join(bin, "csbt")
  );
  core.endGroup();
}

function curl(url: string, outputFile: string) {
  shell.exec(`curl -sL ${url}`, { silent: true }).to(outputFile);
  shell.chmod(755, outputFile);
  shell.cat(outputFile);
  console.log(`Downloaded '${path.basename(outputFile)}' to ${outputFile}`);
}
