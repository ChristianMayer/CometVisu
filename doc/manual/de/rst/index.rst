.. raw:: mediawiki

   {{TOCright}}

Willkommen bei der `CometVisu <CometVisu>`__!
---------------------------------------------

CometVisu ist eine webbasierte Visualisierungslösung für den Bereich der
Hausautomation. Sie kann direkt auf den `KNX <KNX>`__ zugreifen (über
den eibd, bzw. knxd) oder auf alles aus der
`OpenHAB <http://www.openhab.org/>`__-Welt. Die aktuelle Version wird
auf sourceforge.net veröffentlicht.

Diese Dokumentation ist für die aktuelle Version 0.8.5

Die Dokumentation für die 0.6.2 findet man unter `Benutzerhandbuch
Version 0.6.2 <CometVisu/manual/de>`__

Die Dokumentation für die 0.8.0 findet man unter `Benutzerhandbuch
Version 0.8.0 <CometVisu/0.8.0/manual/de>`__

Die deutsche FAQ findet man `hier <CometVisu/FAQ_(Deutsch)>`__

**Aufgabenliste für die CV-Doku:
`CometVisu/0.8.x/aufgaben/de <CometVisu/0.8.x/aufgaben/de>`__**

Systemvoraussetzungen
---------------------

Die **Bedienung** durch die Anwender erfolgt über einen Webbrowser. Die
meisten aktuellen Browser werden unterstützt.

Durch Angabe von `Parametern im URL <CometVisu/URL_parameter/de>`__ kann
man zusätzlich die CometVisu beeinflussen, zum Bespiel andere Configs
oder Design laden, ebenso aber die Darstellung für Mobilgeräte wie z.B.
Smartphones erzwingen.

Bedienung der CometVisu
-----------------------

Das Hauptmenü befindet sich in der Fußzeile und besteht normalerweise
aus verschiedenen Links:

-  Link auf die Homepage des Projekts CometVisu
-  "**Reload**" um die aktuelle Seite neu aufzurufen.

        *Achtung*: Im Editormodus gehen ohne Nachfrage alle nicht
        abgespeicherten Änderungen verloren!

-  "**Widget Demo**": Zeigt die verschiedenen Bedienelemente und ihre
   Verwendungsmöglichkeiten auf.
-  "**`Edit <CometVisu/0.8.x/editor/de>`__**": Wechselt in den Editor.
-  "**Check Config**": Tool, um die Konfigurationsdatei auf syntaktische
   Fehler zu überprüfen. "config visu\_config is valid XML" bedeutet,
   dass die Konfigurationsdatei formal in Ordnung ist, darunter wird dir
   aktuelle Konfigurationsdatei angezeigt..

(Über die Config-Datei kann man den Inhalt der Fußzeile den eigenen
Bedürfnissen anpassen)

Installation der CometVisu
--------------------------

Einfache Installation:

-  `Allgemein <CometVisu/Installation/de>`__
-  `auf Wiregate <CometVisu/Installation/WireGate/de>`__
-  `auf Raspberry Pi <CometVisu/Installation/Raspberry_Pi/de>`__

Schwieriger, nur für Fortgeschrittene:

-  `auf beliebigen anderen
   Linux-Systemen <CometVisu/0.8.x/installation/de/linux>`__
-  `auf NAS-Systemen <CometVisu/0.8.x/installation/de/nas>`__

Informationen wie man die CometVisu auf OpenHAB installiert gibt es auf
englisch in der
`OpenHAB-WIKI <https://github.com/openhab/openhab/wiki/Comet-Visu>`__

Man kann auch die aktuelle Entwickler-Version installieren, diese sollte
jedoch NIE produktiv eingesetzt werden.

-  `Infos zur Installation
   Development-Version <CometVisu/HowTo_install_the_development_version_on_the_WireGate>`__
   - auf eigene Gefahr!!!

Update der CometVisu
--------------------

falls eine Version 0.8 schon installiert war kann die Installation
direkt aktualsiert werden auf dem
`WireGate <CometVisu/0.8.x/manual/updatewiregate/de>`__ oder `anderen
Installationen <CometVisu/0.8.x/manual/updateother/de>`__

CometVisu-Designs
-----------------

-  `Metal <CometVisu/demo_config/swiss/de>`__ das wohl beliebsteste
   Design
-  `Pure <CometVisu/0.8.x/designs/pure/de/>`__
-  `Diskreet <CometVisu/0.8.x/designs/diskreet/de/>`__
-  `Discreet Sand <CometVisu/0.8.x/designs/discreet_sand/de/>`__
-  `Discreet Slim <CometVisu/0.8.x/designs/discreet_slim/de/>`__
-  `Alaska <CometVisu/0.8.x/designs/alaska/de/>`__
-  `Alaska Slim <CometVisu/0.8.x/designs/alaska_slim/de/>`__

Es ist auch möglich eigene Design zu implementieren.

Farben in der CometVisu
-----------------------

werden grundsätzlich hexadezimal im `0xRGB
Format <http://de.wikipedia.org/wiki/Hexadezimale_Farbdefinition>`__
angegeben.

Hilfe, Beispiele und Farbwerte findet man
`hier <http://www.z1-web.de/Webmaster-Tools-HTML-HEX_Farbcodes_Tools>`__
oder `hier <http://de.selfhtml.org/helferlein/farben.htm>`__

"Quick Start mit der CometVisu"
-------------------------------

gibt es `hier <CometVisu/0.8.x/quickstart/de>`__

CometVisu Konfigurationsdatei
-----------------------------

Die CometVisu Konfigurationsdatei ist eine XML Datei, die im
Unterverzeichnis "config" der CometVisu-Installation (normal also unter
/var/www/visu/config) liegt.

Der Editor bearbeitet direkt diese Konfigurationsdatei. Hierfür muss die
Konfigurationsdatei für den Webserver Prozess (oder alle Prozesse)
beschreibar sein.

Die Konfiguration ist XML formatiert und kann von fortgeschrittenen
Anwendern auch direkt bearbeitet werden. (Man sollte dafür dann einen
Editor nutzen, der mit XML umgehen kann und/oder die Syntax einfärbt
(z.B. Textwrangler auf MacOSX, WordPad++ oder MS XML Editor 2007 unter
Windows und unter Linux z.B. vi mit ":syntax on").

Allgemeine Informationen über das CometVisu XML Format findet man
`hier <CometVisu/XML-Elemente>`__, Informationen zu den einzelnen
Widgets in den jeweiligen Unterseiten.

Nach dem Speichern ist keinerlei Neustart von Prozessen nötig, jedoch
sollte man die Seite neu laden und den Browser-Cache löschen.

Wenn die XML Datei ungültig ist wird beim Laden der Visu im Webbrowser
eine Fehlermeldung angezeigt. Diese gibt im Normalfall schon genaue
Hinweise wo in der Datei der Fehler liegt. Man kann die Überprüfung (und
Darstellung) auch mit dem Link "Check Config" in der Fusszeile oder
durch Anhängen von check\_config.php an den URL erzwingen.

Seiten und Struktur der CometVisu
---------------------------------

Navigationselemente in der CometVisu
------------------------------------

Elemente für Konvertierung und Formatierung in der CometVisu
------------------------------------------------------------

In der CometVisu können Werte auf verschiedenste Art und Weisen
dargestellt werden. Hierfür können genutzt werden:

-  `Format <CometVisu/0.8.x/format/de>`__ von Werten z.B. auf Anzahl der
   Nachkommastellen, Einheiten etc.
-  `Mapping <CometVisu/0.8.x/mapping/de>`__ erlaubt das Ersetzen von
   Zahlenwerten durch Texte (z.B. An/Aus statt 1/0) und Icons. (z.B. für
   Fensterkontakte)
-  `Styling <CometVisu/0.8.x/styling/de>`__ erlaubt das wertabhängige
   Färben von Werten (z.B. An in rot und Aus in Grün)
-  `Flavour <CometVisu/0.8.x/flavour/de>`__ ermöglich in einigen Designs
   für einige Widgets noch zusätzliche Optionen.

Widgets in der CometVisu
------------------------

Widgets sind die einzelnen Elemente aus denen eine CometVisu-Site
zusammengebaut wird. Diese können entweder fest in der CometVisu
eingebaut sein oder per Plugin-Schnittstelle intergriert.

Die Beschreibung der Widgets kann man hier nachlesen:

-  `Widgetbeschreibungen <widgets/>`__

CometVisu - Beispiele
---------------------

-  `findet man hier <CometVisu/0.8.0/demo_config/de>`__

sonstiges
---------

-  `RRD Beispiele <CometVisu/0.8.x/etc/rrd/de/>`__
-  `Howto: Animierter
   Hydraulikplan <CometVisu/0.8.x/Howto:_Animierter_Hydraulikplan>`__

Category:CometVisu
