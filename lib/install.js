"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.install = void 0;
const core = __importStar(require("@actions/core"));
const shell = __importStar(require("shelljs"));
const path = __importStar(require("path"));
const homedir = require("os").homedir();
const bin = path.join(homedir, "bin");
function install(javaVersion, jabbaVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        setEnvironmentVariableCI();
        installJava(javaVersion, jabbaVersion);
        installSbt();
    });
}
exports.install = install;
function setEnvironmentVariableCI() {
    core.exportVariable("CI", "true");
}
function jabbaUrlSuffix() {
    const runnerOs = shell.env["RUNNER_OS"] || "undefined";
    switch (runnerOs.toLowerCase()) {
        case "linux":
            return "linux-amd64";
        case "macos":
            return "darwin-amd64";
        case "windows":
            return "windows-amd64.exe";
        default:
            throw new Error(`unknown runner OS: ${runnerOs}, expected one of Linux, macOS or Windows.`);
    }
}
function isWindows() {
    return shell.env["RUNNER_OS"] === "Windows";
}
function jabbaName() {
    if (isWindows())
        return "jabba.exe";
    else
        return "jabba";
}
function installJava(javaVersion, jabbaVersion) {
    core.startGroup("Install Java");
    core.addPath(bin);
    const jabbaUrl = `https://github.com/shyiko/jabba/releases/download/${jabbaVersion}/jabba-${jabbaVersion}-${jabbaUrlSuffix()}`;
    shell.mkdir(bin);
    const jabba = path.join(bin, jabbaName());
    shell.set("-ev");
    shell.exec(`curl -sL -o ${jabba} ${jabbaUrl}`, { silent: true });
    shell.chmod(755, jabba);
    const jabbaInstall = javaVersion.includes("=")
        ? installJavaByExactVersion(javaVersion)
        : installJavaByFuzzyVersion(jabba, javaVersion);
    if (!jabbaInstall)
        return;
    console.log(`Installing ${jabbaInstall.name}`);
    const result = shell.exec(`${jabba} install ${jabbaInstall.install}`);
    if (result.code > 0) {
        core.setFailed(`Failed to install Java ${javaVersion}, Jabba stderr: ${result.stderr}`);
        return;
    }
    const javaHome = shell
        .exec(`${jabba} which --home ${jabbaInstall.name}`)
        .stdout.trim();
    core.exportVariable("JAVA_HOME", javaHome);
    core.addPath(path.join(javaHome, "bin"));
    core.endGroup();
}
function installJavaByFuzzyVersion(jabba, javaVersion) {
    const toInstall = shell
        .exec(`${jabba} ls-remote`)
        .grep(javaVersion)
        .head({ "-n": 1 })
        .stdout.trim();
    if (!toInstall) {
        core.setFailed(`Couldn't find Java ${javaVersion}. To fix this problem, run 'jabba ls-remote' to see the list of valid Java versions.`);
        return;
    }
    return {
        name: toInstall,
        install: toInstall,
    };
}
function installJavaByExactVersion(javaVersion) {
    return {
        name: javaVersion.split("=")[0],
        install: javaVersion,
    };
}
function installSbt() {
    core.startGroup("Install sbt");
    core.addPath(bin);
    curl("https://raw.githubusercontent.com/paulp/sbt-extras/master/sbt", path.join(bin, "sbt"));
    curl("https://raw.githubusercontent.com/coursier/sbt-extras/master/sbt", path.join(bin, "csbt"));
    core.endGroup();
}
function curl(url, outputFile) {
    shell.exec(`curl -sL ${url}`, { silent: true }).to(outputFile);
    shell.chmod(755, outputFile);
    shell.cat(outputFile);
    console.log(`Downloaded '${path.basename(outputFile)}' to ${outputFile}`);
}
