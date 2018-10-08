#!/usr/bin/env python3
import glob
import json
import os
import shutil
import time
import urllib.request
import xml.etree.ElementTree as ET
import re
from datetime import datetime
import locale
from zipfile import ZipFile

locale.setlocale(locale.LC_ALL, '')

NIGHTLY_PATH = 'https://dl.bintray.com/cometvisu/CometVisu/'
RELEASE_PATH = 'https://api.github.com/repos/CometVisu/CometVisu/releases/latest'
# TODO get path from parameter later
CV_PATH = './build'

sep_width = 70

def get_latest_nightly():
    with urllib.request.urlopen(NIGHTLY_PATH) as response:
        html = ET.fromstring(response.read())
        newest = {'date': 0, 'name': '', 'version': ''}
        for node in html.findall('.//body/pre/a'):
            match = re.search('^CometVisu-([0-9\.]+(-dev)?)-([0-9]+)\.zip$', node.text)
            if match is not None:
                date = datetime.strptime(match.group(3), '%Y%m%d%H%M%S')
                name = match.group(0)
                version = match.group(1)
                if newest['date'] == 0 or newest['date'] < date:
                    newest = {'date': date, 'name': name, 'version': version, 'url': '%s%s' % (NIGHTLY_PATH, name)}
    return newest


def get_latest_release():
    with urllib.request.urlopen(RELEASE_PATH) as response:
        data = json.loads(response.read())
        release = {'date': datetime.strptime(data['published_at'], '%Y-%m-%dT%H:%M:%SZ'), 'name': data['name'], 'version': data['tag_name']}
        for asset in data['assets']:
            if asset['content_type'] == 'application/zip':
                release['url'] = asset['browser_download_url']
                release['name'] = asset['name']

        return release


def get_installed_version():
    with open(os.path.join(CV_PATH, 'version')) as f:
        return f.read()


def has_resource_folder(version):
    match = re.search('^v?([0-9]+)\.([0-9]+)\.([0-9]+)(-dev)?$', version)
    return int(match.group(1)) > 0 or int(match.group(2)) >= 11


def install_version(cv, current_version):
    # 1. Download + extract in temp dir
    os.makedirs('tmp', exist_ok=True)

    # TODO: define source and target dirs from versions (>0.11 use resource folder, <=0.10 no resource folder)

    tmp_file = os.path.join('download.zip')
    print()
    print('-' * sep_width)
    print('>>> Downloading %s to %s' % (cv['url'], tmp_file))
    if os.path.exists(tmp_file):
        os.remove(tmp_file)
    with urllib.request.urlopen(cv['url']) as response, open(tmp_file, 'wb') as f:
        data = response.read() # a `bytes` object
        f.write(data)
    print('-' * sep_width)
    # create tempdir
    new_cv_dir = os.path.join('tmp', 'cometvisu', 'release')
    with ZipFile(tmp_file, 'r') as zip:
        files = [n for n in zip.namelist()
                 if n.startswith('cometvisu/release/') and not n.endswith('/')]
        zip.extractall('tmp', members=files)

    # 2.1 copy config from old visu
    target_has_resource = has_resource_folder(cv['version'])
    source_config_dir = os.path.join(CV_PATH, 'resource', 'config') if has_resource_folder(current_version) else os.path.join(CV_PATH, 'config')
    target_config_dir = os.path.join(new_cv_dir, 'resource', 'config') if target_has_resource else os.path.join(new_cv_dir, 'config')
    print()
    print('-' * sep_width)
    print('>>> Copying customizable files from old installation')
    if os.path.exists(source_config_dir):
        shutil.rmtree(target_config_dir)
        print(' - copying %s to %s' % (source_config_dir, target_config_dir))
        shutil.copytree(source_config_dir, target_config_dir)
    else:
        print('existing config directory not found')
        return

    # 2.2 copy design customs from old visu
    for file in glob.glob(os.path.join(CV_PATH, '**', 'designs', '*', 'custom.css')):
        match = re.search('.+%sdesigns%s(.+)%scustom\.css$' % (os.path.sep, os.path.sep, os.path.sep), file)
        dest_dir = os.path.join(new_cv_dir, 'resource', 'designs', match.group(1)) if target_has_resource else os.path.join(new_cv_dir, 'designs', match.group(1))
        print(' - copying %s to %s' % (file, dest_dir))
        shutil.copy(file, dest_dir)
    print('-' * sep_width)

    # 3. move old visu to backup
    print()
    print('-' * sep_width)
    print('>>> Replacing old installation')
    backup_dir = os.path.join('cv-backup-%s' % time.time())
    print(' - backup old installation to %s' % backup_dir)
    shutil.move(CV_PATH, backup_dir)

    # 4. move new visu to old position
    print(' - move new installation to %s' % CV_PATH)
    shutil.move(new_cv_dir, CV_PATH)
    print('-' * sep_width)

    print('')
    print('>>> DONE. CometVisu version %s has been installed into %s!' % (cv['version'], CV_PATH))


if __name__ == '__main__':
    current = get_installed_version()
    nightly = get_latest_nightly()
    release = get_latest_release()
    print('\t\t\t\tVersion\t\tDate')
    print('-' * sep_width)
    print('Currently installed version:\t{0}'.format(current))
    print('Latest nightly build:\t\t{:}\t{:%x %X}'.format(nightly['version'], nightly['date']))
    print('Latest release:\t\t\t{:}\t\t{:%x %X}'.format(release['version'], release['date']))

    # check if the current version is upgradable and let the user decide wich version to use
    print('Please choose which CometVisu version should be installed:')
    action = input('(0) do nothing\n(1) latest release\n(2) latest nightly build\nPlease enter number: ')
    if action == "1":
        install_version(release, current)
    elif action == "2":
        install_version(nightly, current)
    elif action == "0":
        pass
    else:
        print('unknown option: %s' % action)