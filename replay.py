#!/usr/bin/python
# -*- coding: utf-8 -*-

# copyright (c) 2010-2016, Christian Mayer and the CometVisu contributers.
#
# This program is free software; you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation; either version 3 of the License, or (at your option)
# any later version.
#
# This program is distributed in the hope that it will be useful, but WITHOUT
# ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
# FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along
# with this program; if not, write to the Free Software Foundation, Inc.,
# 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA

import sys
import os
import sh
from argparse import ArgumentParser
import threading
import socket
import errno
import json
import shutil

try:
    # Python 2.x
    from SocketServer import ThreadingMixIn
    from SimpleHTTPServer import SimpleHTTPRequestHandler
    from BaseHTTPServer import HTTPServer
except ImportError:
    # Python 3.x
    from socketserver import ThreadingMixIn
    from http.server import SimpleHTTPRequestHandler, HTTPServer


class ThreadingSimpleServer(ThreadingMixIn, HTTPServer):
    """ threadable HTTPServer """
    pass


class MutedHttpRequestHandler(SimpleHTTPRequestHandler):
    """ Mute the log messages """
    def log_message(self, format, *args):
        pass


def prepare_replay(file):
    with open(os.path.join("source", "replay-log.js"), "w") as target:
        with open(file) as source:
            data = source.read()
            target.write('var replayLog = %s;' % data)

            return json.loads(data)["data"]["runtime"]


def start_browser(url, browser="chrome", size="1024,768", open_devtools=False):
    print("Starting browser %s..." % browser)

    user_dir = os.getcwd()+"/."+browser

    try:
        shutil.rmtree(user_dir)
    except OSError:
        pass

    if browser == "chrome":
        flags = [
            "--no-first-run", "--disk-cache-dir=/dev/null",
            "--disk-cache-size=1", "--window-size=%s" % size,
            "--user-data-dir=%s" % user_dir, "--disable-popup-blocking",
            "--media-cache-size=1"
        ]
        if open_devtools is True:
            flags.append("--auto-open-devtools-for-tabs")

        flags.append("--app=%s" % url)
        sh.google_chrome(*flags)
    else:
        print("browser %s not yet supported" % browser)


def get_server(host="", port=9000, next_attempts=0):
    while next_attempts >= 0:
        try:
            server = ThreadingSimpleServer((host, port), MutedHttpRequestHandler)
            return server, port
        except socket.error as e:
            if e.errno == errno.EADDRINUSE:
                next_attempts -= 1
                port += 1
            else:
                raise

if __name__ == '__main__':
    parser = ArgumentParser(usage="%(prog)s - CometVisu documentation helper commands")

    parser.add_argument('file', type=str, help='log file')
    options, unknown = parser.parse_known_args()

    settings = prepare_replay(sys.argv[1])
    window_size = "%s,%s" % (settings["width"], settings["height"])
    browser_name = settings["browserName"] if settings["browserName"] is not None else "chrome"
    anchor = "#%s" % settings["anchor"] if "anchor" in settings and settings["anchor"] is not None else ""

    print("Replaying log recorded with CometVisu:")
    print("  Branch:   %s" % settings["cv"]["BRANCH"])
    print("  Revision: %s" % settings["cv"]["REV"])
    print("  Version:  %s" % settings["cv"]["VERSION"])
    print("  Date:     %s" % settings["cv"]["DATE"])
    print("")

    print("Stop with Strg + c")
    print("")

    hostname = ""
    port = 9000

    # start server
    server, port = get_server(hostname, port, 10)

    try:
        thread = threading.Thread(target=server.serve_forever)
        thread.start()

        # open browser
        start_browser("http://localhost:%s/source/replay.html%s" % (port, anchor), browser=browser_name, size=window_size)

        while thread.isAlive():
            thread.join(1)

    except (KeyboardInterrupt, SystemExit):
        print("aborted")
        server.shutdown()
        sys.exit()