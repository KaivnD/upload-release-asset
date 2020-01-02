const core = require('@actions/core')
const { GitHub } = require('@actions/github')
const fs = require('fs')
const path = require('path')
const mime = require('mime-types')

async function upload(file, uploadUrl) {
  // Setup headers for API call, see Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-upload-release-asset for more information
  const headers = {
    'content-type': file.type,
    'content-length': file.length
  }
  const github = new GitHub(process.env.GITHUB_TOKEN)

  // Upload a release asset
  // API Documentation: https://developer.github.com/v3/repos/releases/#upload-a-release-asset
  // Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-upload-release-asset
  const uploadAssetResponse = await github.repos.uploadReleaseAsset({
    url: uploadUrl,
    headers,
    name: file.name,
    file: fs.readFileSync(file.path)
  })

  const {
    data: { browser_download_url: browserDownloadUrl }
  } = uploadAssetResponse

  return browserDownloadUrl
}

async function run() {
  try {
    const contentLength = filePath => fs.statSync(filePath).size
    const prepare = str =>
      str.split('\n').map(item => {
        const filePath = item.trim()
        if (!fs.existsSync(filePath)) return null
        const fileInfo = path.parse(filePath)
        return {
          name: fileInfo.base,
          length: contentLength(filePath),
          path: path.resolve(filePath),
          type: mime.lookup(fileInfo.base) || 'application/octet-stream'
        }
      })
    const uploadUrl = core.getInput('upload_url', { required: true })
    const files = prepare(core.getInput('files', { required: true }))
    const downloadUrl = files.map(file => upload(file, uploadUrl))

    core.setOutput('browser_download_url', JSON.stringify(downloadUrl))
  } catch (error) {
    core.setFailed(error.message)
  }
}

module.exports = run
