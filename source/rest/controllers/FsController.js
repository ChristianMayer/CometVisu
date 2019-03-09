const path = require('path')
const fs = require('fs')
const config = require('../config')
const FileHandler = require('../lib/FileHandler')

class FsController extends FileHandler {
  constructor() {
    super()
    this.basePath = config.configDir
  }

  /**
   * Return folder listing or file content, depending on the path type
   * @param context {Context}
   * @returns {*}
   */
  read(context) {
    return this.__processRequest(context, fsPath => {
      return this.__folderListing(fsPath);
    }, fsPath => {
      return fs.readFileSync(fsPath, 'utf8')
    })
  }

  create(context) {
    return this.__processRequest(context, fsPath => {
      this.createFolder(context, fsPath, context.requestBody);
    }, fsPath => {
      this.createFile(context, fsPath, context.requestBody);
    })
  }

  update(context) {
    return this.__processRequest(context, null, fsPath => {
      this.updateFile(context, fsPath, context.requestBody);
    })
  }

  delete(context) {
    return this.__processRequest(context, fsPath => {
      this.deleteFolder(context, fsPath);
    }, fsPath => {
      this.deleteFile(context, fsPath);
    })
  }

  __processRequest(context, folderCallback, fileCallback) {
    const fsPath = this.__getAbsolutePath(context.params.query.path)
    if (fs.existsSync(fsPath)) {
      try {
        const stats = fs.statSync(fsPath)
        if (stats.isDirectory()) {
          if (folderCallback) {
            return folderCallback(fsPath)
          }
        } else {
          if (fileCallback) {
            return fileCallback(fsPath);
          }
        }
      } catch (err) {
        // no read access to path
        this.respondMessage(context,403, 'Forbidden')
      }
    } else {
      this.respondMessage(context,404, 'Folder not found')
    }
  }

  __folderListing(fsPath) {
    const res = []
    fs.readdirSync(fsPath).forEach(file => {
      if (!file.startsWith('.')) {
        try {
          const stats = fs.statSync(path.join(fsPath, file))
          let relFolder = fsPath.substring(this.basePath.length + 1)
          if (relFolder.length > 0) {
            relFolder += '/'
          }
          const fullPath = path.join(fsPath, file)
          const entry = {
            name: file,
            type: stats.isDirectory() ? 'dir' : (stats.isFile() ? 'file' : null),
            parentFolder: relFolder,
            hasChildren: stats.isDirectory() ? fs.readdirSync(fullPath).length > 0 : false,
            readable: false,
            writeable: false
          }
          try {
            fs.accessSync(fullPath, fs.constants.R_OK)
            entry.readable = true
          } catch (err) {
          }
          try {
            fs.accessSync(fullPath, fs.constants.W_OK)
            entry.writeable = true
          } catch (err) {
          }
          res.push(entry)
        } catch (err) {
          // error accessing the entry -> do not add it to the resultset
        }
      }
    })
    return res
  }

  __getAbsolutePath(fsPath) {
    fsPath = this.__sanitize(fsPath)
    return path.join(this.basePath, fsPath)
  }

  __sanitize(folder) {
    while (folder.startsWith('../')) {
      folder = folder.substring(3)
    }
    if (folder.startsWith('/')) {
      folder = folder.substring(1);
    }
    return folder
  }
}

const fsController = new FsController()

module.exports = fsController