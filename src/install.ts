import * as core from "@actions/core";
import * as shell from "shelljs";
import * as path from "path";

const homedir = require("os").homedir();

export async function install(javaVersion: string) {
  installJava(javaVersion);
  installSbt();
}

function installJava(javaVersion: string) {
  core.startGroup("Install Java");
  shell
    .exec("curl -sL https://github.com/shyiko/jabba/raw/master/install.sh", {
      silent: true
    })
    .exec("bash");
  const jabbaBin = path.join(homedir, ".jabba", "bin");
  core.addPath(jabbaBin);
  const jabba = path.join(jabbaBin, "jabba");
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
  const bin = path.join(homedir, "bin");
  shell.mkdir(bin);
  core.addPath(bin);
  curl("https://raw.githubusercontent.com/paulp/sbt-extras/master/sbt", "sbt");
  curl(
    "https://raw.githubusercontent.com/coursier/sbt-extras/master/sbt",
    path.join(bin, "csbt")
  );
  core.endGroup();
}

function curl(url: string, outputFile: string) {
  shell.exec(`curl -sL ${url}`, { silent: true }).to(outputFile);
  shell.chmod(755, outputFile);
  console.log(`Downloaded '${path.basename(outputFile)}'`);
}
