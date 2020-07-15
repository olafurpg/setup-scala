import * as core from "@actions/core";
import * as shell from "shelljs";
import * as path from "path";

const homedir = require("os").homedir();
const bin = path.join(homedir, "bin");

export async function install(javaVersion: string, jabbaVersion: string) {
  setEnvironmentVariableCI();
  installJava(javaVersion, jabbaVersion);
  installSbt();
}

function setEnvironmentVariableCI() {
  core.exportVariable("CI", "true");
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
  // if a string using the 'version=url' format is provided, respect it (e.g. 1.14.0=tgz+https://link.to.tarball.tgz)
  const javaVersionSearch = javaVersion.split('=')[0];
  const useVersion = shell
    .exec(`${jabba} ls-remote`)
    .grep(javaVersionSearch)
    .head({ "-n": 1 })
    .stdout.trim();
  var toInstall = useVersion;
  if (!useVersion) {
    core.setFailed(`Couldn't find Java ${javaVersionSearch}. To fix this problem, run 'jabba ls-remote' to see the list of valid Java versions.`);
    return;
  }
  if (javaVersion !== javaVersionSearch) {
    toInstall = javaVersion;
  }
  console.log(`Installing ${toInstall}`);
  const result = shell.exec(`${jabba} install ${toInstall}`);
  if (result.code > 0) {
    core.setFailed(`Failed to install Java ${toInstall}, Jabba stderr: ${result.stderr}`);
    return;
  }
  const javaHome = shell
    .exec(`${jabba} which --home ${useVersion}`)
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
