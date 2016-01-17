# Open Pension
[![Build Status](https://travis-ci.org/hasadna/OpenPension.png?branch=master)](https://travis-ci.org/hasadna/OpenPension)

Import pension "single asset" files into unified DB.


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

    
## Commands

Usage:
$ node op.js [command] [options]

```
  Commands:

    convert-files [options]     convert excel files to csv
    db-create-table [options]   create table in database
    db-empty-table [options]    truncate table in database
    db-load-files [options]     load csv files to database
    fetch-google [options]      download and convert files in Google Doc.
```

## Convert Excel files to CSV

Usage:
$ node op.js convert-files [options]

```
  Options:

    -y, --year <year>         year
    -q, --quarter <quarter>   quarter
    -b, --body <body>         body
    -f, --fund <fund number>  fund
    -s, --srcdir <name>       path of Excel files, default:./excel/
    -t, --trgdir <name>       path of CSV files, default:./csv/
    -o, --overwrite           overwrite existing CSV files, default: false
```

## Create Empty DB Table

Usage:
$ node op.js db-create-table [options]

```
  Options:

    -t, --table <name>  table name
```

## Truncate DB Table

Usage:
$ node op.js db-empty-table [options]

```
  Options:

    -t, --table <name>  table name
```

## Load CSV Files to Database

Usage:
$ node op.js db-load-files [options]

```
  Options:

    -y, --year <year>           year
    -q, --quarter <quarter>     quarter
    -b, --body <body>           body
    -f, --fund <fund number>    fund number
    -t, --table <name>          table name
    -s, --srcdir <name>         path of CSV files, default:./csv/
    -c, --concurrency <number>  number of concurrent DB connections, defaults to 4
```

## Fetch Excel files from Google Sheet

Usage:
$ node op.js db-load-files [options]

```
  Options:

    -y, --year <year>         year
    -q, --quarter <quarter>   quarter
    -b, --body <body>         body
    -f, --fund <fund number>  fund number
    -t, --trgdir <name>       path of Excel files, default:/Users/shakhallevinson/duvdev/OpenPension/excel/
    -o, --overwrite           overwrite existing Excel files, default: false```
```



## License

See LICENSE file.
