const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')
const { exec } = require('child_process')
const { AbstractCompileHandler } = require('../AbstractCompileHandler')
const BuildTarget = require('./BuildTarget')

// because the qx compiler does not handle files in the root resoure folder well
// we add them here
const additionalResources = ['visu_config.xsd', 'cometvisu_management.css'];

// files that must be copied in the compiled folder
const filesToCopy = [
  "resource/sentry/bundle.min.js",
  "editor",
  "upgrade",
  "check_config.php",
  "manager.php",
  "version",
  "library_version.inc.php",
  "../node_modules/monaco-editor",
  "rest/manager"
]

class CvCompileHandler extends AbstractCompileHandler {

  onLoad() {
    if (this._config.targetType === 'build') {
      this._config.targets.some(target => {
        if (target.type === 'build') {
          target.targetClass = BuildTarget
        }
      })
    }

    let command = this._compilerApi.getCommand();
    command.addListener("made", () => this._onMade());
    command.addListener("compiledClass", this._onCompiledClass, this);
  }

  /**
   * Called after all libraries have been loaded and added to the compilation data
   */
  async _onMade() {
    await this.copyFiles()

    if (this._config.targetType === 'build') {
      return this.afterBuild()
    } else {
      return Promise.resolve(true)
    }
  }

  _onCompiledClass(ev) {
    const data = ev.getData();
    if (data.classFile.getClassName() === 'cv.Application') {
      additionalResources.forEach(res => data.dbClassInfo.assets.push(res))
    }
  }

  async copyFiles () {
    const currentDir = process.cwd()
    const targetDir = this._getTargetDir()
    if (targetDir) {
      filesToCopy.forEach(file => {
        const source = path.join(currentDir, 'source', file)
        const target = path.join(currentDir, targetDir, (file.startsWith('../') ? file.substring(3) : file))
        const stats = fs.statSync(source);
        const dirname = stats.isDirectory() ? target : path.dirname(target)
        fse.ensureDirSync(dirname)
        fse.copySync(source, target)
      })
    }

    // copy IconConfig.js to make it available for resource/icon/iconlist.html
    const classTargetDir = path.join(currentDir, targetDir, 'class', 'cv')
    fse.ensureDirSync(classTargetDir)
    fse.copySync(path.join(process.cwd(), 'source', 'class', 'cv', 'IconConfig.js'), path.join(classTargetDir, 'IconConfig.js'))

    if (this._config.targetType === 'source' || this._dbConfig.db("fakeLogin") === "true") {
      // copy a fake /cgi-bin/l response to the target folder
      fse.copySync(path.join(process.cwd(), 'source', 'resource', 'test'), path.join(targetDir, 'cgi-bin'))
    }
  }

  /**
   * Executed after the build version has been compiled
   */
  async afterBuild () {
    // build-libs
    console.log('uglifying libraries')
    exec('grunt uglify:libs')

    const targetDir = this._getTargetDir()

    // build-paths
    console.log('update paths')
    exec('./cv build -up -d ' + targetDir)
  }
}

module.exports = {
  CvCompileHandler: CvCompileHandler
}