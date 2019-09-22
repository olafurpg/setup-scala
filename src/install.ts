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
    .exec("curl -sL https://github.com/shyiko/jabba/raw/master/install.sh")
    .exec("bash");
  const jabba = path.join(homedir, ".jabba", "bin", "jabba");
  const toInstall = shell
    .exec(`${jabba} ls-remote`)
    .grep(`adopt@1.${javaVersion}`)
    .head({ "-n": 1 })
    .stdout.trim();
  console.log(`Installing ${toInstall}`);
  shell.exec(`${jabba} install ${toInstall}`);
  const javaHome = shell
    .exec(`${jabba} which --home ${toInstall}`)
    .stdout.trim();
  core.exportVariable("JAVA_HOME", javaHome);
  core.addPath(path.join(javaHome, "path"));
}
function installSbt() {
  const bin = path.join(homedir, "bin");
  const sbt = path.join(bin, "sbt");
  shell.mkdir(bin);
  shell
    .exec(
      "curl -sl curl -sL https://raw.githubusercontent.com/coursier/sbt-extras/master/sbt"
    )
    .to(sbt);
  shell.chmod("+x", sbt);
  core.addPath(bin);
}
