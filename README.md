# Open Pension
[![Build Status](https://travis-ci.org/hasadna/OpenPension.png?branch=master)](https://travis-ci.org/hasadna/OpenPension)

Import pension "single asset" files into unfied DB.


## Installation

Prerequisites

ssconvert
```shell
sudo apt-get install gnumeric
```

Clone and initialize submodules
```shell
git clone ...
git submodule init
git submodule update
```
and then run (must be node ~v10.x..)
```shell
npm install
```
switch node versions easily with [nvm](https://github.com/creationix/nvm)

    
## Usage

```shell
  Usage: [options] [command]

  Commands:

    convert-files [options]     convert excel files to csv
    db-create-table [options]   create table in database
    db-empty-table [options]    truncate table in database
    db-load-files [options]     load csv files to database
    fetch-google [options]      download and convert files in Google Doc.
```

## License

See LICENSE file.
