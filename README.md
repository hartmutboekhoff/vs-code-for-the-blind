# spark-siteconfig-vscode-plugin README

Prototype and click-dummy for a site-config editor

## Usage

Open project folder in vscode and press `F5` to start debugging. This will start a new instance of vscode with the plugin active. Open the spark-siteconfig project with the second instance. 
Now the config files will be displayed with the respective eitor when opened. If multiple editors are available, use the 'open with...' command.

To receive information about the internal state of the editor-modules run the `SparkSiteConfig.FactoryDiagnostics` command.

## Features

This plugin provides views and click-dummies for several config-files in the spark-siteconfig project. 

> Caution! these editors are not indendet to be used as actual editors. Allthough they can modify the files content, it is not guaranteed that the stored data is correct.

Editors are available for the following config-filess

* Menu-Editor - navigation configuration for desktop (/menu/menu.json)
* Page-Config-Editor - for expert-mode page configuration 
* Simple-Page-Config-Editor - limited page configuration indendet for use by editorss and non-technical staff members
* Redirects-Eitor - for reirects
* Section-Navigation-Editor - to edit index-subnavigation. Only displays an touches the indexSubnavigation parts of category-config.json
* JSON-View - displays JSON files in a more readable way


## Extension Settings

This extension contributes the following settings:

* `SparkSiteeconfigEditor.developerMode`: Changes the color-setting and highlights some elements in the editor-views.


## Known Issues

Work in progress.

