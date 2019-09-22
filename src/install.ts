import * as core from "@actions/core";
import * as shell from "shelljs";
import * as path from "path";

const homedir = require("os").homedir();

export async function install(javaVersion: string) {
  installJava(javaVersion);
  installSbt();
}

function installJava(javaVersion: string) {
  shell
    .exec("curl -sL https://github.com/shyiko/jabba/raw/master/install.sh", {
      silent: true
    })
    .exec("bash");
  const jabba = path.join(homedir, ".jabba", "bin", "jabba");
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
}

function installSbt() {
  const bin = path.join(homedir, "bin");
  shell.mkdir(bin);
  core.addPath(bin);
  curl(
    "https://raw.githubusercontent.com/sbt/sbt-launcher-package/master/src/universal/bin/sbt",
    path.join(bin, "sbt")
  );
  curl(
    "curl -sl curl -sL https://raw.githubusercontent.com/coursier/sbt-extras/master/sbt",
    path.join(bin, "csbt")
  );
}

function curl(url: string, outputFile: string) {
  shell.exec(`curl -sL ${url}`, { silent: true }).to(outputFile);
  shell.chmod("+x", outputFile);
  console.log(`Installed binary '${path.basename(outputFile)}'`);
}
