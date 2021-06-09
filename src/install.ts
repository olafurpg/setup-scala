import * as core from "@actions/core";
import * as shell from "shelljs";
import * as path from "path";
import * as fs from "fs";

const homedir = require("os").homedir();
const bin = path.join(homedir, "bin");
const runnerOs = (shell.env["RUNNER_OS"] || "undefined").toLowerCase();
const isWindows = runnerOs === "windows";


export async function install(javaVersion: string, jabbaVersion: string) {
  setEnvironmentVariableCI();
  shell.mkdir(bin);
  core.addPath(bin);
  installJava(javaVersion, jabbaVersion);
  installSbt();
  const cs = installCoursier();
  if (!cs) return;
  installSbtn(cs);
}

function setEnvironmentVariableCI() {
  core.exportVariable("CI", "true");
}

function jabbaUrlSuffix(): string {
  switch (runnerOs) {
    case "linux":
      const arch = shell.exec("uname -m", { silent: true }).stdout.trim();
      switch (arch) {
        case "arm64":
        case "aarch64":
          return "linux-arm64";

        default:
          return "linux-amd64";
      }
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

function jabbaName(): string {
  if (isWindows) return "jabba.exe";
  else return "jabba";
}

function installJava(javaVersion: string, jabbaVersion: string) {
  core.startGroup("Install Java");
  
  const jabbaUrl = `https://github.com/shyiko/jabba/releases/download/${jabbaVersion}/jabba-${jabbaVersion}-${jabbaUrlSuffix()}`;
  
  const jabba = path.join(bin, jabbaName());
  shell.set("-ev");
  shell.exec(`curl -sL -o ${jabba} ${jabbaUrl}`, { silent: true });
  shell.chmod(755, jabba);
  const jabbaInstall = javaVersion.includes("=")
    ? installJavaByExactVersion(javaVersion)
    : installJavaByFuzzyVersion(jabba, javaVersion);
  if (!jabbaInstall) return;
  console.log(`Installing ${jabbaInstall.name}`);
  const result = shell.exec(`${jabba} install ${jabbaInstall.install}`);
  if (result.code > 0) {
    core.setFailed(
      `Failed to install Java ${javaVersion}, Jabba stderr: ${result.stderr}`
    );
    return;
  }
  const javaHome = shell
    .exec(`${jabba} which --home ${jabbaInstall.name}`)
    .stdout.trim();
  core.exportVariable("JAVA_HOME", javaHome);
  core.addPath(path.join(javaHome, "bin"));
  core.endGroup();
}

interface JabbaInstall {
  name: string;
  install: string;
}

function installJavaByFuzzyVersion(
  jabba: string,
  javaVersion: string
): JabbaInstall | undefined {
  const toInstall = shell
    .exec(`${jabba} ls-remote`)
    .grep(javaVersion)
    .head({ "-n": 1 })
    .stdout.trim();
  if (!toInstall) {
    core.setFailed(
      `Couldn't find Java ${javaVersion}. To fix this problem, run 'jabba ls-remote' to see the list of valid Java versions.`
    );
    return;
  }
  return {
    name: toInstall,
    install: toInstall,
  };
}

function installJavaByExactVersion(javaVersion: string): JabbaInstall {
  return {
    name: javaVersion.split("=")[0],
    install: javaVersion,
  };
}

function installSbt() {
  core.startGroup("Install sbt");
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

function installCoursier(): string {
  core.startGroup("Install coursier");
  const cs = path.join(bin, coursierName());
  const csUrl = `https://git.io/coursier-cli-${coursierUrlSuffix()}`
  shell.exec(`curl -sL -o ${cs} ${csUrl}`, { silent: true });
  shell.chmod(755, cs);
  core.endGroup();
  return cs;
}

function coursierUrlSuffix(): string {
  switch (runnerOs) {
    case "linux":
      return "linux"
    case "macos":
      return "darwin";
    case "windows":
      return "windows-exe";
    default:
      throw new Error(
        `unknown runner OS: ${runnerOs}, expected one of linux, macos or windows.`
      );
  }
}

function coursierName(): string {
  if (isWindows) return "cs.exe";
  else return "cs";
}

function installSbtn(cs: string) {
  core.startGroup("Install sbtn");
  const result = shell.exec(`${cs} install sbtn --dir ${bin}`);
  if (result.code > 0) {
    core.setFailed(
      `Failed to install sbtn, cs stderr: ${result.stderr}`
    );
    return;
  }
  if (isWindows) {
    // create an sbtn bash script on Windows
    // so that we can call `sbtn` instead of `sbtn.bat`
    const sbtn = `${bin}/sbtn`
    const script = `
    #!/bin/bash 
    exec sbtn.bat "$@"
    `
    fs.writeFileSync(sbtn, script)
  }
  core.endGroup();
}
